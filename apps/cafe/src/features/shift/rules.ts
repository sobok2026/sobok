import { INGREDIENTS } from '../../content/ingredients'
import { cupSurfaceIds, STATIONS } from '../../content/stations'
import type { GameState } from '../../simulation/state'
import { cupSurface } from '../cleaning/rules'
import { batchDestination, batchHome, carriedBatch, isSealed } from '../inventory/batches'
import { cupCount } from '../inventory/cups'
import { SUPPLIES } from '../inventory/supplies'
import { PREPARATIONS } from '../preparation/rules'
import { CUSTOMER_STATUS } from '../service/customer'
import { WASH_NAMES, washDestination, washItems, washStock } from '../washing/rules'

export type ShiftTask = { place: string; task: string; count?: string }

const taskLabel = ({ place, task, count }: ShiftTask) => `${place} · ${task}${count ? ` ${count}` : ''}`

/** Everything left to finish in the shop, each named by where it happens and exactly what remains. */
export function shiftTasks(state: GameState): ShiftTask[] {
  const tasks: ShiftTask[] = []
  const unserved = state.sale?.paidAt != null ? state.sale.lines.reduce((sum, l) => sum + l.quantity - l.served, 0) : 0
  if (unserved || state.cup) {
    tasks.push({ place: '주문', task: '음료 제조', count: unserved ? `${unserved}잔 남음` : undefined })
  }
  if (state.preparation) {
    tasks.push({ place: STATIONS.prep.name, task: `${PREPARATIONS[state.preparation.recipe].name} 마무리` })
  }
  if (state.coldBrew && state.coldBrew.stage !== 'extracting') {
    tasks.push({ place: STATIONS['cold-prep'].name, task: coldBrewTask(state.coldBrew.stage) })
  }

  const carried = carriedBatch(state)
  if (carried) {
    tasks.push(
      isSealed(carried)
        ? { place: '들고 있는 원팩', task: `${INGREDIENTS[carried.ingredient].name} 넣기` }
        : { place: STATIONS[batchDestination(carried)].name, task: `${INGREDIENTS[carried.ingredient].name} 보관` },
    )
  }
  if (state.washing) {
    tasks.push(
      state.washing.stage === 'carrying'
        ? {
            place: STATIONS[washDestination(state.washing.item)].name,
            task: `씻은 ${WASH_NAMES[state.washing.item]} 정리`,
          }
        : { place: STATIONS.wash.name, task: `${WASH_NAMES[state.washing.item]} 세척 마무리` },
    )
  }
  if (state.cleaning) {
    const held = cupCount(state.cleaning.heldCups)
    tasks.push(
      held
        ? { place: STATIONS.wash.name, task: '회수한 컵 내려놓기', count: `${held}개` }
        : { place: STATIONS[state.cleaning.station].name, task: '청소 마무리' },
    )
  }
  if (state.supplyDelivery) {
    tasks.push({ place: STATIONS.condiment.name, task: `${SUPPLIES[state.supplyDelivery.supply].name} 채우기` })
  }

  for (const batch of state.batches) {
    const home = batchHome(batch)
    if (!home || batch.amount <= 0 || isSealed(batch)) {
      continue
    }
    if (batch.expiresAt !== null && batch.expiresAt <= state.time) {
      tasks.push({ place: STATIONS[home].name, task: `${INGREDIENTS[batch.ingredient].name} 폐기` })
    } else if (batch.location !== 'bar') {
      tasks.push({ place: STATIONS[home].name, task: `${INGREDIENTS[batch.ingredient].name} 라벨 붙이기` })
    }
  }

  for (const item of washItems) {
    const stock = washStock(state, item)
    if (stock.dirty) {
      tasks.push({ place: STATIONS.wash.name, task: `${WASH_NAMES[item]} 세척`, count: `${stock.dirty}개` })
    }
    if (stock.washed) {
      tasks.push({
        place: STATIONS[washDestination(item)].name,
        task: `씻은 ${WASH_NAMES[item]} 정리`,
        count: `${stock.washed}개`,
      })
    }
  }

  for (const id of cupSurfaceIds) {
    const surface = cupSurface(state, id)
    const cups = cupCount(surface.cups)
    if (cups || surface.dirty) {
      tasks.push({
        place: STATIONS[id].name,
        task: surface.dirty ? '얼룩 닦기' : '컵 회수',
        count: cups ? `컵 ${cups}개` : undefined,
      })
    }
  }
  if (state.dirtyBar) {
    tasks.push({ place: STATIONS.mix.name, task: '얼룩 닦기' })
  }
  if (state.trash) {
    tasks.push({ place: STATIONS.trash.name, task: '쓰레기 비우기', count: `${state.trash}개` })
  }

  for (const job of state.jobs) {
    if (job.kind !== 'cold-brew') {
      tasks.push({
        place: STATIONS[job.station].name,
        task: `${job.label} 작동 중`,
        count: `${Math.max(0, Math.ceil(job.endsAt - state.time))}초`,
      })
    }
  }
  return tasks
}

const coldBrewTasks = { measuring: '계량 마무리', finished: '추출액 회수', ready: '라벨 붙이고 보관' } as const

function coldBrewTask(stage: keyof typeof coldBrewTasks | 'extracting') {
  return stage === 'extracting' ? '추출 중' : coldBrewTasks[stage]
}

/** What still blocks the end-of-day summary, as short lines for the POS checklist and the refusal message. */
export function closingTasks(state: GameState) {
  const tasks = shiftTasks(state)
  if (state.sale?.paidAt === null && state.sale.payments.length) {
    tasks.push({ place: 'POS', task: '진행 중인 결제 마무리 또는 취소' })
  }
  if (state.customer) {
    tasks.push({ place: '손님', task: `${CUSTOMER_STATUS[state.customer.stage]} · 퇴장까지 응대` })
  }
  return tasks.map(taskLabel)
}

export const emptyTotals = (openingCash: number): GameState['totals'] => ({
  openingCash,
  purchases: {},
  cupPurchases: 0,
  coldBrewPurchases: 0,
  coldBrewDiscardedBeans: 0,
  disposed: {},
  supplyPurchases: {},
  suppliesUsed: {},
  served: 0,
  revenue: 0,
  cashSales: 0,
  cardSales: 0,
  wastedCups: 0,
  cleaned: 0,
  washed: 0,
  prepared: 0,
})
