import { z } from 'zod'
import steamData from '../../../data/shop/steam.json'
import type { Costs } from '../../content/ingredients'
import { stockEffectSchema, stockVesselSchema } from '../../content/inventory-schema'
import type { RecipeCatalog } from '../../content/recipe-catalog'
import {
  amountLabel,
  type PlannedObservation,
  type PlannedStep,
  type ResolvedOperation,
} from '../../content/recipe-plan'
import type { RecipeAmount } from '../../content/recipe-schema'
import type { StationId } from '../../content/stations'
import type { StockContext, StockNextAdd } from '../../content/stock-amounts'
import { workStepLabels } from './step-labels'

export const productionQuantity = z.number().min(0).max(100000000)

export const productionStateSchema = z.object({
  cursor: z.number().int().min(0),
  decisions: z.record(z.string(), z.boolean()),
  progress: productionQuantity,
  tool: z.string().nullable(),
  consumed: z.record(z.string(), productionQuantity),
  vessels: z.record(z.string(), stockVesselSchema),
  stockHeld: z.record(z.string(), productionQuantity),
  stepStart: z
    .object({
      stepId: z.string(),
      target: z.number().positive(),
      effect: stockEffectSchema,
      fills: z.record(z.string(), z.number().min(0).max(1)),
    })
    .nullable(),
  choices: z.record(z.string(), z.string()),
  mixedInputs: z.record(z.string(), z.array(z.string())),
  resumeProgress: productionQuantity.nullable(),
  reservedTool: z.boolean(),
  ingredientExpiresAt: z.number().nullable(),
  fault: z.string().nullable(),
})
export type ProductionState = z.infer<typeof productionStateSchema>

export type ProductionTool = {
  id: string
  name: string
  appearance: 'bottle' | 'pitcher' | 'scoop' | 'stirrer' | 'shaker' | 'pack' | 'lid'
}

export type ChoiceKey = 'temperature' | 'bean' | 'extraction' | 'program' | 'lid'

/**
 * A setting the recipe fixes on equipment or at the counter. The player picks it and the game judges the pick,
 * so the work card lists every option and never marks the answer.
 */
export type StepChoice = {
  key: ChoiceKey
  label: string
  options: { value: string; label: string }[]
  answer: string
}

export type WorkStep = PlannedStep & {
  stockContext: StockContext
  nextStockAdd: StockNextAdd | null
  nextStockPortion?: number
  station: StationId
  kind: 'pour' | 'count' | 'mix' | 'machine' | 'confirm' | 'condition'
  condition?: PlannedObservation
  tool: ProductionTool | null
  target: number
  maximum: number | null
  increment: number
  unit: string
  rate: number
  seconds: number | null
  equipmentId: string | null
  costs: Costs
  mixesMaterialId: string | null
  requiresMixedMaterialId: string | null
  inputRequirements: Costs | null
  requiresReusableTool: boolean
  choices: StepChoice[]
}

export const PRODUCTION_EPSILON = 1e-9

export function createProductionState(): ProductionState {
  return {
    cursor: 0,
    decisions: {},
    progress: 0,
    tool: null,
    consumed: {},
    vessels: {},
    stockHeld: {},
    mixedInputs: {},
    resumeProgress: null,
    stepStart: null,
    reservedTool: false,
    ingredientExpiresAt: null,
    fault: null,
    choices: {},
  }
}

const steamRule = z
  .strictObject({
    note: z.string(),
    referenceSeconds: z.number().positive(),
    referenceCelsius: z.number(),
    xHotCelsius: z.number(),
    startCelsius: z.number(),
  })
  .parse(steamData)

type SteamOperation = Extract<ResolvedOperation, { action: 'steam' }>

function steamCelsius(operation: SteamOperation) {
  const temperature = operation.temperature
  if (temperature?.kind === 'celsius') {
    return temperature.value
  }
  if (temperature?.kind === 'range') {
    return (temperature.min + temperature.max) / 2
  }
  return /x-?hot/i.test(operation.setting ?? '') ? steamRule.xHotCelsius : steamRule.referenceCelsius
}

