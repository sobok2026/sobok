import { z } from 'zod'
import { customizationSchema } from '../content/customizations'
import { drinkSizeIds } from '../content/drink-sizes'
import { INGREDIENTS, ingredientIds, ingredientLifetime } from '../content/ingredients'
import { expiryAt } from '../content/lifetime'
import { recipeCup, recipeFor, recipeIds } from '../content/recipes'
import { FLOOR_HEIGHT, isCupSurface, SHOP_BOUNDS, stationIds, tableIds } from '../content/stations'
import { CLEANING_SECONDS, cleaningStationIds } from '../features/cleaning/rules'
import { COLD_BREW_BEANS, COLD_BREW_STEPS, coldBrewTools } from '../features/cold-brew/rules'
import {
  DRIP,
  dripBeanSchema,
  dripDose,
  dripIngredient,
  dripMenuTemperature,
  dripTemperatures,
} from '../features/drip-coffee/rules'
import { FOODS, SHOWCASE_CAPACITY } from '../features/food/catalog'
import { foodBatchSchema, foodLineSchema, foodOrderSchema, foodWorkSchema } from '../features/food/model'
import { grindSettingSchema } from '../features/grinder/rules'
import { ICE } from '../features/ice/rules'
import { BAR_BATCH_CAPACITY, isSealed, packStorage } from '../features/inventory/batches'
import {
  CUP_SUPPLY,
  cupCount,
  cupKinds,
  cupService,
  disposableCupKinds,
  isReusableCup,
  REUSABLE_CUPS_PER_KIND,
  reusableCupKinds,
  serviceModes,
} from '../features/inventory/cups'
import { SUPPLY_CAPACITY, supplyIds } from '../features/inventory/supplies'
import { PREPARATIONS, preparationIds, preparationStation } from '../features/preparation/rules'
import { productionStateSchema } from '../features/production/workflow'
import {
  couponSchema,
  discountDetailSchema,
  memberSchema,
  orderOptionsSchema,
  paymentAllowsChange,
  paymentReceiptAmount,
  paymentSchema,
  saleBenefitsSchema,
} from '../features/service/checkout-model'
import { customerStages } from '../features/service/customer'
import { currentTicket, customerCupCounts, orderMatchesRequest, salePaid, saleTotal } from '../features/service/orders'
import { couponAmount } from '../features/service/pricing'
import { DISHWASHER, rackCount, rackSpace, washItems } from '../features/washing/rules'

const quantity = z.number().min(0).max(100000000)
const reusableCounts = z.record(z.enum(reusableCupKinds), quantity.int())
const timestamp = z.number().min(0).max(100000000000)

const ingredientAmounts = z
  .record(z.string(), quantity)
  .refine(
    (amounts) => Object.keys(amounts).every((id) => ingredientIds.includes(id)),
    '등록되지 않은 재료가 포함되어 있어요.',
  )

const customerPoint = z.tuple([
  z.number().min(SHOP_BOUNDS.minX).max(SHOP_BOUNDS.maxX),
  z
    .number()
    .min(SHOP_BOUNDS.minZ)
    .max(SHOP_BOUNDS.maxZ + 1),
  z
    .number()
    .min(0)
    .max(FLOOR_HEIGHT * 2),
])

const orderItemSchema = z.object({
  recipe: z.enum(recipeIds),
  service: z.enum(serviceModes),
  size: z.enum(drinkSizeIds),
  customizations: customizationSchema,
  options: orderOptionsSchema,
})

const requestedItemSchema = orderItemSchema.extend({ quantity: z.number().int().min(1).max(99) })

const orderLineSchema = requestedItemSchema
  .extend({
    id: z.string().min(1).max(100),
    served: z.number().int().min(0).max(99),
    dripBean: dripBeanSchema.nullable(),
  })
  .refine(
    (line) => !!dripMenuTemperature(line.recipe) === (line.dripBean !== null),
    '드립 주문의 원두가 없거나 메뉴와 맞지 않아요.',
  )

const cashReceiptSchema = z
  .object({
    id: z.string().min(1).max(100),
    kind: z.enum(['personal', 'business', 'unissued']),
    lastFour: z
      .string()
      .regex(/^\d{4}$/)
      .nullable(),
    issuedAt: timestamp,
    amount: quantity.int(),
  })
  .refine(
    (receipt) => (receipt.kind === 'unissued' ? receipt.lastFour === null : receipt.lastFour !== null),
    '현금영수증 발행 정보를 확인해주세요.',
  )
export type CashReceipt = z.infer<typeof cashReceiptSchema>

