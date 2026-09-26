import type {
  CatalogSize,
  Equipment,
  Material,
  RecipeAmount,
  RecipeDocument,
  RecipeOperation,
  RecipeVariant,
  RecipeVessel,
} from './recipe-schema'
import { equipmentSchema, materialSchema, recipeDocumentSchema, selectedAmount, vesselSchema } from './recipe-schema'

export type RecipeCatalog = {
  recipes: Map<string, RecipeDocument>
  materials: Map<string, Material>
  equipment: Map<string, Equipment>
  vessels: Map<string, RecipeVessel>
}

const orderedSizes: CatalogSize[] = ['short', 'tall', 'grande', 'venti', 'trenta']
type AmountChoice = Extract<RecipeOperation, { action: 'add' }>['amount']

function unique<T extends { id: string }>(items: T[], label: string): Map<string, T> {
  const result = new Map<string, T>()

  for (const item of items) {
    if (result.has(item.id)) {
      throw new Error(`${label} ID가 중복됩니다: ${item.id}`)
    }
    result.set(item.id, item)
  }

  return result
}

function distinct(values: string[], context: string) {
  if (new Set(values).size !== values.length) {
    throw new Error(`${context}: 값이 중복됩니다.`)
  }
}

function requireDefinition<T>(collection: Map<string, T>, id: string, context: string): T {
  const definition = collection.get(id)
  if (!definition) {
    throw new Error(`${context}: '${id}' 정의가 없습니다.`)
  }
  return definition
}

function requireItem(catalog: RecipeCatalog, id: string, context: string) {
  if (!catalog.materials.has(id) && !catalog.equipment.has(id) && !catalog.vessels.has(id)) {
    throw new Error(`${context}: '${id}' 재료·도구·용기 정의가 없습니다.`)
  }
}

function validateRanges(value: unknown, context: string) {
  if (!value || typeof value !== 'object') {
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) validateRanges(item, context)
    return
  }

  const fields = value as Record<string, unknown>

  for (const [lower, upper] of [
    ['min', 'max'],
    ['minSeconds', 'maxSeconds'],
    ['minMillimeters', 'maxMillimeters'],
  ]) {
    const min = fields[lower]
    const max = fields[upper]
    if (typeof min === 'number' && typeof max === 'number' && min > max) {
      throw new Error(`${context}: ${lower}(${min})은 ${upper}(${max})보다 클 수 없습니다.`)
    }
  }

  for (const child of Object.values(fields)) validateRanges(child, context)
}

function validateSizeKeys(values: Partial<Record<CatalogSize, unknown>>, sizes: CatalogSize[], context: string) {
  if (!sizes.length) {
    throw new Error(`${context}: 사이즈가 없는 제조법에는 사이즈별 값을 지정할 수 없습니다.`)
  }
  for (const size of sizes)
    if (values[size] === undefined) {
      throw new Error(`${context}: ${size} 값이 없습니다.`)
    }

  for (const size of Object.keys(values))
    if (!sizes.includes(size as CatalogSize)) {
      throw new Error(`${context}: 지원하지 않는 ${size} 값입니다.`)
    }
}

function amountsForVariant(
  amount: AmountChoice,
  sizes: CatalogSize[],
  context: string,
): { amount: RecipeAmount; size?: CatalogSize }[] {
  if (amount.kind === 'by-size') {
    validateSizeKeys(amount.values, sizes, context)
    return sizes.map((size) => ({ amount: selectedAmount(amount, size), size }))
  }
  return sizes.length ? sizes.map((size) => ({ amount, size })) : [{ amount }]
}

function validateCountTool(amount: RecipeAmount, tool: Equipment, context: string) {
  if (amount.kind !== 'count' && amount.kind !== 'count-range') {
    return
  }
  if ((amount.unit === 'pump' && tool.kind !== 'pump') || (amount.unit === 'scoop' && tool.kind !== 'scoop')) {
    throw new Error(`${context}: ${tool.name}로 ${amount.unit} 계량을 할 수 없습니다.`)
  }
}