/** Heating time grows with the temperature rise, anchored at the standard steam of the shop's wand. */
function steamSeconds(operation: SteamOperation) {
  const rise =
    (steamCelsius(operation) - steamRule.startCelsius) / (steamRule.referenceCelsius - steamRule.startCelsius)
  return Math.max(1, Math.round(steamRule.referenceSeconds * rise))
}

const steamChoice = (operation: SteamOperation): StepChoice => ({
  key: 'temperature',
  label: '스팀 온도',
  options: [
    { value: 'standard', label: '기본' },
    { value: 'x-hot', label: 'X-Hot' },
  ],
  answer: steamCelsius(operation) >= steamRule.xHotCelsius ? 'x-hot' : 'standard',
})

const beans = {
  regular: 'regular',
  decaf: 'decaf',
  'half-decaf': 'half-decaf',
  blonde: 'blonde',
  ristretto: 'regular',
  'blonde-ristretto': 'blonde',
  'decaf-ristretto': 'decaf',
} as const

function espressoChoices(operation: Extract<ResolvedOperation, { action: 'espresso' }>): StepChoice[] {
  return [
    {
      key: 'bean',
      label: '원두',
      options: [
        { value: 'regular', label: '일반' },
        { value: 'blonde', label: '블론드' },
        { value: 'decaf', label: '디카페인' },
        { value: 'half-decaf', label: '1/2 디카페인' },
      ],
      answer: beans[operation.method],
    },
    {
      key: 'extraction',
      label: '추출',
      options: [
        { value: 'standard', label: '기본' },
        { value: 'ristretto', label: '리스트레토' },
      ],
      answer: operation.method.includes('ristretto') ? 'ristretto' : 'standard',
    },
  ]
}

function programChoice(
  catalog: RecipeCatalog,
  operation: Extract<ResolvedOperation, { action: 'run-machine' }>,
): StepChoice {
  const equipment = catalog.equipment.get(operation.equipmentId)!

  return {
    key: 'program',
    label: `${equipment.name} 버튼`,
    options: equipment.programs.map((program) => ({ value: program.id, label: program.name })),
    answer: operation.program,
  }
}

const lidChoice = (operation: Extract<ResolvedOperation, { action: 'serve' }>): StepChoice => ({
  key: 'lid',
  label: '리드',
  options: [
    { value: 'none', label: '리드 없이' },
    { value: 'standard', label: '일반' },
    { value: 'dome', label: '돔' },
    { value: 'flat', label: '플랫' },
    { value: 'strawless', label: '스트로리스' },
    { value: 'double-shot', label: '더블 샷' },
  ],
  answer: operation.lid === 'always' ? (operation.lidType ?? 'standard') : 'none',
})

function repetitionBounds(repetitions?: number | { min: number; max: number }) {
  if (typeof repetitions === 'number') {
    return [repetitions, repetitions]
  }
  if (repetitions) {
    return [repetitions.min, repetitions.max]
  }
  return [1, 1]
}

function durationBounds(duration: { seconds: number; atLeast?: boolean } | { minSeconds: number; maxSeconds: number }) {
  return 'seconds' in duration ? [duration.seconds, duration.seconds] : [duration.minSeconds, duration.maxSeconds]
}

export function operationSeconds(catalog: RecipeCatalog, operation: ResolvedOperation): number | null {
  const duration = 'duration' in operation ? operation.duration : undefined
  if (duration) {
    return durationBounds(duration)[0]
  }

  if (operation.action === 'run-machine') {
    const program = catalog.equipment.get(operation.equipmentId)?.programs.find((item) => item.id === operation.program)
    if (program?.duration) {
      return durationBounds(program.duration)[0]
    }
  }

  return null
}

function countMaximum(amount: Extract<RecipeAmount, { kind: 'count' | 'count-range' }>) {
  if (amount.kind === 'count-range') {
    return amount.max
  }
  return amount.atLeast ? null : amount.value
}

