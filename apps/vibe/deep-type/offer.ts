/**
 * The one name the paid product is sold under, in every locale.
 *
 * 전자상거래법 제13조 제2항 제2호 makes the '재화등의 명칭' a pre-contract disclosure, so the terms, the PortOne
 * 결제창 and the buyer's card statement have to agree. Before this constant they did not: one SKU carried seven
 * distinct strings across four locales, and the name printed on the receipt was not the name the contract used.
 *
 * '심층' rather than '정밀'. The paid pass never re-decides the eight letters — it narrows the clarity bands and
 * widens what the report covers — so a name promising measurement precision would describe something the product
 * does not do, and would need a disclaimer in the terms to survive 표시·광고의 공정화에 관한 법률 제3조 제1항 제1호.
 * A name that means scope needs no such repair. The three non-ko values are what PortOne has always printed, so
 * settling here changes no receipt and no GA4 item history.
 *
 * Typed structurally rather than against `Locale`: this module is compiled into the Worker, whose tsconfig maps
 * only `@deep-type/*` and `~/*`, so `@sobok/domain/locale` does not resolve there.
 */
export const PRODUCT_NAME = {
  ko: '겉속유형 심층 리포트',
  en: 'DeepType in-depth report',
  ja: 'DeepType詳細レポート',
  zh: 'DeepType深度报告',
} as const satisfies Record<'ko' | 'en' | 'ja' | 'zh', string>

export const DEEP_TYPE_REPORT_OFFER = {
  amount: 5900,
  currency: 'KRW',
  discountAmount: 4000,
  discountPercent: 40,
  listAmount: 9900,
  sku: 'report',
} as const

// The GA4 `items[]` entry for the paid report. Lives beside the price because the browser funnel
// (view_item/begin_checkout) and the Worker's server-side `purchase` (Measurement Protocol) MUST describe the
// same product — a mismatch in item_id or item_name silently splits the item report in two.
export const DEEP_TYPE_REPORT_ITEM = {
  discount: DEEP_TYPE_REPORT_OFFER.discountAmount,
  item_category: 'self_exploration',
  item_id: 'deep_type_report',
  item_name: 'DeepType in-depth report',
  price: DEEP_TYPE_REPORT_OFFER.amount,
  quantity: 1,
} as const
