import { formatDecimal } from '@sobok/std/format/number'
import { recipeCatalog } from '../../content/catalog'
import type { ResolvedOperation } from '../../content/recipe-plan'
import type { RecipeAmount, RecipeTemperature } from '../../content/recipe-schema'
import { toward } from '../../content/stations'
import { formatQuantity } from '../../shared/format'
import { continuousWork } from './runtime'
import { itemName, portionNames } from './step-labels'
import type { WorkStep } from './workflow'

const countUnits = {
  pump: '펌프',
  shot: '샷',
  scoop: '스쿱',
  pack: '봉',
  tap: '톡',
  turn: '바퀴',
  piece: '개',
  cycle: '회',
  drop: '방울',
  bag: '티백',
  cup: '컵',
}

const methods = {
  regular: '일반 추출',
  decaf: '디카페인',
  'half-decaf': '1/2 디카페인',
  blonde: '블론드',
  ristretto: '리스트레토',
  'blonde-ristretto': '블론드 리스트레토',
  'decaf-ristretto': '디카페인 리스트레토',
}

const nameOf = (id: string) => itemName(recipeCatalog, id)

const range = (minimum: number, maximum: number) =>
  minimum === maximum ? formatDecimal(minimum) : `${formatDecimal(minimum)}–${formatDecimal(maximum)}`

function durationLabel(
  duration: { seconds: number; approximate: boolean; atLeast?: boolean } | { minSeconds: number; maxSeconds: number },
) {
  return 'seconds' in duration
    ? `${duration.approximate ? '약 ' : ''}${formatDecimal(duration.seconds)}초${duration.atLeast ? ' 이상' : ''}`
    : `${range(duration.minSeconds, duration.maxSeconds)}초`
}

export function operationDetails(step: WorkStep): string[] {
  if (step.kind === 'condition') {
    return step.condition ? [`${step.condition.property}: ${step.condition.value} 확인`] : []
  }
  return [...operationObjects(step.operation), ...operationNotes(step)]
}

function operationObjects(op: ResolvedOperation): string[] {
  const objects: string[] = []
  if ('materialId' in op && op.materialId) {
    objects.push(nameOf(op.materialId))
  }
  if (op.action === 'charge' && op.gasMaterialId) {
    objects.push(nameOf(op.gasMaterialId))
  }
  if ('from' in op && 'into' in op) {
    objects.push(`${nameOf(op.from)} → ${nameOf(op.into)}`)
  } else if ('into' in op) {
    objects.push(nameOf(op.into))
  } else if ('vessel' in op) {
    objects.push(nameOf(op.vessel))
  }
  return objects
}