function quantityControl(amount: RecipeAmount): Pick<WorkStep, 'kind' | 'target' | 'maximum' | 'increment' | 'unit'> {
  const unit = amountLabel(amount)
  if (amount.kind === 'unspecified') {
    throw new Error(`계량 기준 확인 필요: ${amount.description}`)
  }

  if (amount.kind === 'count' || amount.kind === 'count-range') {
    const target = amount.kind === 'count' ? amount.value : amount.min
    const maximum = countMaximum(amount)
    const precision = Math.max(
      ...[target, maximum ?? target].map((value) => (String(value).split('.')[1] ?? '').length),
    )
    const scale = 10 ** precision
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
    const increment =
      [target, maximum ?? target].reduce((step, value) => gcd(step, Math.round(value * scale)), scale) / scale
    return { kind: amount.unit === 'turn' ? 'pour' : 'count', target, maximum, increment, unit }
  }

  if (amount.kind === 'amount' || amount.kind === 'amount-range') {
    const [target, maximum] = amount.kind === 'amount' ? [amount.value, amount.value] : [amount.min, amount.max]
    return { kind: 'pour', target, maximum, increment: 1, unit: amount.unit }
  }

  if (amount.kind === 'fraction') {
    return {
      kind: 'pour',
      target: amount.numerator / amount.denominator,
      maximum: amount.numerator / amount.denominator,
      increment: 1 / amount.denominator,
      unit,
    }
  }
  if (amount.kind === 'depth') {
    return { kind: 'pour', target: amount.millimeters, maximum: amount.millimeters, increment: 1, unit: 'mm' }
  }
  if (amount.kind === 'depth-range') {
    return { kind: 'pour', target: amount.minMillimeters, maximum: amount.maxMillimeters, increment: 1, unit: 'mm' }
  }
  return { kind: 'pour', target: 1, maximum: 1, increment: 1, unit }
}

function toolFor(catalog: RecipeCatalog, operation: ResolvedOperation): ProductionTool | null {
  if ('toolIds' in operation && operation.toolIds?.length) {
    return {
      id: `equipment-set:${operation.toolIds.join('|')}`,
      name: operation.toolIds.map((id) => catalog.equipment.get(id)!.name).join(' · '),
      appearance: 'stirrer',
    }
  }

  if ('toolId' in operation && operation.toolId) {
    const tool = catalog.equipment.get(operation.toolId)!
    if (tool.kind === 'pump') {
      return null
    }
    return { id: `equipment:${tool.id}`, name: tool.name, appearance: tool.kind === 'scoop' ? 'scoop' : 'stirrer' }
  }

  if (operation.action === 'transfer' || operation.action === 'strain') {
    return { id: `vessel:${operation.from}`, name: catalog.vessels.get(operation.from)!.name, appearance: 'pitcher' }
  }
  if (operation.action === 'add' || operation.action === 'grind' || operation.action === 'squeeze') {
    return {
      id: `material:${operation.materialId}`,
      name: catalog.materials.get(operation.materialId)!.name,
      appearance:
        operation.action === 'add' && operation.amount.kind === 'count' && operation.amount.unit === 'pack'
          ? 'pack'
          : 'bottle',
    }
  }
  if (operation.action === 'shake' || operation.action === 'swirl') {
    return { id: `vessel:${operation.vessel}`, name: catalog.vessels.get(operation.vessel)!.name, appearance: 'shaker' }
  }
  return null
}

