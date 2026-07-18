import 'server-only'

import { Locale } from '@sobok/domain/locale'

import type { CoupleTypeContent } from './types'

const contentLoaders = {
  [Locale.EN]: () => import('../_content/en').then((module) => module.coupleTypeContent),
  [Locale.JA]: () => import('../_content/ja').then((module) => module.coupleTypeContent),
  [Locale.KO]: () => import('../_content/ko').then((module) => module.coupleTypeContent),
  [Locale.ZH]: () => import('../_content/zh').then((module) => module.coupleTypeContent),
} as const satisfies Record<Locale, () => Promise<CoupleTypeContent>>

export function getCoupleTypeContent(locale: Locale) {
  return contentLoaders[locale]()
}