export function operationNotes(step: WorkStep): string[] {
  if (step.kind === 'condition') {
    return []
  }
  const op = step.operation
  const details: string[] = []
  if ('setting' in op && op.setting) {
    details.push(`설정 ${op.setting}`)
  }
  if ('temperature' in op && op.temperature) {
    details.push(temperatureLabel(op.temperature))
  }
  if (op.action === 'espresso') {
    details.push(methods[op.method])
  }

  if (op.action === 'run-machine') {
    const equipment = recipeCatalog.equipment.get(op.equipmentId)
    const program = equipment?.programs.find((entry) => entry.id === op.program)
    details.push(`${equipment?.name ?? '장비'} · ${program?.name ?? '선택 프로그램'}`)
    if (!op.duration && program?.duration) {
      details.push(`1회 ${durationLabel(program.duration)}`)
    }
  }

  if ('duration' in op && op.duration) {
    details.push(`${op.action === 'run-machine' ? '1회 ' : ''}${durationLabel(op.duration)}`)
  }
  if (op.action === 'steam' && op.airDuration) {
    details.push(`공기 주입 ${durationLabel(op.airDuration)}`)
  }

  if ('repetitions' in op && op.repetitions) {
    const repetitions =
      typeof op.repetitions === 'number' ? formatDecimal(op.repetitions) : range(op.repetitions.min, op.repetitions.max)
    details.push(
      `${'approximate' in op && op.approximate ? '약 ' : ''}${repetitions}회${
        'atLeast' in op && op.atLeast ? ' 이상' : ''
      }`,
    )
  }

  if ('portion' in op && op.portion) {
    details.push(portionNames[op.portion])
  }
  if ('placement' in op && op.placement) {
    details.push(op.placement)
  }
  if ('pattern' in op && op.pattern) {
    details.push(op.pattern)
  }
  if (op.action === 'cut') {
    details.push(`${op.pieces}조각`)
  }
  if (op.action === 'charge' && op.cartridges) {
    details.push(`카트리지 ${op.cartridges}개`)
  }

  if (op.action === 'remove') {
    details.push(`${nameOf(op.itemId)} 제거`)
    if (op.drain) {
      details.push(`물기 빼기 ${durationLabel(op.drain)}`)
    }
    if (op.dispose) {
      details.push('사용 후 폐기')
    }
  }

  if (op.action === 'place') {
    details.push(nameOf(op.itemId))
  }
  if (op.action === 'strain' && op.excludeMaterialIds?.length) {
    details.push(`${op.excludeMaterialIds.map(nameOf).join(' · ')} 제외`)
  }
  if (op.action === 'attach') {
    details.push(`${nameOf(op.itemId)} → ${nameOf(op.toId)}`)
  }
  if (op.action === 'label') {
    details.push(op.labels.join(' · '))
  }
  if (op.action === 'store') {
    details.push(op.storage === 'fridge' ? '냉장 보관' : '상온 보관')
  }

  if (op.action === 'serve') {
    if (op.lid === 'none') {
      details.push('리드 없이 제공')
    }
    if (op.lidType) {
      details.push(
        {
          standard: '일반 리드',
          dome: '돔 리드',
          flat: '플랫 리드',
          strawless: '스트로리스 리드',
          'double-shot': '더블 샷 리드',
        }[op.lidType],
      )
    }
    if (op.accessories?.length) {
      details.push(op.accessories.join(' · '))
    }
  }

  return details
}

const vesselLabel = (id: string) => (id === 'serving-cup' ? '컵' : nameOf(id))

function countUnit(amount: RecipeAmount) {
  return amount.kind === 'count' || amount.kind === 'count-range' ? countUnits[amount.unit] : null
}

const addVerbs: Partial<Record<keyof typeof countUnits, string>> = {
  pump: '펌핑',
  scoop: '담기',
  tap: '뿌리기',
  turn: '두르기',
  piece: '넣기',
  pack: '넣기',
  bag: '넣기',
  drop: '떨어뜨리기',
}

export function workTitle(step: WorkStep): string {
  if (step.kind === 'condition' || step.mixesMaterialId) {
    return step.label
  }
  const op = step.operation

  switch (op.action) {
    case 'add': {
      const unit = op.amount.kind === 'count' || op.amount.kind === 'count-range' ? op.amount.unit : null
      const verb = (unit && addVerbs[unit]) ?? (op.materialId === 'ice' ? '담기' : '붓기')
      return `${vesselLabel(op.into)}에 ${nameOf(op.materialId)} ${verb}`
    }
    case 'transfer':
      if (op.portion === 'foam') return `${vesselLabel(op.into)}에 거품 올리기`
      if (op.from.startsWith('steam-pitcher') && op.portion === 'liquid')
        return `${vesselLabel(op.into)}에 스팀 우유 붓기`
      return `${vesselLabel(op.into)}에 붓기`
    case 'strain':
      return `${vesselLabel(op.from)}에서 ${toward(vesselLabel(op.into))} 걸러 붓기`
    case 'espresso':
      return `${vesselLabel(op.into)}에 샷 추출`
    case 'steam':
      return op.vessel.startsWith('steam-pitcher') ? '우유 스팀' : `${vesselLabel(op.vessel)} 스팀`
    case 'mix':
      return `${vesselLabel(op.vessel)} 젓기`
    case 'shake':
      return `${vesselLabel(op.vessel)} 흔들기`
    case 'swirl':
      return `${vesselLabel(op.vessel)} 돌려 섞기`
    case 'muddle':
      return `${vesselLabel(op.vessel)} 으깨기`
    case 'run-machine':
      return `${nameOf(op.equipmentId)} 작동`
    case 'serve':
      return '제공 준비'
    default:
      return step.label
  }
}

