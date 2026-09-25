import { orderSequence } from '../../content/customers'
import { RECIPES } from '../../content/recipes'
import { type CupSurfaceId, STATIONS } from '../../content/stations'
import { say } from '../../simulation/feedback'
import type { GameState } from '../../simulation/state'
import type { WorkContext } from '../../simulation/work-context'
import { cupSurface } from '../cleaning/rules'
import { type ReusableCupKind, reusableCupFor } from '../inventory/cups'
import { SUPPLIES, type SupplyId } from '../inventory/supplies'
import {
  CUSTOMER_SECONDS,
  createCustomer,
  customerLeave,
  customerToReturn,
  customerToTable,
  customerWait,
  customerWalking,
  moveCustomer,
} from './customer'

function customerSurface(s: GameState, station: CupSurfaceId, cup: ReusableCupKind | null, dirty: boolean) {
  const surface = cupSurface(s, station)
  if (cup) surface.cups[cup]++
  if (dirty) {
    surface.dirty = true
    if (s.cleaning?.station === station) s.cleaning.progress = 0
  }
}

export function advanceCustomer(work: WorkContext, seconds: number) {
  const s = work.state
  const customer = s.customer
  if (!customer) return
  if (customerWalking(customer)) {
    if (!moveCustomer(customer, seconds)) return
    switch (customer.stage) {
      case 'entering':
        customerWait(customer, 'ordering')
        customer.yaw = Math.PI
        say(s, '손님이 POS에 도착했어요. 주문을 받아주세요.')
        break
      case 'to-pickup':
        customerWait(customer, 'pickup')
        customer.yaw = Math.PI
        say(s, '손님이 픽업대에서 기다리고 있어요.')
        break
      case 'to-condiment':
        customerWait(customer, 'condiment')
        break
      case 'to-table':
        customerWait(customer, 'drinking')
        customer.yaw = 0
        break
      case 'to-return':
        customerWait(customer, 'returning')
        break
      case 'leaving':
        if (customer.visit) {
          s.orderNumber++
          s.request = orderSequence[(s.orderNumber - 1) % orderSequence.length]
        }
        s.customer = s.phase === 'open' ? createCustomer(s.orderNumber, s.request) : null
        say(s, s.customer ? '다음 손님이 들어오고 있어요.' : '마지막 손님이 나갔어요. 남은 정리를 마쳐주세요.')
        break
    }
    return
  }
  if (!customer.visit) return
  customer.elapsed += seconds
  if (customer.stage === 'condiment' && customer.elapsed >= CUSTOMER_SECONDS.condiment) {
    const supplies: SupplyId[] = ['napkins']
    if (RECIPES[customer.recipe].variant === 'ICED') supplies.push('straws')
    if (customer.visit.usesSugar) supplies.push('sugar')
    const missing: string[] = []
    for (const id of supplies) {
      if (s.supplies[id].bar > 0) {
        s.supplies[id].bar--
        s.totals.suppliesUsed[id] = (s.totals.suppliesUsed[id] ?? 0) + 1
      } else missing.push(SUPPLIES[id].name)
    }
    if (missing.length) say(s, `컨디먼트 바에 ${missing.join('·')} 보충이 필요해요. 손님은 이용을 계속해요.`)
    if (customer.service === 'takeout') customerLeave(customer)
    else customerToTable(customer)
  } else if (customer.stage === 'drinking' && customer.visit.table && customer.elapsed >= CUSTOMER_SECONDS.drinking) {
    customerSurface(
      s,
      customer.visit.table,
      customer.visit.returnCup ? null : reusableCupFor(customer.recipe),
      customer.visit.dirtyTable,
    )
    if (customer.visit.returnCup) customerToReturn(customer)
    else {
      say(s, `손님이 ${STATIONS[customer.visit.table].name}에 컵을 남겼어요.`)
      customerLeave(customer)
    }
  } else if (customer.stage === 'returning' && customer.elapsed >= CUSTOMER_SECONDS.returning) {
    customerSurface(s, 'condiment', reusableCupFor(customer.recipe), customer.visit.dirtyReturn)
    say(s, '손님이 컨디먼트 바에 컵을 반납했어요.')
    customerLeave(customer)
  }
}
