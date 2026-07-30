import { gt, lt, type SQL } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'

export const REOPEN_LINK_TTL_MS = 15 * 60 * 1000
export const REOPEN_REQUEST_COOLDOWN_MS = 5 * 60 * 1000

export function daysBefore(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

export function monthsBefore(now: Date, months: number): Date {
  return shiftUtcMonths(now, -months)
}

function yearsBefore(now: Date, years: number): Date {
  return shiftUtcMonths(now, -years * 12)
}

export function yearsAfter(now: Date, years: number): Date {
  return shiftUtcMonths(now, years * 12)
}

// Comparators, not sql`` fragments: gt/lt bind the cutoff through the column's own encoder. A Date
// interpolated bare into sql`` would get drizzle's noopEncoder, and drizzle's postgres-js driver has already
// replaced postgres.js's date/time serializers with identity functions — so nothing would encode it and the
// socket writer dies on the raw Date object.
export function dateIsWithinYears(timestamp: PgColumn, now: Date, years: number): SQL {
  return gt(timestamp, yearsBefore(now, years))
}

export function dateIsOlderThanYears(timestamp: PgColumn, now: Date, years: number): SQL {
  return lt(timestamp, yearsBefore(now, years))
}

function shiftUtcMonths(value: Date, delta: number): Date {
  const shifted = new Date(value)
  const originalDay = shifted.getUTCDate()
  shifted.setUTCDate(1)
  shifted.setUTCMonth(shifted.getUTCMonth() + delta)
  const lastDay = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0)).getUTCDate()
  shifted.setUTCDate(Math.min(originalDay, lastDay))
  return shifted
}
