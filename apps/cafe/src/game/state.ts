import { z } from 'zod'
import { ingredientIds, RECIPES, recipeIds, stationIds } from './catalog'
import { craftToolIds } from './crafting'
import { PREPARATIONS, preparationIds, prepToolIds } from './preparation'

const quantity = z.number().finite().min(0).max(100000000)
const timestamp = z.number().finite().min(0).max(100000000000)
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
  kind: z.enum(['craft-machine', 'wash', 'clean-table', 'wipe', 'foam', 'mocha', 'cold-brew']),
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
export const stateSchema = z.object({
  day: z.number().int().min(1).max(10000),
  time: timestamp,
  phase: z.enum(['open', 'closing', 'summary']),
  cash: quantity,
  orderNumber: z.number().int().min(1).max(100000),
  request: z.enum(recipeIds),
  ticket: z.enum(recipeIds).nullable(),
  preparation: preparationSchema.nullable(),
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
  dirtyTables: z.number().int().min(0).max(20),
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
export const emptyTotals = () => ({
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
