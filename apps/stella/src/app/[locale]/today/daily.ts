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

/** Rebuilds the exact instant that represented local noon for the captured day. */
export function snapshotAtLocalNoon({ dateKey, utcOffsetMinutes }: DayAnchor): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12) - utcOffsetMinutes * 60 * 1000)
}

/** xmur3 string hash — spreads a short seed string into a well-mixed 32-bit state. */
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length

  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }

  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

/** mulberry32 — small, fast, good-enough PRNG for cosmetic picks. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
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
