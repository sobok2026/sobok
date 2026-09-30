import type { GameState, Sale } from '../../simulation/state'
import type { Coupon, SaleBenefits } from './checkout-model'
import { findPresentedMember, telecomAvailable } from './members'
import { couponAmount, freeExtraAmount, quoteSale, telecomAmount } from './pricing'

export function couponUnavailable(state: GameState, coupon: Coupon, sale: Sale) {
  if (coupon.usedAt !== null) return '사용한 쿠폰'
  if (coupon.expiresAt <= state.time) return '유효기간 만료'
  if (state.waitingOrders.some((order) => order.sale?.benefits.coupons.some((item) => item.coupon.id === coupon.id)))
    return '보류 주문에서 사용 중'
  if (sale.benefits.coupons.some((item) => item.coupon.id === coupon.id)) return '현재 주문에 적용됨'
  return null
}

export function benefitsError(state: GameState, sale: Sale, benefits: SaleBenefits) {
  const member = findPresentedMember(state)
  if (benefits.memberId !== null && benefits.memberId !== member?.id) return '현재 손님의 회원 카드를 인식해주세요.'
  const recognized = !!member && member.id === benefits.memberId
  if ((benefits.employee || benefits.telecom || benefits.freeExtra) && !recognized)
    return '혜택을 적용하기 전에 회원 카드를 인식해주세요.'
  if (benefits.employee && !member?.employee) return '임직원으로 인증되지 않은 회원이에요.'
  if (
    benefits.manual &&
    (!benefits.manual.value || (benefits.manual.kind === 'percent' && benefits.manual.value > 100))
  )
    return '할인 금액 또는 1~100%의 할인율을 입력해주세요.'
  const lines = [...sale.lines, ...sale.foodLines]
  if (benefits.manual?.lineId && !lines.some((line) => line.id === benefits.manual?.lineId))
    return '할인할 상품을 선택해주세요.'
  if (new Set(benefits.coupons.map((item) => item.coupon.id)).size !== benefits.coupons.length)
    return '같은 쿠폰을 두 번 사용할 수 없어요.'

  const counts = new Map<string, number>()

  for (const applied of benefits.coupons) {
    const sources = applied.coupon.source === 'sr' && recognized ? member.coupons : (state.customer?.paperCoupons ?? [])
    const coupon = sources.find((coupon) => coupon.id === applied.coupon.id)
    if (!coupon || JSON.stringify(coupon) !== JSON.stringify(applied.coupon))
      return '손님이 제시한 쿠폰을 다시 인식해주세요.'
    const at = sale.benefitsCheckedAt ?? state.time
    if (coupon.usedAt !== null || coupon.expiresAt <= at) return '이미 사용했거나 유효기간이 지난 쿠폰이에요.'
    if (state.waitingOrders.some((order) => order.sale?.benefits.coupons.some((item) => item.coupon.id === coupon.id)))
      return '보류한 다른 주문에서 사용 중인 쿠폰이에요.'
    const line = lines.find((line) => line.id === applied.lineId)
    if (!line || !couponAmount(coupon, line)) return '이 상품에는 선택한 쿠폰을 적용할 수 없어요.'
    const count = (counts.get(line.id) ?? 0) + 1
    if (count > line.quantity) return '상품 한 개에 쿠폰 한 장을 적용할 수 있어요.'
    counts.set(line.id, count)
  }

  if (
    benefits.manual &&
    !lines.some(
      (line) =>
        (!benefits.manual?.lineId || benefits.manual.lineId === line.id) && (counts.get(line.id) ?? 0) < line.quantity,
    )
  )
    return '쿠폰을 적용하지 않은 상품을 할인 대상으로 선택해주세요.'

  const telecom = benefits.telecom

  if (telecom) {
    if (!member || !telecomAvailable(member, telecom.carrier, telecom.service, sale.benefitsCheckedAt ?? state.time))
      return '등급 또는 월·연 이용 한도를 확인해주세요.'
    const line = sale.lines.find((line) => line.id === telecom.lineId)
    if (!line || !telecomAmount(telecom, line) || (counts.get(line.id) ?? 0) >= line.quantity)
      return '통신사 혜택을 적용할 수 있는 음료를 선택해주세요.'
    if (
      state.waitingOrders.some(
        (order) =>
          order.sale?.benefits.memberId === member.id && order.sale.benefits.telecom?.carrier === telecom.carrier,
      )
    )
      return '이 회원의 통신사 혜택은 보류 주문에서 사용 중이에요.'
  }

  if (benefits.freeExtra) {
    if (!sale.lines.some((line) => freeExtraAmount(line) > 0)) return 'Free Extra 대상 추가 옵션이 없어요.'
    if (sale.payments.some((payment) => payment.method !== 'starbucks-card'))
      return 'Free Extra는 남은 금액을 소복다방 카드로 전액 결제할 때 사용할 수 있어요.'
    if (quoteSale({ ...sale, benefits }).total <= 0)
      return 'Free Extra는 카드로 결제할 금액이 있을 때 사용할 수 있어요.'
  }

  return null
}
