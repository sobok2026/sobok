import 'server-only'

import type { Locale } from '@sobok/domain/locale'

import type { DeepTypeContent } from './types'

const contentLoaders = {
  en: () => import('../_content/en').then((module) => module.deepTypeContent),
  ja: () => import('../_content/ja').then((module) => module.deepTypeContent),
  ko: () => import('../_content/ko').then((module) => module.deepTypeContent),
  zh: () => import('../_content/zh').then((module) => module.deepTypeContent),
} as const satisfies Record<Locale, () => Promise<DeepTypeContent>>

export function getDeepTypeContent(locale: Locale) {
  return contentLoaders[locale]()
}
