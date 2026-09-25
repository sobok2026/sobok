import { type Costs, RECIPES, type RecipeId, type StationId, staffFacingZ } from './catalog'

import { type CupKind, isReusableCup } from './cups'

export const craftToolIds = [
  'milk-carton',
  'pitcher',
  'shot-glass',
  'stirrer',
  'mocha-bottle',
  'foam-pitcher',
  'shaker',
  'ice-scoop',
  'lid',
  'tea-bottle',
] as const
export type CraftTool = (typeof craftToolIds)[number]
export const TOOL_NAMES: Record<CraftTool, string> = {
  'milk-carton': '우유팩',
  pitcher: '스팀 피처',
  'shot-glass': '샷 글라스',
  stirrer: '머들러',
  'mocha-bottle': '드리즐 보틀',
  'foam-pitcher': '폼 피처',
  shaker: '토핑 쉐이커',
  'ice-scoop': '아이스 스쿱',
  lid: '리드',
  'tea-bottle': '호지차 샷 보틀',
}
export type CraftContents = {
  coffee: number
  sauce: number
  milk: number
  tea: number
  water: number
  foam: number
  ice: number
  drizzle: number
  powder: number
}
export type CraftState = {
  kind: CupKind
  consumed: Costs
  location: StationId | 'hand'
  tool: CraftTool | null
  progress: number
  contents: CraftContents
  pitcherMilk: number
  pitcherReserved: boolean
  steamed: boolean
  shotReady: boolean
  shotTransferred: boolean
  mixed: boolean
  teaMixed: boolean
  lidded: boolean
  fault: string | null
}
export type CraftOperation = {
  id: string
  kind: 'machine' | 'steam' | 'pour' | 'pump' | 'stir' | 'shake' | 'drizzle' | 'sprinkle' | 'ice' | 'lid' | 'transfer'
  label: string
  tool: CraftTool | null
  target: number
  tolerance: number
  unit: string
  rate: number
  costs: Costs
  content?: keyof CraftContents
  weight: number
  targetFill?: number
  cue: string
}
export const craftStations: StationId[] = [
  'espresso',
  'steam',
  'brew',
  'water',
  'ice',
  'sauce',
  'mix',
  'topping',
  'pickup',
]
export function operationFor(recipe: RecipeId, step: number, craft: CraftState): CraftOperation | null {
  const source = RECIPES[recipe].steps[step]
  if (!source || (source.label === '제공' && isReusableCup(craft.kind))) return null
  const toLine = (content: keyof CraftContents, targetFill: number) => ({
    content,
    targetFill,
    weight: Math.max(
      0,
      targetFill -
        (['coffee', 'sauce', 'milk', 'tea', 'water', 'foam', 'ice'] as const).reduce(
          (sum, key) => sum + (key === content ? 0 : craft.contents[key]),
          0,
        ),
    ),
  })
  const base = {
    id: `${recipe}:${step}`,
    target: 1,
    tolerance: 0.06,
    unit: '기준선',
    rate: 0.25,
    costs: source.costs,
    weight: 0,
    cue: '누르는 동안 진행 · 놓으면 멈춤',
  }
  if (recipe === 'cold-brew' && source.label !== '제공') {
    if (source.label === '콜드 브루 추출액')
      return { ...base, kind: 'pour', label: '추출액 따르기', tool: null, ...toLine('coffee', 0.4) }
    if (source.label === '정수')
      return { ...base, kind: 'pour', label: '정수 채우기', tool: null, ...toLine('water', 0.8) }
    return {
      ...base,
      kind: 'ice',
      label: '얼음 담기',
      tool: 'ice-scoop',
      target: 3,
      tolerance: 0,
      unit: '스쿱',
      ...toLine('ice', 0.96),
      cue: '한 번 누를 때마다 한 스쿱',
    }
  }
  if (source.usesPitcher)
    return {
      ...base,
      kind: 'steam',
      label: '피처에 우유 계량',
      tool: 'milk-carton',
      cue: '우유를 계량한 뒤 우유팩을 놓고 스팀 시작',
    }
  if (source.label === '에스프레소')
    return {
      ...base,
      kind: 'machine',
      label: '샷 추출',
      tool: null,
      tolerance: 0,
      unit: '추출',
      content: 'coffee',
      weight: 0.13,
      cue: '한 번 눌러 추출 시작 · 완료될 때까지 컵 고정',
    }
  if (source.label === '글레이즈드 소스' || source.label === '클래식 시럽')
    return {
      ...base,
      kind: 'pump',
      label: source.label === '클래식 시럽' ? '클래식 시럽 펌핑' : '소스 펌핑',
      tool: null,
      target: source.target,
      tolerance: 0,
      unit: '펌프',
      content: 'sauce',
      weight: 0.07,
      cue: '한 번 누를 때마다 한 펌프',
    }
  if (source.label === '에스프레소·소스') {
    if (recipe === 'glazed-iced' && craft.shotReady && !craft.shotTransferred)
      return {
        ...base,
        id: `${base.id}:transfer`,
        kind: 'transfer',
        label: '샷 글라스에서 옮기기',
        tool: 'shot-glass',
        content: 'coffee',
        weight: 0.13,
        cue: '샷을 먼저 옮긴 뒤 머들러로 섞어요',
      }
    return {
      ...base,
      kind: 'stir',
      label: '샷과 소스 섞기',
      tool: 'stirrer',
      rate: 0.4,
      tolerance: 0,
      unit: '혼합',
      cue: '머들러를 집고 누르는 동안 저어요',
    }
  }
  if (source.label === '스팀 우유')
    return {
      ...base,
      kind: 'pour',
      label: '스팀 우유 붓기',
      tool: 'pitcher',
      ...toLine('milk', recipe === 'hoji-hot' ? 0.79 : 0.87),
    }
  if (source.label === '일반 우유')
    return {
      ...base,
      kind: 'pour',
      label: '우유 붓기',
      tool: 'milk-carton',
      ...toLine('milk', recipe === 'hoji-iced' ? 0.6 : 0.8),
    }
  if (source.label === '호지차 샷') {
    if (!craft.teaMixed)
      return {
        ...base,
        id: `${base.id}:tea-mix`,
        kind: 'shake',
        label: '사용 전 호지차 샷 재혼합',
        tool: 'tea-bottle',
        target: 3,
        tolerance: 0,
        unit: '회',
        costs: {},
        cue: '한 번 누를 때마다 한 번 흔들어요',
      }
    return {
      ...base,
      kind: 'pour',
      label: '호지차 샷 붓기',
      tool: 'tea-bottle',
      ...toLine('tea', recipe === 'hoji-hot' ? 0.87 : 0.8),
    }
  }
  if (source.label === '얼음')
    return {
      ...base,
      kind: 'ice',
      label: '얼음 담기',
      tool: 'ice-scoop',
      target: 3,
      tolerance: 0,
      unit: '스쿱',
      ...toLine('ice', 0.9),
      cue: '한 번 누를 때마다 한 스쿱',
    }
  if (source.label === '바모카 드리즐')
    return {
      ...base,
      kind: 'drizzle',
      target: source.target,
      label: '가장자리에 드리즐',
      tool: 'mocha-bottle',
      rate: 0.45,
      tolerance: 0.1,
      unit: '바퀴',
      content: 'drizzle',
      weight: 1,
    }
  if (source.label === '글레이즈드 폼')
    return {
      ...base,
      kind: 'pour',
      label: '글레이즈드 폼 붓기',
      tool: 'foam-pitcher',
      rate: 0.22,
      ...toLine('foam', 0.96),
    }
  if (source.label === '번트 카라멜 파우더')
    return {
      ...base,
      kind: 'sprinkle',
      label: '파우더 토핑',
      tool: 'shaker',
      target: source.target,
      tolerance: 0,
      unit: '톡',
      content: 'powder',
      weight: 1,
      cue: '한 번 누를 때마다 한 톡',
    }
  return {
    ...base,
    kind: 'lid',
    label: '리드 덮기',
    tool: 'lid',
    tolerance: 0,
    unit: '개',
    cue: '리드를 집어 컵 위에 덮어요',
  }
}

