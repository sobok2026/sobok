// Birth-location presets. Coordinates and IANA time zones come from the
// auto-generated `cities.generated.ts` (sourced offline from GeoNames, see
// scripts/generate-cities.mjs) so they never need hand-maintenance. Display
// names follow an endonym rule baked into the data: Korean/Japanese/Chinese
// cities use their own language (a curated set), every other city uses English.

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

export const DEFAULT_CITY_KEY = 'kr-seoul'

export function findCity(key: string): City {
  return CITIES.find((c) => c.key === key) ?? CITIES.find((c) => c.key === DEFAULT_CITY_KEY) ?? CITIES[0]
}

export type CityGroup = { iso2: string; country: string; cities: City[] }

// The app's primary markets lead the country list; the rest follow alphabetically.
const PRIMARY_ISO2 = ['KR', 'JP', 'CN', 'TW', 'HK']

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
