import type { Locale } from '@sobok/domain/locale'

export function formatKrw(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(locale, {
    currency: 'KRW',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount)
}
