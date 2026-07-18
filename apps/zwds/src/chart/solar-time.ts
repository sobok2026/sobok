// Apparent solar time (진태양시) correction for the birth clock reading.
//
// Korean commercial fortune services determine the double-hour (時辰) from the
// sun's actual position, not the zone clock: KST runs on 135°E while Korea sits
// near 127°E, so a wall clock reads ~32 minutes ahead of the local sun. The
// correction has two parts:
//   • longitude — 4 minutes per degree between the birthplace and the zone meridian
//   • equation of time — the ±16-minute seasonal wobble of the true sun
// Both are applied to the wall-clock reading; the corrected reading may cross a
// date boundary, which callers must respect when deriving the chart date.

export type WallClock = {
  year: number
  month: number // 1-12
  day: number
  hour: number // 0-23
  minute: number // 0-59
}

export type ApparentSolarTime = {
  clock: WallClock
  /** Total minutes added to the input reading (negative west of the zone meridian). */
  correctionMinutes: number
  longitudeMinutes: number
  equationMinutes: number
}

/**
 * UTC offset of `timeZone` in minutes at the given instant, via the Intl
 * timezone database — this respects history such as Korea's UTC+8:30 era
 * (1954-1961) and the 1987-88 summer time.
 */
function offsetMinutesAt(instantMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instantMs))

  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  const zoneWallMs = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  )

  return Math.round((zoneWallMs - instantMs) / 60_000)
}

/**
 * The instant a wall-clock reading refers to. Two fixed-point passes converge
 * for every real offset change (DST, historical zone shifts).
 */
function wallClockToInstant(clock: WallClock, timeZone: string): number {
  const asUtc = Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute)
  let instant = asUtc - offsetMinutesAt(asUtc, timeZone) * 60_000
  instant = asUtc - offsetMinutesAt(instant, timeZone) * 60_000
  return instant
}

function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365
}

function dayOfYear(clock: WallClock): number {
  const start = Date.UTC(clock.year, 0, 1)
  const current = Date.UTC(clock.year, clock.month - 1, clock.day)
  return (current - start) / 86_400_000 + 1
}

/** NOAA approximation of the equation of time, in minutes (true sun − mean sun). */
export function equationOfTimeMinutes(clock: WallClock): number {
  const gamma = ((2 * Math.PI) / daysInYear(clock.year)) * (dayOfYear(clock) - 1 + (clock.hour - 12) / 24)

  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma))
  )
}

/** Shift a wall-clock reading by whole minutes, letting the date roll over naturally. */
function shiftClock(clock: WallClock, minutes: number): WallClock {
  const shifted = new Date(Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute + minutes))

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  }
}

export function toApparentSolarTime(clock: WallClock, longitude: number, timeZone: string): ApparentSolarTime {
  const instant = wallClockToInstant(clock, timeZone)
  const zoneMeridian = (offsetMinutesAt(instant, timeZone) / 60) * 15
  const longitudeMinutes = 4 * (longitude - zoneMeridian)
  const equationMinutes = equationOfTimeMinutes(clock)
  const correctionMinutes = Math.round(longitudeMinutes + equationMinutes)

  return {
    clock: shiftClock(clock, correctionMinutes),
    correctionMinutes,
    longitudeMinutes,
    equationMinutes,
  }
}
