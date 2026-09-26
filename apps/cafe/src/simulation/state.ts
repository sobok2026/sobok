import { z } from 'zod'
import { customizationSchema } from '../content/customizations'
import { drinkSizeIds } from '../content/drink-sizes'
import { ingredientIds } from '../content/ingredients'
import { recipeFor, recipeIds } from '../content/recipes'
import { isCupSurface, stationIds, tableIds } from '../content/stations'
import { CLEANING_SECONDS, cleaningStationIds } from '../features/cleaning/rules'
import { COLD_BREW_BEANS, COLD_BREW_STEPS, coldBrewTools } from '../features/cold-brew/rules'
import {
  cupCount,
  cupKindFor,
  cupKinds,
  cupService,
  cupSize,
  disposableCupKinds,
  isReusableCup,
  REUSABLE_CUPS_PER_KIND,
  reusableCupKinds,
  serviceModes,
} from '../features/inventory/cups'
import { SUPPLY_CAPACITY, supplyIds } from '../features/inventory/supplies'
import { PREPARATIONS, preparationIds } from '../features/preparation/rules'
import { productionStateSchema } from '../features/production/workflow'
import { customerStages } from '../features/service/customer'
import { currentTicket, customerCupCounts, orderMatchesRequest, salePaid, saleTotal } from '../features/service/orders'
import { washItems } from '../features/washing/rules'

const quantity = z.number().min(0).max(100000000)
const reusableCounts = z.record(z.enum(reusableCupKinds), quantity.int())
const timestamp = z.number().min(0).max(100000000000)
const ingredientAmounts = z
  .record(z.string(), quantity)
  .refine(
    (amounts) => Object.keys(amounts).every((id) => ingredientIds.includes(id)),
    '등록되지 않은 재료가 포함되어 있어요.',
  )
const customerPoint = z.tuple([z.number().min(-7).max(7), z.number().min(0).max(7)])
const orderItemSchema = z.object({
  recipe: z.enum(recipeIds),
  service: z.enum(serviceModes),
  size: z.enum(drinkSizeIds),
  customizations: customizationSchema,
})
const requestedItemSchema = orderItemSchema.extend({ quantity: z.number().int().min(1).max(99) })
const orderLineSchema = requestedItemSchema.extend({
  id: z.string().min(1).max(100),
  served: z.number().int().min(0).max(99),
})
const paymentSchema = z.object({
  id: z.string().min(1).max(100),
  method: z.enum(['cash', 'card']),
  amount: z.number().int().positive().max(100000000),
  tendered: z.number().int().positive().max(100000000),
})
const saleSchema = z
  .object({
    customerId: z.string().min(1).max(100),
    lines: z.array(orderLineSchema).min(1).max(50),
    payments: z.array(paymentSchema).max(20),
    paidAt: timestamp.nullable(),
  })
  .superRefine((sale, context) => {
    const invalid = (message: string) => context.addIssue({ code: 'custom', message })
    try {
      for (const line of sale.lines) recipeFor(line.recipe, line.size, line.service, line.customizations)
      if (new Set(sale.lines.map((line) => line.id)).size !== sale.lines.length) invalid('주문 항목이 중복됩니다.')
      if (new Set(sale.payments.map((payment) => payment.id)).size !== sale.payments.length)
        invalid('결제 내역이 중복됩니다.')
      if (sale.lines.some((line) => line.served > line.quantity || (sale.paidAt === null && line.served > 0)))
        invalid('전달 수량을 확인해주세요.')
      if (
        sale.payments.some(
          (payment) =>
            payment.tendered < payment.amount || (payment.method === 'card' && payment.tendered !== payment.amount),
        )
      )
        invalid('받은 금액을 확인해주세요.')
      const total = saleTotal(sale),
        paid = salePaid(sale)
      if (paid > total || (sale.paidAt === null ? paid >= total : paid !== total))
        invalid('주문 금액과 결제 상태가 맞지 않아요.')
    } catch {
      invalid('주문할 수 없는 커스텀이나 메뉴가 포함되어 있어요.')
    }
  })
