import { type Costs, INGREDIENTS } from './ingredients'
import {
  shopStockRules as rules,
  type StockEffect,
  type StockGeometry,
  type StockLayer,
  type StockSize,
  type StockVessel,
} from './inventory-schema'
import { lineVolume, type RecipeCatalog } from './recipe-catalog'
import type { PlannedStep, ResolvedOperation } from './recipe-plan'
import type { CatalogSize, RecipeAmount } from './recipe-schema'

export type StockContext = {
  size?: CatalogSize
  cupStyle: 'hot-paper' | 'iced-plastic' | 'hot-mug' | 'iced-glass'
  recipeId: string
  variantId: string
}
export type StockFlowState = { vessels: Record<string, StockVessel>; stockHeld: Costs }
export type StockNextAdd = Extract<ResolvedOperation, { action: 'add' }>
type Dose = { value: number; unit: 'ml' | 'g' | 'oz' | 'tsp' }
const EPSILON = 1e-9
const sizes: CatalogSize[] = ['short', 'tall', 'grande', 'venti', 'trenta']

function requireValue<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message)
  return value
}
function factors(materialId: string) {
  return requireValue(rules.materials[materialId], `${materialId}: 재고 환산값이 없습니다.`)
}
function stockUnit(catalog: RecipeCatalog, materialId: string) {
  const material = requireValue(catalog.materials.get(materialId), `${materialId}: 재료 정의가 없습니다.`)
  return material.kind === 'utility'
    ? requireValue(rules.utilityUnits[materialId], `${material.name}: 공급량 계산 단위가 없습니다.`)
    : requireValue(INGREDIENTS[materialId], `${material.name}: 재고 운영값이 없습니다.`).stockUnit
}
function stockFromVolume(materialId: string, milliliters: number) {
  return milliliters / factors(materialId).millilitersPerStockUnit
}
function stockFromMass(materialId: string, grams: number) {
  return grams / factors(materialId).gramsPerStockUnit
}
function physicalStock(materialId: string, value: number, unit: string) {
  if (unit in rules.volumeUnits)
    return stockFromVolume(materialId, value * rules.volumeUnits[unit as keyof typeof rules.volumeUnits])
  if (unit in rules.massUnits)
    return stockFromMass(materialId, value * rules.massUnits[unit as keyof typeof rules.massUnits])
  throw new Error(`${materialId}: '${unit}' 재고 변환이 없습니다.`)
}
function minimumCount(amount: RecipeAmount) {
  if (amount.kind === 'count') return amount.value
  if (amount.kind === 'count-range') return amount.min
  throw new Error('횟수 단위 계량이 필요합니다.')
}
function referenceSize(amount: RecipeAmount, size?: CatalogSize): StockSize {
  const reference = 'referenceSize' in amount ? amount.referenceSize : undefined
  if (!reference) return size ?? 'single'
  if (reference !== 'one-size-smaller' && reference !== 'one-size-larger') return reference
  const index = size === undefined ? -1 : sizes.indexOf(size)
  const selected = sizes[index + (reference === 'one-size-smaller' ? -1 : 1)]
  if (index < 0 || !selected) throw new Error(`${size ?? '단일 제공'}에서 '${reference}' 계량을 선택할 수 없습니다.`)
  return selected
}
function toolDose(catalog: RecipeCatalog, toolId: string, size: StockSize): Dose {
  const tool = requireValue(catalog.equipment.get(toolId), `${toolId}: 도구 정의가 없습니다.`)
  if (tool.dose) return tool.dose
  const estimate = requireValue(rules.tools[toolId], `${tool.name}: 게임 재고용 토출량이 없습니다.`)
  return { value: estimate.bySize ? estimate.bySize[size] : estimate.value, unit: estimate.unit }
}
function stockCount(
  catalog: RecipeCatalog,
  materialId: string,
  amount: Extract<RecipeAmount, { kind: 'count' | 'count-range' }>,
  size: StockSize,
  toolId?: string,
) {
  const count = minimumCount(amount)
  if (toolId && ['pump', 'scoop', 'shot'].includes(amount.unit)) {
    const dose = toolDose(catalog, toolId, size)
    return physicalStock(materialId, dose.value * count, dose.unit)
  }
  if (amount.unit === stockUnit(catalog, materialId)) return count
  return count * factors(materialId).counts[amount.unit]
}

