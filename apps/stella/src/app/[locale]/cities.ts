import { Locale } from '@sobok/domain/locale'

import { GENERATED_CITIES } from './cities.generated'

export type City = {
  key: string
  /** English display name — used when there is no localized override in messages. */
  name: string
  /** English country name — the <optgroup> label. */
  country: string
  iso2: string
  latitude: number
  longitude: number
  timeZone: string
}

export const CITIES: readonly City[] = GENERATED_CITIES

const DEFAULT_CITY_KEYS = {
  [Locale.KO]: 'kr-seoul',
  [Locale.EN]: 'us-new-york',
  [Locale.JA]: 'jp-tokyo',
  [Locale.ZH]: 'cn-beijing',
} as const satisfies Record<Locale, string>

const INITIAL_CITY_ISO2 = {
  [Locale.KO]: ['KR'],
  [Locale.EN]: ['US', 'GB', 'CA', 'AU', 'NZ'],
  [Locale.JA]: ['JP'],
  [Locale.ZH]: ['CN'],
} as const satisfies Record<Locale, readonly string[]>

const FALLBACK_CITY_KEY = DEFAULT_CITY_KEYS[Locale.KO]

export function getDefaultCityKey(locale: Locale): string {
  return DEFAULT_CITY_KEYS[locale]
}

export function findCity(key: string): City {
  return CITIES.find((c) => c.key === key) ?? CITIES.find((c) => c.key === FALLBACK_CITY_KEY) ?? CITIES[0]
}

export type CityGroup = {
  iso2: string
  country: string
  cities: City[]
}

// The app's primary markets lead the country list; the rest follow alphabetically.
const PRIMARY_ISO2 = ['KR', 'CN', 'HK', 'JP', 'TW']

/** Cities grouped by country for the <optgroup> picker (generated order preserved within each group). */
export const CITY_GROUPS: readonly CityGroup[] = (() => {
  const groups = new Map<string, City[]>()

  for (const city of CITIES) {
    const group = groups.get(city.iso2)

    if (group) {
      group.push(city)
    } else {
      groups.set(city.iso2, [city])
    }
  }

  const rank = (iso2: string) => {
    const i = PRIMARY_ISO2.indexOf(iso2)
    return i === -1 ? PRIMARY_ISO2.length : i
  }

  return [...groups.entries()]
    .map(([iso2, cities]) => ({ iso2, country: cities[0].country, cities }))
    .sort((a, b) => rank(a.iso2) - rank(b.iso2) || a.country.localeCompare(b.country))
})()

const CITY_GROUP_BY_ISO2 = new Map(CITY_GROUPS.map((group) => [group.iso2, group]))

/** The curated city list shown before the user types, with locale-specific country order. */
export function getInitialCities(locale: Locale): City[] {
  return INITIAL_CITY_ISO2[locale].flatMap((iso2) => CITY_GROUP_BY_ISO2.get(iso2)?.cities ?? [])
}

/** Flat city list in picker order (primary markets first) — the combobox's browse/search source. */
export const CITIES_IN_DISPLAY_ORDER: readonly City[] = CITY_GROUPS.flatMap((group) => group.cities)
