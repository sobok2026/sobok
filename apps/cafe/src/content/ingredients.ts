import materialData from '../../data/materials.json'
import qualityData from '../../data/quality.json'
import { qualitySchema, shopInventory, shopStockRules } from './inventory-schema'
import type { Lifetime } from './lifetime'
import { materialSchema } from './recipe-schema'

export type IngredientId = string
export type Costs = Record<string, number>

export type Ingredient = {
  id: string
  name: string
  unit: string
  stockUnit: string
  pack: number
  price: number
  storage: 'room' | 'fridge'
  lifetime: Lifetime
  prepared: boolean
  preparationId: string | null
  startingAmount: number
  color?: string
  visualGroup: 'coffee' | 'milk' | 'tea' | 'sauce' | 'foam' | 'powder' | 'ice' | 'water' | 'other'
}

const materials = materialSchema.parse(materialData)
const sourceQuality = qualitySchema.parse(qualityData)
const sourceIds = new Set(materials.map((material) => material.id))

for (const id of Object.keys(sourceQuality)) {
  if (!sourceIds.has(id)) throw new Error(`품질 기준에 원문 재료 '${id}'가 없습니다.`)
}

for (const id of Object.keys(shopInventory.materials)) {
  if (!sourceIds.has(id)) throw new Error(`재고 운영값에 원문 재료 '${id}'가 없습니다.`)
}

for (const id of Object.keys(shopStockRules.materials)) {
  if (!sourceIds.has(id)) throw new Error(`재고 환산값에 원문 재료 '${id}'가 없습니다.`)
}

export const ingredientIds: string[] = materials
  .filter((material) => material.kind !== 'utility')
  .map((material) => material.id)

export const INGREDIENTS: Record<string, Ingredient> = Object.fromEntries(
  materials.flatMap((material) => {
    if (!shopStockRules.materials[material.id]) throw new Error(`${material.name}: 재고 환산값이 없습니다.`)
    const supply = shopInventory.materials[material.id]

    if (material.kind === 'utility') {
      if (supply) throw new Error(`${material.name}: 무제한 공급품은 재고 품목으로 등록할 수 없습니다.`)
      if (!shopStockRules.utilityUnits[material.id]) throw new Error(`${material.name}: 공급량 계산 단위가 없습니다.`)
      return []
    }

    if (!supply) throw new Error(`${material.name}: 재고 운영값이 없습니다.`)
    const quality = sourceQuality[material.id]
    if (quality && (supply.storage !== undefined || supply.lifetime !== undefined))
      throw new Error(`${material.name}: quality.json의 보관·기한 기준을 재고 운영값에 중복 선언할 수 없습니다.`)
    const storage = quality?.storage ?? supply.storage
    const lifetime = quality?.lifetime ?? supply.lifetime
    if (storage === undefined || lifetime === undefined)
      throw new Error(
        `${material.name}: 확인된 품질 기준이 없는 재료는 재고 운영값에 보관 장소와 기한이 모두 필요합니다.`,
      )

    return [
      [
        material.id,
        {
          ...supply,
          storage,
          lifetime,
          id: material.id,
          name: material.name,
          prepared: material.kind === 'prepared',
          preparationId: material.preparationId,
        },
      ],
    ]
  }),
)