// Explicit source output wins. Only a missing physical yield uses this shop's inventory estimate.
export function preparationStockOutput(catalog: RecipeCatalog, recipeId: string, variantId: string) {
  const recipe = requireValue(catalog.recipes.get(recipeId), `${recipeId}: 제조법이 없습니다.`)
  const variant = requireValue(
    recipe.variants.find((item) => item.id === variantId),
    `${recipeId}/${variantId}: 제조 구분이 없습니다.`,
  )
  const output = variant.output
  if (recipe.kind !== 'preparation' || !output)
    throw new Error(`${recipeId}/${variantId}: 부재료 완성 정의가 없습니다.`)
  const unit = stockUnit(catalog, output.materialId)
  const amount = output.amount
  let quantity: number
  if (amount?.kind === 'amount') quantity = physicalStock(output.materialId, amount.value, amount.unit)
  else if (amount?.kind === 'amount-range') quantity = physicalStock(output.materialId, amount.min, amount.unit)
  else if (amount?.kind === 'count' || amount?.kind === 'count-range')
    quantity = stockCount(catalog, output.materialId, amount, 'single')
  else if (amount === null) {
    const estimate = requireValue(
      rules.preparationOutputs[`${recipeId}/${variantId}`],
      `${recipeId}/${variantId}: 게임 완성 재고량이 없습니다.`,
    )
    if (estimate.materialId !== output.materialId || estimate.stockUnit !== unit)
      throw new Error(`${recipeId}/${variantId}: 완성 재고 연결이 다릅니다.`)
    quantity = estimate.amount
  } else throw new Error(`${recipeId}/${variantId}: 완성 재고량의 단위를 확인해야 합니다.`)
  return { materialId: output.materialId, amount: quantity, stockUnit: unit }
}

function checked(value: number, label: string): number {
  if (!Number.isFinite(value) || value < -EPSILON || value > 100000000)
    throw new Error(`${label}: 재고 수량이 유효하지 않습니다.`)
  return Math.max(0, value)
}
function layerKey(layer: Pick<StockLayer, 'materialId' | 'phase' | 'ground'>) {
  return `${layer.materialId}/${layer.phase}/${layer.ground}`
}
function emptyVessel(): StockVessel {
  return { layers: [], voids: 0, processes: [], fill: 0, materials: {} }
}
function copyFlow(state: StockFlowState): StockFlowState {
  return {
    stockHeld: { ...state.stockHeld },
    vessels: Object.fromEntries(
      Object.entries(state.vessels).map(([id, item]) => [
        id,
        {
          ...item,
          layers: item.layers.map((layer) => ({ ...layer })),
          materials: { ...item.materials },
          processes: [...item.processes],
        },
      ]),
    ),
  }
}
function occupied(state: StockVessel) {
  return state.layers.reduce((total, layer) => total + layer.milliliters, 0)
}
function voids(state: StockVessel) {
  const liquid = state.layers
    .filter((layer) => layer.phase === 'liquid')
    .reduce((total, layer) => total + layer.milliliters, 0)
  const ice = state.layers
    .filter((layer) => layer.materialId === rules.ice.materialId && layer.phase === 'solid')
    .reduce((total, layer) => total + layer.milliliters, 0)
  return Math.max(0, ice * (1 / rules.ice.packedVolumeRatio - 1) - liquid)
}
function level(state: StockVessel) {
  return occupied(state) + voids(state)
}
function geometry(id: string, size: StockSize, context: Pick<StockContext, 'cupStyle'>): StockGeometry {
  const model = requireValue(rules.vessels[id], `${id}: 게임 용기 형상이 없습니다.`)
  return model.cupStyles ? model.cupStyles[context.cupStyle][size] : model.geometry[size]
}
function volumeAtHeight(shape: StockGeometry, height: number) {
  const fraction = Math.min(1, Math.max(0, height / shape.heightMillimeters))
  const bottom = shape.bottomDiameterMillimeters / 2
  const difference = (shape.topDiameterMillimeters - shape.bottomDiameterMillimeters) / 2
  const integral = (at: number) =>
    bottom * bottom * at + bottom * difference * at * at + (difference * difference * at * at * at) / 3
  return (shape.capacityMilliliters * integral(fraction)) / integral(1)
}
function heightAtVolume(shape: StockGeometry, volume: number) {
  if (volume <= EPSILON) return 0
  if (volume >= shape.capacityMilliliters) return shape.heightMillimeters
  let low = 0
  let high = shape.heightMillimeters
  for (let i = 0; i < 40; i++) {
    const middle = (low + high) / 2
    if (volumeAtHeight(shape, middle) < volume) low = middle
    else high = middle
  }
  return (low + high) / 2
}
export function vesselLineFill(
  catalog: RecipeCatalog,
  vesselId: string,
  size: StockSize,
  cupStyle: StockContext['cupStyle'],
  line: 'lower' | 'middle' | 'upper',
) {
  const model = requireValue(rules.vessels[vesselId], `${vesselId}: 용기 표시 기준이 없습니다.`)
  const shape = geometry(vesselId, size, { cupStyle })
  const source = size === 'single' ? null : lineVolume(catalog, vesselId, size, line, model.cupStyles ? cupStyle : null)
  const volume = source ?? requireValue(model.lines[line], `${vesselId}: ${line} 표시 기준이 없습니다.`)[size]
  return heightAtVolume(shape, volume) / shape.heightMillimeters
}
function projectVessel(state: StockVessel, id: string, context: StockContext) {
  state.materials = {}
  for (const layer of state.layers) {
    layer.quantity = checked(layer.quantity, `${id}/${layer.materialId}`)
    layer.milliliters = checked(layer.milliliters, `${id}/${layer.materialId} 부피`)
    state.materials[layer.materialId] = (state.materials[layer.materialId] ?? 0) + layer.quantity
  }
  state.layers = state.layers.filter((layer) => layer.quantity > EPSILON || layer.milliliters > EPSILON)
  state.voids = checked(voids(state), `${id} 얼음 사이 공간`)
  const shape = geometry(id, context.size ?? 'single', context)
  state.fill = heightAtVolume(shape, level(state)) / shape.heightMillimeters
}
function addLayer(state: StockVessel, layer: StockLayer) {
  const old = state.layers.find((item) => layerKey(item) === layerKey(layer))
  if (old) {
    old.quantity += layer.quantity
    old.milliliters += layer.milliliters
  } else state.layers.push({ ...layer })
}

