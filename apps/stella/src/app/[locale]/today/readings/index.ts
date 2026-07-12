import { Locale, type PublicLocale } from '@sobok/domain/locale'

import type { TodayReadings } from './types'

/** Dynamic per-locale import so each language's tables stay in their own chunk. */
export function loadReadings(locale: PublicLocale): Promise<TodayReadings> {
  switch (locale) {
    case Locale.KO:
      return import('./ko').then((m) => m.readings)
    case Locale.JA:
      return import('./ja').then((m) => m.readings)
    case Locale.ZH_CN:
      return import('./zh-CN').then((m) => m.readings)
    default:
      return import('./en').then((m) => m.readings)
  }
}
