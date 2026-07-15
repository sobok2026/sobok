import type { Locale } from '@sobok/domain/locale'

import type { LuckyContent } from './types'

const loaders: Record<Locale, () => Promise<LuckyContent>> = {
  ko: () => import('./ko').then((module) => module.luckyContent),
  en: () => import('./en').then((module) => module.luckyContent),
  ja: () => import('./ja').then((module) => module.luckyContent),
  zh: () => import('./zh').then((module) => module.luckyContent),
}

export function loadLuckyContent(locale: Locale): Promise<LuckyContent> {
  return loaders[locale]()
}
