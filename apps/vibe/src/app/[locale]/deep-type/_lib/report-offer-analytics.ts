import { DEEP_TYPE_REPORT_ITEM, DEEP_TYPE_REPORT_OFFER } from '@deep-type/offer'

// GA4 ecommerce payloads for the paid report. These are pushed under the `ecommerce` key (see
// `trackEcommerce`), which is the ONLY shape the GA4 tag's "Send Ecommerce data → Data Layer" option reads.
export const REPORT_OFFER_ECOMMERCE = {
  currency: DEEP_TYPE_REPORT_OFFER.currency,
  items: [DEEP_TYPE_REPORT_ITEM],
  value: DEEP_TYPE_REPORT_OFFER.amount,
} as const

export const REPORT_PROMOTION_ECOMMERCE = {
  creative_slot: 'free_result_offer',
  items: [DEEP_TYPE_REPORT_ITEM],
  promotion_id: 'deep_type_report_40_off',
  promotion_name: 'DeepType report 40% off',
} as const
