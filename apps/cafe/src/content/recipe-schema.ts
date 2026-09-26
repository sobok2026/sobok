import { z } from 'zod'

const id = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9가-힣][A-Za-z0-9가-힣._-]*$/)

const text = z.string().trim().min(1)
const positive = z.number().positive()
const sizes = ['short', 'tall', 'grande', 'venti', 'trenta'] as const
export const recipeSizeSchema = z.enum(sizes)
export type CatalogSize = z.infer<typeof recipeSizeSchema>

const referenceSize = z.union([recipeSizeSchema, z.enum(['one-size-smaller', 'one-size-larger'])])
const physicalUnit = z.enum(['ml', 'l', 'g', 'kg', 'lb', 'oz'])
const countUnit = z.enum(['pump', 'shot', 'scoop', 'pack', 'tap', 'turn', 'piece', 'cycle', 'drop', 'bag', 'cup'])

export const amountSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('amount'),
    value: positive,
    unit: physicalUnit,
    approximate: z.boolean().optional(),
  }),
  z.strictObject({ kind: z.literal('amount-range'), min: positive, max: positive, unit: physicalUnit }),
  z.strictObject({
    kind: z.literal('count'),
    value: positive,
    unit: countUnit,
    referenceSize: referenceSize.optional(),
    approximate: z.boolean().optional(),
    atLeast: z.boolean().optional(),
  }),
  z.strictObject({
    kind: z.literal('count-range'),
    min: positive,
    max: positive,
    unit: countUnit,
    referenceSize: referenceSize.optional(),
  }),
  z.strictObject({
    kind: z.literal('line'),
    line: z.enum(['lower', 'middle', 'upper', 'size', 'max']),
    referenceSize: referenceSize.optional(),
    offsetMillimeters: z.number().optional(),
  }),
  z.strictObject({
    kind: z.literal('mark'),
    label: text,
    referenceSize: referenceSize.optional(),
    offsetMillimeters: z.number().optional(),
  }),
  z.strictObject({ kind: z.literal('fill-volume'), value: positive, unit: z.enum(['ml', 'l']) }),
  z.strictObject({
    kind: z.literal('fraction'),
    numerator: z.number().int().positive(),
    denominator: z.number().int().positive(),
    of: text,
    referenceSize: referenceSize.optional(),
  }),
  z.strictObject({ kind: z.literal('depth'), millimeters: positive }),
  z.strictObject({ kind: z.literal('depth-range'), minMillimeters: positive, maxMillimeters: positive }),
  z.strictObject({ kind: z.literal('rim-gap'), millimeters: positive }),
  z.strictObject({ kind: z.literal('all') }),
  z.strictObject({ kind: z.literal('unspecified'), description: text }),
])
export type RecipeAmount = z.infer<typeof amountSchema>

const amountChoice = z.union([
  amountSchema,
  z.strictObject({ kind: z.literal('by-size'), values: z.partialRecord(recipeSizeSchema, amountSchema) }),
])

const duration = z.union([
  z.strictObject({ seconds: positive, approximate: z.boolean(), atLeast: z.boolean().optional() }),
  z.strictObject({ minSeconds: positive, maxSeconds: positive }),
])

const repetitions = z.union([positive, z.strictObject({ min: positive, max: positive })])

const temperature = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('celsius'), value: z.number() }),
  z.strictObject({ kind: z.literal('range'), min: z.number(), max: z.number() }),
  z.strictObject({ kind: z.literal('boiling') }),
  z.strictObject({ kind: z.literal('hot') }),
  z.strictObject({ kind: z.literal('cold') }),
])
export type RecipeTemperature = z.infer<typeof temperature>

export const recipeConditionSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('container'), value: z.enum(['standard-cup', 'personal-cup', 'tumbler']) }),
  z.strictObject({ kind: z.literal('service'), value: z.enum(['for-here', 'takeaway']) }),
  z.strictObject({ kind: z.literal('customization'), option: text, choice: text }),
  z.strictObject({ kind: z.literal('observation'), property: text, value: text }),
])
export type RecipeCondition = z.infer<typeof recipeConditionSchema>
// A list is a conjunction of explicit source conditions, never an evaluated expression.
const when = z.union([recipeConditionSchema, z.array(recipeConditionSchema).min(1)])
const target = id
const portion = z.enum(['all', 'liquid', 'foam'])

