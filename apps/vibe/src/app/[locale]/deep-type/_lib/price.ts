import { majorUnits, type OfferCurrency } from '@deep-type/offer'
import type { Locale } from '@sobok/domain/locale'

// Minor units in, formatted major units out — the one place display division happens, so a screen can never
// print a cent amount as dollars. Fraction digits follow the currency (₩5,900 · $4.98 · ¥698) via Intl's own
// ISO 4217 table.
export function formatPrice(locale: Locale, currency: OfferCurrency, amount: number): string {
  return new Intl.NumberFormat(locale, {
    currency,
    currencyDisplay: 'narrowSymbol',
    style: 'currency',
  }).format(majorUnits(currency, amount))
}
