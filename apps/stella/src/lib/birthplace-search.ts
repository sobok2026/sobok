import type { Birthplace, BirthplaceCatalog, BirthplaceResultGroup } from './birthplaces'

const HANGUL_LEADS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const HANGUL_SYLLABLE_BASE = 0xac00
const HANGUL_SYLLABLE_LAST = 0xd7a3
const HANGUL_LEAD_BLOCK = 21 * 28
const DEFAULT_RESULT_LIMIT = 50

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

function leadConsonant(char: string): string | null {
  const code = char.charCodeAt(0)

  if (code >= HANGUL_SYLLABLE_BASE && code <= HANGUL_SYLLABLE_LAST) {
    return HANGUL_LEADS[Math.floor((code - HANGUL_SYLLABLE_BASE) / HANGUL_LEAD_BLOCK)]
  }

  return HANGUL_LEADS.includes(char) ? char : null
}

function isChoseongQuery(query: string): boolean {
  return query.length > 0 && [...query].every((character) => HANGUL_LEADS.includes(character))
}

function matchesChoseong(value: string, query: string): boolean {
  const characters = [...value]

  if (query.length > characters.length) {
    return false
  }

  return [...query].every((character, index) => leadConsonant(characters[index]) === character)
}

type SearchEntry = {
  place: Birthplace
  name: string
  aliases: readonly string[]
  context: string
  group: string
}

const INDEX_CACHE = new WeakMap<BirthplaceCatalog, readonly SearchEntry[]>()

function getIndex(catalog: BirthplaceCatalog): readonly SearchEntry[] {
  const cached = INDEX_CACHE.get(catalog)

  if (cached) {
    return cached
  }

  const groupLabelById = new Map(catalog.groups.map((group) => [group.id, group.label]))
  const index = catalog.places.map((place) => ({
    place,
    name: normalize(place.name),
    aliases: place.searchNames.map(normalize),
    context: normalize(place.contextName),
    group: normalize(groupLabelById.get(place.groupId) ?? ''),
  }))

  INDEX_CACHE.set(catalog, index)
  return index
}

function matchScore(entry: SearchEntry, rawQuery: string, query: string): number | null {
  if (isChoseongQuery(rawQuery)) {
    if (matchesChoseong(entry.place.name, rawQuery)) {
      return 0
    }

    return matchesChoseong(entry.place.contextName, rawQuery) ? 1 : null
  }

  if (entry.name === query) {
    return 0
  }

  if (entry.name.startsWith(query)) {
    return 1
  }

  if (entry.aliases.some((alias) => alias.startsWith(query))) {
    return 2
  }

  if (entry.name.includes(query) || entry.aliases.some((alias) => alias.includes(query))) {
    return 3
  }

  return entry.context.includes(query) || entry.group.includes(query) ? 4 : null
}

function groupResults(catalog: BirthplaceCatalog, places: readonly Birthplace[]): readonly BirthplaceResultGroup[] {
  const placesByGroup = new Map<string, Birthplace[]>()

  for (const place of places) {
    const groupPlaces = placesByGroup.get(place.groupId) ?? []
    groupPlaces.push(place)
    placesByGroup.set(place.groupId, groupPlaces)
  }

  return catalog.groups.flatMap((group) => {
    const groupPlaces = placesByGroup.get(group.id)
    return groupPlaces ? [{ ...group, places: groupPlaces }] : []
  })
}

/** Empty input shows a short curated list; typed searches are globally ranked and capped. */
export function getBirthplaceGroups(
  catalog: BirthplaceCatalog,
  query: string,
  limit = DEFAULT_RESULT_LIMIT,
): readonly BirthplaceResultGroup[] {
  const rawQuery = query.trim()
  const normalizedQuery = normalize(rawQuery)

  if (!normalizedQuery) {
    const popular = catalog.places
      .filter((place) => place.popularRank !== null)
      .sort((a, b) => (a.popularRank ?? 0) - (b.popularRank ?? 0))
    return groupResults(catalog, popular)
  }

  const matches = getIndex(catalog)
    .flatMap((entry) => {
      const score = matchScore(entry, rawQuery, normalizedQuery)
      return score === null ? [] : [{ place: entry.place, score }]
    })
    .sort(
      (a, b) =>
        a.score - b.score || b.place.population - a.place.population || a.place.name.localeCompare(b.place.name),
    )
    .slice(0, limit)
    .map(({ place }) => place)

  return groupResults(catalog, matches)
}
