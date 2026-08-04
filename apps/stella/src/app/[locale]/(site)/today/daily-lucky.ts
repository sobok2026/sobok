import type { Locale } from '@sobok/domain/locale'

import type { NatalChart, SignId } from '@/chart/types'

import { type DayAnchor, snapshotAtLocalNoon } from './daily'
import { selectLuckyRecommendations } from './recommendations/select'
import type { LuckyContent, LuckyRecommendations } from './recommendations/types'
import { computeSkyToday, type SkyToday } from './sky'
import { computePersonalToday, type PersonalToday } from './transits'

/** The day-independent half of the pipeline — resolve once, reuse for every day computed in a visit. */
export type DailyLuckyInputs = {
  locale: Locale
  natal: NatalChart | null
  /** Undefined when the exact birth time is known; one/two signs for a date-only birth. */
  natalMoonSigns?: readonly SignId[]
  natalMoonExact: boolean
  content: LuckyContent
}

export type DailyLucky = {
  sky: SkyToday
  personal: PersonalToday | null
  lucky: LuckyRecommendations
}

/**
 * One calendar day's full computation — sky snapshot, personal transits, lucky
 * pick. /today, its tomorrow teaser, and /tomorrow all go through here, so the
 * three surfaces can never disagree about the same day.
 */
export async function computeDailyLucky(anchor: DayAnchor, inputs: DailyLuckyInputs): Promise<DailyLucky> {
  const sky = await computeSkyToday(snapshotAtLocalNoon(anchor))

  const personal = inputs.natal
    ? computePersonalToday(sky.positions, inputs.natal, { natalMoonExact: inputs.natalMoonExact })
    : null

  const lucky = selectLuckyRecommendations({
    locale: inputs.locale,
    dateKey: anchor.dateKey,
    sky,
    natal: inputs.natal,
    natalMoonSigns: inputs.natalMoonSigns,
    personal,
    content: inputs.content,
  })

  return { sky, personal, lucky }
}