const customerSchema = z
  .object({
    id: z.string().max(100),
    orderNumber: z.number().int().min(1).max(100000),
    items: z.array(requestedItemSchema).min(1).max(50),
    stage: z.enum(customerStages),
    position: customerPoint,
    yaw: z.number(),
    path: z.array(customerPoint).max(12),
    nextPoint: z.number().int().min(0).max(12),
    elapsed: quantity,
    visit: z
      .object({
        table: z.enum(tableIds).nullable(),
        returnCup: z.boolean(),
        dirtyTable: z.boolean(),
        dirtyReturn: z.boolean(),
        usesSugar: z.boolean(),
      })
      .nullable(),
  })
  .refine(
    (customer) =>
      customer.items.every((item) => {
        try {
          recipeFor(item.recipe, item.size, item.service, item.customizations)
          return true
        } catch {
          return false
        }
      }),
    '손님 주문의 사이즈를 확인해주세요.',
  )
  .refine((customer) => customer.nextPoint <= customer.path.length, '손님 이동 위치가 경로를 벗어났어요.')
  .refine(
    (customer) =>
      !['to-condiment', 'condiment', 'to-table', 'drinking', 'to-return', 'returning'].includes(customer.stage) ||
      customer.visit !== null,
    '수령한 손님의 이용 정보가 없어요.',
  )
  .refine(
    (customer) =>
      !customer.visit ||
      (customer.items.some((item) => item.service === 'dine-in')
        ? customer.visit.table !== null
        : customer.visit.table === null),
    '손님의 이용 방식과 테이블 정보가 맞지 않아요.',
  )
const batchSchema = z.object({
  id: z.string().max(100),
  ingredient: z.enum(ingredientIds),
  amount: quantity,
  location: z.enum(['bar', 'stock', 'prep', 'cold-prep', 'hand']),
  openedAt: timestamp.nullable(),
  expiresAt: timestamp.nullable(),
  labelled: z.boolean(),
})
const jobSchema = z.object({
  id: z.string().max(100),
  kind: z.enum(['production', 'cold-brew']),
  station: z.enum(stationIds),
  label: z.string().max(200),
  startedAt: timestamp,
  endsAt: timestamp,
  cupId: z.string().max(100).optional(),
  stepIndex: quantity.optional(),
  equipmentId: z.string().optional(),
  preparationId: z.string().max(100).optional(),
})
const totalsSchema = z.object({
  openingCash: quantity,
  purchases: ingredientAmounts,
  cupPurchases: quantity,
  coldBrewPurchases: quantity,
  coldBrewDiscardedBeans: quantity,
  disposed: ingredientAmounts,
  supplyPurchases: z.partialRecord(z.enum(supplyIds), quantity),
  suppliesUsed: z.partialRecord(z.enum(supplyIds), quantity.int()),
  served: quantity,
  revenue: quantity,
  cashSales: quantity,
  cardSales: quantity,
  wastedCups: quantity,
  cleaned: quantity,
  washed: quantity,
  prepared: quantity,
})
const craftSchema = productionStateSchema.extend({
  customizations: customizationSchema,
  kind: z.enum(cupKinds),
  location: z.union([z.literal('hand'), z.enum(stationIds)]),
  lidded: z.boolean(),
})
const preparationSchema = productionStateSchema
  .extend({
    id: z.string().max(100),
    recipe: z.enum(preparationIds),
    stage: z.enum(['measuring', 'processing', 'ready']),
    batchId: z.string().max(100).nullable(),
  })
  .refine((prep) => prep.cursor <= PREPARATIONS[prep.recipe].steps.length, '부재료 준비 단계가 범위를 벗어났어요.')
const coldBrewSchema = z
  .object({
    id: z.string().max(100),
    step: z
      .number()
      .int()
      .min(0)
      .max(COLD_BREW_STEPS.length - 1),
    progress: quantity,
    stage: z.enum(['measuring', 'extracting', 'finished', 'ready']),
    tool: z.enum(coldBrewTools).nullable(),
    beans: z.number().min(0).max(COLD_BREW_BEANS),
    water: quantity,
    fault: z.string().max(300).nullable(),
    completedAt: timestamp.nullable(),
    batchId: z.string().max(100).nullable(),
  })
  .refine(
    (brew) => !['finished', 'ready'].includes(brew.stage) || brew.completedAt !== null,
    '추출 완료 시각이 없어요.',
  )
const washingSchema = z
  .object({
    id: z.string().max(100),
    item: z.enum(washItems),
    stage: z.enum(['scrub', 'rinse', 'ready', 'carrying']),
    progress: z.number().min(0).max(2.5),
    spongeHeld: z.boolean(),
  })
  .refine((washing) => washing.stage === 'scrub' || !washing.spongeHeld, '스펀지를 먼저 내려놓아주세요.')