/** Resolve one source operation against the actual contents at the beginning of that step. */
export function buildStockEffect(
  catalog: RecipeCatalog,
  state: StockFlowState,
  operation: ResolvedOperation,
  context: StockContext,
  nextAdd?: StockNextAdd | null,
): StockEffect {
  const after = copyFlow(state)
  const costs: Costs = {}
  let repeatable = false
  let transferInfo: StockEffect['transfer'] = null
  function vessel(id: string) {
    if (!catalog.vessels.has(id)) throw new Error(`${id}: 용기 정의가 없습니다.`)
    requireValue(rules.vessels[id], `${id}: 게임 용기 환산값이 없습니다.`)
    after.vessels[id] ??= emptyVessel()
    return after.vessels[id]
  }
  function rimVolume(id: string, size: StockSize, gap: number) {
    const shape = geometry(id, size, context)
    return volumeAtHeight(shape, shape.heightMillimeters - gap)
  }
  function fillVolume(id: string, amount: RecipeAmount, size: StockSize) {
    const model = requireValue(rules.vessels[id], `${id}: 게임 용기 환산값이 없습니다.`)
    let target: number
    if (amount.kind === 'fill-volume') return amount.value * rules.volumeUnits[amount.unit]
    if (amount.kind === 'rim-gap') return rimVolume(id, size, amount.millimeters)
    if (amount.kind === 'line') {
      const source =
        size === 'single'
          ? null
          : ((model.cupStyles ? lineVolume(catalog, id, size, amount.line, context.cupStyle) : null) ??
            lineVolume(catalog, id, size, amount.line, null))
      target = source ?? requireValue(model.lines[amount.line], `${id}: '${amount.line}' 재고 계량선이 없습니다.`)[size]
    } else if (amount.kind === 'mark') {
      target = requireValue(model.marks[amount.label], `${id}: '${amount.label}' 재고 표시선이 없습니다.`)[size]
    } else throw new Error(`${amount.kind}: 누적 계량선이 아닙니다.`)
    if (amount.offsetMillimeters) {
      const shape = geometry(id, size, context)
      target = volumeAtHeight(shape, heightAtVolume(shape, target) + amount.offsetMillimeters)
    }
    return target
  }
  function fractionVolume(id: string, amount: Extract<RecipeAmount, { kind: 'fraction' }>, size: StockSize) {
    const basis = requireValue(rules.fractions[amount.of], `'${amount.of}' 분수 계량의 게임 환산값이 없습니다.`)
    const fraction = amount.numerator / amount.denominator
    if (basis.kind === 'target')
      return { value: geometry(id, size, context).capacityMilliliters * fraction, cumulative: true }
    if (basis.kind === 'vessel')
      return { value: rimVolume(basis.vesselId, size, basis.rimGapMillimeters) * fraction, cumulative: false }
    const dose = toolDose(catalog, basis.toolId, size)
    if (!(dose.unit in rules.volumeUnits)) throw new Error(`${basis.toolId}: 분수 계량에 부피 기준이 필요합니다.`)
    return {
      value: dose.value * rules.volumeUnits[dose.unit as keyof typeof rules.volumeUnits] * fraction,
      cumulative: false,
    }
  }
  function volumeToTarget(id: string, target: number, phase: StockLayer['phase']) {
    const destination = vessel(id)
    return Math.max(0, target - (phase === 'liquid' ? occupied(destination) : level(destination)))
  }
  function iceBulkToTarget(id: string, target: number) {
    const destination = vessel(id)
    const contents = occupied(destination)
    const liquid = destination.layers
      .filter((layer) => layer.phase === 'liquid')
      .reduce((total, layer) => total + layer.milliliters, 0)
    const ice = destination.layers
      .filter((layer) => layer.materialId === rules.ice.materialId && layer.phase === 'solid')
      .reduce((total, layer) => total + layer.milliliters, 0)
    const gaps = ice * (1 / rules.ice.packedVolumeRatio - 1)
    const solid = Math.max(
      0,
      Math.min(target - contents, (target - contents - gaps + liquid) * rules.ice.packedVolumeRatio),
    )
    return solid / rules.ice.packedVolumeRatio
  }
  function measured(materialId: string, amount: RecipeAmount, into: string, toolId?: string) {
    const profile = factors(materialId)
    const size = referenceSize(amount, context.size)
    const contents = vessel(into)
    const ice = materialId === rules.ice.materialId
    let quantity: number
    if (amount.kind === 'amount' || amount.kind === 'amount-range')
      quantity = physicalStock(materialId, amount.kind === 'amount' ? amount.value : amount.min, amount.unit)
    else if (amount.kind === 'count' || amount.kind === 'count-range')
      quantity = stockCount(catalog, materialId, amount, size, toolId)
    else if (amount.kind === 'fraction') {
      const fraction = fractionVolume(into, amount, size)
      const volume = fraction.cumulative
        ? ice
          ? iceBulkToTarget(into, fraction.value)
          : volumeToTarget(into, fraction.value, profile.phase)
        : fraction.value
      quantity = stockFromVolume(materialId, volume)
    } else if (amount.kind === 'depth' || amount.kind === 'depth-range') {
      const shape = geometry(into, size, context)
      const thickness = amount.kind === 'depth' ? amount.millimeters : amount.minMillimeters
      const current = level(contents)
      const target = volumeAtHeight(shape, heightAtVolume(shape, current) + thickness)
      quantity = stockFromVolume(materialId, ice ? iceBulkToTarget(into, target) : Math.max(0, target - current))
    } else if (['line', 'mark', 'fill-volume', 'rim-gap'].includes(amount.kind)) {
      const target = fillVolume(into, amount, size)
      quantity = stockFromVolume(
        materialId,
        ice ? iceBulkToTarget(into, target) : volumeToTarget(into, target, profile.phase),
      )
    } else if (amount.kind === 'all')
      quantity = requireValue(after.stockHeld[materialId], `${materialId}: 전량 투입할 재료를 먼저 계량해야 합니다.`)
    else throw new Error(`${materialId}: 원문 정량이 없는 재료를 재고값으로 대신 계량할 수 없습니다.`)
    quantity = checked(quantity, materialId)
    return {
      quantity,
      milliliters: quantity * profile.millilitersPerStockUnit * (ice ? rules.ice.packedVolumeRatio : 1),
    }
  }
  function contents(
    into: string,
    materialId: string,
    quantity: number,
    milliliters: number,
    phase = factors(materialId).phase,
    ground = false,
  ) {
    addLayer(vessel(into), {
      materialId,
      quantity: checked(quantity, materialId),
      milliliters: checked(milliliters, `${materialId} 부피`),
      phase,
      ground,
    })
  }
  function debit(materialId: string, quantity: number, useHeld = true) {
    const material = requireValue(catalog.materials.get(materialId), `${materialId}: 재료 정의가 없습니다.`)
    quantity = checked(quantity, materialId)
    if (material.kind === 'utility') return
    requireValue(INGREDIENTS[materialId], `${material.name}: 재고 운영값이 없습니다.`)
    const credit = useHeld ? Math.min(after.stockHeld[materialId] ?? 0, quantity) : 0
    if (credit) after.stockHeld[materialId] = checked((after.stockHeld[materialId] ?? 0) - credit, materialId)
    const consumed = quantity - credit
    if (consumed > EPSILON) costs[materialId] = (costs[materialId] ?? 0) + consumed
  }
  function transferVolume(op: Extract<ResolvedOperation, { action: 'transfer' }>) {
    const amount = op.amount
    const size = referenceSize(amount, context.size)
    const phase = op.portion === 'foam' ? 'foam' : 'liquid'
    if (amount.kind === 'all') return null
    if (amount.kind === 'amount' || amount.kind === 'amount-range') {
      if (!(amount.unit in rules.volumeUnits)) throw new Error('혼합물 이관에는 부피 단위가 필요합니다.')
      return (
        (amount.kind === 'amount' ? amount.value : amount.min) *
        rules.volumeUnits[amount.unit as keyof typeof rules.volumeUnits]
      )
    }
    if (amount.kind === 'count' || amount.kind === 'count-range') {
      if (!op.toolId) throw new Error('혼합물 횟수 이관에는 도구 용량이 필요합니다.')
      const dose = toolDose(catalog, op.toolId, size)
      if (!(dose.unit in rules.volumeUnits)) throw new Error('혼합물 도구에는 부피 단위가 필요합니다.')
      return minimumCount(amount) * dose.value * rules.volumeUnits[dose.unit as keyof typeof rules.volumeUnits]
    }
    if (amount.kind === 'fraction') {
      const fraction = fractionVolume(op.into, amount, size)
      return fraction.cumulative ? volumeToTarget(op.into, fraction.value, phase) : fraction.value
    }
    if (amount.kind === 'depth' || amount.kind === 'depth-range') {
      const shape = geometry(op.into, size, context)
      const current = level(vessel(op.into))
      return Math.max(
        0,
        volumeAtHeight(
          shape,
          heightAtVolume(shape, current) + (amount.kind === 'depth' ? amount.millimeters : amount.minMillimeters),
        ) - current,
      )
    }
    if (['line', 'mark', 'fill-volume', 'rim-gap'].includes(amount.kind))
      return volumeToTarget(op.into, fillVolume(op.into, amount, size), phase)
    throw new Error(`${amount.kind}: 혼합물 이관의 재고 단위를 확인해야 합니다.`)
  }
  function transfer(from: string, into: string, volume: number | null, exclude: string[], portion?: string) {
    if (from === into) throw new Error(`${from}: 같은 용기로 내용물을 옮길 수 없습니다.`)
    const source = vessel(from)
    const destination = vessel(into)
    const eligible = source.layers.filter(
      (layer) => !exclude.includes(layer.materialId) && (!portion || portion === 'all' || layer.phase === portion),
    )
    const available = eligible.reduce((sum, layer) => sum + layer.milliliters, 0)
    const fraction = volume === null ? 1 : available > EPSILON ? Math.min(1, Math.max(0, volume) / available) : 0
    transferInfo = {
      from,
      into,
      requiredMilliliters: volume,
      availableMilliliters: available,
      movedMilliliters: available * fraction,
    }
    for (const layer of eligible) {
      const moved = { ...layer, quantity: layer.quantity * fraction, milliliters: layer.milliliters * fraction }
      layer.quantity -= moved.quantity
      layer.milliliters -= moved.milliliters
      addLayer(destination, moved)
    }
  }
  function foam(id: string, profile: { stockFraction: number; volumeMultiplier: number }, process: string) {
    const target = vessel(id)
    if (target.processes.includes(process)) return
    for (const layer of [...target.layers]) {
      if (layer.phase !== 'liquid') continue
      const quantity = layer.quantity
      const milliliters = layer.milliliters
      layer.quantity *= 1 - profile.stockFraction
      layer.milliliters *= 1 - profile.stockFraction
      addLayer(target, {
        ...layer,
        phase: 'foam',
        quantity: quantity * profile.stockFraction,
        milliliters: milliliters * (profile.stockFraction + profile.volumeMultiplier - 1),
      })
    }
    target.processes.push(process)
  }
  function airProfile(duration?: { seconds: number } | { minSeconds: number }) {
    const seconds = duration ? ('seconds' in duration ? duration.seconds : duration.minSeconds) : 0
    return (
      rules.foamProfiles.air
        .filter((profile) => profile.minimumSeconds <= seconds)
        .sort((a, b) => b.minimumSeconds - a.minimumSeconds)[0] ?? rules.foamProfiles.air[0]
    )
  }
  function materialPresent(id: string) {
    return (
      (after.stockHeld[id] ?? 0) > EPSILON ||
      Object.values(after.vessels).some((target) =>
        target.layers.some((layer) => layer.materialId === id && layer.quantity > EPSILON),
      )
    )
  }
  switch (operation.action) {
    case 'add': {
      const amount = measured(operation.materialId, operation.amount, operation.into, operation.toolId)
      debit(operation.materialId, amount.quantity)
      contents(operation.into, operation.materialId, amount.quantity, amount.milliliters)
      repeatable = true
      break
    }
    case 'grind': {
      if (!operation.amount) throw new Error('분쇄할 원두 계량이 필요합니다.')
      const amount = measured(operation.materialId, operation.amount, operation.into)
      debit(operation.materialId, amount.quantity)
      contents(operation.into, operation.materialId, amount.quantity, amount.milliliters, 'solid', true)
      vessel(operation.into).processes.push('grind')
      break
    }
    case 'espresso': {
      const setting = requireValue(
        rules.espresso[operation.method],
        `${operation.method}: 에스프레소 재고 규칙이 없습니다.`,
      )
      if (
        (operation.amount.kind !== 'count' && operation.amount.kind !== 'count-range') ||
        operation.amount.unit !== 'shot'
      )
        throw new Error('에스프레소 재고 계산에는 샷 수가 필요합니다.')
      const shots = minimumCount(operation.amount)
      const beans = operation.materialId ? [{ materialId: operation.materialId, share: 1 }] : setting.beans
      for (const bean of beans) {
        const total = stockFromMass(bean.materialId, setting.gramsPerShot * shots * bean.share)
        let quantity = total
        for (const target of Object.values(after.vessels))
          for (const layer of target.layers) {
            if (
              !layer.ground ||
              layer.materialId !== bean.materialId ||
              quantity <= EPSILON ||
              layer.quantity <= EPSILON
            )
              continue
            const used = Math.min(layer.quantity, quantity)
            layer.milliliters *= Math.max(0, 1 - used / layer.quantity)
            layer.quantity -= used
            quantity -= used
          }
        debit(bean.materialId, quantity)
        contents(operation.into, bean.materialId, total, setting.millilitersPerShot * shots * bean.share, 'liquid')
      }
      vessel(operation.into).processes.push('espresso')
      break
    }
    case 'transfer':
      transfer(operation.from, operation.into, transferVolume(operation), [], operation.portion)
      repeatable = true
      break
    case 'strain':
      transfer(operation.from, operation.into, null, operation.excludeMaterialIds ?? [])
      break
    case 'steam':
      if (operation.airDuration) foam(operation.vessel, airProfile(operation.airDuration), 'aerate')
      if (!vessel(operation.vessel).processes.includes('aerate'))
        foam(operation.vessel, rules.foamProfiles.steam, 'steam')
      else vessel(operation.vessel).processes.push('steam')
      break
    case 'aerate':
      foam(operation.vessel, airProfile(operation.duration), 'aerate')
      break
    case 'run-machine': {
      const dispense = rules.machineDispenses[operation.equipmentId]?.[operation.program]
      if (dispense) {
        const cycles = typeof operation.cycles === 'number' ? operation.cycles : operation.cycles.min
        const volume = dispense.milliliters * cycles
        const quantity = stockFromVolume(dispense.materialId, volume)
        debit(dispense.materialId, quantity)
        contents(operation.vessel, dispense.materialId, quantity, volume)
        repeatable = true
      }
      const multiplier = rules.machineVolumeMultipliers[operation.equipmentId]?.[operation.program]
      const target = vessel(operation.vessel)
      const process = `machine:${operation.equipmentId}/${operation.program}`
      if (multiplier && !target.processes.includes(process)) {
        for (const layer of target.layers) layer.milliliters *= multiplier
      }
      target.processes.push(process)
      break
    }
    case 'peel':
    case 'cut': {
      const quantity =
        nextAdd?.materialId === operation.materialId
          ? measured(operation.materialId, nextAdd.amount, nextAdd.into, nextAdd.toolId).quantity
          : rules.actionUnits[operation.action] * factors(operation.materialId).counts.piece
      if (!materialPresent(operation.materialId)) {
        debit(operation.materialId, quantity)
        after.stockHeld[operation.materialId] = (after.stockHeld[operation.materialId] ?? 0) + quantity
      }
      const recipe = requireValue(catalog.recipes.get(context.recipeId), `${context.recipeId}: 제조법이 없습니다.`)
      if (operation.action === 'cut' && recipe.kind === 'preparation') {
        const variant = requireValue(
          recipe.variants.find((item) => item.id === context.variantId),
          `${context.variantId}: 제조 구분이 없습니다.`,
        )
        if (variant.output) {
          const output = preparationStockOutput(catalog, context.recipeId, context.variantId)
          after.stockHeld[operation.materialId] = 0
          after.stockHeld[output.materialId] = output.amount
        }
      }
      break
    }
    case 'squeeze': {
      if (!materialPresent(operation.materialId)) {
        const amount = measured(
          operation.materialId,
          operation.amount ?? { kind: 'count', value: rules.actionUnits.squeeze, unit: 'piece' },
          operation.into,
        )
        debit(operation.materialId, amount.quantity)
        contents(operation.into, operation.materialId, amount.quantity, amount.milliliters, 'liquid')
      }
      break
    }
    case 'place':
    case 'attach': {
      const material = catalog.materials.get(operation.itemId)
      if (material && material.kind !== 'utility' && !materialPresent(material.id)) {
        const quantity = rules.actionUnits[operation.action] * factors(material.id).counts.piece
        debit(material.id, quantity)
        const target = operation.action === 'place' ? operation.into : operation.toId
        if (catalog.vessels.has(target))
          contents(target, material.id, quantity, quantity * factors(material.id).millilitersPerStockUnit)
      }
      break
    }
    case 'arrange': {
      const quantity = after.stockHeld[operation.materialId] ?? 0
      if (quantity > EPSILON) {
        contents(
          operation.into,
          operation.materialId,
          quantity,
          quantity * factors(operation.materialId).millilitersPerStockUnit,
        )
        after.stockHeld[operation.materialId] = 0
      }
      break
    }
    case 'charge':
      if (operation.gasMaterialId)
        debit(
          operation.gasMaterialId,
          (operation.cartridges ?? rules.actionUnits.charge) * factors(operation.gasMaterialId).counts.piece,
        )
      foam(operation.vessel, rules.foamProfiles.charge, 'charge')
      break
    case 'remove':
      vessel(operation.from).layers = vessel(operation.from).layers.filter(
        (layer) => layer.materialId !== operation.itemId,
      )
      break
    case 'wash':
      after.vessels[operation.vessel] = emptyVessel()
      after.vessels[operation.vessel].processes.push('wash')
      break
    case 'sanitize':
    case 'dry':
    case 'mix':
    case 'shake':
    case 'swirl':
    case 'muddle':
    case 'etch':
    case 'steep':
    case 'cover':
    case 'label':
    case 'store':
      vessel(operation.vessel).processes.push(operation.action)
      break
    case 'wait':
    case 'serve':
      break
    default: {
      const exhaustive: never = operation
      throw new Error(`재고 행동을 확인해야 합니다: ${JSON.stringify(exhaustive)}`)
    }
  }
  const effect: StockEffect = { costs, stockHeld: {}, repeatable, vessels: {}, targetFills: {}, transfer: transferInfo }
  for (const id of new Set([...Object.keys(state.stockHeld), ...Object.keys(after.stockHeld)])) {
    const change = (after.stockHeld[id] ?? 0) - (state.stockHeld[id] ?? 0)
    if (Math.abs(change) > EPSILON) effect.stockHeld[id] = change
  }
  for (const [id, target] of Object.entries(after.vessels)) {
    projectVessel(target, id, context)
    const before = state.vessels[id] ?? emptyVessel()
    const changes = new Map<string, StockLayer>()
    for (const layer of before.layers)
      changes.set(layerKey(layer), { ...layer, quantity: -layer.quantity, milliliters: -layer.milliliters })
    for (const layer of target.layers) {
      const previous = changes.get(layerKey(layer))
      changes.set(layerKey(layer), {
        ...layer,
        quantity: layer.quantity + (previous?.quantity ?? 0),
        milliliters: layer.milliliters + (previous?.milliliters ?? 0),
      })
    }
    const layers = [...changes.values()].filter(
      (layer) => Math.abs(layer.quantity) > EPSILON || Math.abs(layer.milliliters) > EPSILON,
    )
    const processes = [...new Set(target.processes)]
    if (layers.length || processes.join('|') !== before.processes.join('|') || !(id in state.vessels))
      effect.vessels[id] = { layers, processes }
    effect.targetFills[id] = target.fill
  }
  return effect
}