export function createCraft(kind: CupKind): CraftState {
  return {
    kind,
    consumed: {},
    location: 'hand',
    tool: null,
    progress: 0,
    contents: { coffee: 0, sauce: 0, milk: 0, tea: 0, water: 0, foam: 0, ice: 0, drizzle: 0, powder: 0 },
    pitcherMilk: 0,
    pitcherReserved: false,
    steamed: false,
    shotReady: false,
    shotTransferred: false,
    mixed: false,
    teaMixed: false,
    lidded: false,
    fault: null,
  }
}
export function isContinuous(op: CraftOperation) {
  return ['steam', 'pour', 'stir', 'drizzle', 'transfer'].includes(op.kind)
}
export function isMetered(op: CraftOperation) {
  return !['machine', 'stir', 'shake', 'lid', 'transfer'].includes(op.kind) && op.tool !== 'pitcher'
}
export function readyToConfirm(op: CraftOperation, progress: number) {
  return progress >= op.target * (1 - op.tolerance)
}
export function cupSpot(station: StationId): [number, number, number] {
  if (station === 'pickup') return [6.1, 1.1, -1.48]
  const x: Partial<Record<StationId, number>> = {
    espresso: -2.27,
    steam: -1.05,
    brew: 0,
    water: 1.1,
    ice: 2.1,
    sauce: 3.1,
    mix: 4.1,
    topping: 5.1,
  }
  return [x[station] ?? 0, station === 'espresso' ? 1.115 : 1.075, staffFacingZ(-0.62)]
}
