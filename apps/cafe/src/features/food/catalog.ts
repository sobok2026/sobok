import { z } from 'zod'
import data from '../../../data/shop/food.json'
import { uid } from '../../shared/id'
import type { FoodBatch } from './model'

const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['bread', 'sandwich', 'cake', 'goods']),
  price: z.number().int().positive(),
  purchaseQuantity: z.number().int().positive(),
  purchasePrice: z.number().int().positive(),
  storageHours: z.number().positive(),
  heatingSeconds: z.number().int().min(0),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  source: z.string(),
})
export type FoodProduct = z.infer<typeof productSchema>

export const foodProducts = z.object({ note: z.string(), products: z.array(productSchema) }).parse(data).products
export const FOODS: Record<string, FoodProduct> = Object.fromEntries(
  foodProducts.map((product) => [product.id, product]),
)
export const SHOWCASE_CAPACITY = 18

export function initialFoodBatches(time: number): FoodBatch[] {
  return foodProducts.map((product) => ({
    id: uid(),
    productId: product.id,
    quantity: product.purchaseQuantity,
    location: 'stock',
    receivedAt: time,
    expiresAt: time + product.storageHours * 3600,
    displayedAt: null,
  }))
}
