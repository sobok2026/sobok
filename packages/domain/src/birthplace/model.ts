import type { Locale } from '../locale'

export type BirthplaceCoordinatePrecision = 'locality' | 'administrativeSeat' | 'administrativeArea'

/** The self-contained, reproducible location snapshot persisted with a birth profile. */
export type BirthplaceSnapshot = {
  id: string
  name: string
  countryCode: string
  latitude: number
  longitude: number
  timeZone: string
  coordinatePrecision: BirthplaceCoordinatePrecision
}

/** Search-only metadata loaded when the birthplace combobox is first opened. */
export type Birthplace = BirthplaceSnapshot & {
  groupId: string
  contextName: string
  population: number
  suggestionRank: number | null
  searchNames: readonly string[]
}

export type BirthplaceGroup = {
  id: string
  label: string
  countryCode: string
  countryName: string
}

export type BirthplaceResultGroup = BirthplaceGroup & {
  places: readonly Birthplace[]
}

export type BirthplaceCatalog = {
  locale: Locale
  groups: readonly BirthplaceGroup[]
  places: readonly Birthplace[]
}

export type GeneratedBirthplaceGroupRow = readonly [id: string, label: string, countryCode: string, countryName: string]

export type GeneratedBirthplaceRow = readonly [
  id: string,
  name: string,
  groupIndex: number,
  latitude: number,
  longitude: number,
  timeZone: string,
  coordinatePrecision: 0 | 1 | 2,
  population: number,
  suggestionRank: number,
  contextName: string,
  ...searchNames: string[],
]

/** Hydrates compact generated tuples only after a locale catalog is requested. */
export function createBirthplaceCatalog(
  locale: Locale,
  groupRows: readonly GeneratedBirthplaceGroupRow[],
  rows: readonly GeneratedBirthplaceRow[],
): BirthplaceCatalog {
  const groups = groupRows.map(([id, label, countryCode, countryName]) => ({ id, label, countryCode, countryName }))

  const places = rows.map(
    ([
      id,
      name,
      groupIndex,
      latitude,
      longitude,
      timeZone,
      precision,
      population,
      suggestionRank,
      contextName,
      ...searchNames
    ]) => {
      const group = groups[groupIndex]

      if (!group) {
        throw new Error(`Unknown birthplace group index ${groupIndex} in ${locale}`)
      }

      const coordinatePrecision = ['locality', 'administrativeSeat', 'administrativeArea'][precision] as
        | BirthplaceCoordinatePrecision
        | undefined

      if (!coordinatePrecision) {
        throw new Error(`Unknown birthplace coordinate precision ${precision} in ${locale}`)
      }

      return {
        id,
        name,
        countryCode: group.countryCode,
        groupId: group.id,
        latitude,
        longitude,
        timeZone,
        coordinatePrecision,
        population,
        suggestionRank: suggestionRank >= 0 ? suggestionRank : null,
        contextName,
        searchNames,
      }
    },
  )

  return { locale, groups, places }
}

export function snapshotBirthplace(place: BirthplaceSnapshot): BirthplaceSnapshot {
  return {
    id: place.id,
    name: place.name,
    countryCode: place.countryCode,
    latitude: place.latitude,
    longitude: place.longitude,
    timeZone: place.timeZone,
    coordinatePrecision: place.coordinatePrecision,
  }
}
