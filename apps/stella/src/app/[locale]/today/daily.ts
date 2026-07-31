import { hashSeed, mulberry32 } from '@/lib/prng'

/** Local calendar date as YYYY-MM-DD — the seed for everything daily. */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export type DayAnchor = {
  dateKey: string
  /** UTC offset at local noon, positive east of UTC. */
  utcOffsetMinutes: number
}

/** Captures the creator's calendar day without coupling it to the recipient's time zone. */
export function localDayAnchor(date: Date = new Date()): DayAnchor {
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)

  return {
    dateKey: localDateKey(date),
    utcOffsetMinutes: -noon.getTimezoneOffset(),
  }
}

/** Tomorrow's anchor — the offset comes from tomorrow's own noon so DST transitions stay correct. */
export function nextLocalDayAnchor(date: Date = new Date()): DayAnchor {
  return localDayAnchor(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 12))
}

/** Rebuilds the exact instant that represented local noon for the captured day. */
export function snapshotAtLocalNoon({ dateKey, utcOffsetMinutes }: DayAnchor): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12) - utcOffsetMinutes * 60 * 1000)
}

/** Calendar day as a count of days since the Unix epoch — the step for daily rotations. */
export function dayOrdinal(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
}

/** Renders a dateKey as a full localized date, pinned to noon UTC so every zone shows the same calendar day. */
export function formatDateKey(languageTag: string, dateKey: string): string {
  return new Intl.DateTimeFormat(languageTag, { dateStyle: 'full', timeZone: 'UTC' }).format(
    new Date(`${dateKey}T12:00:00Z`),
  )
}

/** Pick `count` distinct items, deterministically for a given seed string. */
export function seededPick<T>(items: readonly T[], count: number, seed: string): T[] {
  const rand = mulberry32(hashSeed(seed))
  const pool = items.slice()
  const picked: T[] = []

  while (pool.length > 0 && picked.length < count) {
    picked.push(pool.splice(Math.floor(rand() * pool.length), 1)[0])
  }

  return picked
}
