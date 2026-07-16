import { Locale } from '@sobok/domain/locale'
import { GENERATED_CITIES } from './cities.generated'
import CITY_MARKETS_JSON from './city-markets.json'

export type City = {
  key: string
  /** Localized city display name pinned by the catalog. */
  name: string
  /** Localized country display name pinned by the catalog. */
  country: string
  iso2: string
  /** ISO 3166-2 code used when the locale groups by first-level administration. */
  regionCode?: string
  latitude: number
  longitude: number
  timeZone: string
}

export type CityGroupDefinition = {
  key: string
  label: string
}

export type CityMarketDefinition = {
  countryCodes: readonly string[]
  groupBy: 'country' | 'region'
  groups: readonly CityGroupDefinition[]
}

export type CityGroup = CityGroupDefinition & {
  cities: readonly City[]
}

export const CITIES: readonly City[] = GENERATED_CITIES
const CITY_MARKETS = CITY_MARKETS_JSON as Readonly<Record<Locale, CityMarketDefinition>>

const DEFAULT_CITY_KEYS = {
  [Locale.KO]: 'kr-seoul',
  [Locale.EN]: 'us-new-york',
  [Locale.JA]: 'jp-tokyo',
  [Locale.ZH]: 'cn-beijing',
} as const satisfies Record<Locale, string>

const FALLBACK_CITY_KEY = DEFAULT_CITY_KEYS[Locale.KO]
const CITY_BY_KEY = new Map(CITIES.map((city) => [city.key, city]))

function buildCityGroups(locale: Locale): readonly CityGroup[] {
  const market = CITY_MARKETS[locale]
  const groups = market.groups.map((group) => ({ ...group, cities: [] as City[] }))
  const groupByKey = new Map(groups.map((group) => [group.key, group]))

  for (const city of CITIES) {
    if (!market.countryCodes.includes(city.iso2)) {
      continue
    }

    const groupKey = market.groupBy === 'country' ? city.iso2 : city.regionCode
    const group = groupKey ? groupByKey.get(groupKey) : undefined

    if (!group) {
      throw new Error(`City ${city.key} has no configured ${locale} group`)
    }

    group.cities.push(city)
  }

  return groups.filter((group) => group.cities.length > 0)
}

const CITY_GROUPS_BY_LOCALE = {
  [Locale.KO]: buildCityGroups(Locale.KO),
  [Locale.EN]: buildCityGroups(Locale.EN),
  [Locale.JA]: buildCityGroups(Locale.JA),
  [Locale.ZH]: buildCityGroups(Locale.ZH),
} satisfies Record<Locale, readonly CityGroup[]>

export function getDefaultCityKey(locale: Locale): string {
  return DEFAULT_CITY_KEYS[locale]
}

export function findCity(key: string): City {
  const city = CITY_BY_KEY.get(key) ?? CITY_BY_KEY.get(FALLBACK_CITY_KEY) ?? CITIES[0]

  if (!city) {
    throw new Error('City catalog is empty')
  }

  return city
}

/** Full, uncapped picker groups for one locale, in their configured display order. */
export function getCityGroups(locale: Locale): readonly CityGroup[] {
  return CITY_GROUPS_BY_LOCALE[locale]
}
