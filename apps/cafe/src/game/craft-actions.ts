import type { Action } from './actions'
import { type Costs, type IngredientId, RECIPES, type StationId } from './catalog'
import {
  type CraftOperation,
  craftStations,
  createCraft,
  isContinuous,
  isMetered,
  operationFor,
  readyToConfirm,
  TOOL_NAMES,
} from './crafting'
import { CUP_NAMES, cleanCupCount, cupKindFor, isReusableCup } from './cups'
import { say, startJob } from './feedback'
import { addAmounts, available, consume } from './inventory'
import { nextStep } from './progress'
import { uid } from './state'
import type { WorkContext } from './work-context'

export function handleCraftActions(
  work: WorkContext,
  action: Extract<
    Action,
    { type: 'take-cup' | 'place-cup' | 'pick-cup' | 'tool' | 'use-start' | 'confirm-craft' | 'discard-cup' }
  >,
) {
  const s = work.state
  const fail = (text: string) => say(s, text, 'error')
  const busy = (station: StationId) => s.jobs.some((job) => job.station === station)
  switch (action.type) {
    case 'take-cup': {
      if (s.preparation?.tool) {
        fail('준비대의 도구를 먼저 내려놓아주세요.')
        break
      }
      if (!s.ticket) {
        fail('먼저 POS에서 주문을 입력해주세요.')
        break
      }
      if (s.cup) {
        fail('이미 컵을 들고 있어요.')
        break
      }
      const kind = cupKindFor(s.ticket.recipe, s.ticket.service)
      if (!cleanCupCount(s, kind)) {
        fail(
          isReusableCup(kind)
            ? `${CUP_NAMES[kind]}가 없어요. 회수·세척 후 컵 보관대에 돌려놓아주세요.`
            : `${CUP_NAMES[kind]}가 없어요. 창고에서 보충해주세요.`,
        )
        break
      }
      if (isReusableCup(kind)) s.reusableCups[kind].clean--
      else s.disposableCups[kind].bar--
      s.cup = { id: uid(), recipe: s.ticket.recipe, step: 0, craft: createCraft(kind) }
      say(s, `${CUP_NAMES[kind]}를 집었어요.`)
      break
    }
    case 'place-cup': {
      if (!s.cup || !craftStations.includes(action.station)) break
      if (action.station === 'mix' && s.cleaning?.station === 'mix') {
        fail('혼합 작업대의 청소를 마치거나 취소한 뒤 컵을 놓아주세요.')
        break
      }
      if (s.jobs.some((j) => j.cupId === s.cup?.id)) {
        fail('장비 작업이 끝나면 컵을 움직일 수 있어요.')
        break
      }
      if (s.cup.craft.location !== 'hand') {
        fail('다른 작업대의 컵을 먼저 집어주세요.')
        break
      }
      s.cup.craft.location = action.station
      say(s, '컵을 내려놓았어요.')
      break
    }
    case 'pick-cup': {
      if (!s.cup || s.cup.craft.location !== action.station) break
      if (s.preparation?.tool) {
        fail('준비대의 도구를 먼저 내려놓아주세요.')
        break
      }
      if (s.cup.craft.tool) {
        fail(`${TOOL_NAMES[s.cup.craft.tool]}를 G로 내려놓아주세요.`)
        break
      }
      if (s.jobs.some((j) => j.cupId === s.cup?.id)) {
        fail('장비 작업이 끝날 때까지 기다려주세요.')
        break
      }
      s.cup.craft.location = 'hand'
      say(s, '컵을 집었어요.')
      break
    }
    case 'tool': {
      if (s.preparation?.tool) {
        fail('준비대의 도구를 먼저 내려놓아주세요.')
        break
      }
      if (!s.cup || s.cup.craft.location !== action.station) {
        fail('이 작업대에 컵을 먼저 내려놓아주세요.')
        break
      }
      const c = s.cup.craft
      if (s.jobs.some((j) => j.cupId === s.cup?.id)) {
        fail('장비가 작동 중이에요.')
        break
      }
      if (c.tool) {
        const name = TOOL_NAMES[c.tool]
        c.tool = null
        say(s, `${name}를 내려놓았어요.`)
        break
      }
      const op = operationFor(s.cup.recipe, s.cup.step, c)
      if (!op?.tool || nextStep(s)?.station !== action.station) {
        fail('여기서 사용할 도구가 없어요.')
        break
      }
      if (c.fault) {
        fail(c.fault)
        break
      }
      if ((op.kind === 'steam' || op.tool === 'pitcher') && !c.pitcherReserved) {
        if (!s.tools.clean) {
          fail('깨끗한 피처를 먼저 준비해주세요.')
          break
        }
        s.tools.clean--
        c.pitcherReserved = true
      }
      c.tool = op.tool
      say(s, `${TOOL_NAMES[op.tool]}를 집었어요.`)
      break
    }
    case 'use-start': {
      if (s.preparation?.tool) {
        fail('준비대의 도구를 먼저 내려놓아주세요.')
        break
      }
      if (!s.cup || s.cup.craft.location !== action.station || nextStep(s)?.station !== action.station) {
        fail('현재 단계의 작업대에 컵을 놓아주세요.')
        break
      }
      const c = s.cup.craft
      const op = operationFor(s.cup.recipe, s.cup.step, c)!
      if (c.fault) {
        fail(c.fault)
        break
      }
      if (op.kind === 'shake' && available(s, 'hojicha') < (nextStep(s)!.costs.hojicha ?? 0)) {
        fail('호지차 샷을 먼저 준비하고 보관해주세요.')
        break
      }
      if (s.jobs.some((j) => j.cupId === s.cup?.id) || busy(action.station)) {
        fail('장비가 작동 중이에요.')
        break
      }
      if (op.tool !== c.tool) {
        fail(op.tool ? `G로 ${TOOL_NAMES[op.tool]}를 먼저 집어주세요.` : '도구를 먼저 내려놓아주세요.')
        break
      }
      if (op.kind === 'machine') {
        if (!consume(s, op.costs)) break
        addAmounts(c.consumed, op.costs)
        startJob(s, 'craft-machine', action.station, '에스프레소 추출', nextStep(s)!.seconds, {
          cupId: s.cup.id,
          stepIndex: s.cup.step,
          machine: 'espresso',
        })
      } else if (isContinuous(op)) {
        work.input = { kind: 'drink', cupId: s.cup.id, step: s.cup.step, station: action.station, operation: op.id }
      } else applyCraft(work, op, 1)
      break
    }
    case 'confirm-craft': {
      if (s.preparation?.tool) {
        fail('준비대의 도구를 먼저 내려놓아주세요.')
        break
      }
      if (!s.cup || s.cup.craft.location !== action.station || nextStep(s)?.station !== action.station) break
      const c = s.cup.craft
      const op = operationFor(s.cup.recipe, s.cup.step, c)!
      if (c.fault) {
        fail(c.fault)
        break
      }
      if (s.jobs.some((j) => j.cupId === s.cup?.id)) {
        fail('장비가 작동 중이에요.')
        break
      }
      if (!readyToConfirm(op, c.progress)) {
        fail('아직 목표량에 못 미쳤어요. 조금 더 진행해주세요.')
        break
      }
      if (c.tool) {
        fail(`${TOOL_NAMES[c.tool]}를 G로 내려놓은 뒤 확인해주세요.`)
        break
      }
      if (op.kind === 'steam') {
        startJob(s, 'craft-machine', action.station, '우유 스팀', 5, {
          cupId: s.cup.id,
          stepIndex: s.cup.step,
          machine: 'steam',
        })
      } else if (op.kind === 'transfer') {
        c.shotTransferred = true
        c.progress = 0
        say(s, '샷을 옮겼어요.', 'success')
      } else if (op.kind === 'shake') {
        if (available(s, 'hojicha') < (nextStep(s)!.costs.hojicha ?? 0)) {
          fail('사용할 호지차 샷이 부족해요. 먼저 준비하고 다시 섞어주세요.')
          break
        }
        c.teaMixed = true
        c.progress = 0
        say(s, '호지차 샷을 다시 섞었어요. 같은 보틀로 계량해 부어주세요.', 'success')
      } else {
        if (op.kind === 'stir') c.mixed = true
        if (op.kind === 'lid') c.lidded = true
        if (op.tool === 'pitcher' && c.pitcherReserved) {
          c.pitcherReserved = false
          if (c.pitcherMilk > 0) {
            addAmounts(s.totals.disposed, { milk: c.pitcherMilk })
            c.consumed.milk = Math.max(0, (c.consumed.milk ?? 0) - c.pitcherMilk)
          }
          c.pitcherMilk = 0
          s.tools.dirty++
        }
        s.cup.step++
        if (isReusableCup(c.kind) && RECIPES[s.cup.recipe].steps[s.cup.step]?.label === '제공') s.cup.step++
        c.progress = 0
        say(s, nextStep(s) ? `${op.label} 완료.` : '음료가 완성됐어요.', 'success')
      }
      break
    }
    case 'discard-cup':
      if (!s.cup) break
      addAmounts(s.totals.disposed, s.cup.craft.consumed)
      if (s.cup.craft.pitcherReserved) s.tools.dirty++
      s.jobs = s.jobs.filter((j) => j.cupId !== s.cup?.id)
      if (isReusableCup(s.cup.craft.kind)) {
        s.reusableCups[s.cup.craft.kind].dirty++
        say(s, '내용물을 비우고 다회용 컵을 세척 대상으로 보냈어요.')
      } else {
        s.trash++
        s.totals.wastedCups++
        say(s, '일회용 컵을 폐기했어요. 이미 사용한 재료는 돌아오지 않아요.')
      }
      s.cup = null
      break
  }
}

