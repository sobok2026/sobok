// Client-side persistence for the birth form. The data never leaves the browser
// — it exists so the /today and /love pages (and a returning visitor) can reuse
// the birth details without retyping. Two storages back it:
//   • localStorage  — the "save to this browser" checkbox is on: the details
//     persist across visits and tabs on this device.
//   • sessionStorage — the checkbox is off: the details live only for this tab's
//     session, yet are still shared across pages so the visit stays personalized
//     without leaving a lasting trace.
// localStorage wins when both hold a value — an explicit "remember me on this
// device" outranks a transient session copy.

import type { Locale } from '@sobok/domain/locale'
import type { BirthInput } from '@/chart/ephemeris'
import { isBirthplaceCountryAllowed } from './birthplace-policy'
import type { BirthplaceSnapshot } from './birthplaces'

const STORAGE_KEY = 'stella.birth.v3'

export type StoredBirth = {
  date: string // YYYY-MM-DD
  time: string // HH:mm
  timeKnown: boolean
  place: BirthplaceSnapshot
}

/** A loaded birth plus whether it came from persistent (localStorage) storage. */
export type LoadedBirth = {
  birth: StoredBirth
  persistent: boolean
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    year >= 1900 &&
    year <= 2030 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function isClockTime(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false
  }

  const [hour, minute] = value.split(':').map(Number)
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

function isBirthplaceIdAllowed(id: string, countryCode: string): boolean {
  if (['US', 'GB', 'CA', 'AU', 'NZ'].includes(countryCode)) {
    return /^geonames:\d+$/.test(id)
  }

  if (countryCode === 'KR') {
    return /^KR:\d{10}$/.test(id)
  }

  if (countryCode === 'JP') {
    return /^JP:\d{5}$/.test(id)
  }

  if (countryCode === 'CN') {
    return /^CN:\d{12}$/.test(id)
  }

  if (countryCode === 'HK') {
    return id === 'HK:810000000000'
  }

  if (countryCode === 'MO') {
    return id === 'MO:820000000000'
  }

  return false
}

function isBirthplaceSnapshot(value: unknown, locale: Locale): value is BirthplaceSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const place = value as Record<string, unknown>

  if (
    typeof place.id !== 'string' ||
    typeof place.countryCode !== 'string' ||
    !isBirthplaceIdAllowed(place.id, place.countryCode) ||
    typeof place.name !== 'string' ||
    place.name.length === 0 ||
    place.name.length > 120 ||
    !isBirthplaceCountryAllowed(locale, place.countryCode) ||
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

export function isStoredBirth(value: unknown, locale: Locale): value is StoredBirth {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const v = value as Record<string, unknown>

  return (
    typeof v.date === 'string' &&
    isCalendarDate(v.date) &&
    typeof v.time === 'string' &&
    isClockTime(v.time) &&
    typeof v.timeKnown === 'boolean' &&
    isBirthplaceSnapshot(v.place, locale)
  )
}

/** Web Storage can throw (private mode, disabled storage) — treat that as "no data". */
function read(storage: Storage, locale: Locale): StoredBirth | null {
  try {
    const raw = storage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    return isStoredBirth(parsed, locale) ? parsed : null
  } catch {
    return null
  }
}

export function loadBirth(locale: Locale): LoadedBirth | null {
  const persisted = read(localStorage, locale)

  if (persisted) {
    return { birth: persisted, persistent: true }
  }

  const session = read(sessionStorage, locale)
  return session ? { birth: session, persistent: false } : null
}

/**
 * Persist the birth to exactly one storage, chosen by the "save to browser"
 * checkbox, and clear the other so there is a single source of truth. When
 * `persistent` is off the details survive only for this tab's session.
 */
export function saveBirth(birth: StoredBirth, persistent: boolean) {
  const primary = persistent ? localStorage : sessionStorage
  const secondary = persistent ? sessionStorage : localStorage
  const value = JSON.stringify(birth)

  try {
    primary.setItem(STORAGE_KEY, value)
  } catch {
    /* storage unavailable — the app still works, just without persistence */
  }

  try {
    secondary.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Forget the birth on this device — removes both storages so nothing lingers. */
export function clearBirth() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }

  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function toBirthInput(stored: StoredBirth): BirthInput {
  const [year, month, day] = stored.date.split('-').map(Number)
  const [hour, minute] = stored.timeKnown ? stored.time.split(':').map(Number) : [12, 0]

  return {
    year,
    month,
    day,
    hour: hour ?? 12,
    minute: minute ?? 0,
    latitude: stored.place.latitude,
    longitude: stored.place.longitude,
    timeZone: stored.place.timeZone,
    timeKnown: stored.timeKnown,
  }
}