const transactionSchema = z
  .object({
    id: z.string().min(1).max(100),
    orderNumber: z.number().int().min(1).max(100000),
    day: z.number().int().min(1).max(10000),
    paidAt: timestamp,
    lines: z
      .array(
        z.object({
          id: z.string().min(1).max(100),
          name: z.string().min(1).max(200),
          specification: z.string().max(200),
          customizations: z.array(z.string().max(200)).max(100),
          quantity: z.number().int().min(1).max(99),
          unitPrice: z.number().int().positive().max(100000000),
          discount: quantity.int(),
          deposit: quantity.int(),
          discounts: z.array(discountDetailSchema).max(100),
        }),
      )
      .min(1)
      .max(50),
    payments: z.array(paymentSchema).max(20),
    settlements: z.array(paymentSchema.extend({ at: timestamp })).max(100),
    memberId: z.string().max(100).nullable(),
    creditName: z.string().max(80).nullable(),
    cashReceipts: z.array(cashReceiptSchema),
    printCount: z.number().int().min(0).max(100000),
    lastPrintedAt: timestamp.nullable(),
  })
  .superRefine((transaction, context) => {
    const invalid = (message: string) => context.addIssue({ code: 'custom', message })
    const total = transaction.lines.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity - line.discount + line.deposit,
      0,
    )
    const paid = transaction.payments.reduce((sum, payment) => sum + payment.amount, 0)

    if (total !== paid) invalid('거래 내역의 주문 금액과 결제 금액이 달라요.')
    if (new Set(transaction.lines.map((line) => line.id)).size !== transaction.lines.length) {
      invalid('거래 내역의 주문 항목이 중복됩니다.')
    }
    if (new Set(transaction.payments.map((payment) => payment.id)).size !== transaction.payments.length) {
      invalid('거래 내역의 결제가 중복됩니다.')
    }
    if (new Set(transaction.cashReceipts.map((receipt) => receipt.id)).size !== transaction.cashReceipts.length) {
      invalid('현금영수증 발행 이력이 중복됩니다.')
    }
    if (
      transaction.payments.some(
        (payment) =>
          payment.tendered < payment.amount ||
          (!paymentAllowsChange(payment.method) && payment.tendered !== payment.amount),
      )
    ) {
      invalid('거래 내역의 받은 금액을 확인해주세요.')
    }
    if (
      transaction.cashReceipts.length &&
      ![...transaction.payments, ...transaction.settlements].some((payment) => paymentReceiptAmount(payment) > 0)
    ) {
      invalid('현금 결제가 없는 거래에는 현금영수증을 발행할 수 없어요.')
    }
    if ((transaction.printCount === 0) !== (transaction.lastPrintedAt === null)) {
      invalid('영수증 출력 이력을 확인해주세요.')
    }
    if (
      transaction.lines.some(
        (line) =>
          line.discount > line.unitPrice * line.quantity ||
          line.discounts.reduce((sum, detail) => sum + detail.amount, 0) !== line.discount,
      )
    )
      invalid('상품 할인 금액이 맞지 않아요.')
    const credit = transaction.payments.reduce(
      (sum, payment) => sum + (payment.method === 'credit' ? payment.amount : 0),
      0,
    )
    if (
      transaction.settlements.some((payment) => payment.method === 'credit') ||
      transaction.settlements.reduce((sum, payment) => sum + payment.amount, 0) > credit
    )
      invalid('외상 정산 금액을 확인해주세요.')
    if (new Set(transaction.settlements.map((payment) => payment.id)).size !== transaction.settlements.length)
      invalid('외상 정산 내역이 중복됩니다.')
  })
export type Transaction = z.infer<typeof transactionSchema>

