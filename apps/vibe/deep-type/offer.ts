import type { Locale } from '@sobok/domain/locale'

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
} as const satisfies Record<Locale, string>

/**
 * Every currency this product is ever priced in. Three and not four on purpose: PayPal is the overseas rail
 * and it does not take KRW, so the non-Korean locales price in what their buyers' PayPal can settle — and CNY
 * is off the table because PayPal supports it for China-registered accounts only, which a Korean merchant
 * account is not. `zh` therefore rides USD.
 */
export type OfferCurrency = 'KRW' | 'USD' | 'JPY'

/**
 * ISO 4217 minor-unit exponents. Every amount in this codebase — this table, the DB, `/checkout`, the PortOne
 * SDK's `totalAmount` — is an integer in minor units: KRW and JPY have no subunit (5900 = ₩5,900) and USD is
 * cents (498 = $4.98). PortOne pins the same convention, so an amount crosses the wire unchanged; only
 * display and GA4 divide, via `majorUnits`.
 */
export const CURRENCY_EXPONENT = { KRW: 0, JPY: 0, USD: 2 } as const satisfies Record<OfferCurrency, number>

export function majorUnits(currency: OfferCurrency, amount: number): number {
  return amount / 10 ** CURRENCY_EXPONENT[currency]
}

export function isOfferCurrency(value: string): value is OfferCurrency {
  return value in CURRENCY_EXPONENT
}

/**
 * One price point per currency, not per locale: `en` and `zh` both sell in USD and MUST charge the same
 * number, so the locale table below references this one and cannot disagree with itself. Minor units.
 */
const REPORT_PRICE = {
  KRW: { amount: 5900, listAmount: 9900 },
  USD: { amount: 498, listAmount: 798 },
  JPY: { amount: 698, listAmount: 1180 },
} as const satisfies Record<OfferCurrency, { amount: number; listAmount: number }>

const REPORT_CURRENCY = {
  ko: 'KRW',
  en: 'USD',
  ja: 'JPY',
  zh: 'USD',
} as const satisfies Record<Locale, OfferCurrency>

export type ReportOffer = {
  /** Sale price, minor units. What `/checkout` charges and the PG verifies. */
  amount: number
  currency: OfferCurrency
  /** Derived, never declared: a stated percent can drift from the two prices it claims to relate. */
  discountPercent: number
  /** Struck-through list price, minor units. 표시광고법 territory — one consistent 정가 per currency. */
  listAmount: number
}

// Computed rather than written out so a price edit in REPORT_PRICE is one line and the percent follows.
export const DEEP_TYPE_REPORT_OFFER = Object.fromEntries(
  Object.entries(REPORT_CURRENCY).map(([locale, currency]) => {
    const { amount, listAmount } = REPORT_PRICE[currency]
    return [locale, { amount, currency, discountPercent: Math.round((1 - amount / listAmount) * 100), listAmount }]
  }),
) as Record<Locale, ReportOffer>

/**
 * The GA4 `items[]` entry for the paid report. Lives beside the price because the browser funnel
 * (view_item/begin_checkout) and the Worker's server-side `purchase` (Measurement Protocol) MUST describe the
 * same product — a mismatch in item_id or item_name silently splits the item report in two.
 *
 * A function of currency because GA4 wants `price`/`discount` in the event's currency and in MAJOR units —
 * the one place minor units may not travel. `item_id`/`item_name` stay fixed across currencies so the item
 * report remains one row.
 */
export function reportItemFor(currency: OfferCurrency) {
  const { amount, listAmount } = REPORT_PRICE[currency]
  return {
    discount: majorUnits(currency, listAmount - amount),
    item_category: 'self_exploration',
    item_id: 'deep_type_report',
    item_name: 'DeepType in-depth report',
    price: majorUnits(currency, amount),
    quantity: 1,
  }
}
