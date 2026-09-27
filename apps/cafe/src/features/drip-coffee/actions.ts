import { INGREDIENTS } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import { uid } from '../../shared/id'
import type { DripAction } from '../../simulation/actions'
import { say, startJob } from '../../simulation/feedback'
import { craftingHandsBusy } from '../../simulation/hands'
import type { DripBrew, GameState, Job } from '../../simulation/state'
import type { WorkContext } from '../../simulation/work-context'
import { carriedBatch } from '../inventory/batches'
import { addAmounts, consume, newBatch } from '../inventory/inventory'
import { MEASURE_TOLERANCE } from '../production/runtime'
import {
  DRIP,
  DRIP_BEANS,
  type DripTemperature,
  dripBeanIngredient,
  dripBeanSchema,
  dripDose,
  dripHandsBusy,
  dripIngredient,
  dripTemperatures,
} from './rules'

function outputBatch(state: GameState, temperature: DripTemperature, brew: DripBrew) {
  const batch = newBatch(dripIngredient(temperature), DRIP.waterMilliliters + brew.ice, brew.completedAt!, 'urn')
  batch.dripBean = brew.bean
  batch.labelled = temperature === 'hot'
  batch.expiresAt = Math.min(batch.expiresAt!, brew.ingredientExpiresAt ?? Infinity)
  state.batches.push(batch)
  brew.stage = 'ready'
  brew.batchId = batch.id
}

export function finishDripJob(state: GameState, job: Job) {
  const temperature = dripTemperatures.find((temperature) => state.drip[temperature]?.id === job.preparationId)
  if (!temperature) return
  const brew = state.drip[temperature]!
  if (brew.stage !== 'extracting' || brew.fault) return

  if (brew.ingredientExpiresAt !== null && brew.ingredientExpiresAt <= job.endsAt) {
    brew.fault = '추출 중 원두 기한이 지났어요. 배치를 폐기해주세요.'
    say(state, brew.fault, 'error')
    return
  }

  brew.completedAt = job.endsAt
  state.totals.prepared++
  state.trash++

  if (temperature === 'hot') {
    outputBatch(state, temperature, brew)
    say(state, `${DRIP_BEANS[brew.bean]} HOT 추출 완료. 완료 시각부터 URN에서 1시간 보온해요.`, 'success')
  } else {
    brew.stage = 'ice'
    say(state, `${DRIP_BEANS[brew.bean]} ICED 추출 완료. 얼음을 계량해 넣고 혼합해주세요.`, 'success')
  }
}

/** Release the brewer only after its output has been consumed, discarded, or stored elsewhere. */
export function settleDrip(state: GameState) {
  for (const temperature of dripTemperatures) {
    const brew = state.drip[temperature]
    if (!brew) continue

    if (brew.stage === 'ready') {
      const batch = state.batches.find((batch) => batch.id === brew.batchId)
      if (batch && batch.amount <= 1e-9) state.batches = state.batches.filter((item) => item.id !== batch.id)
      if (!batch || batch.amount <= 1e-9 || !['urn', 'hand'].includes(batch.location)) state.drip[temperature] = null
      continue
    }

    const expiresAt =
      brew.completedAt === null
        ? brew.ingredientExpiresAt
        : Math.min(
            expiryAt(brew.completedAt, INGREDIENTS[dripIngredient(temperature)].lifetime),
            brew.ingredientExpiresAt ?? Infinity,
          )
    if (!brew.fault && expiresAt !== null && expiresAt <= state.time) {
      brew.fault = '재료 또는 추출액 기한이 지났어요. 배치를 폐기해주세요.'
      brew.tool = false
      state.jobs = state.jobs.filter((job) => job.preparationId !== brew.id)
      say(state, brew.fault, 'error')
    }
  }
}

