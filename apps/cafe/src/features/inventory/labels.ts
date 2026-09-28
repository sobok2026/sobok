import { INGREDIENTS } from '../../content/ingredients'
import { expiryAt, type Lifetime } from '../../content/lifetime'
import type { Batch } from '../../simulation/state'
import { batchLifetime } from './batches'

const DAY = 86400
const LIFETIME_UNITS = { days: '일', hours: '시간', months: '개월' } as const

/** Day and month shelf lives end at midnight, so their labels carry a date. Anything else carries the minute. */
export type LabelFormat = 'date' | 'time'
export type LabelValue = { month: number; day: number; hour: number; minute: number }
export type LabelVerdict = { title: string; detail?: string }

export function labelFormat(batch: Batch): LabelFormat {
  const expiresAt = batch.expiresAt ?? 0

  return batchLifetime(batch).unit === 'hours' || expiresAt % DAY !== 0 ? 'time' : 'date'
}

const parts = (moment: number) => {
  const date = new Date(moment * 1000)

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  }
}

/** The label starts from the moment the batch was opened or made; the player moves it forward. */
export function startingLabel(batch: Batch): LabelValue {
  const { month, day, hour, minute } = parts(batch.openedAt ?? 0)
  return { month, day, hour, minute }
}

/** A written label runs to the end of its date, or to its minute. 24:00 is the same moment as the next midnight. */
export function labelMoment(value: LabelValue, format: LabelFormat, from: number) {
  const start = parts(from)
  const year = start.year + (value.month < start.month ? 1 : 0)
  const date = Date.UTC(year, value.month - 1, value.day) / 1000

  return format === 'date' ? date + DAY : date + value.hour * 3600 + value.minute * 60
}

export function expectedLabel(batch: Batch) {
  let expiresAt = batch.expiresAt ?? 0
  if (INGREDIENTS[batch.ingredient].storageLifetimes && batch.openedAt !== null) {
    expiresAt = Math.min(expiryAt(batch.openedAt, batchLifetime(batch)), batch.ingredientExpiresAt ?? Infinity)
  }
  return labelFormat(batch) === 'date' ? expiresAt : Math.floor(expiresAt / 60) * 60
}

export function daysIn(value: LabelValue, from: number) {
  const start = parts(from)
  return new Date(Date.UTC(start.year + (value.month < start.month ? 1 : 0), value.month, 0)).getUTCDate()
}

/** A label is right only when it names the exact expiry; writing it early wastes stock, late breaks food safety. */
export function checkLabel(batch: Batch, moment: number): LabelVerdict | null {
  const expected = expectedLabel(batch)
  if (moment === expected) {
    return null
  }
  const definition = INGREDIENTS[batch.ingredient]
  const late = moment > expected
  const title = late ? '기한을 늦게 적었어요' : '기한을 이르게 적었어요'
  const lifetime = batchLifetime(batch)
  const ownExpiry = batch.openedAt === null ? null : expiryAt(batch.openedAt, lifetime)

  if (
    definition.prepared &&
    late &&
    ownExpiry !== null &&
    batch.ingredientExpiresAt !== null &&
    ownExpiry > batch.ingredientExpiresAt
  ) {
    return { title, detail: '넣은 원재료 중 더 먼저 끝나는 것이 있어요.' }
  }
  if (lifetime.unit !== 'hours' && late && moment - expected === DAY) {
    return { title, detail: '시작한 날을 첫날로 세요.' }
  }

  return { title }
}

export function lifetimeText(lifetime: Lifetime) {
  return `${lifetime.amount}${LIFETIME_UNITS[lifetime.unit]}`
}

const two = (value: number) => String(value).padStart(2, '0')

/** How a moment reads on a label: midnight shows the day it closes, anything else the minute. */
export function momentText(moment: number, format: LabelFormat = moment % DAY === 0 ? 'date' : 'time') {
  if (moment % DAY === 0) {
    const { month, day } = parts(moment - DAY)
    return format === 'date' ? `${month}/${day}` : `${month}/${day} 24:00`
  }
  const { month, day, hour, minute } = parts(moment)

  return `${month}/${day} ${two(hour)}:${two(minute)}`
}

export function labelText(batch: Batch) {
  return `~${momentText(expectedLabel(batch), labelFormat(batch))}`
}

export function startedText(moment: number) {
  const { month, day, hour, minute } = parts(moment)
  return `${month}월 ${day}일 ${two(hour)}:${two(minute)}`
}
