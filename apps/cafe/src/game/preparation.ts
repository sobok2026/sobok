import { INGREDIENTS, type IngredientId, references } from './catalog'

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
}
const foam = references.preparations.find((item) => item.name === '글레이즈드 폼' && item.batch.startsWith('기본'))!
const mocha = references.prepGuide.find((item) => item.name === '바모카')!
if (foam?.steps.length !== 4 || !mocha) throw new Error('부재료 준비 자료를 확인해주세요.')
const pumpMl = Number(foam.steps[2].note.match(/([\d.]+)ml/)?.[1])
const blendSeconds = Number(foam.steps[3].note.match(/(\d+)초/)?.[1])
const mochaAmounts = mocha.instruction.match(/(\d+)봉\s*\+\s*온수\s*([\d.]+)L/)
if (!(pumpMl > 0) || !(blendSeconds > 0) || !mochaAmounts) throw new Error('부재료 배합 수치를 확인해주세요.')
const sourceLine = (source: { file: string; sheet: string; row: number }) =>
  `${source.file} / ${source.sheet} ${source.row}행`
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
    storageNote: foam.storage,
    seconds: blendSeconds,
    steps: [
      ...foam.steps.slice(0, 3).map(
        (step, index): PrepStep => ({
          label: step.item,
          kind: index === 2 ? 'pump' : 'pour',
          tool: index === 0 ? 'cream-carton' : index === 1 ? 'milk-carton' : null,
          target: Number(step.amount),
          unit: step.unit,
          rate: Number(step.amount) / 4,
          tolerance: index === 2 ? 0 : 0.06,
          ingredient: (['cream', 'milk', 'glaze'] as const)[index],
          perUnit: index === 2 ? pumpMl : 1,
          instruction: [step.instruction, step.note].filter(Boolean).join(' '),
          source: sourceLine(step.source),
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
        instruction: [foam.steps[3].instruction, foam.steps[3].note].join(' '),
        source: sourceLine(foam.steps[3].source),
      },
    ],
  },
  mocha: {
    name: INGREDIENTS.mocha.name,
    marking: `${mocha.code} · ${mocha.marking}`,
    storageNote: `${mocha.storage} · ${mocha.lifetime}`,
    seconds: 0,
    steps: [
      {
        label: '바모카 원팩 넣기',
        kind: 'pack',
        tool: 'mocha-pack',
        target: Number(mochaAmounts[1]),
        unit: '봉',
        rate: 0,
        tolerance: 0,
        ingredient: 'mochaPowder',
        perUnit: 1,
        instruction: mocha.instruction,
        source: sourceLine(mocha.source),
      },
      {
        label: '온수 계량',
        kind: 'pour',
        tool: 'water-jug',
        target: Number(mochaAmounts[2]) * 1000,
        unit: 'ml',
        rate: Number(mochaAmounts[2]) * 250,
        tolerance: 0.06,
        instruction: mocha.instruction,
        source: sourceLine(mocha.source),
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
        source: sourceLine(mocha.source),
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
  }
}
export const preparationStep = (prep: Preparation) => PREPARATIONS[prep.recipe].steps[prep.step]
export const continuousPreparation = (step: PrepStep) => step.kind === 'pour' || step.kind === 'stir'
export const PREP_SPOT: [number, number, number] = [-2.3, 1.105, -4.95]
export function batchDate(time: number | null) {
  return time === null
    ? '—'
    : new Date(time * 1000).toLocaleString('ko-KR', {
        timeZone: 'UTC',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
}
