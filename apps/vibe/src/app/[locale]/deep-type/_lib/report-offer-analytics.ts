import { DEEP_TYPE_REPORT_OFFER } from '@deep-type/offer'

export const REPORT_OFFER_ITEMS = [
  {
    discount: DEEP_TYPE_REPORT_OFFER.discountAmount,
    item_category: 'self_exploration',
    item_id: 'deep_type_report',
    item_name: 'DeepType in-depth report',
    price: DEEP_TYPE_REPORT_OFFER.amount,
    quantity: 1,
  },
] as const

export const REPORT_PROMOTION = {
  promotion_id: 'deep_type_report_40_off',
  promotion_name: 'DeepType report 40% off',
} as const
