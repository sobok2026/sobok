import type { Locale } from '@sobok/domain/locale'

export type BirthplaceCoordinateKind = 'locality' | 'administrativeSeat'

/** The self-contained, reproducible location snapshot persisted with a birth profile. */
export type BirthplaceSnapshot = {
  id: string
  name: string
  countryCode: string
  latitude: number
  longitude: number
  timeZone: string
  coordinateKind: BirthplaceCoordinateKind
}

/** Search-only metadata loaded when the birthplace combobox is first opened. */
export type Birthplace = BirthplaceSnapshot & {
  groupId: string
  contextName: string
  population: number
  popularRank: number | null
  searchNames: readonly string[]
}

export type BirthplaceGroup = {
  id: string
  label: string
  countryCode: string
}

export type BirthplaceResultGroup = BirthplaceGroup & {
  places: readonly Birthplace[]
}

export type BirthplaceCatalog = {
  locale: Locale
  groups: readonly BirthplaceGroup[]
  places: readonly Birthplace[]
}

export type GeneratedBirthplaceGroupRow = readonly [id: string, label: string, countryCode: string]

export type GeneratedBirthplaceRow = readonly [
  id: string,
  name: string,
  groupIndex: number,
  latitude: number,
  longitude: number,
  timeZone: string,
  coordinateKind: 0 | 1,
  population: number,
  popularRank: number,
  contextName: string,
  ...searchNames: string[],
]

/** Hydrates compact generated tuples only after a locale catalog is requested. */
export function createBirthplaceCatalog(
  locale: Locale,
  groupRows: readonly GeneratedBirthplaceGroupRow[],
  rows: readonly GeneratedBirthplaceRow[],
): BirthplaceCatalog {
  const groups = groupRows.map(([id, label, countryCode]) => ({ id, label, countryCode }))
  const places = rows.map(
    ([
      id,
      name,
      groupIndex,
      latitude,
      longitude,
      timeZone,
      kind,
      population,
      popularRank,
      contextName,
      ...searchNames
    ]) => {
      const group = groups[groupIndex]

      if (!group) {
        throw new Error(`Unknown birthplace group index ${groupIndex} in ${locale}`)
      }

      return {
        id,
        name,
        countryCode: group.countryCode,
        groupId: group.id,
        latitude,
        longitude,
        timeZone,
        coordinateKind: kind === 0 ? ('locality' as const) : ('administrativeSeat' as const),
        population,
        popularRank: popularRank >= 0 ? popularRank : null,
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
    coordinateKind: place.coordinateKind,
  }
}
