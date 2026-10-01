import { GUARDIAN_PASS_DURATION_DAYS } from './offer'

export function guardianDateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find(({ type }) => type === 'year')?.value
  const month = parts.find(({ type }) => type === 'month')?.value
  const day = parts.find(({ type }) => type === 'day')?.value
  if (!year || !month || !day) throw new Error('Guardian purchase date did not resolve')
  return `${year}-${month}-${day}`
}

export function shiftGuardianDateKey(dateKey: string, offset: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + offset, 12))
  return date.toISOString().slice(0, 10)
}

export function guardianWeekDateKeys(paidAt: Date, timeZone: string): string[] {
  const purchasedDateKey = guardianDateKeyInTimeZone(paidAt, timeZone)
  return Array.from({ length: GUARDIAN_PASS_DURATION_DAYS }, (_, index) =>
    shiftGuardianDateKey(purchasedDateKey, index + 1),
  )
}
