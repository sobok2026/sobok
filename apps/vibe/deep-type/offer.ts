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
