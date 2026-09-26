import { formatDecimal } from '@sobok/std/format/number'
import { recipeCatalog } from '../../content/catalog'
import type { ResolvedOperation } from '../../content/recipe-plan'
import type { RecipeTemperature } from '../../content/recipe-schema'
import { continuousWork, readyWork } from './runtime'
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

const itemName = (id: string) =>
  recipeCatalog.materials.get(id)?.name ??
  recipeCatalog.equipment.get(id)?.name ??
  recipeCatalog.vessels.get(id)?.name ??
  '작업 재료'

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
  const op = step.operation
  const details: string[] = []
  if ('materialId' in op && op.materialId) {
    details.push(itemName(op.materialId))
  }
  if (op.action === 'charge' && op.gasMaterialId) {
    details.push(itemName(op.gasMaterialId))
  }
  if ('from' in op && 'into' in op) {
    details.push(`${itemName(op.from)} → ${itemName(op.into)}`)
  } else if ('into' in op) {
    details.push(itemName(op.into))
  } else if ('vessel' in op) {
    details.push(itemName(op.vessel))
  }
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
    details.push({ liquid: '액체만', foam: '거품만', all: '전체' }[op.portion])
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
    details.push(`${itemName(op.itemId)} 제거`)
    if (op.drain) {
      details.push(`물기 빼기 ${durationLabel(op.drain)}`)
    }
    if (op.dispose) {
      details.push('사용 후 폐기')
    }
  }

  if (op.action === 'place') {
    details.push(itemName(op.itemId))
  }
  if (op.action === 'strain' && op.excludeMaterialIds?.length) {
    details.push(`${op.excludeMaterialIds.map(itemName).join(' · ')} 제외`)
  }
  if (op.action === 'attach') {
    details.push(`${itemName(op.itemId)} → ${itemName(op.toId)}`)
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

export function workProgressLabel(step: WorkStep, progress: number): string {
  if (step.kind === 'condition') {
    return '상태 확인 대기'
  }
  const op = step.operation
  const goal = range(step.target, step.maximum ?? step.target)
  const minimum = step.maximum === null ? ' 이상' : ''
  if (step.mixesMaterialId) {
    return readyWork(step, progress) ? '재혼합 완료' : '재혼합 전'
  }
  if (step.kind === 'machine') {
    return `${formatDecimal(progress)} / ${goal}회${minimum}`
  }

  if ('amount' in op && op.amount) {
    const amount = op.amount
    if (amount.kind === 'amount' || amount.kind === 'amount-range') {
      return `${formatDecimal(progress)} / ${goal}${amount.unit}${minimum}`
    }
    if (amount.kind === 'count' || amount.kind === 'count-range') {
      return `${formatDecimal(progress)} / ${goal}${countUnits[amount.unit]}${minimum}`
    }
    if (amount.kind === 'depth' || amount.kind === 'depth-range') {
      return `${formatDecimal(progress)} / ${goal}mm${minimum}`
    }
    if (amount.kind === 'fraction') {
      return `${formatDecimal(progress * amount.denominator)}/${amount.denominator} · 목표 ${amount.numerator}/${
        amount.denominator
      }`
    }
    return `진행 ${formatDecimal(Math.min(1, progress / step.target) * 100)}%`
  }

  if (step.kind === 'confirm' || step.unit === '완료') {
    return readyWork(step, progress) ? '동작 완료' : '동작 전'
  }
  return `${formatDecimal(progress)} / ${goal}${step.unit}${minimum}`
}

const actionLabels: Partial<Record<ResolvedOperation['action'], string>> = {
  add: '담기',
  transfer: '옮기기',
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
    return step.seconds === null ? '작동 확인' : '작동 시작'
  }

  const action = actionLabels[step.operation.action] ?? '진행'
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
