import type { BirthplaceSnapshot } from './model'

// A saved or shared birth profile is user data: it must survive UI-language
// switches, so snapshots are validated against the union of every market's
// catalog rules — never the current locale. Each pattern pins the id shape its
// source catalog emits; countries outside every market fail closed.
const BIRTHPLACE_ID_PATTERNS: Readonly<Record<string, RegExp>> = {
  AU: /^geonames:\d+$/,
  CA: /^geonames:\d+$/,
  CN: /^CN:\d{12}$/,
  GB: /^geonames:\d+$/,
  HK: /^HK:810000000000$/,
  JP: /^JP:\d{5}$/,
  KR: /^KR:\d{10}$/,
  MO: /^MO:820000000000$/,
  NZ: /^geonames:\d+$/,
  US: /^geonames:\d+$/,
}

export function isBirthplaceSnapshot(value: unknown): value is BirthplaceSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const place = value as Record<string, unknown>

  if (
    typeof place.id !== 'string' ||
    typeof place.countryCode !== 'string' ||
    !BIRTHPLACE_ID_PATTERNS[place.countryCode]?.test(place.id) ||
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
