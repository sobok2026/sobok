import { z } from 'zod'
import inventoryData from '../../data/shop/inventory.json'
import stockRuleData from '../../data/shop/stock-rules.json'

const text = z.string().trim().min(1)
const positive = z.number().positive()
const nonnegative = z.number().nonnegative()
const materialQuality = z.strictObject({
  storage: z.enum(['room', 'fridge']),
  lifetime: z.strictObject({ amount: positive, unit: z.enum(['days', 'hours', 'months']) }),
})
export const qualitySchema = z.record(text, materialQuality)
const stockUnit = z.enum(['ml', 'g', 'piece', 'pack', 'scoop', 'tap'])
const stockSize = z.enum(['single', 'short', 'tall', 'grande', 'venti', 'trenta'])
const cupStyle = z.enum(['hot-paper', 'iced-plastic', 'hot-mug', 'iced-glass'])
const countUnit = z.enum(['pump', 'shot', 'scoop', 'pack', 'tap', 'turn', 'piece', 'cycle', 'drop', 'bag', 'cup'])
const sizeNumbers = z.record(stockSize, positive)
const geometry = z.strictObject({
  capacityMilliliters: positive,
  heightMillimeters: positive,
  topDiameterMillimeters: positive,
  bottomDiameterMillimeters: positive,
})

export const shopInventorySchema = z.strictObject({
  note: text,
  materials: z.record(
    text,
    z.strictObject({
      stockUnit,
      unit: text,
      pack: positive,
      price: nonnegative,
      storage: materialQuality.shape.storage.optional(),
      lifetime: materialQuality.shape.lifetime.optional(),
      startingAmount: nonnegative,
      color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
      visualGroup: z.enum(['coffee', 'milk', 'tea', 'sauce', 'foam', 'powder', 'ice', 'water', 'other']),
    }),
  ),
})

export const shopStockRulesSchema = z.strictObject({
  note: text,
  rangePolicy: z.literal('minimum'),
  volumeUnits: z.strictObject({ ml: z.literal(1), l: z.literal(1000), oz: positive, tsp: positive }),
  massUnits: z.strictObject({ g: z.literal(1), kg: z.literal(1000), lb: positive }),
  utilityUnits: z.record(text, stockUnit),
  materials: z.record(
    text,
    z.strictObject({
      millilitersPerStockUnit: positive,
      gramsPerStockUnit: positive,
      counts: z.record(countUnit, positive),
      phase: z.enum(['liquid', 'foam', 'solid']),
    }),
  ),
  tools: z.record(text, z.strictObject({ value: positive, unit: z.enum(['ml', 'g']), bySize: sizeNumbers.nullable() })),
  vessels: z.record(
    text,
    z.strictObject({
      geometry: z.record(stockSize, geometry),
      cupStyles: z.record(cupStyle, z.record(stockSize, geometry)).nullable(),
      lines: z.record(text, sizeNumbers),
      marks: z.record(text, sizeNumbers),
    }),
  ),
  fractions: z.record(
    text,
    z.discriminatedUnion('kind', [
      z.strictObject({ kind: z.literal('tool'), toolId: text }),
      z.strictObject({ kind: z.literal('vessel'), vesselId: text, rimGapMillimeters: nonnegative }),
      z.strictObject({ kind: z.literal('target') }),
    ]),
  ),
  espresso: z.record(
    text,
    z.strictObject({
      beans: z.array(z.strictObject({ materialId: text, share: positive })).min(1),
      gramsPerShot: positive,
      millilitersPerShot: positive,
    }),
  ),
  ice: z.strictObject({ materialId: text, packedVolumeRatio: positive.max(1) }),
  foamProfiles: z.strictObject({
    steam: z.strictObject({ stockFraction: nonnegative.max(1), volumeMultiplier: positive }),
    charge: z.strictObject({ stockFraction: nonnegative.max(1), volumeMultiplier: positive }),
    air: z
      .array(
        z.strictObject({ minimumSeconds: nonnegative, stockFraction: nonnegative.max(1), volumeMultiplier: positive }),
      )
      .min(1),
  }),
  machineVolumeMultipliers: z.record(text, z.record(text, positive)),
  machineDispenses: z.record(text, z.record(text, z.strictObject({ materialId: text, milliliters: positive }))),
  actionUnits: z.strictObject({
    peel: positive,
    cut: positive,
    squeeze: positive,
    place: positive,
    attach: positive,
    charge: positive,
  }),
  preparationOutputs: z.record(text, z.strictObject({ materialId: text, amount: positive, stockUnit })),
})

export type StockSize = z.infer<typeof stockSize>
export type StockGeometry = z.infer<typeof geometry>
export type ShopStockRules = z.infer<typeof shopStockRulesSchema>
export const shopInventory = shopInventorySchema.parse(inventoryData)
export const shopStockRules = shopStockRulesSchema.parse(stockRuleData)

for (const [method, setting] of Object.entries(shopStockRules.espresso)) {
  if (Math.abs(setting.beans.reduce((total, bean) => total + bean.share, 0) - 1) > 1e-9)
    throw new Error(`${method}: 에스프레소 재고 원두 비율의 합이 1이어야 합니다.`)
}
for (const output of Object.values(shopStockRules.preparationOutputs)) {
  if (shopInventory.materials[output.materialId]?.stockUnit !== output.stockUnit)
    throw new Error(`${output.materialId}: 완성 배합의 재고 단위가 재료 운영값과 다릅니다.`)
}

const flowAmount = z.number().min(0).max(100000000)
const flowChange = z.number().min(-100000000).max(100000000)
const phase = z.enum(['liquid', 'foam', 'solid'])
export const stockLayerSchema = z.strictObject({
  materialId: text,
  phase,
  ground: z.boolean(),
  quantity: flowAmount,
  milliliters: flowAmount,
})
export const stockVesselSchema = z.strictObject({
  layers: z.array(stockLayerSchema),
  voids: flowAmount,
  processes: z.array(text),
  // Read projections. Only layers are used to calculate content transfers.
  fill: z.number().min(0).max(1),
  materials: z.record(text, flowAmount),
})
export const stockEffectSchema = z.strictObject({
  costs: z.record(text, flowAmount),
  stockHeld: z.record(text, flowChange),
  repeatable: z.boolean(),
  targetFills: z.record(text, nonnegative.max(1)),
  transfer: z
    .strictObject({
      from: text,
      into: text,
      requiredMilliliters: flowAmount.nullable(),
      availableMilliliters: flowAmount,
      movedMilliliters: flowAmount,
    })
    .nullable(),
  vessels: z.record(
    text,
    z.strictObject({
      layers: z.array(
        z.strictObject({ materialId: text, phase, ground: z.boolean(), quantity: flowChange, milliliters: flowChange }),
      ),
      processes: z.array(text),
    }),
  ),
})
export type StockLayer = z.infer<typeof stockLayerSchema>
export type StockVessel = z.infer<typeof stockVesselSchema>
export type StockEffect = z.infer<typeof stockEffectSchema>