export function workReading(step: WorkStep, progress: number): string | null {
  if (step.kind === 'condition' || step.mixesMaterialId) {
    return null
  }
  const op = step.operation
  const amount = 'amount' in op ? op.amount : undefined

  if (step.kind === 'count') {
    return `${formatDecimal(progress)}${(amount && countUnit(amount)) ?? step.unit}`
  }
  if (step.kind === 'mix') {
    return step.unit === '초' ? `${formatDecimal(progress)}초` : null
  }
  if (step.kind === 'pour' && amount && (amount.kind === 'amount' || amount.kind === 'amount-range')) {
    return formatQuantity(progress, amount.unit)
  }
  // A drizzle counts the turns of the hand, not the height in the cup.
  const turns = amount && countUnit(amount)
  return step.kind === 'pour' && turns ? `${formatDecimal(progress)}${turns}` : null
}

const actionLabels: Partial<Record<ResolvedOperation['action'], string>> = {
  add: '담기',
  transfer: '붓기',
  strain: '걸러 옮기기',
  mix: '젓기',
  shake: '흔들기',
  swirl: '돌려 섞기',
  muddle: '으깨기',
  aerate: '공기 주입',
  squeeze: '즙 내기',
  steam: '스팀',
  espresso: '샷 추출',
  grind: '분쇄',
  charge: '충전',
  steep: '우리기',
  wait: '기다리기',
  serve: '제공 준비',
  remove: '제거',
  peel: '껍질 벗기기',
  cut: '자르기',
  arrange: '배치',
  attach: '부착',
  place: '담기',
  cover: '덮기',
  wash: '씻기',
  sanitize: '소독',
  dry: '말리기',
  label: '라벨 부착',
  store: '보관',
  etch: '무늬 그리기',
}

export function workUseLabel(step: WorkStep): string {
  if (step.operation.action === 'grind' && step.kind === 'count') return '원두 1스쿱 넣고 분쇄'
  if (step.kind === 'condition') {
    return '상태 선택'
  }
  if (step.mixesMaterialId) {
    return '재혼합'
  }

  if (step.kind === 'machine') {
    if (step.operation.action === 'wait') {
      return '대기 시작'
    }
    if (step.operation.action === 'steep') {
      return '우리기 시작'
    }
    return step.operation.action === 'steam' ? '스팀 시작' : '작동'
  }
  if (step.operation.action === 'run-machine') {
    return '작동'
  }

  const operation = step.operation
  if (operation.action === 'transfer' && operation.portion === 'foam') {
    return continuousWork(step) ? '누르고 거품 올리기' : '거품 올리기'
  }
  const unit =
    operation.action === 'add' && (operation.amount.kind === 'count' || operation.amount.kind === 'count-range')
      ? operation.amount.unit
      : null
  const liquid = operation.action === 'add' && !unit && operation.materialId !== 'ice'
  const action = (unit && addVerbs[unit]) ?? (liquid ? '붓기' : actionLabels[operation.action]) ?? '진행'
  return continuousWork(step) ? `누르고 ${action}` : `${action}${step.kind === 'confirm' ? ' 완료' : ''}`
}

function temperatureLabel(temperature: RecipeTemperature) {
  if (temperature.kind === 'celsius') {
    return `${temperature.value}°C`
  }
  if (temperature.kind === 'range') {
    return `${temperature.min}–${temperature.max}°C`
  }
  return { boiling: '끓는 물', hot: '뜨거운 온도', cold: '차가운 온도' }[temperature.kind]
}