function operation<T extends z.ZodRawShape>(shape: T) {
  return z.strictObject({ ...shape, when: when.optional() })
}

export const operationSchema = z.discriminatedUnion('action', [
  operation({
    action: z.literal('add'),
    materialId: id,
    into: target,
    amount: amountChoice,
    toolId: id.optional(),
    temperature: temperature.optional(),
    portion: portion.optional(),
    placement: text.optional(),
  }),
  operation({
    action: z.literal('steam'),
    vessel: target,
    setting: text.optional(),
    temperature: temperature.optional(),
    duration: duration.optional(),
    airDuration: duration.optional(),
  }),
  operation({ action: z.literal('aerate'), vessel: target, duration: duration.optional() }),
  operation({
    action: z.literal('espresso'),
    into: target,
    amount: amountChoice,
    method: z.enum(['regular', 'decaf', 'half-decaf', 'blonde', 'ristretto', 'blonde-ristretto', 'decaf-ristretto']),
    equipmentId: id.optional(),
    materialId: id.optional(),
  }),
  operation({
    action: z.literal('grind'),
    equipmentId: id,
    materialId: id,
    into: target,
    amount: amountChoice.optional(),
    setting: text.optional(),
  }),
  operation({
    action: z.literal('mix'),
    vessel: target,
    toolId: id.optional(),
    duration: duration.optional(),
    repetitions: repetitions.optional(),
    approximate: z.boolean().optional(),
  }),
  operation({
    action: z.literal('shake'),
    vessel: target,
    repetitions: repetitions.optional(),
    approximate: z.boolean().optional(),
    atLeast: z.boolean().optional(),
  }),
  operation({
    action: z.literal('swirl'),
    vessel: target,
    repetitions: repetitions.optional(),
    approximate: z.boolean().optional(),
  }),
  operation({
    action: z.literal('run-machine'),
    equipmentId: id,
    vessel: target,
    program: z.union([text, z.partialRecord(recipeSizeSchema, text)]),
    cycles: z.union([
      z.number().int().positive(),
      z.strictObject({ min: z.number().int().positive(), max: z.number().int().positive() }),
    ]),
    duration: duration.optional(),
  }),
  operation({
    action: z.literal('transfer'),
    from: target,
    into: target,
    amount: amountChoice,
    portion: portion.optional(),
    toolId: id.optional(),
  }),
  operation({
    action: z.literal('strain'),
    from: target,
    into: target,
    toolId: id.optional(),
    toolIds: z.array(id).min(1).optional(),
    excludeMaterialIds: z.array(id).optional(),
  }),
  operation({
    action: z.literal('muddle'),
    vessel: target,
    toolId: id.optional(),
    repetitions: repetitions.optional(),
  }),
  operation({ action: z.literal('squeeze'), materialId: id, into: target, amount: amountChoice.optional() }),
  operation({ action: z.literal('etch'), vessel: target, toolId: id.optional(), pattern: text.optional() }),
  operation({
    action: z.literal('charge'),
    vessel: target,
    equipmentId: id.optional(),
    gasMaterialId: id.optional(),
    cartridges: positive.optional(),
    duration: duration.optional(),
  }),
  operation({ action: z.literal('steep'), vessel: target, duration, temperature: temperature.optional() }),
  operation({
    action: z.literal('remove'),
    itemId: id,
    from: target,
    drain: duration.optional(),
    dispose: z.boolean().optional(),
  }),
  operation({ action: z.literal('peel'), materialId: id }),
  operation({ action: z.literal('cut'), materialId: id, pieces: z.number().int().positive() }),
  operation({ action: z.literal('arrange'), materialId: id, into: target, pattern: text }),
  operation({ action: z.literal('place'), itemId: id, into: target }),
  operation({ action: z.literal('attach'), itemId: id, toId: id }),
  operation({ action: z.literal('cover'), vessel: target }),
  operation({ action: z.literal('wash'), vessel: target }),
  operation({ action: z.literal('sanitize'), vessel: target }),
  operation({ action: z.literal('dry'), vessel: target }),
  operation({ action: z.literal('label'), vessel: target, labels: z.array(text).min(1) }),
  operation({
    action: z.literal('store'),
    vessel: target,
    storage: z.enum(['room', 'fridge']),
    temperature: temperature.optional(),
  }),
  operation({ action: z.literal('wait'), duration }),
  operation({
    action: z.literal('serve'),
    lid: z.enum(['takeaway', 'always', 'none']).optional(),
    lidType: z.enum(['standard', 'dome', 'flat', 'strawless', 'double-shot']).optional(),
    accessories: z.array(text).optional(),
  }),
])
export type RecipeOperation = z.infer<typeof operationSchema>