const saleSchema = z
  .object({
    customerId: z.string().min(1).max(100),
    lines: z.array(orderLineSchema).max(50),
    foodLines: z.array(foodLineSchema).max(50),
    benefits: saleBenefitsSchema,
    benefitsCheckedAt: timestamp.nullable(),
    acceptedAt: timestamp.nullable(),
    payments: z.array(paymentSchema).max(20),
    paidAt: timestamp.nullable(),
  })
  .superRefine((sale, context) => {
    const invalid = (message: string) => context.addIssue({ code: 'custom', message })

    try {
      for (const line of sale.lines) recipeFor(line.recipe, line.size, line.service, line.customizations)
      const lines = [...sale.lines, ...sale.foodLines]
      if (!lines.length || lines.length > 50) invalid('주문 항목 수를 확인해주세요.')
      if (new Set(lines.map((line) => line.id)).size !== lines.length) {
        invalid('주문 항목이 중복됩니다.')
      }
      if (new Set(sale.payments.map((payment) => payment.id)).size !== sale.payments.length) {
        invalid('결제 내역이 중복됩니다.')
      }
      if (lines.some((line) => line.served > line.quantity || (sale.acceptedAt === null && line.served > 0))) {
        invalid('전달 수량을 확인해주세요.')
      }
      if (
        sale.payments.some(
          (payment) =>
            payment.tendered < payment.amount ||
            (!paymentAllowsChange(payment.method) && payment.tendered !== payment.amount),
        )
      ) {
        invalid('받은 금액을 확인해주세요.')
      }
      const benefits = sale.benefits
      if (new Set(benefits.coupons.map((item) => item.coupon.id)).size !== benefits.coupons.length)
        invalid('주문의 쿠폰이 중복됩니다.')

      for (const applied of benefits.coupons) {
        const line = lines.find((line) => line.id === applied.lineId)
        if (
          !line ||
          !couponAmount(applied.coupon, line) ||
          benefits.coupons.filter((item) => item.lineId === line.id).length > line.quantity
        )
          invalid('주문의 쿠폰과 대상 상품이 맞지 않아요.')
      }

      if (
        benefits.manual &&
        (!benefits.manual.value ||
          (benefits.manual.kind === 'percent' && benefits.manual.value > 100) ||
          (benefits.manual.lineId && !lines.some((line) => line.id === benefits.manual?.lineId)))
      )
        invalid('금액/메뉴 할인을 확인해주세요.')
      if (benefits.telecom && !sale.lines.some((line) => line.id === benefits.telecom?.lineId))
        invalid('통신사 제휴 대상 음료가 없어요.')
      if ((sale.payments.length > 0 || sale.paidAt !== null) !== (sale.benefitsCheckedAt !== null))
        invalid('결제한 주문의 혜택 확인 시각이 맞지 않아요.')
      if (benefits.freeExtra && sale.payments.some((payment) => payment.method !== 'starbucks-card'))
        invalid('Free Extra와 결제수단이 맞지 않아요.')
      const total = saleTotal(sale),
        paid = salePaid(sale)
      if (paid > total || (sale.paidAt === null ? total > 0 && paid >= total : paid !== total)) {
        invalid('주문 금액과 결제 상태가 맞지 않아요.')
      }
      if (sale.paidAt !== null && sale.acceptedAt === null) invalid('결제한 주문의 접수 시각이 없어요.')
    } catch {
      invalid('주문할 수 없는 커스텀이나 메뉴가 포함되어 있어요.')
    }
  })