const cleaningSchema = z
  .object({
    id: z.string().max(100),
    station: z.enum(cleaningStationIds),
    stage: z.enum(['collect', 'wipe', 'bag']),
    progress: z.number().min(0).max(3),
    clothHeld: z.boolean(),
    heldCups: reusableCounts,
    trashCount: quantity.int(),
  })
  .refine(
    (cleaning) => !cleaning.clothHeld || (cleaning.stage === 'wipe' && cupCount(cleaning.heldCups) === 0),
    '컵을 비운 뒤 닦아주세요.',
  )
  .refine(
    (cleaning) => (cleaning.station === 'trash' ? cleaning.stage === 'bag' : cleaning.stage !== 'bag'),
    '청소 단계와 작업대가 맞지 않아요.',
  )
  .refine(
    (cleaning) => isCupSurface(cleaning.station) || (cupCount(cleaning.heldCups) === 0 && cleaning.stage !== 'collect'),
    '테이블·컨디먼트 바에서만 컵을 회수할 수 있어요.',
  )
  .refine(
    (cleaning) => cleaning.progress <= (cleaning.stage === 'collect' ? 0 : CLEANING_SECONDS[cleaning.stage]),
    '청소 진행량이 범위를 벗어났어요.',
  )
export const stateSchema = z
  .object({
    day: z.number().int().min(1).max(10000),
    time: timestamp,
    phase: z.enum(['open', 'closing', 'summary']),
    cash: quantity,
    orderNumber: z.number().int().min(1).max(100000),
    customer: customerSchema.nullable(),
    sale: saleSchema.nullable(),
    preparation: preparationSchema.nullable(),
    coldBrew: coldBrewSchema.nullable(),
    washing: washingSchema.nullable(),
    cleaning: cleaningSchema.nullable(),
    condiment: z.object({ cups: reusableCounts, dirty: z.boolean() }),
    supplies: z.record(
      z.enum(supplyIds),
      z.object({ bar: z.number().int().min(0).max(SUPPLY_CAPACITY), stock: quantity.int() }),
    ),
    supplyDelivery: z
      .object({ supply: z.enum(supplyIds), amount: z.number().int().min(1).max(SUPPLY_CAPACITY) })
      .nullable(),
    cup: z
      .object({
        id: z.string().max(100),
        recipe: z.enum(recipeIds),
        orderLineId: z.string().min(1).max(100),
        craft: craftSchema,
      })
      .refine((cup) => {
        try {
          return (
            cup.craft.cursor <=
            recipeFor(cup.recipe, cupSize(cup.craft.kind), cupService(cup.craft.kind), cup.craft.customizations).steps
              .length
          )
        } catch {
          return false
        }
      }, '메뉴·용기·제조 단계가 올바르지 않아요.')
      .refine((cup) => !isReusableCup(cup.craft.kind) || !cup.craft.lidded, '매장용 잔의 리드 상태가 올바르지 않아요.')
      .nullable(),
    batches: z.array(batchSchema).max(5000),
    jobs: z.array(jobSchema).max(30),
    tools: z.object({ clean: quantity, dirty: quantity, washed: quantity }),
    disposableCups: z.record(z.enum(disposableCupKinds), z.object({ bar: quantity.int(), reserve: quantity.int() })),
    reusableCups: z.record(
      z.enum(reusableCupKinds),
      z.object({ clean: quantity.int(), dirty: quantity.int(), washed: quantity.int() }),
    ),
    tables: z.record(z.enum(tableIds), z.object({ cups: reusableCounts, dirty: z.boolean() })),
    dirtyBar: z.number().int().min(0).max(20),
    trash: quantity,
    totals: totalsSchema,
    messages: z
      .array(
        z.object({ id: z.string().max(100), text: z.string().max(400), tone: z.enum(['info', 'success', 'error']) }),
      )
      .max(8),
    position: z.tuple([z.number().min(-7).max(7), z.number().min(-6).max(6), z.number(), z.number()]),
  })
  .refine((state) => {
    if (!state.cup) return true
    const ticket = currentTicket(state)
    return (
      !!ticket &&
      state.cup.orderLineId === ticket.id &&
      state.cup.recipe === ticket.recipe &&
      JSON.stringify(state.cup.craft.customizations) === JSON.stringify(ticket.customizations) &&
      state.cup.craft.kind === cupKindFor(ticket.recipe, ticket.service, ticket.size)
    )
  }, '제조 중인 컵과 주문표의 메뉴·사이즈·이용 방식이 맞지 않아요.')
  .refine(
    (state) =>
      (!state.customer || state.customer.orderNumber === state.orderNumber) &&
      (!state.sale || state.sale.customerId === state.customer?.id),
    '손님과 현재 주문 정보가 맞지 않아요.',
  )
  .refine(
    (state) =>
      !state.sale ||
      (state.sale.paidAt === null
        ? state.customer?.stage === 'ordering'
        : orderMatchesRequest(state) && !['entering', 'ordering'].includes(state.customer?.stage ?? '')),
    '결제 상태와 손님 주문이 맞지 않아요.',
  )
  .refine(
    (state) =>
      !state.customer?.visit ||
      (!!state.sale && state.sale.paidAt !== null && state.sale.lines.every((line) => line.served === line.quantity)),
    '모든 음료를 전달한 뒤 손님이 매장을 이용할 수 있어요.',
  )
  .refine(
    (state) => !state.preparation || state.cup?.craft.location !== 'prep',
    '준비대에는 음료와 부재료 작업을 동시에 놓을 수 없어요.',
  )
  .refine(
    (state) => state.batches.filter((batch) => batch.location === 'hand').length <= 1,
    '배합 용기는 한 번에 하나만 운반할 수 있어요.',
  )
  .refine(
    (state) =>
      !state.batches.some((batch) => batch.location === 'hand') ||
      !(
        state.supplyDelivery ||
        state.cup?.craft.location === 'hand' ||
        state.cup?.craft.tool ||
        state.preparation?.tool ||
        state.coldBrew?.tool ||
        state.washing?.stage === 'carrying' ||
        state.washing?.spongeHeld ||
        cupCount(state.cleaning?.heldCups) ||
        state.cleaning?.clothHeld
      ),
    '배합 용기와 다른 물건을 동시에 들 수 없어요.',
  )
  .refine(
    (state) =>
      state.batches.every((batch) => {
        if (!['prep', 'cold-prep', 'hand'].includes(batch.location)) return true
        return batch.ingredient === 'coldBrew'
          ? batch.location !== 'prep' && state.coldBrew?.stage === 'ready' && state.coldBrew.batchId === batch.id
          : !!state.preparation &&
              PREPARATIONS[state.preparation.recipe].output.materialId === batch.ingredient &&
              batch.location !== 'cold-prep' &&
              state.preparation?.stage === 'ready' &&
              state.preparation.batchId === batch.id
      }),
    '준비 용기와 진행 중인 작업이 연결되지 않았어요.',
  )
  .refine((state) => {
    const jobs = state.jobs.filter((job) => job.kind === 'cold-brew')
    return state.coldBrew?.stage === 'extracting'
      ? jobs.length === 1 && jobs[0].preparationId === state.coldBrew.id
      : jobs.length === 0
  }, '추출 작업과 콜드 브루 준비 상태가 맞지 않아요.')
  .refine(
    (state) =>
      state.coldBrew?.stage !== 'ready' ||
      state.batches.some((batch) => batch.id === state.coldBrew?.batchId && batch.ingredient === 'coldBrew'),
    '회수한 콜드 브루 용기가 없어요.',
  )
  .refine(
    (state) =>
      reusableCupKinds.every((kind) => {
        const stock = state.reusableCups[kind]
        const washing = state.washing?.item === kind && state.washing.stage !== 'ready' ? 1 : 0
        const customer = customerCupCounts(state)[kind]
        const surfaces = state.condiment.cups[kind] + tableIds.reduce((sum, id) => sum + state.tables[id].cups[kind], 0)
        return (
          stock.clean +
            stock.dirty +
            stock.washed +
            washing +
            customer +
            surfaces +
            (state.cleaning?.heldCups[kind] ?? 0) +
            (state.cup?.craft.kind === kind ? 1 : 0) ===
          REUSABLE_CUPS_PER_KIND
        )
      }),
    `다회용 컵은 종류·사이즈별 ${REUSABLE_CUPS_PER_KIND}개가 보관·제조·사용·세척 위치 사이에서 유지되어야 해요.`,
  )

export type GameState = z.infer<typeof stateSchema>
export type Batch = z.infer<typeof batchSchema>
export type Job = z.infer<typeof jobSchema>

export type CraftState = z.infer<typeof craftSchema>
export type Preparation = z.infer<typeof preparationSchema>
export type ColdBrew = z.infer<typeof coldBrewSchema>
export type Washing = z.infer<typeof washingSchema>
export type Cleaning = z.infer<typeof cleaningSchema>
export type Customer = z.infer<typeof customerSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type OrderLine = z.infer<typeof orderLineSchema>
export type Sale = z.infer<typeof saleSchema>
