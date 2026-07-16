import type { Locale } from '@sobok/domain/locale'

import type { Interpretations } from './types'

type Tables = typeof import('./ko')
type Report = typeof import('./report/ko')

/**
 * Dynamic per-locale import so each language's natal tables stay in their own
 * chunk — pages that never open a chart never carry them. The Record is
 * exhaustive over Locale, so adding a locale without interpretation
 * modules fails the type check instead of falling back silently.
 */
const loaders: Record<Locale, () => Promise<Interpretations>> = {
  ko: () => assemble(import('./ko'), import('./report/ko')),
  en: () => assemble(import('./en'), import('./report/en')),
  ja: () => assemble(import('./ja'), import('./report/ja')),
  zh: () => assemble(import('./zh'), import('./report/zh')),
}

async function assemble(tables: Promise<Tables>, report: Promise<Report>): Promise<Interpretations> {
  const [{ planets, retro, houses, aspects, aspectIntensity }, { report: reportContent }] = await Promise.all([
    tables,
    report,
  ])

  return {
    planets,
    retro,
    houses,
    aspects,
    aspectIntensity,
    report: reportContent,
  }
}

export function loadInterpretations(locale: Locale): Promise<Interpretations> {
  return loaders[locale]()
}
