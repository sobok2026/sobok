'use client'

import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

import { computeBirthChartAnalysis, type UnknownBirthTimeAnalysis } from '@/chart/ephemeris'
import type { NatalChart } from '@/chart/types'
import { type StoredBirth, toBirthInput } from '@/lib/birth-storage'

import { type DailySurface, type DayAnchor, localDayAnchor, nextLocalDayAnchor } from './daily'
import { computeDailyLucky, type DailyLuckyInputs } from './daily-lucky'
import { loadReadings } from './readings'
import type { TodayReadings } from './readings/types'
import { loadLuckyContent } from './recommendations'
import type { LuckyRecommendations } from './recommendations/types'
import type { SkyToday } from './sky'
import type { PersonalToday } from './transits'
import { type ReadingLoadInput, useReadingLoad } from './useReadingLoad'

/** Everything a daily page resolves asynchronously before its reading can render at once. */
export type DailyReading = {
  dateKey: string
  utcOffsetMinutes: number
  birth: StoredBirth | null
  sky: SkyToday
  readings: TodayReadings
  natal: NatalChart | null
  unknownTime: UnknownBirthTimeAnalysis | null
  personal: PersonalToday | null
  lucky: LuckyRecommendations
}

export type DailyReadingState = {
  reading: DailyReading | null
  failed: boolean
  /** The URL carried a share hash that could not be decoded — the page owes the visitor an explanation. */
  invalid: boolean
  shared: boolean
  /** /today only: tomorrow's lucky food, filled in after today's reading is already on screen. */
  teaserFood: string | null
}

const ANCHOR_OF: Record<DailySurface, () => DayAnchor> = {
  today: localDayAnchor,
  tomorrow: nextLocalDayAnchor,
}

type DailyLoad = {
  reading: DailyReading
  /** The inputs the teaser reuses for tomorrow's pick, captured while today's reading was computed. */
  luckyInputs: DailyLuckyInputs
}

/**
 * The daily pages' slice of the shared reading lifecycle — everything past the
 * generic load/track skeleton is daily-specific: the calendar-day anchor and
 * the lucky pipeline (see `useReadingLoad` for the shared part).
 *
 * Both surfaces load the full reading even though /tomorrow renders only the lucky pick. The unread half is
 * one locale chunk next to an ephemeris that both pages already pay for, and one shape means the two can
 * never disagree about the same day — which is the whole reason they go through `computeDailyLucky` together.
 */
export function useDailyReading(surface: DailySurface): DailyReadingState {
  const locale = useLocale()
  const { data, failed, invalid, shared } = useReadingLoad(surface, resolveDailyReading)
  const [teaserFood, setTeaserFood] = useState<string | null>(null)

  // The teaser arrives after the reading is on screen and fails alone — tomorrow's computation must
  // never blank or delay today's page. A shared view pins a past day, so it has nothing to preview.
  useEffect(() => {
    if (surface !== 'today' || data === null || shared) {
      setTeaserFood(null)
      return
    }

    let cancelled = false

    computeDailyLucky(nextLocalDayAnchor(), data.luckyInputs)
      .then((next) => {
        if (!cancelled) {
          setTeaserFood(next.lucky.food.name)
        }
      })
      .catch(() => {
        /* the teaser is optional — today's reading stands */
      })

    return () => {
      cancelled = true
    }
  }, [data, locale, shared, surface])

  return {
    reading: data?.reading ?? null,
    failed,
    invalid,
    shared,
    teaserFood,
  }
}

async function resolveDailyReading({
  locale,
  birth,
  payload,
  surface,
}: ReadingLoadInput<DailySurface>): Promise<DailyLoad> {
  const anchor = payload ?? ANCHOR_OF[surface]()

  const [readings, luckyContent, analysis] = await Promise.all([
    loadReadings(locale),
    loadLuckyContent(locale),
    birth ? computeBirthChartAnalysis(toBirthInput(birth)) : null,
  ])

  const natal = analysis?.chart ?? null
  const unknownTime = analysis?.unknownTime ?? null

  const luckyInputs: DailyLuckyInputs = {
    locale,
    natal,
    natalMoonSigns: unknownTime?.moonSigns,
    natalMoonExact: birth?.timeKnown ?? false,
    content: luckyContent,
  }

  const { sky, personal, lucky } = await computeDailyLucky(anchor, luckyInputs)

  return {
    reading: {
      dateKey: anchor.dateKey,
      utcOffsetMinutes: anchor.utcOffsetMinutes,
      birth,
      sky,
      readings,
      natal,
      unknownTime,
      personal,
      lucky,
    },
    luckyInputs,
  }
}
