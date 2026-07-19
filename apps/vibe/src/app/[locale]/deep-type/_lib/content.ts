import 'server-only'

import { Locale } from '@sobok/domain/locale'

import type { DeepTypeContent } from './types'

const contentLoaders = {
  [Locale.EN]: () => import('../_content/en').then((module) => module.deepTypeContent),
  [Locale.JA]: () => import('../_content/ja').then((module) => module.deepTypeContent),
  [Locale.KO]: () => import('../_content/ko').then((module) => module.deepTypeContent),
  [Locale.ZH]: () => import('../_content/zh').then((module) => module.deepTypeContent),
} as const satisfies Record<Locale, () => Promise<DeepTypeContent>>

export function getDeepTypeContent(locale: Locale) {
  return contentLoaders[locale]()
}