export function applyCraft(work: WorkContext, op: CraftOperation, delta: number) {
  const s = work.state
  if (!s.cup) return
  const c = s.cup.craft
  if (c.fault) {
    work.input = null
    return
  }
  if (!isMetered(op)) delta = Math.min(delta, Math.max(0, op.target - c.progress))
  if (op.tool === 'pitcher') delta = Math.min(delta, c.pitcherMilk / 200)
  if (delta <= 0) {
    work.input = null
    return
  }
  const costs: Costs = {}
  for (const [key, amount] of Object.entries(op.costs)) costs[key as IngredientId] = (amount * delta) / op.target
  if (!consume(s, costs)) {
    work.input = null
    return
  }
  addAmounts(c.consumed, costs)
  c.progress += delta
  if (op.kind === 'steam') c.pitcherMilk += ((op.costs.milk ?? 200) * delta) / op.target
  if (op.tool === 'pitcher') c.pitcherMilk = Math.max(0, c.pitcherMilk - 200 * delta)
  if (op.content) c.contents[op.content] += (op.weight * delta) / op.target
  if (op.kind === 'lid') {
    c.lidded = true
    c.tool = null
  }
  if (isMetered(op) && c.progress > op.target * (1 + op.tolerance) + 0.0001) {
    c.fault = `${op.label} 계량을 초과했어요. 이 컵은 다시 만들어주세요.`
    s.dirtyBar = Math.min(3, s.dirtyBar + 1)
    if (s.cleaning?.station === 'mix') s.cleaning.progress = 0
    work.input = null
    say(s, c.fault, 'error')
  }
}
