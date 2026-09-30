import type { GameState } from '../../simulation/state'
import type { Coupon, Member } from './checkout-model'

export const memberIds = ['morning', 'forest', 'cloud'] as const

// Fictional, local game accounts. These codes never identify a real card or person.
export function initialMembers(time: number): Member[] {
  return memberIds.map((id, index) => {
    const coupon = (suffix: string, name: string, kind: Coupon['kind'], amount = 0): Coupon => ({
      id: `${id}-${suffix}`,
      code: `COUPON-${index + 1}-${suffix}`,
      name,
      source: 'sr',
      kind,
      amount,
      expiresAt: time + 30 * 86400,
      usedAt: null,
    })
    const coupons: Coupon[] = [
      coupon('coffee', '별 8개 커피 쿠폰', 'coffee'),
      coupon('size', '사이즈업 쿠폰', 'size-up'),
    ]

    if (index === 0) {
      coupons.push(
        coupon('drink', '별 12개 무료음료 쿠폰', 'free-drink'),
        coupon('food', '푸드 8,000원 쿠폰', 'food-amount', 8000),
      )
    }

    if (index === 2) {
      coupons.splice(0, coupons.length, coupon('birthday', '생일 무료음료 쿠폰', 'free-drink'))
    }

    return {
      id,
      nickname: ['아침산책', '초록숲', '구름한잔'][index],
      level: (['Gold', 'Green', 'Welcome'] as const)[index],
      stars: [36, 8, 1][index],
      ecoReward: 'discount',
      employee: index === 1,
      cards: [{ id: `${id}-card`, number: `SOBOK-000${index + 1}`, balance: [100000, 45000, 20000][index] }],
      coupons,
      telecom: { kt: (['VVIP', 'VIP', 'general'] as const)[index], lgu: (['VVIP', 'VIP', 'general'] as const)[index] },
      telecomUses: [],
    }
  })
}

export function presentedPaperCoupons(orderNumber: number, time: number): Coupon[] {
  return [
    {
      id: `paper-${orderNumber}`,
      code: `PAPER-${String(orderNumber).padStart(4, '0')}`,
      name: '종이 무료음료 쿠폰',
      source: 'paper',
      kind: 'free-drink',
      amount: 0,
      expiresAt: time + 30 * 86400,
      usedAt: null,
    },
    {
      id: `tumbler-${orderNumber}`,
      code: `TUMBLER-${orderNumber}`,
      name: '텀블러 음료 쿠폰',
      source: 'paper',
      kind: 'tumbler',
      amount: 0,
      expiresAt: time + 30 * 86400,
      usedAt: null,
    },
    {
      id: `amount-${orderNumber}`,
      code: `AMOUNT-${orderNumber}`,
      name: '1,000원 금액 쿠폰',
      source: 'paper',
      kind: 'amount',
      amount: 1000,
      expiresAt: time + 30 * 86400,
      usedAt: null,
    },
  ]
}

export function cardOwner(state: Pick<GameState, 'members'>, cardId: string) {
  for (const member of state.members) {
    const card = member.cards.find((card) => card.id === cardId)
    if (card) return { member, card }
  }

  return null
}

export function findPresentedMember(state: Pick<GameState, 'customer' | 'members'>) {
  return state.members.find((member) => member.id === state.customer?.memberId) ?? null
}

export function maskedCard(number: string) {
  return `SOBOK ···· ${number.slice(-4)}`
}

export function telecomAvailable(
  member: Member,
  carrier: 'kt' | 'lgu',
  service: 'size-up' | 'americano',
  time: number,
) {
  const tier = member.telecom[carrier]
  if (carrier === 'lgu' && tier === 'general') return false
  if (service === 'americano' && (tier === 'general' || (carrier === 'lgu' && tier !== 'VVIP'))) return false
  const date = new Date(time * 1000).toISOString()
  const uses = member.telecomUses.filter(
    (use) => use.carrier === carrier && (carrier === 'lgu' || use.service === service),
  )
  if (uses.some((use) => new Date(use.at * 1000).toISOString().slice(0, 7) === date.slice(0, 7))) return false
  if (carrier !== 'kt' || service !== 'americano') return true
  const annual = uses.filter((use) => new Date(use.at * 1000).toISOString().slice(0, 4) === date.slice(0, 4)).length
  return annual < (tier === 'VVIP' ? 12 : 6)
}
