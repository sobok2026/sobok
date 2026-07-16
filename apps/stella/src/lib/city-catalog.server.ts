import 'server-only'

import { Locale } from '@sobok/domain/locale'
import type { City, CityCatalogData, CityGroup, CityMarketDefinition } from './cities'
import CITY_MARKETS_JSON from './city-markets.json'

type GeneratedCityModule = {
  GENERATED_CITIES: readonly City[]
}

const CITY_MODULE_LOADERS = {
  [Locale.KO]: () => import('./cities.ko.generated'),
  [Locale.EN]: () => import('./cities.en.generated'),
  [Locale.JA]: () => import('./cities.ja.generated'),
  [Locale.ZH]: () => import('./cities.zh.generated'),
} satisfies Record<Locale, () => Promise<GeneratedCityModule>>

const DEFAULT_CITY_KEYS = {
  [Locale.KO]: 'kr-seoul',
  [Locale.EN]: 'us-new-york',
  [Locale.JA]: 'jp-tokyo',
  [Locale.ZH]: 'cn-1100-beijing',
} as const satisfies Record<Locale, string>

const CITY_MARKETS = CITY_MARKETS_JSON as Readonly<Record<Locale, CityMarketDefinition>>

/**
 * Resolves one locale on the server. Only this plain catalog is serialized into
 * that locale's static layout; generated data for the other locales never
 * crosses the client boundary.
 */
export async function loadCityCatalogData(locale: Locale): Promise<CityCatalogData> {
  const { GENERATED_CITIES } = await CITY_MODULE_LOADERS[locale]()
  const market = CITY_MARKETS[locale]
  const groups = market.groups.map((group) => ({ ...group, cities: [] as City[] }))
  const groupByKey = new Map(groups.map((group) => [group.key, group]))

  for (const city of GENERATED_CITIES) {
    if (!market.countryCodes.includes(city.iso2)) {
      throw new Error(`City ${city.key} is outside the ${locale} market`)
    }

    const groupKey = market.groupBy === 'country' ? city.iso2 : city.regionCode
    const group = groupKey ? groupByKey.get(groupKey) : undefined

    if (!group) {
      throw new Error(`City ${city.key} has no configured ${locale} group`)
    }

    group.cities.push(city)
  }

  const populatedGroups: readonly CityGroup[] = groups.filter((group) => group.cities.length > 0)
  const defaultCityKey = DEFAULT_CITY_KEYS[locale]

  if (!populatedGroups.some((group) => group.cities.some((city) => city.key === defaultCityKey))) {
    throw new Error(`Missing default city ${defaultCityKey} in ${locale} catalog`)
  }

  return { locale, defaultCityKey, groups: populatedGroups }
}
