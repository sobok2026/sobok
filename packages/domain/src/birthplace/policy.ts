import ID_PATTERN_JSON from './id-patterns.json'
import type { BirthplaceSnapshot } from './model'

// A saved or shared birth profile is user data: it must survive UI-language
// switches, so snapshots are validated against id-patterns.json — the union of
// id shapes across every market ever shipped — never the current locale. The
// catalog generator asserts that same file covers markets.json and matches
// every generated id, so the two cannot drift. Entries must never be removed:
// profiles saved under a retired market would silently vanish.
const BIRTHPLACE_ID_PATTERNS = new Map(
  Object.entries(ID_PATTERN_JSON).map(([countryCode, source]) => [countryCode, new RegExp(source)]),
)

export function isBirthplaceSnapshot(value: unknown): value is BirthplaceSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const place = value as Record<string, unknown>

  if (
    typeof place.id !== 'string' ||
    typeof place.countryCode !== 'string' ||
    !BIRTHPLACE_ID_PATTERNS.get(place.countryCode)?.test(place.id) ||
    typeof place.name !== 'string' ||
    place.name.length === 0 ||
    place.name.length > 120 ||
    typeof place.latitude !== 'number' ||
    !Number.isFinite(place.latitude) ||
    place.latitude < -90 ||
    place.latitude > 90 ||
    typeof place.longitude !== 'number' ||
    !Number.isFinite(place.longitude) ||
    place.longitude < -180 ||
    place.longitude > 180 ||
    typeof place.timeZone !== 'string' ||
    place.timeZone.length === 0 ||
    place.timeZone.length > 64 ||
    (place.coordinatePrecision !== 'locality' &&
      place.coordinatePrecision !== 'administrativeSeat' &&
      place.coordinatePrecision !== 'administrativeArea')
  ) {
    return false
  }

  try {
    new Intl.DateTimeFormat('en', { timeZone: place.timeZone }).format()
    return true
  } catch {
    return false
  }
}
