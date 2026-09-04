/**
 * Public offer facts shared by the checkout UI and the authoritative Worker checkout. Keep this module free
 * of private catalog data so importing a price into a client component never ships the card catalog.
 */
export const GUARDIAN_MARKET = 'KR' as const
export const GUARDIAN_CURRENCY = 'KRW' as const

export const GUARDIAN_PASS_DURATION_DAYS = 7
export const GUARDIAN_PASS_DURATION_HOURS = GUARDIAN_PASS_DURATION_DAYS * 24
export const GUARDIAN_PASS_DURATION_MS = GUARDIAN_PASS_DURATION_HOURS * 60 * 60 * 1000
export const GUARDIAN_PASS_PRICE = 1_900
export const GUARDIAN_PASS_NAME = { ko: '수호령 내일 선공개 7일권' } as const
export const GUARDIAN_PASS_TERMS_VERSION = '3.0' as const
export const GUARDIAN_PASS_PRIVACY_VERSION = '3.0' as const
export const GUARDIAN_PASS_REFUND_VERSION = '2.0' as const

// Product identifiers are immutable analytics and payment contracts and must never be repurposed.
export const GUARDIAN_PASS_SKU = 'guardian-tomorrow-pass-7d-v1' as const

export const GUARDIAN_PASS_ITEM = {
  item_id: GUARDIAN_PASS_SKU,
  item_name: 'Guardian tomorrow pass (7 days)',
  item_category: 'astrology_reading',
  price: GUARDIAN_PASS_PRICE,
  quantity: 1,
} as const
