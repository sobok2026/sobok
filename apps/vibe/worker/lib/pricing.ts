import { DEEP_TYPE_REPORT_ITEM, DEEP_TYPE_REPORT_OFFER, PRODUCT_NAME } from '@deep-type/offer'

import type { GA4Item } from './ga4'

// Server is the SOLE price authority. The client never supplies an amount; checkout looks the SKU up here
// and the grant path verifies the PG-reported amount equals this. Minor units, KRW.
export type Sku = 'report' | 'compat' | 'bundle'
type Locale = 'ko' | 'en' | 'ja' | 'zh'

export interface SkuDetail {
  amount: number
  currency: string
  item: GA4Item
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
    amount: DEEP_TYPE_REPORT_OFFER.amount,
    currency: DEEP_TYPE_REPORT_OFFER.currency,
    item: DEEP_TYPE_REPORT_ITEM,
    orderNames: PRODUCT_NAME,
  },
}

export function resolveSku(
  sku: string,
  locale: Locale,
): (Omit<SkuDetail, 'item' | 'orderNames'> & { orderName: string; sku: Sku }) | null {
  const detail = SKU_CATALOG[sku as Sku]

  if (!detail) {
    return null
  }

  return {
    amount: detail.amount,
    currency: detail.currency,
    orderName: detail.orderNames[locale],
    sku: sku as Sku,
  }
}

export function skuItem(sku: Sku): GA4Item | null {
  return SKU_CATALOG[sku]?.item ?? null
}
