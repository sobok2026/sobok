import type { Locale } from '@sobok/domain/locale'
import MARKET_JSON from './birthplace-markets.json'

type MarketPolicy = {
  countries: Readonly<Record<string, string>>
}

const MARKETS = MARKET_JSON as Readonly<Record<Locale, MarketPolicy>>

export function isBirthplaceCountryAllowed(locale: Locale, countryCode: string): boolean {
  return Object.hasOwn(MARKETS[locale].countries, countryCode)
}
