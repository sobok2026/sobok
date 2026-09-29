import type { Action } from '../../simulation/actions'
import { say, startJob } from '../../simulation/feedback'
import { craftingHandsBusy, cupHandsBusy } from '../../simulation/hands'
import type { WorkContext } from '../../simulation/work-context'
import { GRINDER_HOPPER_POUNDS } from '../grinder/rules'
import { addAmounts, newBatch } from '../inventory/inventory'
import {
  COLD_BREW_BEANS,
  COLD_BREW_COST,
  COLD_BREW_HOURS,
  COLD_BREW_OUTPUT,
  coldBrewStep,
  createColdBrew,
  judgeColdBrew,
} from './rules'

export function handleColdBrewActions(
  work: WorkContext,
  action: Extract<
    Action,
    {
      type:
        | 'start-cold-brew'
        | 'cold-grind'
        | 'cold-tool'
        | 'cold-use'
        | 'cold-confirm'
        | 'collect-cold-brew'
        | 'discard-cold-brew'
    }
  >,
) {
  const s = work.state
  const fail = (text: string) => say(s, text, 'error')

  switch (action.type) {
    case 'start-cold-brew':
      if (s.coldBrew) {
        fail('진행 중인 콜드 브루를 먼저 마무리해주세요.')
        break
      }

      if (craftingHandsBusy(s)) {
        fail('컵과 도구를 먼저 내려놓아주세요.')
        break
      }

      if (s.cash < COLD_BREW_COST) {
        fail('추출용 원두 입고비가 부족해요.')
        break
      }

      s.cash -= COLD_BREW_COST
      s.totals.coldBrewPurchases += COLD_BREW_COST
      s.coldBrew = createColdBrew()
      say(s, '한 배치분의 원두를 준비했어요. BUNN G3에서 COARSE로 나누어 분쇄해주세요.')
      break
    case 'cold-grind': {
      const brew = s.coldBrew
      if (brew?.stage !== 'grind' || brew.fault) break
      if (craftingHandsBusy(s)) {
        fail('컵과 다른 도구를 먼저 내려놓아주세요.')
        break
      }
      if (s.grindSetting !== 'coarse') {
        fail('콜드 브루는 COARSE 설정으로 분쇄해주세요.')
        break
      }

      brew.groundBeans = Math.min(COLD_BREW_BEANS, brew.groundBeans + GRINDER_HOPPER_POUNDS)
      if (brew.groundBeans === COLD_BREW_BEANS) brew.stage = 'ground'
      say(
        s,
        brew.stage === 'ground'
          ? '분쇄를 마쳤어요. 원두 봉투를 집어 콜드 브루 추출대로 가져가세요.'
          : '3lb 분쇄를 마쳤어요. 남은 원두를 이어서 분쇄해주세요.',
        'success',
      )
      break
    }
    case 'cold-tool': {
      const brew = s.coldBrew
      if (brew?.stage === 'ground' && !brew.fault && !craftingHandsBusy(s)) {
        brew.stage = 'measuring'
        brew.tool = 'bean-bag'
        say(s, '분쇄 원두 봉투를 집었어요. 콜드 브루 추출대의 필터에 담아주세요.')
        break
      }
      if (brew?.stage !== 'measuring') {
        break
      }

      if (brew.tool) {
        brew.tool = null
      } else if (!brew.fault && !cupHandsBusy(s.cup) && !s.preparation?.tool) {
        brew.tool = coldBrewStep(brew).tool
      } else {
        fail('컵과 다른 도구를 먼저 내려놓거나 실패한 배합을 폐기해주세요.')
        break
      }

      say(s, brew.tool ? '콜드 브루 계량 도구를 집었어요.' : '콜드 브루 계량 도구를 내려놓았어요.')
      break
    }
    case 'cold-use': {
      const brew = s.coldBrew
      if (brew?.stage !== 'measuring' || brew.fault) {
        break
      }

      if (craftingHandsBusy(s)) {
        fail('컵과 다른 도구를 먼저 내려놓아주세요.')
        break
      }

      const step = coldBrewStep(brew)

      if (brew.tool !== step.tool) {
        fail('필요한 도구를 집거나 내려놓아주세요.')
        break
      }

      if (brew.step === 2) {
        brew.stage = 'extracting'
        startJob(s, 'cold-brew', 'cold-prep', '콜드 브루 추출', COLD_BREW_HOURS * 3600, { preparationId: brew.id })
      } else {
        work.input = { kind: 'cold', preparationId: brew.id, step: brew.step, station: 'cold-prep' }
      }

      break
    }
    case 'cold-confirm': {
      const brew = s.coldBrew
      if (brew?.stage !== 'measuring' || brew.fault || brew.step === 2) {
        break
      }

      if (brew.tool) {
        fail('계량 도구를 내려놓은 뒤 확인해주세요.')
        break
      }

      const judgement = judgeColdBrew(brew)
      if (judgement === 'under') {
        fail(brew.step === 0 ? '봉투에 원두가 남아 있어요.' : '아직 덜 부었어요.')
        break
      }
      if (judgement === 'over') {
        brew.fault = '물을 너무 많이 부었어요. 배합을 폐기하고 다시 준비해주세요.'
        fail(brew.fault)
        break
      }

      brew.step++
      brew.progress = 0
      say(s, '콜드 브루 계량을 확인했어요.', 'success')
      break
    }
    case 'collect-cold-brew': {
      const brew = s.coldBrew
      if (brew?.stage !== 'finished' || brew.completedAt === null) {
        break
      }

      if (craftingHandsBusy(s)) {
        fail('컵과 도구를 먼저 내려놓아주세요.')
        break
      }

      const batch = newBatch('cold-brew', COLD_BREW_OUTPUT, brew.completedAt, 'cold-prep')
      s.batches.push(batch)
      brew.batchId = batch.id
      brew.stage = 'ready'
      say(s, '추출액을 용기에 회수했어요. 기한을 계산해 라벨을 써주세요.', 'success')
      break
    }
    case 'discard-cold-brew': {
      const brew = s.coldBrew
      if (!brew) {
        break
      }

      if (brew.batchId) {
        const batch = s.batches.find((item) => item.id === brew.batchId)
        if (batch) {
          addAmounts(s.totals.disposed, { 'cold-brew': batch.amount })
          batch.amount = 0
        }
      } else if (brew.stage === 'finished') {
        addAmounts(s.totals.disposed, { 'cold-brew': COLD_BREW_OUTPUT })
      } else {
        s.totals.coldBrewDiscardedBeans += COLD_BREW_BEANS
      }

      s.jobs = s.jobs.filter((job) => job.preparationId !== brew.id)
      s.coldBrew = null
      s.trash++
      say(s, '콜드 브루 준비를 정리했어요. 한 배치분의 준비비는 반환되지 않아요.')
      break
    }
  }
}

export function applyColdBrew(work: WorkContext, seconds: number) {
  const s = work.state
  const brew = s.coldBrew

  if (brew?.stage !== 'measuring' || brew.fault || brew.step === 2) {
    work.input = null
    return
  }

  const step = coldBrewStep(brew)
  const delta = Math.min(seconds * step.rate, Math.max(0, step.cap - brew.progress))
  brew.progress += delta

  if (brew.step === 0) {
    brew.beans += delta
  } else {
    brew.water += delta
  }
  if (brew.progress >= step.cap) {
    work.input = null
  }
}