const row = z.strictObject({
  id,
  label: text,
  instructions: z.array(text).min(1),
  notes: z.array(text),
  operations: z.array(operationSchema),
  when: when.optional(),
  alternatives: z.array(z.strictObject({ label: text, operations: z.array(operationSchema).min(1) })).optional(),
})

export const recipeDocumentSchema = z.strictObject({
  id,
  name: text,
  kind: z.enum(['drink', 'preparation', 'procedure']),
  variants: z
    .array(
      z.strictObject({
        id,
        name: text,
        temperature: z.enum(['hot', 'iced']).nullable(),
        sizes: z.array(recipeSizeSchema),
        defaults: z.record(text, z.union([text, z.literal(false)])).optional(),
        steps: z.array(row).min(1),
        notes: z.array(text),
        review: z.array(text),
        output: z.strictObject({ materialId: id, amount: amountSchema.nullable(), description: text }).optional(),
      }),
    )
    .min(1),
})
export type RecipeDocument = z.infer<typeof recipeDocumentSchema>
export type RecipeVariant = RecipeDocument['variants'][number]
export type RecipeStep = RecipeVariant['steps'][number]

export const equipmentSchema = z.array(
  z.strictObject({
    id,
    name: text,
    kind: z.enum(['pump', 'scoop', 'utensil', 'machine']),
    dose: z.strictObject({ value: positive, unit: z.enum(['ml', 'g', 'oz', 'tsp']) }).nullable(),
    programs: z.array(z.strictObject({ id, name: text, duration: duration.nullable() })),
    notes: z.array(text),
  }),
)

export type Equipment = z.infer<typeof equipmentSchema>[number]

export const materialSchema = z.array(
  z.strictObject({
    id,
    name: text,
    kind: z.enum(['raw', 'prepared', 'utility']),
    stockUnit: z.enum(['ml', 'g', 'pack', 'scoop', 'tap', 'piece']).nullable(),
    preparationId: id.nullable(),
    notes: z.array(text),
  }),
)

export type Material = z.infer<typeof materialSchema>[number]

export const vesselSchema = z.array(
  z.strictObject({
    id,
    name: text,
    lines: z.array(z.enum(['lower', 'middle', 'upper', 'size', 'max'])),
    marks: z.array(text).optional(),
    lineVolumes: z.array(
      z.strictObject({
        size: recipeSizeSchema,
        line: z.enum(['lower', 'middle', 'upper', 'size', 'max']),
        cupStyle: z.enum(['hot-paper', 'iced-plastic', 'hot-mug', 'iced-glass']).nullable(),
        milliliters: positive,
      }),
    ),
    notes: z.array(text),
  }),
)

export type RecipeVessel = z.infer<typeof vesselSchema>[number]

export function selectedAmount(amount: z.infer<typeof amountChoice>, size: CatalogSize): RecipeAmount {
  if (amount.kind !== 'by-size') return amount
  const selected = amount.values[size]
  if (!selected) throw new Error(`${size} 계량 기준이 없습니다.`)
  return selected
}
