import { z } from 'zod'
import { ingredientIds, isCupSurface, RECIPES, recipeIds, stationIds, tableIds } from './catalog'
import { CLEANING_SECONDS, cleaningStationIds } from './cleaning'
import { craftToolIds } from './crafting'
import { PREPARATIONS, preparationIds, prepToolIds } from './preparation'
import { SUPPLY_CAPACITY, supplyIds } from './supplies'

const quantity = z.number().finite().min(0).max(100000000)
const timestamp = z.number().finite().min(0).max(100000000000)
const ingredientAmounts = z.partialRecord(z.enum(ingredientIds), quantity)
export const batchSchema = z.object({
  id: z.string().max(100),
  ingredient: z.enum(ingredientIds),
  amount: quantity,
  location: z.enum(['bar', 'stock', 'prep']),
  openedAt: timestamp.nullable(),
  expiresAt: timestamp.nullable(),
  labelled: z.boolean(),
})
const jobSchema = z.object({
  id: z.string().max(100),
  kind: z.enum(['craft-machine', 'foam', 'mocha', 'cold-brew']),
  station: z.enum(stationIds),
  label: z.string().max(200),
  startedAt: timestamp,
  endsAt: timestamp,
  cupId: z.string().max(100).optional(),
  stepIndex: quantity.optional(),
  machine: z.enum(['steam', 'espresso']).optional(),
  preparationId: z.string().max(100).optional(),
})
const totalsSchema = z.object({
  openingCash: quantity,
  purchases: ingredientAmounts,
  cupPurchases: quantity,
  coldBrewPurchases: quantity,
  disposed: ingredientAmounts,
  supplyPurchases: z.partialRecord(z.enum(supplyIds), quantity),
  suppliesUsed: z.partialRecord(z.enum(supplyIds), quantity.int()),
  served: quantity,
  revenue: quantity,
  mistakes: quantity,
  wastedCups: quantity,
  cleaned: quantity,
  washed: quantity,
  restocked: quantity,
  prepared: quantity,
})
const craftSchema = z.object({
  consumed: ingredientAmounts,
  location: z.union([z.literal('hand'), z.enum(stationIds)]),
  tool: z.enum(craftToolIds).nullable(),
  progress: z.number().finite().min(0).max(20),
  contents: z.object({
    coffee: quantity,
    sauce: quantity,
    milk: quantity,
    water: quantity,
    foam: quantity,
    ice: quantity,
    drizzle: quantity,
    powder: quantity,
  }),
  pitcherMilk: quantity,
  pitcherReserved: z.boolean(),
  steamed: z.boolean(),
  shotReady: z.boolean(),
  shotTransferred: z.boolean(),
  mixed: z.boolean(),
  lidded: z.boolean(),
  fault: z.string().max(300).nullable(),
})
const preparationSchema = z
  .object({
    id: z.string().max(100),
    recipe: z.enum(preparationIds),
    step: z.number().int().min(0).max(3),
    progress: quantity,
    stage: z.enum(['measuring', 'processing', 'ready']),
    tool: z.enum(prepToolIds).nullable(),
    toolReserved: z.boolean(),
    amounts: z.object({ cream: quantity, milk: quantity, glaze: quantity, water: quantity, mochaPowder: quantity }),
    fault: z.string().max(300).nullable(),
    batchId: z.string().max(100).nullable(),
  })
  .refine((prep) => prep.step < PREPARATIONS[prep.recipe].steps.length, '부재료 준비 단계가 범위를 벗어났어요.')
const washingSchema = z
  .object({
    id: z.string().max(100),
    stage: z.enum(['scrub', 'rinse', 'ready', 'carrying']),
    progress: z.number().finite().min(0).max(2.5),
    spongeHeld: z.boolean(),
  })
  .refine((washing) => washing.stage === 'scrub' || !washing.spongeHeld, '스펀지를 먼저 내려놓아주세요.')
const cleaningSchema = z
  .object({
    id: z.string().max(100),
    station: z.enum(cleaningStationIds),
    stage: z.enum(['collect', 'wipe', 'bag']),
    progress: z.number().finite().min(0).max(3),
    clothHeld: z.boolean(),
    heldCups: quantity.int(),
    trashCount: quantity.int(),
  })
  .refine(
    (cleaning) => !cleaning.clothHeld || (cleaning.stage === 'wipe' && cleaning.heldCups === 0),
    '컵을 비운 뒤 닦아주세요.',
  )
  .refine(
    (cleaning) => (cleaning.station === 'trash' ? cleaning.stage === 'bag' : cleaning.stage !== 'bag'),
    '청소 단계와 작업대가 맞지 않아요.',
  )
  .refine(
    (cleaning) => isCupSurface(cleaning.station) || (cleaning.heldCups === 0 && cleaning.stage !== 'collect'),
    '테이블·컨디먼트 바에서만 컵을 회수할 수 있어요.',
  )
  .refine(
    (cleaning) => cleaning.progress <= (cleaning.stage === 'collect' ? 0 : CLEANING_SECONDS[cleaning.stage]),
    '청소 진행량이 범위를 벗어났어요.',
  )
export const stateSchema = z.object({
  day: z.number().int().min(1).max(10000),
  time: timestamp,
  phase: z.enum(['open', 'closing', 'summary']),
  cash: quantity,
  orderNumber: z.number().int().min(1).max(100000),
  request: z.enum(recipeIds),
  ticket: z.enum(recipeIds).nullable(),
  preparation: preparationSchema.nullable(),
  washing: washingSchema.nullable().optional(),
  cleaning: cleaningSchema.nullable(),
  condiment: z.object({ cups: quantity.int(), dirty: z.boolean() }),
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
      step: z.number().int().min(0).max(20),
      craft: craftSchema,
    })
    .refine((cup) => cup.step <= RECIPES[cup.recipe].steps.length, '제조 단계가 범위를 벗어났어요.')
    .nullable(),
  batches: z.array(batchSchema).max(300),
  jobs: z.array(jobSchema).max(30),
  tools: z.object({ clean: quantity, dirty: quantity, washed: quantity }),
  cups: quantity,
  reserveCups: quantity,
  tables: z.record(z.enum(tableIds), z.object({ cups: quantity.int(), dirty: z.boolean() })),
  dirtyBar: z.number().int().min(0).max(20),
  trash: quantity,
  totals: totalsSchema,
  messages: z
    .array(z.object({ id: z.string().max(100), text: z.string().max(400), tone: z.enum(['info', 'success', 'error']) }))
    .max(8),
  position: z.tuple([
    z.number().finite().min(-7).max(7),
    z.number().finite().min(-6).max(6),
    z.number().finite(),
    z.number().finite(),
  ]),
})
export type GameState = z.infer<typeof stateSchema>
export type Batch = z.infer<typeof batchSchema>
export type Job = z.infer<typeof jobSchema>
export const emptyTotals = (openingCash: number): z.infer<typeof totalsSchema> => ({
  openingCash,
  purchases: {},
  cupPurchases: 0,
  coldBrewPurchases: 0,
  disposed: {},
  supplyPurchases: {},
  suppliesUsed: {},
  served: 0,
  revenue: 0,
  mistakes: 0,
  wastedCups: 0,
  cleaned: 0,
  washed: 0,
  restocked: 0,
  prepared: 0,
})
export const uid = () => crypto.randomUUID()
