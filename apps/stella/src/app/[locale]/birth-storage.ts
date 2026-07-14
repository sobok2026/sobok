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

// Per-tab flag: the visitor made an explicit save/don't-save decision via the
// form. Once set, a deep-linked chart won't cross-seed device storage — so a
// deliberately unsaved chart isn't quietly resurrected on refresh.
const DECISION_KEY = 'stella.birth.decided'

export function markBirthDecision() {
  try {
    sessionStorage.setItem(DECISION_KEY, '1')
  } catch {
    /* session storage unavailable — cross-seeding just stays enabled */
  }
}

function birthDecisionMade(): boolean {
  try {
    return sessionStorage.getItem(DECISION_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Persist birth data that arrived via a shared/deep-linked URL, so the /today and
 * /love pages (which read localStorage) personalize too. Deliberately conservative:
 * skips when the visitor already has their own saved birth (don't clobber a
 * returning user with someone else's link) or made a form decision this tab (don't
 * override a "don't save" choice). Genuine first-time link entries seed and nothing
 * else does.
 */
export function seedBirthFromLink(birth: StoredBirth) {
  if (birthDecisionMade() || loadBirth() !== null) {
    return
  }

  saveBirth(birth)
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
