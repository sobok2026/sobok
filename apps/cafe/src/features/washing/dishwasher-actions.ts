import type { Action } from '../../simulation/actions'
import { say, startJob } from '../../simulation/feedback'
import { craftingHandsBusy } from '../../simulation/hands'
import type { WorkContext } from '../../simulation/work-context'
import {
  DISHWASHER,
  dishwasherJob,
  rackCount,
  rackSlots,
  rackSpace,
  washItems,
  washingHandsBusy,
  washStock,
} from './rules'

export function handleDishwasherActions(
  { state }: WorkContext,
  action: Extract<Action, { type: 'dishwasher-hood' | 'dishwasher-load' | 'dishwasher-unload' }>,
) {
  const machine = state.dishwasher
  const fail = (text: string) => say(state, text, 'error')
  if (dishwasherJob(state) && action.type !== 'dishwasher-hood') {
    fail('후드를 올려 운전을 멈춘 뒤 랙을 꺼내주세요.')
    return
  }
  if (craftingHandsBusy(state) || washingHandsBusy(state.washing)) {
    fail('컵과 작업 도구를 먼저 내려놓아주세요.')
    return
  }

  switch (action.type) {
    case 'dishwasher-hood':
      machine.hoodOpen = !machine.hoodOpen
      if (machine.hoodOpen) {
        const interrupted = !!dishwasherJob(state)
        state.jobs = state.jobs.filter((job) => job.kind !== 'dishwasher')
        say(state, interrupted ? '후드를 올려 운전을 멈췄어요. 다시 내리면 처음부터 세척해요.' : '후드를 올렸어요.')
      } else if (!machine.clean && rackCount(machine.rack)) {
        startJob(state, 'dishwasher', 'dishwasher', '식기 세척', DISHWASHER.cycleSeconds)
      } else {
        say(state, '후드를 내렸어요.')
      }
      break
    case 'dishwasher-load': {
      if (!machine.hoodOpen || machine.clean) {
        fail(machine.clean ? '깨끗한 랙을 먼저 건조대에 꺼내주세요.' : '후드를 먼저 올려주세요.')
        return
      }

      const stock = washStock(state, action.item)
      const count = Math.min(
        stock.dirty,
        Math.floor((DISHWASHER.capacity - rackSpace(machine.rack)) / rackSlots(action.item)),
      )
      if (!count) {
        fail(stock.dirty ? '랙이 가득 찼어요.' : '담을 용기가 없어요.')
        return
      }

      stock.dirty -= count
      machine.rack[action.item] = (machine.rack[action.item] ?? 0) + count
      say(state, `잔여물을 비우고 용기 ${count}개를 랙에 담았어요.`)
      break
    }
    case 'dishwasher-unload':
      if (!machine.hoodOpen) {
        fail('후드를 먼저 올려주세요.')
        return
      }

      for (const item of washItems) {
        washStock(state, item)[machine.clean ? 'washed' : 'dirty'] += machine.rack[item] ?? 0
      }

      say(
        state,
        machine.clean
          ? '세척한 랙을 건조대에 꺼냈어요. 마른 용기를 바에 옮겨 정리해주세요.'
          : '용기를 회수대로 되돌렸어요.',
      )
      machine.rack = {}
      machine.clean = false
      break
  }
}
