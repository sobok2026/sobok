import 'server-only'

import type { Locale } from '@sobok/domain/locale'

import type { GyeolContent } from './types'

const contentLoaders = {
  en: () => import('../_content/en').then((module) => module.rarityContent),
  ja: () => import('../_content/ja').then((module) => module.rarityContent),
  ko: () => import('../_content/ko').then((module) => module.rarityContent),
  zh: () => import('../_content/zh').then((module) => module.rarityContent),
} as const satisfies Record<Locale, () => Promise<GyeolContent>>

export function getGyeolContent(locale: Locale) {
  return contentLoaders[locale]()
}