function validateAmount(
  amount: RecipeAmount,
  context: string,
  size?: CatalogSize,
  vessel?: RecipeVessel,
  tool?: Equipment,
) {
  validateRanges(amount, context)

  if (
    'referenceSize' in amount &&
    (amount.referenceSize === 'one-size-smaller' || amount.referenceSize === 'one-size-larger')
  ) {
    const index = size === undefined ? -1 : orderedSizes.indexOf(size)
    const reference = index + (amount.referenceSize === 'one-size-smaller' ? -1 : 1)
    if (index < 0 || reference < 0 || reference >= orderedSizes.length) {
      throw new Error(`${context}: ${size ?? '사이즈 미지정'}에서 ${amount.referenceSize} 기준을 선택할 수 없습니다.`)
    }
  }

  if (tool) {
    validateCountTool(amount, tool, context)
  }
  if (amount.kind === 'line' && vessel && !vessel.lines.includes(amount.line)) {
    throw new Error(`${context}: ${vessel.name}에 '${amount.line}' 기준선이 정의되지 않았습니다.`)
  }
  if (amount.kind === 'mark' && vessel && !vessel.marks?.includes(amount.label)) {
    throw new Error(`${context}: ${vessel.name}에 '${amount.label}' 표시가 정의되지 않았습니다.`)
  }
}

function stepOperations(step: RecipeVariant['steps'][number]): RecipeOperation[] {
  return [...step.operations, ...(step.alternatives ?? []).flatMap((alternative) => alternative.operations)]
}

function validateOperation(catalog: RecipeCatalog, operation: RecipeOperation, sizes: CatalogSize[], context: string) {
  validateRanges(operation, context)
  if ('materialId' in operation && operation.materialId) {
    requireDefinition(catalog.materials, operation.materialId, context)
  }
  if ('gasMaterialId' in operation && operation.gasMaterialId) {
    requireDefinition(catalog.materials, operation.gasMaterialId, context)
  }
  if ('itemId' in operation) {
    requireItem(catalog, operation.itemId, context)
  }
  if ('toId' in operation) {
    requireItem(catalog, operation.toId, context)
  }
  if ('excludeMaterialIds' in operation) {
    for (const materialId of operation.excludeMaterialIds ?? [])
      requireDefinition(catalog.materials, materialId, context)
  }
  const tool =
    'toolId' in operation && operation.toolId
      ? requireDefinition(catalog.equipment, operation.toolId, context)
      : undefined
  if ('toolIds' in operation) {
    for (const toolId of operation.toolIds ?? []) requireDefinition(catalog.equipment, toolId, context)
  }
  const equipment =
    'equipmentId' in operation && operation.equipmentId
      ? requireDefinition(catalog.equipment, operation.equipmentId, context)
      : undefined
  if (equipment && ['espresso', 'grind', 'run-machine'].includes(operation.action) && equipment.kind !== 'machine') {
    throw new Error(`${context}: '${equipment.id}'은 기계 장비가 아닙니다.`)
  }
  if ('from' in operation) {
    requireDefinition(catalog.vessels, operation.from, context)
  }
  if ('vessel' in operation) {
    requireDefinition(catalog.vessels, operation.vessel, context)
  }
  const into = 'into' in operation ? requireDefinition(catalog.vessels, operation.into, context) : undefined

  if (operation.action === 'run-machine') {
    if (typeof operation.program !== 'string') {
      validateSizeKeys(operation.program, sizes, `${context} 장비 프로그램`)
    }
    const programs = typeof operation.program === 'string' ? [operation.program] : Object.values(operation.program)

    for (const program of programs)
      if (!equipment!.programs.some((entry) => entry.id === program)) {
        throw new Error(`${context}: '${equipment!.id}' 장비에 '${program}' 프로그램이 없습니다.`)
      }
  }

  if ('amount' in operation && operation.amount) {
    for (const selected of amountsForVariant(operation.amount, sizes, context))
      validateAmount(selected.amount, context, selected.size, into, tool)
  }
}

function inputMaterials(operation: RecipeOperation): string[] {
  switch (operation.action) {
    case 'add':
    case 'grind':
    case 'squeeze':
    case 'peel':
    case 'cut':
      return [operation.materialId]
    case 'espresso':
      return operation.materialId ? [operation.materialId] : []
    case 'charge':
      return operation.gasMaterialId ? [operation.gasMaterialId] : []
    case 'place':
    case 'attach':
      return [operation.itemId]
    default:
      return []
  }
}

