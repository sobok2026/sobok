import type { Locale } from '@sobok/domain/locale'

import type { LoveReadings } from './types'

/**
 * Dynamic per-locale import so each language's tables stay in their own chunk.
 * The Record is exhaustive over Locale, so adding a locale without a
 * readings module fails the type check instead of falling back silently.
 */
const loaders: Record<Locale, () => Promise<LoveReadings>> = {
  ko: () => import('./ko').then((m) => m.readings),
  en: () => import('./en').then((m) => m.readings),
  ja: () => import('./ja').then((m) => m.readings),
  zh: () => import('./zh').then((m) => m.readings),
}

export function loadLoveReadings(locale: Locale): Promise<LoveReadings> {
  return loaders[locale]()
}
