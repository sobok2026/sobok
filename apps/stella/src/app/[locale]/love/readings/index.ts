import { createLocaleLoaders } from '@/content/locale-loaders'

import type { LoveReadings } from './types'

export const loadLoveReadings = createLocaleLoaders<LoveReadings>({
  ko: () => import('./ko').then((m) => m.readings),
  en: () => import('./en').then((m) => m.readings),
  ja: () => import('./ja').then((m) => m.readings),
  zh: () => import('./zh').then((m) => m.readings),
})
