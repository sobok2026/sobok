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

export function lifetimeLabel(lifetime: Lifetime, prepared: boolean) {
  const start = prepared ? '제조' : '개봉'
  if (lifetime.unit === 'months') return `${start}일 기준 달력 ${lifetime.amount}개월`
  return lifetime.unit === 'days'
    ? `${start}일 포함 ${lifetime.amount}일 · 마지막 날 종료까지`
    : `${start} 후 ${lifetime.amount}시간`
}
