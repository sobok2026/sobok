import { createLocaleLoaders } from '@/content/locale-loaders'

import type { Interpretations } from './types'

type Tables = typeof import('./ko')
type Report = typeof import('./report/ko')

export const loadInterpretations = createLocaleLoaders<Interpretations>({
  ko: () => assemble(import('./ko'), import('./report/ko')),
  en: () => assemble(import('./en'), import('./report/en')),
  ja: () => assemble(import('./ja'), import('./report/ja')),
  zh: () => assemble(import('./zh'), import('./report/zh')),
})

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
