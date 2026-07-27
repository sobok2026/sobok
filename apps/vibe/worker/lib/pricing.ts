import { DEEP_TYPE_REPORT_ITEM, DEEP_TYPE_REPORT_OFFER } from '@deep-type/offer'

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
// NOTE: orderName must never contain "MBTI" (상표) — it shows on the PortOne 결제창/영수증.
export const SKU_CATALOG: Partial<Record<Sku, SkuDetail>> = {
  report: {
    amount: DEEP_TYPE_REPORT_OFFER.amount,
    currency: DEEP_TYPE_REPORT_OFFER.currency,
    item: DEEP_TYPE_REPORT_ITEM,
    orderNames: {
      ko: '겉속유형 심층 리포트',
      en: 'DeepType in-depth report',
      ja: 'DeepType詳細レポート',
      zh: 'DeepType深度报告',
    },
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
