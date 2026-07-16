import type { Locale } from '@sobok/domain/locale'

export type City = {
  key: string
  /** Localized birthplace display name pinned by the catalog. */
  name: string
  /** Localized country display name pinned by the catalog. */
  country: string
  iso2: string
  /** ISO 3166-2 code used when the locale groups by first-level administration. */
  regionCode?: string
  /** Official six-digit administrative code when the source jurisdiction defines one. */
  administrativeCode?: string
  administrativeLevel?: 'province' | 'prefecture'
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

/** Plain data that can cross the Server Component boundary. */
export type CityCatalogData = {
  locale: Locale
  defaultCityKey: string
  groups: readonly CityGroup[]
}

/** Client-side index built from the one locale catalog serialized by its layout. */
export type CityCatalog = CityCatalogData & {
  cities: readonly City[]
  cityByKey: ReadonlyMap<string, City>
}

export function createCityCatalog(data: CityCatalogData): CityCatalog {
  const cities = data.groups.flatMap((group) => group.cities)
  const cityByKey = new Map(cities.map((city) => [city.key, city]))

  if (cityByKey.size !== cities.length) {
    throw new Error(`Duplicate city key in ${data.locale} catalog`)
  }

  if (!cityByKey.has(data.defaultCityKey)) {
    throw new Error(`Missing default city ${data.defaultCityKey} in ${data.locale} catalog`)
  }

  return { ...data, cities, cityByKey }
}

export function getDefaultCityKey(catalog: CityCatalog): string {
  return catalog.defaultCityKey
}

export function findCity(catalog: CityCatalog, key: string): City {
  const city = catalog.cityByKey.get(key)

  if (!city) {
    throw new Error(`Unknown city key in ${catalog.locale} catalog: ${key}`)
  }

  return city
}
