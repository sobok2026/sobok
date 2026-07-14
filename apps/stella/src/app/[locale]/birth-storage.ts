// Device-local persistence for the birth form. The data never leaves the
// browser — it exists so returning visitors (and the /today page) don't have to
// retype their birth details. Stored as the raw form values (not the derived
// BirthInput) so the form can prefill exactly what the user picked.

import { findCity } from './cities'
import type { BirthInput } from './ephemeris'

const STORAGE_KEY = 'stella.birth.v1'

export type StoredBirth = {
  date: string // YYYY-MM-DD
  time: string // HH:mm
  timeKnown: boolean
  cityKey: string
}

export function isStoredBirth(value: unknown): value is StoredBirth {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const v = value as Record<string, unknown>

  return (
    typeof v.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
    typeof v.time === 'string' &&
    /^\d{2}:\d{2}$/.test(v.time) &&
    typeof v.timeKnown === 'boolean' &&
    typeof v.cityKey === 'string'
  )
}

/** localStorage can throw (private mode, disabled storage) — treat that as "no data". */
export function loadBirth(): StoredBirth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    return isStoredBirth(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveBirth(birth: StoredBirth) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(birth))
  } catch {
    /* storage unavailable — the app still works, just without persistence */
  }
}

export function clearBirth() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function toBirthInput(stored: StoredBirth): BirthInput {
  const [year, month, day] = stored.date.split('-').map(Number)
  const [hour, minute] = stored.timeKnown ? stored.time.split(':').map(Number) : [12, 0]
  const city = findCity(stored.cityKey)

  return {
    year,
    month,
    day,
    hour: hour ?? 12,
    minute: minute ?? 0,
    latitude: city.latitude,
    longitude: city.longitude,
    timeZone: city.timeZone,
    timeKnown: stored.timeKnown,
  }
}
