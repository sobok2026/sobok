export type Lifetime = { amount: number; unit: 'days' | 'hours' | 'months' }

export function expiryAt(startedAt: number, lifetime: Lifetime) {
  if (lifetime.unit === 'hours') return startedAt + lifetime.amount * 3600

  if (lifetime.unit === 'months') {
    const start = new Date(startedAt * 1000)
    const year = start.getUTCFullYear()
    const month = start.getUTCMonth() + lifetime.amount
    const day = start.getUTCDate()
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    return (day > lastDay ? Date.UTC(year, month + 1, 1) : Date.UTC(year, month, day)) / 1000
  }

  // The game's fictional local calendar is represented by UTC timestamps.
  // Opening/manufacturing day is day one; expiry is exclusive at the following midnight.
  return Math.floor(startedAt / 86400) * 86400 + lifetime.amount * 86400
}

export function sameLifetime(first: Lifetime, second: Lifetime) {
  return first.unit === second.unit && first.amount === second.amount
}
