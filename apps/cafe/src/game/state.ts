import { z } from 'zod'
import { ingredientIds, recipeIds, stationIds } from './catalog'

const quantity = z.number().finite().min(0).max(100000000)
const timestamp = z.number().finite().min(0).max(100000000000)
export const batchSchema = z.object({
  id: z.string().max(100),
  ingredient: z.enum(ingredientIds),
  amount: quantity,
  location: z.enum(['bar', 'stock']),
  openedAt: timestamp.nullable(),
  expiresAt: timestamp.nullable(),
  labelled: z.boolean(),
})
const jobSchema = z.object({
  id: z.string().max(100),
  kind: z.enum(['step', 'wash', 'clean-table', 'wipe', 'foam', 'mocha', 'cold-brew']),
  station: z.enum(stationIds),
  label: z.string().max(200),
  startedAt: timestamp,
  endsAt: timestamp,
  cupId: z.string().max(100).optional(),
  stepIndex: quantity.optional(),
  usesTool: z.boolean().optional(),
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
export const stateSchema = z.object({
  version: z.literal(1),
  day: z.number().int().min(1).max(10000),
  time: timestamp,
  phase: z.enum(['open', 'closing', 'summary']),
  cash: quantity,
  orderNumber: z.number().int().min(1).max(100000),
  request: z.enum(recipeIds),
  ticket: z.enum(recipeIds).nullable(),
  cup: z
    .object({ id: z.string().max(100), recipe: z.enum(recipeIds), step: z.number().int().min(0).max(20) })
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
