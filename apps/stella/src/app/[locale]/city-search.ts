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

function matchesQuery(city: City, query: string): boolean {
  if (isChoseongQuery(query)) {
    return matchesChoseong(city.name, query)
  }

  return city.name.includes(query) || city.country.includes(query) || romanizedKey(city).includes(query.toLowerCase())
}

/**
 * Cities matching `query`, in picker order. An empty query returns the full list
 * so the combobox doubles as a browsable dropdown. Capped so a broad query can't
 * render the entire list into the menu.
 */
export function searchCities(query: string, limit = 60): City[] {
  const q = query.trim()

  if (!q) {
    return [...CITIES_IN_DISPLAY_ORDER]
  }

  const matches: City[] = []

  for (const city of CITIES_IN_DISPLAY_ORDER) {
    if (matchesQuery(city, q)) {
      matches.push(city)

      if (matches.length >= limit) {
        break
      }
    }
  }

  return matches
}