function stationFor(operation: ResolvedOperation, owner?: 'prep'): StationId {
  if (owner) {
    return owner
  }
  if (operation.action === 'espresso' || operation.action === 'grind') {
    return 'espresso'
  }
  if (operation.action === 'steam' || operation.action === 'aerate') {
    return 'steam'
  }
  if (operation.action === 'serve') {
    return 'pickup'
  }
  if (operation.action === 'run-machine') {
    return operation.equipmentId === 'hot-water-dispenser' ? 'water' : 'prep'
  }

  if (operation.action === 'add') {
    if (operation.into !== 'serving-cup') {
      return ['steam-pitcher', 'steam-pitcher-50-50'].includes(operation.into) ? 'steam' : 'mix'
    }
    if (operation.materialId === 'water') {
      return 'water'
    }
    if (operation.materialId === 'ice') {
      return 'ice'
    }
    if (operation.materialId === 'milk') {
      return 'steam'
    }
    if (operation.materialId === 'cold-brew') {
      return 'brew'
    }
    if (operation.amount.kind === 'count' && operation.amount.unit === 'pump') {
      return 'sauce'
    }
    return 'mix'
  }

  if (operation.action === 'transfer' && ['steam-pitcher', 'steam-pitcher-50-50'].includes(operation.from)) {
    return 'steam'
  }
  return 'mix'
}

const MIX_CONTROL_UNITS = { mix: '초', count: '회', confirm: '완료' } as const

function mixControlKind(duration: unknown, repetitions: unknown) {
  if (duration) {
    return 'mix'
  }
  return repetitions ? 'count' : 'confirm'
}

