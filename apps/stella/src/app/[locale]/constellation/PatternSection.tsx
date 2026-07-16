'use client'

import { useTranslations } from 'next-intl'

import { PLANET_GLYPHS } from '../chart/data'
import { findPatterns } from '../chart/patterns'
import { findShape } from '../chart/shape'
import type { NatalChart } from '../chart/types'
import { glyphText } from './glyphs'

export default function PatternSection({ chart, dateOnly = false }: { chart: NatalChart; dateOnly?: boolean }) {
  const t = useTranslations('Constellation')
  const reliablePlanets = dateOnly ? chart.planets.filter((planet) => planet.id !== 'moon') : chart.planets
  const patterns = findPatterns(reliablePlanets)
  const shape = dateOnly ? null : findShape(chart.planets)

  return (
    <section className="px-1 sm:rounded-2xl sm:border sm:bg-surface sm:p-5">
      <h2 className="text-sm font-bold text-foreground">{t('shapes.title')}</h2>
      <p className="mt-1 text-xs text-foreground-subtle">{t(dateOnly ? 'shapes.noTime' : 'shapes.intro')}</p>

      {shape && (
        <div className="mt-3 border rounded-xl bg-surface-2 p-3 sm:border-0">
          <p className="text-sm font-semibold text-foreground">{t(`shapes.name.${shape.id}`)}</p>
          <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">{t(`shapes.body.${shape.id}`)}</p>
        </div>
      )}

      {patterns.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-bold text-foreground">{t('patterns.title')}</h3>
          <p className="mt-1 text-xs text-foreground-subtle">{t('patterns.intro')}</p>
          <ul className="mt-3 space-y-2">
            {patterns.map((p) => (
              <li className="border rounded-xl bg-surface-2 p-3 sm:border-0" key={`${p.type}-${p.planets.join('-')}`}>
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-base text-accent">
                    {p.planets.map((id) => glyphText(PLANET_GLYPHS[id])).join(' ')}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{t(`patterns.name.${p.type}`)}</span>
                </div>
                <p className="mt-1 text-[11px] text-foreground-faint">
                  {p.planets.map((id) => t(`planets.${id}`)).join(' · ')}
                  {p.apex ? ` — ${t('patterns.apex')}: ${t(`planets.${p.apex}`)}` : ''}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground-secondary">
                  {t(`patterns.body.${p.type}`)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
