import { DEEP_TYPE_REPORT_OFFER, type OfferCurrency, PRODUCT_NAME, reportItemFor } from '@deep-type/offer'

import type { GA4Item } from './ga4'

// Server is the SOLE price authority. The client never supplies an amount; checkout looks the SKU up here
// and the grant path verifies the PG-reported amount equals this. Minor units, per-locale currency — `ko`
// charges KRW, the overseas locales charge what their PayPal rail settles (`en`/`zh` USD, `ja` JPY), and the
// numbers live in `@deep-type/offer` so the paywall shows the same price this module charges.
export type Sku = 'report' | 'compat' | 'bundle'
type Locale = 'ko' | 'en' | 'ja' | 'zh'

export interface SkuDetail {
  offers: typeof DEEP_TYPE_REPORT_OFFER
  orderNames: Record<Locale, string>
}

// v1 ships the single 심층 리포트 SKU. 궁합(compat)/번들(bundle) land in a later phase (they need a
// second-result linkage the current one-purchase→one-result schema doesn't model yet).
//
// `orderName` is what PortOne prints on the 결제창 and what the card issuer puts on the statement, so it is the
// name the buyer is most likely to see and the least likely to be able to look up later. It comes from
// `PRODUCT_NAME` for that reason — the terms name the same string, and the MBTI 상표 rule that used to live in a
// comment here is now a test over that constant instead.
export const SKU_CATALOG: Partial<Record<Sku, SkuDetail>> = {
  report: {
    offers: DEEP_TYPE_REPORT_OFFER,
    orderNames: PRODUCT_NAME,
  },
}

export function resolveSku(
  sku: string,
  locale: Locale,
): { amount: number; currency: OfferCurrency; orderName: string; sku: Sku } | null {
  const detail = SKU_CATALOG[sku as Sku]

  if (!detail) {
    return null
  }

  const offer = detail.offers[locale]

  return {
    amount: offer.amount,
    currency: offer.currency,
    orderName: detail.orderNames[locale],
    sku: sku as Sku,
  }
}

// Currency-aware because GA4 wants item price/discount in the event's currency and in major units — the
// stored purchase row is what says which currency this sale was in.
export function skuItem(sku: Sku, currency: OfferCurrency): GA4Item | null {
  if (!SKU_CATALOG[sku]) {
    return null
  }

  return reportItemFor(currency)
}
