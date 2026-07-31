'use client'

import { track } from '@sobok/analytics/browser'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

import { computeBirthChartAnalysis, type UnknownBirthTimeAnalysis } from '@/chart/ephemeris'
import type { NatalChart } from '@/chart/types'
import { useBirthSource } from '@/hooks/useBirthSource'
import { type StoredBirth, toBirthInput } from '@/lib/birth-storage'

import { type DailySurface, type DayAnchor, localDayAnchor, nextLocalDayAnchor } from './daily'
import { computeDailyLucky, type DailyLuckyInputs } from './daily-lucky'
import { loadReadings } from './readings'
import type { TodayReadings } from './readings/types'
import { loadLuckyContent } from './recommendations'
import type { LuckyRecommendations } from './recommendations/types'
import type { SkyToday } from './sky'
import type { PersonalToday } from './transits'
import { useLiveDateKey } from './useLiveDateKey'

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

/**
 * The async lifecycle both daily pages share: resolve the birth (saved profile or an isolated shared one),
 * wait for the local calendar day, compute the day, and count the view. A shared link pins the sender's day
 * so the recipient reproduces their reading rather than recomputing their own.
 *
 * Both surfaces load the full reading even though /tomorrow renders only the lucky pick. The unread half is
 * one locale chunk next to an ephemeris that both pages already pay for, and one shape means the two can
 * never disagree about the same day — which is the whole reason they go through `computeDailyLucky` together.
 */
export function useDailyReading(surface: DailySurface): DailyReadingState {
  const [reading, setReading] = useState<DailyReading | null>(null)
  const [teaserFood, setTeaserFood] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const birthSource = useBirthSource(surface)
  const locale = useLocale()

  const { birth, payload: sharedPayload, shared } = birthSource
  const liveDateKey = useLiveDateKey(!shared)

  const sourceReady = birthSource.status === 'ready'
  const dayReady = shared || liveDateKey !== null

  useEffect(() => {
    let cancelled = false

    if (!sourceReady || !dayReady) {
      return () => {
        cancelled = true
      }
    }

    async function run() {
      try {
        setFailed(false)
        setReading(null)
        setTeaserFood(null)

        const anchor = sharedPayload ?? ANCHOR_OF[surface]()

        const [readings, luckyContent, analysis] = await Promise.all([
          loadReadings(locale),
          loadLuckyContent(locale),
          birth ? computeBirthChartAnalysis(toBirthInput(birth)) : null,
        ])

        const natal = analysis?.chart ?? null
        const unknownTime = analysis?.unknownTime ?? null

        const inputs: DailyLuckyInputs = {
          locale,
          natal,
          natalMoonSigns: unknownTime?.moonSigns,
          natalMoonExact: birth?.timeKnown ?? false,
          content: luckyContent,
        }

        const { sky, personal, lucky } = await computeDailyLucky(anchor, inputs)

        if (cancelled) {
          return
        }

        setReading({
          dateKey: anchor.dateKey,
          utcOffsetMinutes: anchor.utcOffsetMinutes,
          birth,
          sky,
          readings,
          natal,
          unknownTime,
          personal,
          lucky,
        })

        track('view_reading', {
          content_type: surface,
          personalized: birth !== null,
          time_known: birth?.timeKnown ?? false,
          shared,
        })

        // The teaser arrives after the reading is on screen and fails alone — tomorrow's computation must
        // never blank or delay today's page. A shared view pins a past day, so it has nothing to preview.
        if (surface === 'today' && !sharedPayload) {
          try {
            const next = await computeDailyLucky(nextLocalDayAnchor(), inputs)

            if (!cancelled) {
              setTeaserFood(next.lucky.food.name)
            }
          } catch {
            /* the teaser is optional — today's reading stands */
          }
        }
      } catch {
        if (!cancelled) {
          setFailed(true)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [
    birth,
    dayReady,
    liveDateKey,
    locale,
    shared,
    sharedPayload?.dateKey,
    sharedPayload?.utcOffsetMinutes,
    sourceReady,
    surface,
  ])

  return { reading, failed, invalid: birthSource.status === 'invalid', shared, teaserFood }
}