export function handleDripActions(work: WorkContext, action: DripAction) {
  const s = work.state
  const fail = (message: string) => say(s, message, 'error')
  if (action.type === 'drip-stop') return

  if (action.type === 'set-cow') {
    if (!dripBeanSchema.safeParse(action.hot).success || !dripBeanSchema.safeParse(action.iced).success) return
    s.cow = { hot: action.hot, iced: action.iced }
    say(s, 'COW 원두를 변경했어요. 기존 배치와 접수한 주문의 원두는 유지돼요.', 'success')
    return
  }

  const temperature = action.temperature
  const brew = s.drip[temperature]
  if (action.type === 'drip-prepare') {
    if (brew) return fail('해당 URN의 배치를 먼저 사용하거나 정리해주세요.')
    if (!dripBeanSchema.safeParse(action.bean).success) return
    if (craftingHandsBusy(s) || dripHandsBusy(s) || carriedBatch(s)) return fail('컵과 도구를 먼저 내려놓아주세요.')

    s.drip[temperature] = {
      id: uid(),
      bean: action.bean,
      stage: 'filter',
      beans: 0,
      ice: 0,
      tool: false,
      ingredientExpiresAt: null,
      completedAt: null,
      batchId: null,
      fault: null,
    }
    say(s, `${DRIP_BEANS[action.bean]} ${temperature.toUpperCase()} 배치를 준비해요. 새 필터를 넣어주세요.`)
    return
  }
  if (!brew) return

  if (action.type === 'drip-discard') {
    const batch = s.batches.find((batch) => batch.id === brew.batchId)
    if (batch?.location === 'hand') return fail('들고 있는 용기를 URN에 먼저 내려놓아주세요.')

    if (batch) {
      addAmounts(s.totals.disposed, { [batch.ingredient]: batch.amount })
      batch.amount = 0
    } else if (brew.completedAt !== null) {
      addAmounts(s.totals.disposed, { [dripIngredient(temperature)]: DRIP.waterMilliliters + brew.ice })
    } else {
      addAmounts(s.totals.disposed, { [dripBeanIngredient(brew.bean)]: brew.beans })
    }

    s.jobs = s.jobs.filter((job) => job.preparationId !== brew.id)
    s.drip[temperature] = null
    s.trash++
    say(s, 'URN 배치를 정리했어요. 사용한 원두는 반환되지 않아요.')
    return
  }

  if (brew.fault) return fail(brew.fault)
  if (craftingHandsBusy(s) || carriedBatch(s)) return fail('컵과 다른 도구를 먼저 내려놓아주세요.')
  if (dripTemperatures.some((other) => other !== temperature && s.drip[other]?.tool))
    return fail('다른 URN 계량 도구를 먼저 내려놓아주세요.')

  if (action.type === 'drip-filter' && brew.stage === 'filter') {
    brew.stage = 'beans'
    say(s, '필터를 넣었어요. 선택한 원두를 분쇄해 계량해주세요.')
  } else if (action.type === 'drip-tool' && (brew.stage === 'beans' || brew.stage === 'ice')) {
    brew.tool = !brew.tool
  } else if (action.type === 'drip-use' && brew.tool && (brew.stage === 'beans' || brew.stage === 'ice')) {
    work.input = { kind: 'drip', station: 'urn', preparationId: brew.id, temperature, stage: brew.stage }
  } else if (action.type === 'drip-confirm' && (brew.stage === 'beans' || brew.stage === 'ice')) {
    if (brew.tool) return fail('계량 도구를 내려놓은 뒤 확인해주세요.')
    const amount = brew.stage === 'beans' ? brew.beans : brew.ice
    const target = brew.stage === 'beans' ? dripDose(temperature) : DRIP.icedIceGrams
    if (amount + 1e-9 < target * (1 - MEASURE_TOLERANCE)) return fail('아직 계량한 양이 부족해요.')
    if (amount - 1e-9 > target * (1 + MEASURE_TOLERANCE)) {
      brew.fault = '너무 많이 넣었어요. 배치를 폐기하고 다시 준비해주세요.'
      return fail(brew.fault)
    }
    brew.stage = brew.stage === 'beans' ? 'loaded' : 'mix'
  } else if (action.type === 'drip-brew' && brew.stage === 'loaded') {
    brew.stage = 'extracting'
    startJob(s, 'drip-coffee', 'urn', `${temperature.toUpperCase()} 드립 추출`, DRIP.brewSeconds, {
      preparationId: brew.id,
    })
    say(s, 'URN 추출을 시작했어요. 5분 동안 다른 일을 할 수 있어요.')
  } else if (action.type === 'drip-mix' && brew.stage === 'mix' && temperature === 'iced') {
    outputBatch(s, temperature, brew)
    say(s, '아이스 드립을 혼합했어요. 라벨을 쓰고 냉장 보관해주세요.', 'success')
  }
}

export function applyDrip(work: WorkContext, seconds: number) {
  const input = work.input
  if (input?.kind !== 'drip') return
  const brew = work.state.drip[input.temperature]
  if (!brew || brew.id !== input.preparationId || brew.stage !== input.stage || brew.fault || !brew.tool) {
    work.input = null
    return
  }
  const target = brew.stage === 'beans' ? dripDose(input.temperature) : DRIP.icedIceGrams
  const amount = brew.stage === 'beans' ? brew.beans : brew.ice
  const delta = Math.min((seconds * target) / 4, Math.max(0, target * 1.5 - amount))
  if (delta <= 1e-9) {
    work.input = null
    return
  }

  if (brew.stage === 'beans') {
    const used = consume(work.state, { [dripBeanIngredient(brew.bean)]: delta })
    if (!used) {
      work.input = null
      return
    }
    brew.beans += delta
    if (used.earliestExpiry !== null)
      brew.ingredientExpiresAt = Math.min(brew.ingredientExpiresAt ?? Infinity, used.earliestExpiry)
  } else {
    brew.ice += delta
  }
}
