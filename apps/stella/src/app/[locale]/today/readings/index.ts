import type { PublicLocale } from '@sobok/domain/locale'

import type { TodayReadings } from './types'

/**
 * Dynamic per-locale import so each language's tables stay in their own chunk.
 * The Record is exhaustive over PublicLocale, so adding a locale without a
 * readings module fails the type check instead of falling back silently.
 */
const loaders: Record<PublicLocale, () => Promise<TodayReadings>> = {
  ko: () => import('./ko').then((m) => m.readings),
  en: () => import('./en').then((m) => m.readings),
  ja: () => import('./ja').then((m) => m.readings),
  'zh-CN': () => import('./zh-CN').then((m) => m.readings),
}

export function loadReadings(locale: PublicLocale): Promise<TodayReadings> {
  return loaders[locale]()
}
