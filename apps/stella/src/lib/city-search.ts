import { CITIES_IN_DISPLAY_ORDER, type City } from './cities'

// The 19 Hangul lead consonants (초성) in Unicode order. String literals here are
// compatibility jamo (U+3131–), which is exactly what a Korean keyboard emits for
// a standalone consonant — so query chars and extracted leads compare directly.
const HANGUL_LEADS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const HANGUL_SYLLABLE_BASE = 0xac00
const HANGUL_SYLLABLE_LAST = 0xd7a3

// Each syllable block spans 21 vowels × 28 tails, so the lead index is offset / 588.
const HANGUL_LEAD_BLOCK = 21 * 28

/** The lead consonant of a Korean syllable (or a standalone consonant), else null. */
function leadConsonant(char: string): string | null {
  const code = char.charCodeAt(0)

  if (code >= HANGUL_SYLLABLE_BASE && code <= HANGUL_SYLLABLE_LAST) {
    return HANGUL_LEADS[Math.floor((code - HANGUL_SYLLABLE_BASE) / HANGUL_LEAD_BLOCK)]
  }

  return HANGUL_LEADS.includes(char) ? char : null
}

/** True when the query is nothing but lead consonants (e.g. "ㅅㅇ"), i.e. a 초성 search. */
function isChoseongQuery(query: string): boolean {
  return query.length > 0 && [...query].every((char) => HANGUL_LEADS.includes(char))
}

/** "ㅅㅇ" matches "서울" — each query consonant equals the corresponding syllable's lead. */
function matchesChoseong(name: string, query: string): boolean {
  const chars = [...name]

  if (query.length > chars.length) {
    return false
  }

  for (let i = 0; i < query.length; i++) {
    if (leadConsonant(chars[i]) !== query[i]) {
      return false
    }
  }

  return true
}

/** The romanized part of a city key: `kr-seoul` → `seoul`, `us-new-york` → `new-york`. */
function romanizedKey(city: City): string {
  return city.key.slice(city.iso2.length + 1)
}

/** Case-, accent-, width-, and separator-insensitive text used by every search field. */
function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

type SearchableCity = {
  city: City
  name: string
  country: string
  romanizedKey: string
}

const SEARCHABLE_CITIES: readonly SearchableCity[] = CITIES_IN_DISPLAY_ORDER.map((city) => ({
  city,
  name: normalizeSearchText(city.name),
  country: normalizeSearchText(city.country),
  romanizedKey: normalizeSearchText(romanizedKey(city)),
}))

function matchesQuery(entry: SearchableCity, rawQuery: string, normalizedQuery: string): boolean {
  if (isChoseongQuery(rawQuery)) {
    return matchesChoseong(entry.city.name, rawQuery)
  }

  return (
    entry.name.includes(normalizedQuery) ||
    entry.country.includes(normalizedQuery) ||
    entry.romanizedKey.includes(normalizedQuery)
  )
}

/**
 * Cities matching a non-empty query across the full catalog, in picker order.
 * Results are capped so a broad query cannot render the entire catalog.
 */
export function searchCities(query: string, limit = 60): City[] {
  const rawQuery = query.trim()
  const normalizedQuery = normalizeSearchText(rawQuery)

  if (!normalizedQuery) {
    return []
  }

  const matches: City[] = []

  for (const entry of SEARCHABLE_CITIES) {
    if (matchesQuery(entry, rawQuery, normalizedQuery)) {
      matches.push(entry.city)

      if (matches.length >= limit) {
        break
      }
    }
  }

  return matches
}
