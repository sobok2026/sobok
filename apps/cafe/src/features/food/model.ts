import { z } from 'zod'
import { orderOptionsSchema } from '../service/checkout-model'

const identifier = z.string().min(1).max(100)
const timestamp = z.number().min(0).max(100000000000)

export const foodOrderSchema = z.object({
  productId: identifier,
  service: z.enum(['dine-in', 'takeout']),
  warmed: z.boolean(),
  quantity: z.number().int().min(1).max(99),
  options: orderOptionsSchema,
})
export type FoodOrder = z.infer<typeof foodOrderSchema>

export const foodLineSchema = foodOrderSchema.extend({
  id: identifier,
  unitPrice: z.number().int().positive().max(100000000),
  served: z.number().int().min(0).max(99),
})
export type FoodLine = z.infer<typeof foodLineSchema>

export const foodBatchSchema = z.object({
  id: identifier,
  productId: identifier,
  quantity: z.number().int().min(0).max(1000),
  location: z.enum(['stock', 'showcase']),
  receivedAt: timestamp,
  expiresAt: timestamp,
  displayedAt: timestamp.nullable(),
})
export type FoodBatch = z.infer<typeof foodBatchSchema>

export const foodWorkSchema = z.object({
  lineId: identifier,
  productId: identifier,
  expiresAt: timestamp,
  stage: z.enum(['picked', 'heating', 'heated', 'packed']),
  location: z.enum(['hand', 'food-oven', 'pickup']),
  heatingEndsAt: timestamp.nullable(),
  packaging: z.enum(['none', 'individual', 'together']).nullable(),
})
export type FoodWork = z.infer<typeof foodWorkSchema>