function preparationDependencies(catalog: RecipeCatalog, variant: RecipeVariant): Set<string> {
  const dependencies = new Set<string>()

  for (const step of variant.steps)
    for (const operation of stepOperations(step))
      for (const materialId of inputMaterials(operation)) {
        const preparationId = catalog.materials.get(materialId)?.preparationId
        if (preparationId) {
          dependencies.add(preparationId)
        }
      }

  return dependencies
}

function validatePreparations(catalog: RecipeCatalog) {
  for (const material of catalog.materials.values()) {
    if (!material.preparationId) {
      continue
    }
    const recipe = requireDefinition(catalog.recipes, material.preparationId, material.name)
    if (material.kind !== 'prepared') {
      throw new Error(`${material.name}: 제조법이 연결된 재료는 prepared 종류여야 합니다.`)
    }
    if (recipe.kind !== 'preparation') {
      throw new Error(`${material.name}: '${recipe.id}'은 부재료 제조법이 아닙니다.`)
    }
    if (!recipe.variants.some((variant) => variant.output?.materialId === material.id)) {
      throw new Error(`${material.name}: '${recipe.id}' 제조법에 이 재료의 완성 결과가 없습니다.`)
    }
  }

  const visiting: string[] = []
  const visited = new Set<string>()

  const visit = (recipeId: string) => {
    const cycleStart = visiting.indexOf(recipeId)
    if (cycleStart !== -1) {
      throw new Error(`부재료 제조 참조가 순환합니다: ${[...visiting.slice(cycleStart), recipeId].join(' → ')}`)
    }
    if (visited.has(recipeId)) {
      return
    }
    visiting.push(recipeId)
    const recipe = catalog.recipes.get(recipeId)!

    for (const variant of recipe.variants)
      for (const dependency of preparationDependencies(catalog, variant)) visit(dependency)

    visiting.pop()
    visited.add(recipeId)
  }

  for (const recipe of catalog.recipes.values())
    if (recipe.kind === 'preparation') {
      visit(recipe.id)
    }
}

export function parseRecipeCatalog(input: {
  recipes: unknown[]
  materials: unknown
  equipment: unknown
  vessels: unknown
}): RecipeCatalog {
  const catalog: RecipeCatalog = {
    recipes: unique(
      input.recipes.map((recipe) => recipeDocumentSchema.parse(recipe)),
      '레시피',
    ),
    materials: unique(materialSchema.parse(input.materials), '재료'),
    equipment: unique(equipmentSchema.parse(input.equipment), '도구·장비'),
    vessels: unique(vesselSchema.parse(input.vessels), '용기'),
  }

  for (const equipment of catalog.equipment.values()) {
    unique(equipment.programs, `${equipment.name} 프로그램`)
    validateRanges(equipment.programs, `${equipment.name} 프로그램`)
  }

  for (const vessel of catalog.vessels.values()) {
    distinct(vessel.lines, `${vessel.name} 기준선`)
    distinct(vessel.marks ?? [], `${vessel.name} 표시`)
    distinct(
      vessel.lineVolumes.map((entry) => `${entry.cupStyle ?? 'vessel'}/${entry.size}/${entry.line}`),
      `${vessel.name} 기준선 용량`,
    )

    for (const volume of vessel.lineVolumes)
      if (!vessel.lines.includes(volume.line)) {
        throw new Error(`${vessel.name}: 기준선 용량의 '${volume.line}' 기준선이 정의되지 않았습니다.`)
      }

    const orderedLines = ['lower', 'middle', 'upper'] as const

    for (const volume of vessel.lineVolumes) {
      const position = orderedLines.indexOf(volume.line as (typeof orderedLines)[number])
      if (position === -1) {
        continue
      }

      for (const nextLine of orderedLines.slice(position + 1)) {
        const higher = lineVolume(catalog, vessel.id, volume.size, nextLine, volume.cupStyle)
        if (higher !== null && volume.milliliters >= higher) {
          throw new Error(`${vessel.name} ${volume.size}: ${volume.line} 용량은 ${nextLine}보다 작아야 합니다.`)
        }
      }
    }
  }

  for (const recipe of catalog.recipes.values()) {
    unique(recipe.variants, `${recipe.name} 제조법`)
    for (const variant of recipe.variants) {
      const context = `${recipe.name} / ${variant.name}`
      unique(variant.steps, `${context} 단계`)
      distinct(variant.sizes, `${context} 사이즈`)

      if (variant.output) {
        requireDefinition(catalog.materials, variant.output.materialId, `${context} 완성 재료`)
        if (variant.output.amount) {
          validateAmount(variant.output.amount, `${context} 완성 수량`)
        }
      }

      for (const step of variant.steps) {
        const stepContext = `${context} / ${step.id}`
        for (const [index, operation] of stepOperations(step).entries())
          validateOperation(catalog, operation, variant.sizes, `${stepContext} / ${index + 1}. ${operation.action}`)
      }
    }
  }

  validatePreparations(catalog)
  return catalog
}

