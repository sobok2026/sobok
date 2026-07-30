import { DEEP_TYPE_REPORT_OFFER, majorUnits, reportItemFor } from '@deep-type/offer'
import type { Locale } from '@sobok/domain/locale'

// GA4 ecommerce payloads for the paid report. These are pushed under the `ecommerce` key (see
// `trackEcommerce`), which is the ONLY shape the GA4 tag's "Send Ecommerce data → Data Layer" option reads.
//
// Functions of locale since the price went multi-currency: the funnel events must carry the same currency and
// major-unit value the Worker's server-side `purchase` will close the funnel with, or GA4 splits the revenue
// stream by currency mid-funnel.
export function reportOfferEcommerce(locale: Locale) {
  const offer = DEEP_TYPE_REPORT_OFFER[locale]

  return {
    currency: offer.currency,
    items: [reportItemFor(offer.currency)],
    value: majorUnits(offer.currency, offer.amount),
  }
}

// The id names the offer, not a percent — the discount rounds differently per currency (KRW 40% · USD 38% ·
// JPY 41%), and a promotion that renames itself per locale is three promotions in every GA4 report.
export function reportPromotionEcommerce(locale: Locale) {
  const offer = DEEP_TYPE_REPORT_OFFER[locale]

  return {
    creative_slot: 'free_result_offer',
    items: [reportItemFor(offer.currency)],
    promotion_id: 'deep_type_report_intro',
    promotion_name: 'DeepType report intro offer',
  }
}