export function compileWorkflow(
  catalog: RecipeCatalog,
  plan: PlannedStep[],
  costs: Costs[],
  stockContext: StockContext,
  owner?: 'prep',
): WorkStep[] {
  const labels = workStepLabels(catalog, plan)
  const populated = new Set<string>()
  const destinations = plan.flatMap((step) => ('into' in step.operation ? [step.operation.into] : []))
  const servingVessel = destinations.includes('serving-cup') ? 'serving-cup' : (destinations.at(-1) ?? 'serving-cup')
  let supplyMix: string | null = null

  return plan.flatMap((source, index) => {
    const operation = source.operation
    let control: Pick<WorkStep, 'kind' | 'target' | 'maximum' | 'increment' | 'unit'> = {
      kind: 'confirm',
      target: 1,
      maximum: 1,
      increment: 1,
      unit: '완료',
    }
    let equipmentId: string | null = 'equipmentId' in operation ? (operation.equipmentId ?? null) : null
    let seconds = operationSeconds(catalog, operation)
    let mixesMaterialId: string | null = null
    let choices: StepChoice[] = []

    if (operation.action === 'add' || operation.action === 'transfer') {
      control = quantityControl(operation.amount)
    } else if (operation.action === 'espresso') {
      // Each press pulls one shot, so the number of shots is the player's call like pumps.
      control = { ...quantityControl(operation.amount), kind: 'count' }
      equipmentId ??= 'espresso-machine'
      choices = espressoChoices(operation)
    } else if (operation.action === 'grind') {
      control = { kind: 'machine', target: 1, maximum: 1, increment: 1, unit: '분쇄' }
    } else if (operation.action === 'run-machine') {
      const [target, maximum] = repetitionBounds(operation.cycles)
      // Timed programs run on their own; untimed ones count each press as one run.
      control =
        seconds === null
          ? { kind: 'count', target, maximum, increment: 1, unit: '회' }
          : { kind: 'machine', target: 1, maximum: 1, increment: 1, unit: '완료' }
      choices = [programChoice(catalog, operation)]
    } else if (operation.action === 'charge') {
      const target = operation.cartridges ?? 1
      control = { kind: 'count', target, maximum: target, increment: 1, unit: '개' }
    } else if (operation.action === 'steam') {
      control = { kind: 'machine', target: 1, maximum: 1, increment: 1, unit: '완료' }
      equipmentId = 'steam-wand'
      seconds ??= steamSeconds(operation)
      choices = [steamChoice(operation)]
    } else if (operation.action === 'steep' || operation.action === 'wait') {
      control = { kind: 'machine', target: 1, maximum: 1, increment: 1, unit: '완료' }
    } else if (operation.action === 'serve') {
      choices = [lidChoice(operation)]
    } else if (['mix', 'shake', 'swirl', 'muddle', 'aerate'].includes(operation.action)) {
      const duration = 'duration' in operation ? operation.duration : undefined
      const [target, maximum] = duration
        ? durationBounds(duration)
        : repetitionBounds('repetitions' in operation ? operation.repetitions : undefined)
      const repetitions = 'repetitions' in operation ? operation.repetitions : undefined
      const kind = mixControlKind(duration, repetitions)
      control = { kind, target, maximum, increment: 1, unit: MIX_CONTROL_UNITS[kind] }
      seconds = null

      if ((operation.action === 'shake' || operation.action === 'mix') && !populated.has(operation.vessel)) {
        const next = plan[index + 1]?.operation
        if (next?.action === 'add' && next.into !== operation.vessel) {
          mixesMaterialId = next.materialId
        }
      }
    }

    if (source.portion !== undefined) {
      control = { kind: 'pour', target: 1, maximum: 1, increment: 1, unit: '비율' }
    }
    if ('into' in operation) {
      populated.add(operation.into)
    }
    if (operation.action === 'transfer' && operation.amount.kind === 'all') {
      populated.delete(operation.from)
    }
    const requiresMixedMaterialId =
      operation.action === 'add' && supplyMix === operation.materialId ? operation.materialId : null
    supplyMix = mixesMaterialId
    const vesselIds = ['into', 'from', 'vessel'].flatMap((key) =>
      key in operation ? [(operation as Record<string, unknown>)[key] as string] : [],
    )
    const requiresReusableTool =
      !mixesMaterialId && (owner === 'prep' || vesselIds.some((id) => id !== servingVessel && id !== 'serving-cup'))
    const nextMaterial =
      mixesMaterialId ?? (operation.action === 'peel' || operation.action === 'cut' ? operation.materialId : null)
    const nextStockStep = nextMaterial
      ? (plan
          .slice(index + 1)
          .find((item) => item.operation.action === 'add' && item.operation.materialId === nextMaterial) ?? null)
      : null
    const nextStockAdd = nextStockStep?.operation.action === 'add' ? nextStockStep.operation : null
    const step: WorkStep = {
      ...source,
      ...control,
      label: labels[index],
      stockContext,
      nextStockAdd,
      nextStockPortion: nextStockStep?.portion,
      tool: toolFor(catalog, operation),
      station: stationFor(operation, owner),
      equipmentId,
      seconds,
      rate: control.kind === 'mix' && 'duration' in operation && operation.duration ? 1 : control.target / 4,
      costs: costs[index] ?? {},
      mixesMaterialId,
      inputRequirements: mixesMaterialId ? (costs[index + 1] ?? null) : null,
      requiresMixedMaterialId,
      requiresReusableTool,
      choices,
    }
    if ('atLeast' in operation && operation.atLeast) {
      step.maximum = null
    }
    if (
      step.kind === 'mix' &&
      'duration' in operation &&
      operation.duration &&
      'atLeast' in operation.duration &&
      operation.duration.atLeast
    ) {
      step.maximum = null
    }

    if (operation.action === 'remove' && operation.drain) {
      const draining: WorkStep = {
        ...step,
        id: `${step.id}:drain`,
        label: '물기 빼기',
        kind: 'machine',
        target: 1,
        maximum: 1,
        seconds: durationBounds(operation.drain)[0],
        operation: { action: 'wait', duration: operation.drain },
        costs: {},
        tool: null,
        choices: [],
      }
      const { drain: _drain, ...removal } = operation
      step.operation = removal
      return [draining, step]
    }

    if (operation.action === 'steam' && operation.airDuration) {
      const [target, maximum] = durationBounds(operation.airDuration)
      const air: WorkStep = {
        ...step,
        id: `${step.id}:air`,
        label: '공기 주입',
        kind: 'mix',
        target,
        maximum: 'atLeast' in operation.airDuration && operation.airDuration.atLeast ? null : maximum,
        rate: 1,
        unit: '초',
        seconds: null,
        operation: { action: 'aerate', vessel: operation.vessel, duration: operation.airDuration },
        costs: {},
        tool: null,
        choices: [],
      }
      const { airDuration: _airDuration, ...heating } = operation
      step.operation = heating
      return [air, step]
    }

    return [step]
  })
}