/** Apply a progress segment to canonical quantities, then derive presentation values. Pure and atomic. */
export function projectStockEffect(
  state: StockFlowState,
  effect: StockEffect,
  context: StockContext,
  fromRatio: number,
  toRatio: number,
): StockFlowState {
  checked(fromRatio, '이전 제조 진행률')
  checked(toRatio, '제조 진행률')
  if (toRatio < fromRatio) throw new Error('제조 진행률이 감소할 수 없습니다.')
  let fraction = effect.repeatable ? toRatio - fromRatio : Math.min(1, toRatio) - Math.min(1, fromRatio)
  const next = copyFlow(state)
  // Partial transfers cannot move more stock than remains in their actual source vessel.
  for (const [id, change] of Object.entries(effect.vessels))
    for (const layer of change.layers) {
      const old = next.vessels[id]?.layers.find((item) => layerKey(item) === layerKey(layer))
      if (layer.quantity < -EPSILON) fraction = Math.min(fraction, (old?.quantity ?? 0) / -layer.quantity)
      if (layer.milliliters < -EPSILON) fraction = Math.min(fraction, (old?.milliliters ?? 0) / -layer.milliliters)
    }
  for (const [id, change] of Object.entries(effect.stockHeld))
    if (change < -EPSILON) fraction = Math.min(fraction, (next.stockHeld[id] ?? 0) / -change)
  fraction = checked(fraction, '수량 이동 비율')
  if (fraction <= EPSILON) return next
  for (const [id, change] of Object.entries(effect.stockHeld))
    next.stockHeld[id] = checked((next.stockHeld[id] ?? 0) + change * fraction, id)
  for (const [id, change] of Object.entries(effect.vessels)) {
    next.vessels[id] ??= emptyVessel()
    const target = next.vessels[id]
    for (const layer of change.layers)
      addLayer(target, { ...layer, quantity: layer.quantity * fraction, milliliters: layer.milliliters * fraction })
    target.processes = [...change.processes]
    projectVessel(target, id, context)
  }
  return next
}

/** Static guidance includes potential branches; runtime resolves each executed step against actual state. */
export function planStockCosts(catalog: RecipeCatalog, plan: PlannedStep[], context: StockContext): Costs[] {
  let state: StockFlowState = { vessels: {}, stockHeld: {} }
  return plan.map((step, index) => {
    const nextAdd =
      step.operation.action === 'peel' || step.operation.action === 'cut'
        ? plan
            .slice(index + 1)
            .map((item) => item.operation)
            .find(
              (item): item is StockNextAdd =>
                item.action === 'add' &&
                item.materialId ===
                  (step.operation as Extract<ResolvedOperation, { action: 'peel' | 'cut' }>).materialId,
            )
        : undefined
    const effect = buildStockEffect(catalog, state, step.operation, context, nextAdd)
    state = projectStockEffect(state, effect, context, 0, 1)
    return effect.costs
  })
}
