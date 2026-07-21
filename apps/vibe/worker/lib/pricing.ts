// Server is the SOLE price authority. The client never supplies an amount; checkout looks the SKU up here
// and the grant path verifies the PG-reported amount equals this. Minor units, KRW.
export type Sku = 'report' | 'compat' | 'bundle'

export interface SkuDetail {
  amount: number
  currency: string
  orderName: string
}

// v1 ships the single 정밀 감정서 SKU. 궁합(compat)/번들(bundle) land in a later phase (they need a
// second-result linkage the current one-purchase→one-result schema doesn't model yet).
// NOTE: orderName must never contain "MBTI" (상표) — it shows on the PortOne 결제창/영수증.
export const SKU_CATALOG: Partial<Record<Sku, SkuDetail>> = {
  report: { amount: 5900, currency: 'KRW', orderName: '딥타입 정밀 감정서' },
}

export function resolveSku(sku: string): (SkuDetail & { sku: Sku }) | null {
  const detail = SKU_CATALOG[sku as Sku]
  return detail ? { ...detail, sku: sku as Sku } : null
}
