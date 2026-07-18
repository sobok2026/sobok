import 'server-only'

import { Locale } from '@sobok/domain/locale'

import type { GyeolContent } from './types'

const contentLoaders = {
  [Locale.EN]: () => import('../_content/en').then((module) => module.rarityContent),
  [Locale.JA]: () => import('../_content/ja').then((module) => module.rarityContent),
  [Locale.KO]: () => import('../_content/ko').then((module) => module.rarityContent),
  [Locale.ZH]: () => import('../_content/zh').then((module) => module.rarityContent),
} as const satisfies Record<Locale, () => Promise<GyeolContent>>

export function getGyeolContent(locale: Locale) {
  return contentLoaders[locale]()
}
