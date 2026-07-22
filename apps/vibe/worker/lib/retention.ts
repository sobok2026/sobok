export const REOPEN_LINK_TTL_MS = 15 * 60 * 1000
export const REOPEN_REQUEST_COOLDOWN_MS = 5 * 60 * 1000

export function daysBefore(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

export function monthsBefore(now: Date, months: number): Date {
  return shiftUtcMonths(now, -months)
}

export function yearsAfter(now: Date, years: number): Date {
  return shiftUtcMonths(now, years * 12)
}

export function dateIsWithinYears(timestamp: SQLWrapper, now: Date, years: number): SQL {
  return sql`${timestamp} + make_interval(years => ${years}) > ${now}`
}

export function dateIsOlderThanYears(timestamp: SQLWrapper, now: Date, years: number): SQL {
  return sql`${timestamp} + make_interval(years => ${years}) < ${now}`
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

import { type SQL, type SQLWrapper, sql } from 'drizzle-orm'
