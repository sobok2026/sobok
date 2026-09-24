import { INGREDIENTS, type IngredientId, referenceLinks } from './catalog'
import { sourceLine } from './reference-links'

export const preparationIds = ['foam', 'mocha'] as const
export type PreparationId = (typeof preparationIds)[number]
export const prepToolIds = ['cream-carton', 'milk-carton', 'mocha-pack', 'water-jug', 'spatula'] as const
export type PrepTool = (typeof prepToolIds)[number]
export const PREP_TOOL_NAMES: Record<PrepTool, string> = {
  'cream-carton': '휘핑크림 팩',
  'milk-carton': '우유팩',
  'mocha-pack': '바모카 원팩',
  'water-jug': '온수 계량 피처',
  spatula: '혼합 스패튤러',
}
export type PrepStep = {
  label: string
  kind: 'pour' | 'pump' | 'pack' | 'stir' | 'machine'
  tool: PrepTool | null
  target: number
  unit: string
  rate: number
  tolerance: number
  ingredient?: IngredientId
  perUnit?: number
  instruction: string
  source: string
}
export type Preparation = {
  id: string
  recipe: PreparationId
  step: number
  progress: number
  stage: 'measuring' | 'processing' | 'ready'
  tool: PrepTool | null
  toolReserved: boolean
  amounts: { cream: number; milk: number; glaze: number; water: number; mochaPowder: number }
  fault: string | null
  batchId: string | null
  ingredientExpiresAt: number | null
}
const { foam, mocha } = referenceLinks
export const PREPARATIONS: Record<
  PreparationId,
  {
    name: string
    marking: string
    storageNote: string
    seconds: number
    steps: PrepStep[]
  }
> = {
  foam: {
    name: INGREDIENTS.foam.name,
    marking: '숫자 Tag + Price Tag',
    storageNote: foam.reference.storage,
    seconds: foam.seconds,
    steps: [
      ...(
        [
          {
            reference: foam.steps.cream,
            kind: 'pour',
            tool: 'cream-carton',
            ingredient: 'cream',
            target: foam.creamMl,
            perUnit: 1,
          },
          {
            reference: foam.steps.milk,
            kind: 'pour',
            tool: 'milk-carton',
            ingredient: 'milk',
            target: foam.milkMl,
            perUnit: 1,
          },
          {
            reference: foam.steps.glaze,
            kind: 'pump',
            tool: null,
            ingredient: 'glaze',
            target: foam.glazePumps,
            perUnit: foam.pumpMl,
          },
        ] as const
      ).map(
        ({ reference, ...step }): PrepStep => ({
          ...step,
          label: reference.item,
          unit: reference.unit,
          rate: step.target / 4,
          tolerance: step.kind === 'pump' ? 0 : 0.06,
          instruction: [reference.instruction, reference.note].filter(Boolean).join(' '),
          source: sourceLine(reference.source),
        }),
      ),
      {
        label: '콜드 폼 블렌딩',
        kind: 'machine',
        tool: null,
        target: 1,
        unit: '회',
        rate: 0,
        tolerance: 0,
        instruction: [foam.steps.blend.instruction, foam.steps.blend.note].join(' '),
        source: sourceLine(foam.steps.blend.source),
      },
    ],
  },
  mocha: {
    name: INGREDIENTS.mocha.name,
    marking: `${mocha.reference.code} · ${mocha.reference.marking}`,
    storageNote: `${mocha.reference.storage} · ${mocha.reference.lifetime}`,
    seconds: 0,
    steps: [
      {
        label: '바모카 원팩 넣기',
        kind: 'pack',
        tool: 'mocha-pack',
        target: mocha.packs,
        unit: '봉',
        rate: 0,
        tolerance: 0,
        ingredient: 'mochaPowder',
        perUnit: 1,
        instruction: mocha.reference.instruction,
        source: sourceLine(mocha.reference.source),
      },
      {
        label: '온수 계량',
        kind: 'pour',
        tool: 'water-jug',
        target: mocha.waterMl,
        unit: 'ml',
        rate: mocha.waterMl / 4,
        tolerance: 0.06,
        instruction: mocha.reference.instruction,
        source: sourceLine(mocha.reference.source),
      },
      {
        label: '바모카 혼합',
        kind: 'stir',
        tool: 'spatula',
        target: 6,
        unit: '초',
        rate: 1,
        tolerance: 0,
        instruction: '스패튤러로 저어 섞어요. 혼합 동작 시간은 게임용 임시 규칙이에요.',
        source: sourceLine(mocha.reference.source),
      },
    ],
  },
}
export function createPreparation(recipe: PreparationId): Preparation {
  return {
    id: crypto.randomUUID(),
    recipe,
    step: 0,
    progress: 0,
    stage: 'measuring',
    tool: null,
    toolReserved: true,
    amounts: { cream: 0, milk: 0, glaze: 0, water: 0, mochaPowder: 0 },
    fault: null,
    batchId: null,
    ingredientExpiresAt: null,
  }
}
export const preparationStep = (prep: Preparation) => PREPARATIONS[prep.recipe].steps[prep.step]
export const continuousPreparation = (step: PrepStep) => step.kind === 'pour' || step.kind === 'stir'
export const PREP_SPOT: [number, number, number] = [-2.3, 1.105, -4.95]
export function batchDate(time: number | null, withSeconds = false) {
  return time === null
    ? '—'
    : new Date(time * 1000).toLocaleString('ko-KR', {
        timeZone: 'UTC',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: withSeconds ? '2-digit' : undefined,
        hourCycle: 'h23',
      })
}
