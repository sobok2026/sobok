import type { Locale } from '@sobok/domain/locale'

import type { Interpretations } from './types'

/**
 * Dynamic per-locale import so each language's reading tables stay in their own
 * chunk — pages that never open a chart never carry them. The Record is
 * exhaustive over Locale, so adding a locale without an interpretation module
 * fails the type check instead of falling back silently.
 */
const loaders: Record<Locale, () => Promise<{ interpretations: Interpretations }>> = {
  ko: () => import('./ko'),
  en: () => import('./en'),
  ja: () => import('./ja'),
  zh: () => import('./zh'),
}

export function loadInterpretations(locale: Locale): Promise<Interpretations> {
  return loaders[locale]().then((module) => module.interpretations)
}