const customerSchema = z
  .object({
    id: z.string().max(100),
    orderNumber: z.number().int().min(1).max(100000),
    items: z.array(requestedItemSchema).max(50),
    foodItems: z.array(foodOrderSchema).max(50),
    memberId: z.string().max(100).nullable(),
    paperCoupons: z.array(couponSchema).max(50),
    stage: z.enum(customerStages),
    position: customerPoint,
    yaw: z.number(),
    path: z.array(customerPoint).max(64),
    nextPoint: z.number().int().min(0).max(64),
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

const batchSchema = z
  .object({
    id: z.string().max(100),
    ingredient: z.enum(ingredientIds),
    amount: quantity,
    location: z.enum(['bar', 'fridge', 'stock', 'prep', 'cold-prep', 'urn', 'grinder', 'hand']),
    carryFrom: z.enum(['bar', 'fridge', 'stock', 'prep', 'cold-prep', 'urn', 'grinder']).nullable(),
    openedAt: timestamp.nullable(),
    expiresAt: timestamp.nullable(),
    storage: z.enum(['room', 'fridge']),
    ingredientExpiresAt: timestamp.nullable(),
    labelled: z.boolean(),
    dripBean: dripBeanSchema.nullable(),
  })
  .refine((batch) => {
    const definition = INGREDIENTS[batch.ingredient]
    return batch.storage === definition.storage || !!definition.storageLifetimes?.[batch.storage]
  }, '재료에 허용되지 않은 보관 방식이에요.')
  .refine((batch) => {
    if (batch.openedAt === null) return batch.expiresAt === null && batch.ingredientExpiresAt === null
    const limit = Math.min(
      expiryAt(batch.openedAt, ingredientLifetime(batch.ingredient, batch.storage)),
      batch.ingredientExpiresAt ?? Infinity,
    )
    return batch.expiresAt !== null && batch.expiresAt <= limit
  }, '배치 기한이 제조·개봉 또는 원재료 기한을 넘었어요.')

const jobSchema = z.object({
  id: z.string().max(100),
  kind: z.enum(['production', 'cold-brew', 'drip-coffee', 'dishwasher']),
  station: z.enum(stationIds),
  label: z.string().max(200),
  startedAt: timestamp,
  endsAt: timestamp,
  cupId: z.string().max(100).optional(),
  stepIndex: quantity.optional(),
  equipmentId: z.string().optional(),
  preparationId: z.string().max(100).optional(),
  vessel: z.string().max(100).optional(),
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
  otherSales: quantity,
  creditSales: quantity,
  creditCollected: quantity,
  discounts: quantity,
  deposits: quantity,
  foodPurchases: quantity,
  foodDisposed: z.record(z.string().max(100), quantity.int()),
  foodServed: quantity.int(),
  wastedCups: quantity,
  cleaned: quantity,
  washed: quantity,
  prepared: quantity,
})

const place = z.union([z.literal('hand'), z.enum(stationIds)])

const craftSchema = productionStateSchema
  .extend({
    customizations: customizationSchema,
    kind: z.enum(cupKinds),
    size: z.enum(drinkSizeIds),
    location: place,
    espressoStation: z.enum(['espresso', 'espresso-2']),
    steamStation: z.enum(['steam', 'steam-2']),
    places: z.record(z.string().max(100), place),
    lidded: z.boolean(),
    sticker: z.boolean(),
    personalCup: z.boolean(),
  })
  .refine(
    (craft) => [craft.location, ...Object.values(craft.places)].filter((item) => item === 'hand').length <= 1,
    '용기는 한 번에 하나만 들 수 있어요.',
  )

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
    stage: z.enum(['grind', 'ground', 'measuring', 'extracting', 'finished', 'ready']),
    groundBeans: z.number().min(0).max(COLD_BREW_BEANS),
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
  .refine((brew) => {
    if (brew.beans > brew.groundBeans) return false
    if (brew.stage === 'grind') {
      return (
        brew.groundBeans < COLD_BREW_BEANS &&
        !brew.tool &&
        !brew.beans &&
        !brew.water &&
        brew.step === 0 &&
        brew.progress === 0
      )
    }

    if (brew.groundBeans !== COLD_BREW_BEANS) return false
    if (brew.stage === 'ground') {
      return !brew.tool && !brew.beans && !brew.water && brew.step === 0 && brew.progress === 0
    }

    return true
  }, '콜드 브루 원두의 분쇄·투입 상태가 맞지 않아요.')

const dripBrewSchema = z.object({
  id: z.string().min(1).max(100),
  bean: dripBeanSchema,
  stage: z.enum(['filter', 'beans', 'grind', 'ground', 'loaded', 'extracting', 'ice', 'mix', 'ready']),
  beans: quantity,
  ice: quantity,
  tool: z.boolean(),
  ingredientExpiresAt: timestamp.nullable(),
  completedAt: timestamp.nullable(),
  batchId: z.string().max(100).nullable(),
  fault: z.string().max(300).nullable(),
})

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
    '테이블·컵 반납대에서만 컵을 회수할 수 있어요.',
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
    nextOrderNumber: z.number().int().min(1).max(100001),
    customer: customerSchema.nullable(),
    sale: saleSchema.nullable(),
    waitingOrders: z
      .array(z.object({ customer: customerSchema, sale: saleSchema.nullable(), heldAt: timestamp }))
      .max(10),
    members: z.array(memberSchema).max(100),
    foodBatches: z.array(foodBatchSchema).max(1000),
    foodWork: foodWorkSchema.nullable(),
    transactions: z
      .array(transactionSchema)
      .refine(
        (transactions) => new Set(transactions.map((transaction) => transaction.id)).size === transactions.length,
        '거래 번호가 중복됩니다.',
      ),
    preparation: preparationSchema.nullable(),
    coldBrew: coldBrewSchema.nullable(),
    cow: z.object({ hot: dripBeanSchema, iced: dripBeanSchema }),
    drip: z.object({ hot: dripBrewSchema.nullable(), iced: dripBrewSchema.nullable() }),
    grindSetting: grindSettingSchema,
    washing: washingSchema.nullable(),
    dishwasher: z.object({
      hoodOpen: z.boolean(),
      clean: z.boolean(),
      rack: z.partialRecord(z.enum(washItems), z.number().int().min(1).max(DISHWASHER.capacity)),
    }),
    ice: z.object({
      enabled: z.boolean(),
      stored: z.number().min(0).max(ICE.capacity),
      bar: z.number().min(0).max(ICE.barCapacity),
      bucket: z.number().min(0).max(ICE.bucketCapacity),
      bucketHeld: z.boolean(),
      cycleStartedAt: timestamp.nullable(),
      produced: quantity,
      used: quantity,
      discarded: quantity,
    }),
    cleaning: cleaningSchema.nullable(),
    condiment: z.object({ cups: reusableCounts, dirty: z.boolean() }),
    supplies: z.record(
      z.enum(supplyIds),
      z.object({ bar: z.number().int().min(0).max(SUPPLY_CAPACITY), stock: quantity.int() }),
    ),
    supplyDelivery: z
      .object({ supply: z.enum(supplyIds), amount: z.number().int().min(1).max(SUPPLY_CAPACITY) })
      .nullable(),
    cupDelivery: z
      .object({ kind: z.enum(disposableCupKinds), amount: z.number().int().min(1).max(CUP_SUPPLY.refill) })
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
            recipeFor(cup.recipe, cup.craft.size, cupService(cup.craft.kind), cup.craft.customizations).steps.length
          )
        } catch {
          return false
        }
      }, '메뉴·용기·제조 단계가 올바르지 않아요.')
      .refine(
        (cup) => cup.craft.personalCup || !isReusableCup(cup.craft.kind) || !cup.craft.lidded,
        '매장용 잔의 리드 상태가 올바르지 않아요.',
      )
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
    position: z.tuple([
      z.number().min(SHOP_BOUNDS.minX).max(SHOP_BOUNDS.maxX),
      z.number().min(SHOP_BOUNDS.minZ).max(SHOP_BOUNDS.maxZ),
      z.number(),
      z.number(),
      z
        .number()
        .min(0)
        .max(FLOOR_HEIGHT * 2),
    ]),
  })
  .superRefine((state, context) => {
    const invalid = (message: string) => context.addIssue({ code: 'custom', message })
    const machine = state.dishwasher
    const jobs = state.jobs.filter((job) => job.kind === 'dishwasher')
    if (rackSpace(machine.rack) > DISHWASHER.capacity || (machine.clean && !rackCount(machine.rack))) {
      invalid('세척기 랙의 적재량과 상태가 맞지 않아요.')
    }
    if (
      jobs.length > 1 ||
      (jobs.length > 0 &&
        (machine.hoodOpen ||
          machine.clean ||
          !rackCount(machine.rack) ||
          jobs[0].station !== 'dishwasher' ||
          jobs[0].endsAt - jobs[0].startedAt !== DISHWASHER.cycleSeconds))
    )
      invalid('세척기 후드·운전·랙 상태가 맞지 않아요.')

    const ice = state.ice
    if (!ice.bucketHeld && ice.bucket > 0) invalid('운반통에 얼음이 있는데 운반 상태가 아니에요.')
    if (
      Math.abs(
        ice.stored +
          ice.bar +
          ice.bucket +
          ice.used +
          ice.discarded -
          ICE.initialStored -
          ICE.initialBar -
          ice.produced,
      ) > 0.01
    ) {
      invalid('생산·보관·운반·사용한 얼음의 수량이 맞지 않아요.')
    }
    if (
      (ice.enabled && ice.stored < ICE.capacity) !== (ice.cycleStartedAt !== null) ||
      (ice.cycleStartedAt !== null && ice.cycleStartedAt > state.time)
    ) {
      invalid('제빙기의 가동 상태와 생산 시작 시각이 맞지 않아요.')
    }
    if (
      ice.bucketHeld &&
      (state.cupDelivery ||
        state.supplyDelivery ||
        state.batches.some((batch) => batch.location === 'hand') ||
        state.cup?.craft.location === 'hand' ||
        state.cup?.craft.tool ||
        Object.values(state.cup?.craft.places ?? {}).includes('hand') ||
        state.preparation?.tool ||
        state.coldBrew?.tool ||
        dripTemperatures.some((temperature) => state.drip[temperature]?.tool) ||
        state.washing?.spongeHeld ||
        state.washing?.stage === 'carrying' ||
        state.cleaning?.clothHeld ||
        cupCount(state.cleaning?.heldCups))
    )
      invalid('얼음통과 다른 물건을 동시에 들 수 없어요.')
  })
  .refine((state) => {
    if (!state.cup) {
      return true
    }
    const ticket = currentTicket(state)

    return (
      !!ticket &&
      state.cup.orderLineId === ticket.id &&
      state.cup.recipe === ticket.recipe &&
      JSON.stringify(state.cup.craft.customizations) === JSON.stringify(ticket.customizations) &&
      state.cup.craft.size === ticket.size &&
      state.cup.craft.dripBean === ticket.dripBean &&
      state.cup.craft.personalCup === ticket.options.personalCup &&
      state.cup.craft.kind === recipeCup(ticket.recipe, ticket.size, ticket.service)
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
      (state.sale.acceptedAt === null
        ? ['entering', 'ordering'].includes(state.customer?.stage ?? '')
        : orderMatchesRequest(state) && !['entering', 'ordering'].includes(state.customer?.stage ?? '')),
    '결제 상태와 손님 주문이 맞지 않아요.',
  )
  .refine(
    (state) =>
      !state.sale ||
      state.sale.paidAt === null ||
      state.transactions.some(
        (transaction) => transaction.id === state.sale!.customerId && transaction.paidAt === state.sale!.paidAt,
      ),
    '결제된 주문의 거래 내역이 없습니다.',
  )
  .refine(
    (state) =>
      !state.customer?.visit ||
      (!!state.sale &&
        state.sale.paidAt !== null &&
        [...state.sale.lines, ...state.sale.foodLines].every((line) => line.served === line.quantity)),
    '모든 음료를 전달한 뒤 손님이 매장을 이용할 수 있어요.',
  )
  .superRefine((state, context) => {
    const invalid = (message: string) => context.addIssue({ code: 'custom', message })
    const customers = [
      ...(state.customer ? [state.customer] : []),
      ...state.waitingOrders.map((order) => order.customer),
    ]
    if (
      new Set(customers.map((customer) => customer.id)).size !== customers.length ||
      new Set(customers.map((customer) => customer.orderNumber)).size !== customers.length
    )
      invalid('응대 중인 손님이나 주문 번호가 중복됩니다.')
    if (
      customers.some(
        (customer) =>
          customer.orderNumber >= state.nextOrderNumber || (!customer.items.length && !customer.foodItems.length),
      )
    )
      invalid('손님 주문 번호 또는 상품 수가 올바르지 않아요.')
    if (
      state.waitingOrders.some(
        (order) =>
          order.customer.visit !== null ||
          (order.sale &&
            (order.sale.customerId !== order.customer.id ||
              order.sale.acceptedAt !== null ||
              order.sale.payments.length > 0)),
      )
    )
      invalid('보류 주문에는 결제·제조를 시작하지 않은 손님의 주문만 보관할 수 있어요.')
    const cards = state.members.flatMap((member) => member.cards)
    const coupons = state.members.flatMap((member) => member.coupons)
    if (
      new Set(state.members.map((member) => member.id)).size !== state.members.length ||
      new Set(cards.map((card) => card.id)).size !== cards.length ||
      new Set(coupons.map((coupon) => coupon.id)).size !== coupons.length
    )
      invalid('회원·카드·쿠폰 정보가 중복됩니다.')
    if (
      customers.some(
        (customer) => customer.memberId !== null && !state.members.some((member) => member.id === customer.memberId),
      )
    )
      invalid('손님의 회원 정보를 찾을 수 없어요.')
    const orders = [
      ...(state.customer && state.sale ? [{ customer: state.customer, sale: state.sale }] : []),
      ...state.waitingOrders.filter((order) => order.sale !== null),
    ]
    const couponIds: string[] = []

    for (const order of orders) {
      const sale = order.sale!
      const member = state.members.find((member) => member.id === sale.benefits.memberId)
      if (sale.benefits.memberId && sale.benefits.memberId !== order.customer.memberId)
        invalid('주문의 회원과 손님이 다릅니다.')
      if (sale.benefits.employee && !member?.employee) invalid('임직원 할인의 인증 정보가 맞지 않아요.')

      for (const applied of sale.benefits.coupons) {
        const sources = applied.coupon.source === 'sr' ? (member?.coupons ?? []) : order.customer.paperCoupons
        const source = sources.find((coupon) => coupon.id === applied.coupon.id)
        if (
          !source ||
          JSON.stringify({ ...source, usedAt: null }) !== JSON.stringify({ ...applied.coupon, usedAt: null }) ||
          source.usedAt !== sale.paidAt
        )
          invalid('쿠폰의 소유자 또는 사용 내역이 맞지 않아요.')
        couponIds.push(applied.coupon.id)
      }

      if (sale.benefitsCheckedAt !== null && sale.benefitsCheckedAt > state.time)
        invalid('혜택 확인 시각은 현재 시각을 넘을 수 없어요.')
    }

    if (new Set(couponIds).size !== couponIds.length) invalid('같은 쿠폰을 여러 주문에 적용할 수 없어요.')
    const foodItems = [
      ...customers.flatMap((customer) => customer.foodItems),
      ...(state.sale?.foodLines ?? []),
      ...state.waitingOrders.flatMap((order) => order.sale?.foodLines ?? []),
    ]
    if (
      foodItems.some(
        (item) =>
          !FOODS[item.productId] ||
          (item.warmed && !FOODS[item.productId].heatingSeconds) ||
          item.options.personalCup ||
          item.options.cupDeposit,
      )
    )
      invalid('푸드의 상품·가열·포장 정보가 맞지 않아요.')
    if (new Set(state.foodBatches.map((batch) => batch.id)).size !== state.foodBatches.length)
      invalid('푸드 재고가 중복됩니다.')
    if (
      state.foodBatches.some(
        (batch) =>
          !FOODS[batch.productId] ||
          (batch.location === 'showcase' && batch.displayedAt === null) ||
          batch.expiresAt <= batch.receivedAt ||
          (batch.displayedAt !== null && batch.displayedAt < batch.receivedAt),
      )
    )
      invalid('푸드 재고의 상품과 기한을 확인해주세요.')
    if (
      state.foodBatches
        .filter((batch) => batch.location === 'showcase')
        .reduce((sum, batch) => sum + batch.quantity, 0) > SHOWCASE_CAPACITY
    )
      invalid('푸드 쇼케이스 진열량을 초과했어요.')

    if (state.foodWork) {
      const food = state.foodWork
      const line = state.sale?.foodLines.find(
        (line) => line.id === food.lineId && line.productId === food.productId && line.served < line.quantity,
      )
      if (!line || state.sale?.acceptedAt == null) invalid('준비 중인 푸드와 주문이 연결되지 않았어요.')
      if (
        (food.stage === 'heating') !== (food.heatingEndsAt !== null) ||
        (food.stage === 'heating' && food.location !== 'food-oven')
      )
        invalid('푸드의 가열 상태가 올바르지 않아요.')
      if (food.stage === 'packed' && (food.packaging === null || food.packaging !== line?.options.packaging))
        invalid('푸드 포장이 주문과 맞지 않아요.')
      if (
        food.location === 'hand' &&
        (state.cup?.craft.location === 'hand' ||
          state.cup?.craft.tool ||
          Object.values(state.cup?.craft.places ?? {}).includes('hand') ||
          state.preparation?.tool ||
          state.cupDelivery ||
          state.supplyDelivery ||
          state.batches.some((batch) => batch.location === 'hand') ||
          state.washing?.spongeHeld ||
          state.washing?.stage === 'carrying' ||
          state.cleaning?.clothHeld ||
          state.coldBrew?.tool ||
          Object.values(state.drip).some((brew) => brew?.tool) ||
          cupCount(state.cleaning?.heldCups))
      )
        invalid('푸드와 다른 물건을 동시에 들 수 없어요.')
    }
  })
  .refine(
    (state) => !state.preparation || state.cup?.craft.location !== preparationStation(state.preparation),
    '준비대에는 음료와 부재료 작업을 동시에 놓을 수 없어요.',
  )
  .refine((state) => {
    const counts = new Map<string, number>()

    for (const batch of state.batches) {
      if (batch.location !== 'bar' || batch.amount <= 0) continue
      const count = (counts.get(batch.ingredient) ?? 0) + 1
      if (count > BAR_BATCH_CAPACITY) return false
      counts.set(batch.ingredient, count)
    }

    return true
  }, `바에는 재료 품목별로 ${BAR_BATCH_CAPACITY}용기까지 보관할 수 있어요.`)
  .refine(
    (state) => state.batches.filter((batch) => batch.location === 'hand').length <= 1,
    '배합 용기는 한 번에 하나만 운반할 수 있어요.',
  )
  .refine(
    (state) =>
      !state.batches.some((batch) => batch.location === 'hand') ||
      !(
        state.supplyDelivery ||
        state.cupDelivery ||
        state.cup?.craft.location === 'hand' ||
        Object.values(state.cup?.craft.places ?? {}).includes('hand') ||
        state.cup?.craft.tool ||
        state.preparation?.tool ||
        state.coldBrew?.tool ||
        dripTemperatures.some((temperature) => state.drip[temperature]?.tool) ||
        state.washing?.stage === 'carrying' ||
        state.washing?.spongeHeld ||
        cupCount(state.cleaning?.heldCups) ||
        state.cleaning?.clothHeld
      ),
    '배합 용기와 다른 물건을 동시에 들 수 없어요.',
  )
  .refine(
    (state) =>
      state.batches.every(
        (batch) => !isSealed(batch) || batch.location === 'hand' || batch.location === packStorage(batch.ingredient),
      ),
    '미개봉 원팩은 알맞은 보관 장소에만 둘 수 있어요.',
  )
  .refine(
    (state) =>
      state.batches.every((batch) => {
        const atPreparation =
          batch.location === 'prep' ||
          batch.location === 'cold-prep' ||
          batch.location === 'grinder' ||
          (batch.location === 'hand' &&
            (!batch.carryFrom || ['prep', 'cold-prep', 'grinder'].includes(batch.carryFrom)))
        if (isSealed(batch) || !atPreparation) {
          return true
        }

        return batch.ingredient === 'cold-brew'
          ? (batch.location === 'cold-prep' || (batch.location === 'hand' && batch.carryFrom === 'cold-prep')) &&
              state.coldBrew?.stage === 'ready' &&
              state.coldBrew.batchId === batch.id
          : !!state.preparation &&
              PREPARATIONS[state.preparation.recipe].output.materialId === batch.ingredient &&
              (batch.location === preparationStation(state.preparation) ||
                (batch.location === 'hand' && batch.carryFrom === preparationStation(state.preparation))) &&
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
      !state.cupDelivery ||
      !(
        state.supplyDelivery ||
        state.batches.some((batch) => batch.location === 'hand') ||
        state.cup?.craft.location === 'hand' ||
        Object.values(state.cup?.craft.places ?? {}).includes('hand') ||
        state.cup?.craft.tool ||
        state.preparation?.tool ||
        state.coldBrew?.tool ||
        dripTemperatures.some((temperature) => state.drip[temperature]?.tool) ||
        state.washing?.stage === 'carrying' ||
        state.washing?.spongeHeld ||
        cupCount(state.cleaning?.heldCups) ||
        state.cleaning?.clothHeld
      ),
    '보충할 컵 묶음과 다른 물건을 동시에 들 수 없어요.',
  )
  .refine(
    (state) =>
      state.coldBrew?.stage !== 'ready' ||
      state.batches.some((batch) => batch.id === state.coldBrew?.batchId && batch.ingredient === 'cold-brew'),
    '회수한 콜드 브루 용기가 없어요.',
  )
  .superRefine((state, context) => {
    const invalid = (message: string) => context.addIssue({ code: 'custom', message })
    const owners = dripTemperatures.flatMap((temperature) => {
      const brew = state.drip[temperature]
      return brew ? [{ temperature, brew }] : []
    })
    const tools = owners.filter(({ brew }) => brew.tool)
    if (
      tools.length > 1 ||
      (tools.length &&
        (state.supplyDelivery ||
          state.cupDelivery ||
          state.cup?.craft.location === 'hand' ||
          state.cup?.craft.tool ||
          Object.values(state.cup?.craft.places ?? {}).includes('hand') ||
          state.preparation?.tool ||
          state.coldBrew?.tool ||
          state.washing?.spongeHeld ||
          state.washing?.stage === 'carrying' ||
          state.cleaning?.clothHeld ||
          state.coldBrew?.tool ||
          Object.values(state.drip).some((brew) => brew?.tool) ||
          cupCount(state.cleaning?.heldCups)))
    )
      invalid('URN 도구와 다른 물건을 동시에 들 수 없어요.')

    for (const { temperature, brew } of owners) {
      const jobs = state.jobs.filter((job) => job.kind === 'drip-coffee' && job.preparationId === brew.id)

      if (brew.stage === 'extracting' && !brew.fault) {
        if (jobs.length !== 1 || jobs[0].station !== 'urn' || jobs[0].endsAt - jobs[0].startedAt !== DRIP.brewSeconds) {
          invalid('URN 추출 작업의 시간과 상태가 맞지 않아요.')
        }
      } else if (jobs.length) invalid('추출 중이 아닌 URN에 진행 작업이 남아 있어요.')

      if (brew.tool && (!['beans', 'ice', 'ground'].includes(brew.stage) || brew.fault))
        invalid('URN 계량 도구 상태가 맞지 않아요.')
      if (brew.beans > dripDose(temperature) * 1.5 + 1e-9 || brew.ice > DRIP.icedIceGrams * 1.5 + 1e-9)
        invalid('URN 계량 범위를 벗어났어요.')
      if (temperature === 'hot' && (brew.ice > 0 || brew.stage === 'ice' || brew.stage === 'mix'))
        invalid('HOT URN에 얼음 작업이 포함되어 있어요.')
      if (['ice', 'mix', 'ready'].includes(brew.stage) !== (brew.completedAt !== null))
        invalid('URN 추출 완료 시각이 맞지 않아요.')
      const batch = state.batches.find((batch) => batch.id === brew.batchId)

      if (brew.stage === 'ready') {
        if (
          !batch ||
          batch.ingredient !== dripIngredient(temperature) ||
          batch.dripBean !== brew.bean ||
          batch.openedAt !== brew.completedAt ||
          !(
            batch.location === 'urn' ||
            (temperature === 'iced' && batch.location === 'hand' && batch.carryFrom === 'urn')
          )
        )
          invalid('URN과 완성 배치가 연결되지 않았어요.')
      } else if (brew.batchId !== null) invalid('완성되지 않은 URN에 배치가 연결되어 있어요.')
    }

    if (
      state.jobs.some((job) => job.kind === 'drip-coffee' && !owners.some(({ brew }) => brew.id === job.preparationId))
    )
      invalid('URN 작업의 소유자가 없어요.')
    if (
      state.batches.some((batch) => {
        if ((batch.ingredient === 'todays-coffee' || batch.ingredient === 'iced-coffee') !== (batch.dripBean !== null))
          return true
        if (batch.ingredient === 'todays-coffee' && batch.location !== 'urn') return true

        return (
          (batch.location === 'urn' || batch.carryFrom === 'urn') &&
          !owners.some(({ brew }) => brew.batchId === batch.id)
        )
      })
    )
      invalid('드립 배치의 원두 또는 보관 장소가 맞지 않아요.')
  })
  .refine(
    (state) =>
      reusableCupKinds.every((kind) => {
        const stock = state.reusableCups[kind]
        const washing = state.washing?.item === kind && state.washing.stage !== 'ready' ? 1 : 0
        const dishwasher = state.dishwasher.rack[kind] ?? 0
        const customer = customerCupCounts(state)[kind]
        const surfaces = state.condiment.cups[kind] + tableIds.reduce((sum, id) => sum + state.tables[id].cups[kind], 0)

        return (
          stock.clean +
            stock.dirty +
            stock.washed +
            washing +
            dishwasher +
            customer +
            surfaces +
            (state.cleaning?.heldCups[kind] ?? 0) +
            (state.cup?.craft.kind === kind && !state.cup.craft.personalCup ? 1 : 0) ===
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
export type DripBrew = z.infer<typeof dripBrewSchema>
export type Washing = z.infer<typeof washingSchema>
export type Cleaning = z.infer<typeof cleaningSchema>
export type Customer = z.infer<typeof customerSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type OrderLine = z.infer<typeof orderLineSchema>
export type Sale = z.infer<typeof saleSchema>
