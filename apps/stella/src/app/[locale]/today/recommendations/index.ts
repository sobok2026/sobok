import { createLocaleLoaders } from '@/content/locale-loaders'

import type { LuckyContent } from './types'

export const loadLuckyContent = createLocaleLoaders<LuckyContent>({
  ko: () => import('./ko').then((m) => m.luckyContent),
  en: () => import('./en').then((m) => m.luckyContent),
  ja: () => import('./ja').then((m) => m.luckyContent),
  zh: () => import('./zh').then((m) => m.luckyContent),
})
