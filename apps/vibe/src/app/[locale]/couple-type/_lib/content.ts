import 'server-only'

import type { Locale } from '@sobok/domain/locale'

import type { CoupleTypeContent } from './types'

const contentLoaders = {
  en: () => import('../_content/en').then((module) => module.coupleTypeContent),
  ja: () => import('../_content/ja').then((module) => module.coupleTypeContent),
  ko: () => import('../_content/ko').then((module) => module.coupleTypeContent),
  zh: () => import('../_content/zh').then((module) => module.coupleTypeContent),
} as const satisfies Record<Locale, () => Promise<CoupleTypeContent>>

export function getCoupleTypeContent(locale: Locale) {
  return contentLoaders[locale]()
}
