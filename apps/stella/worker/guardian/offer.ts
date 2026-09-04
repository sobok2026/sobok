/**
 * The paid offer as the buyer-facing surfaces need to state it: the landing page, the terms, the refund
 * policy, the checkout summary and the GA4 item. One projection so those five cannot disagree.
 *
 * This module is imported by the browser, so it deliberately owns only public offer constants. The server
 * manifest imports these same values for checkout instead of making this module import the private card
 * catalog; that keeps prices aligned without pulling card copy, draw weights or asset keys into client chunks.
 */

/** The market the guardian report is sold in. One, for now, and every price below is quoted in it. */
export const GUARDIAN_MARKET = 'KR' as const
export const GUARDIAN_CURRENCY = 'KRW' as const

/**
 * Sale price in minor units. KRW has no subunit, so 3900 is ₩3,900 — the same integer the PortOne SDK is
 * handed and the server verifies against.
 */
export const GUARDIAN_REPORT_PRICE = 3_900

/**
 * The one name the report is sold under. 전자상거래법 §13(2)(2) makes '재화등의 명칭' a pre-contract disclosure,
 * so the terms, the landing page, the PortOne 결제창 and the card statement all have to say this.
 */
export const GUARDIAN_REPORT_NAME = { ko: '별자리 수호령 전체 리포트' } as const

export const GUARDIAN_REPORT_SKU = 'guardian-report-full-v1' as const

/**
 * GA4 `items[]` for the paid report. Lives here so `view_item`, `begin_checkout` and `purchase` describe one
 * product — a drifting item_id silently splits the item report in two and makes ROAS unreadable. GA4 wants
 * major units; KRW's exponent is 0, so the minor-unit integer is already the major-unit one.
 */
export const GUARDIAN_REPORT_ITEM = {
  item_id: GUARDIAN_REPORT_SKU,
  item_name: 'Guardian full report',
  item_category: 'astrology_reading',
  price: GUARDIAN_REPORT_PRICE,
  quantity: 1,
} as const

/**
 * What the free run hands over before any payment, in the order the free result screen shows it.
 *
 * This is the only thing supporting the 시용 상품 제공 limb of 전자상거래법 §17(6): the withdrawal limitation the
 * refund policy claims holds *because* a buyer can judge the product for free first. So the refund policy
 * names these three and the free result screen lists these three, from here — if the free run ever stops
 * handing over one of them, the limitation falls away with it and both surfaces have to change together.
 */
export const GUARDIAN_FREE_DELIVERABLES_KO = [
  '두 답으로 읽은 지금의 마음',
  '출생 차트의 주요 별자리와 원소 단서',
  '오늘의 행동과 성찰 질문',
] as const