export function recipeVariant(catalog: RecipeCatalog, recipeId: string, variantId: string) {
  const recipe = catalog.recipes.get(recipeId)
  const variant = recipe?.variants.find((item) => item.id === variantId)
  if (!recipe || !variant) {
    throw new Error(`제조법을 찾을 수 없습니다: ${recipeId}/${variantId}`)
  }
  return { recipe, variant }
}

export function recipeVariantExecutionIssues(catalog: RecipeCatalog, recipeId: string, variantId: string): string[] {
  const { recipe, variant } = recipeVariant(catalog, recipeId, variantId)
  const issues = variant.review.map((review) => `${recipe.name} / ${variant.name}: ${review}`)

  for (const step of variant.steps) {
    if (!step.operations.length) {
      issues.push(`${step.label}: 제조 동작이 연결되지 않았습니다.`)
    }
    for (const operation of stepOperations(step)) {
      if (!('amount' in operation) || !operation.amount) {
        continue
      }
      for (const { amount, size } of amountsForVariant(operation.amount, variant.sizes, step.label))
        if (amount.kind === 'unspecified') {
          issues.push(`${step.label}${size ? ` (${size})` : ''}: ${amount.description}`)
        }
    }
  }

  return [...new Set(issues)]
}

export function executableRecipeVariant(catalog: RecipeCatalog, recipeId: string, variantId: string) {
  const issues = recipeVariantExecutionIssues(catalog, recipeId, variantId)
  if (issues.length) {
    throw new Error(`실행할 수 없는 제조법입니다: ${recipeId}/${variantId}\n${issues.join('\n')}`)
  }
  return recipeVariant(catalog, recipeId, variantId)
}

export function operationAmount(operation: Extract<RecipeOperation, { amount: unknown }>, size: CatalogSize) {
  return selectedAmount(operation.amount, size)
}

// No implicit cup-line conversion or generic pump capacity is permitted.
export function amountMilliliters(catalog: RecipeCatalog, amount: RecipeAmount, toolId?: string): number | null {
  if (amount.kind === 'amount') {
    if (amount.approximate) {
      return null
    }
    if (amount.unit === 'ml') {
      return amount.value
    }
    if (amount.unit === 'l') {
      return amount.value * 1000
    }
    return null
  }

  if (amount.kind !== 'count' || !toolId) {
    return null
  }
  const tool = requireDefinition(catalog.equipment, toolId, '계량 도구')
  validateCountTool(amount, tool, '계량 도구')
  if (amount.approximate || amount.atLeast) {
    return null
  }
  if (tool.dose?.unit !== 'ml') {
    return null
  }
  if (amount.unit !== 'pump' && amount.unit !== 'scoop') {
    return null
  }
  // Milliliters are kept at microliter precision for deterministic stock arithmetic.
  return Math.round(amount.value * Math.round(tool.dose.value * 1000)) / 1000
}

export function lineVolume(
  catalog: RecipeCatalog,
  vesselId: string,
  size: CatalogSize,
  line: RecipeVessel['lines'][number],
  cupStyle: RecipeVessel['lineVolumes'][number]['cupStyle'],
): number | null {
  const volume = catalog.vessels
    .get(vesselId)
    ?.lineVolumes.find((entry) => entry.size === size && entry.line === line && entry.cupStyle === cupStyle)
  return volume?.milliliters ?? null
}
