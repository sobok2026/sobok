import { CUSTOMER_HABITS } from '../../content/customers'
import { type Costs, INGREDIENTS } from '../../content/ingredients'
import { recipeFor } from '../../content/recipes'
import { tableIds } from '../../content/stations'
import type { Action } from '../../simulation/actions'
import { say } from '../../simulation/feedback'
import type { WorkContext } from '../../simulation/work-context'
import { nextStep } from '../crafting/rules'
import { cupKindFor, cupService, cupSize } from '../inventory/cups'
import { addAmounts } from '../inventory/inventory'
import { customerToCondiment } from './customer'
import { currentTicket } from './orders'

export function handleOrderActions(work: WorkContext, action: Extract<Action, { type: 'serve' }>) {
  const s = work.state
  const fail = (text: string) => say(s, text, 'error')

  switch (action.type) {
    case 'serve': {
      if (s.customer?.stage !== 'pickup' || s.customer.visit || s.customer.orderNumber !== s.orderNumber) {
        fail(
          s.customer?.stage === 'to-pickup'
            ? '손님이 픽업대로 오고 있어요. 도착하면 전달해주세요.'
            : '현재 주문의 손님이 픽업대에 도착해야 전달할 수 있어요.',
        )
        break
      }

      const ticket = currentTicket(s)

      if (!ticket || !s.cup || nextStep(s)) {
        fail('아직 완성된 음료가 없어요.')
        break
      }

      if (s.cup.craft.location !== 'pickup' || s.cup.craft.tool || s.preparation?.tool) {
        fail('픽업대에 컵을 내려놓고 도구를 정리해주세요.')
        break
      }

      if (s.cup.craft.fault) {
        fail('계량이 맞지 않는 음료예요. 컵을 정리하고 다시 만들어주세요.')
        break
      }

      if (
        s.cup.recipe !== ticket.recipe ||
        s.cup.orderLineId !== ticket.id ||
        s.cup.craft.kind !== cupKindFor(ticket.recipe, ticket.service, ticket.size)
      ) {
        fail('현재 제조할 주문과 다른 컵이에요. 컵을 정리하고 주문표에 맞게 다시 준비해주세요.')
        break
      }

      const servingVessel = recipeFor(
        s.cup.recipe,
        cupSize(s.cup.craft.kind),
        cupService(s.cup.craft.kind),
        s.cup.craft.customizations,
      ).vesselId
      const leftovers: Costs = { ...s.cup.craft.stockHeld }

      for (const [id, vessel] of Object.entries(s.cup.craft.vessels)) {
        if (id === servingVessel) {
          continue
        }
        for (const layer of vessel.layers) {
          if (INGREDIENTS[layer.materialId]) {
            leftovers[layer.materialId] = (leftovers[layer.materialId] ?? 0) + layer.quantity
          }
        }
      }

      addAmounts(s.totals.disposed, leftovers)
      ticket.served++
      s.totals.served++
      s.cup = null

      if (currentTicket(s)) {
        say(s, '음료를 전달했어요. 다음 잔을 제조해주세요.', 'success')
        break
      }

      const dineIn = s.customer.items.some((item) => item.service === 'dine-in')
      s.customer.visit = {
        table: dineIn ? tableIds[Math.floor(Math.random() * tableIds.length)] : null,
        returnCup: dineIn && Math.random() < CUSTOMER_HABITS.returnCup,
        dirtyTable: dineIn && Math.random() < CUSTOMER_HABITS.stain,
        dirtyReturn: dineIn && Math.random() < CUSTOMER_HABITS.stain,
        usesSugar: Math.random() < CUSTOMER_HABITS.sugar,
      }

      if (Math.random() < CUSTOMER_HABITS.stain) {
        s.dirtyBar = Math.min(3, s.dirtyBar + 1)
        if (s.cleaning?.station === 'mix') {
          s.cleaning.progress = 0
        }
      }

      customerToCondiment(s.customer)
      say(
        s,
        !dineIn
          ? '포장 손님이 음료를 받았어요. 소모품을 챙긴 뒤 나가요.'
          : '매장 손님이 음료를 받았어요. 소모품을 챙기고 테이블을 이용해요.',
        'success',
      )
      break
    }
  }
}
