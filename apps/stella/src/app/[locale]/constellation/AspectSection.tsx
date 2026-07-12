'use client'

import { useTranslations } from 'next-intl'

import { ASPECT_STYLE, PLANET_GLYPHS } from '../chart/data'
import type { AspectType, ChartAspect } from '../chart/types'
import { glyphText } from './glyphs'
import { isAspectSelection, type Selection } from './selection'

// Aspects that flow easily vs. those that create productive friction.
const HARMONY_TYPES: readonly AspectType[] = ['conjunction', 'trine', 'sextile']
const TENSION_TYPES: readonly AspectType[] = ['square', 'opposition']

export interface AspectSectionProps {
  aspects: readonly ChartAspect[]
  onSelect: (asp: ChartAspect) => void
  selection: Selection
}

/** The tappable aspect list under the wheel, grouped into harmony vs. tension. */
export default function AspectSection({ aspects, onSelect, selection }: AspectSectionProps) {
  const t = useTranslations('Constellation')

  if (aspects.length === 0) {
    return null
  }

  const harmony = aspects.filter((a) => HARMONY_TYPES.includes(a.type))
  const tension = aspects.filter((a) => TENSION_TYPES.includes(a.type))

  return (
    <section className="sm:rounded-2xl sm:border sm:bg-surface sm:p-5">
      <h2 className="text-sm font-bold text-foreground">{t('aspects.title')}</h2>
      <p className="mt-1 text-xs text-foreground-subtle">{t('aspects.intro')}</p>
      <div className="mt-4 sm:grid sm:grid-cols-2 sm:gap-4">
        {harmony.length > 0 && (
          <AspectGroup
            accent="var(--color-positive)"
            aspects={harmony}
            label={t('aspects.harmonyGroup')}
            onSelect={onSelect}
            selection={selection}
          />
        )}
        {tension.length > 0 && (
          <AspectGroup
            accent="var(--color-danger)"
            aspects={tension}
            label={t('aspects.tensionGroup')}
            onSelect={onSelect}
            selection={selection}
          />
        )}
      </div>
    </section>
  )
}

interface AspectGroupProps {
  accent: string
  aspects: readonly ChartAspect[]
  label: string
  onSelect: (asp: ChartAspect) => void
  selection: Selection
}

function AspectGroup({ accent, aspects, label, onSelect, selection }: AspectGroupProps) {
  const t = useTranslations('Constellation')

  return (
    <div className="mt-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: accent }}>
        {label}
      </p>
      <ul className="space-y-1">
        {aspects.map((asp) => {
          const color = ASPECT_STYLE[asp.type].color
          const active = isAspectSelection(selection, asp)

          return (
            <li key={`${asp.a}-${asp.b}-${asp.type}`}>
              <button
                className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-surface-2 sm:gap-3 sm:px-2.5 ${active ? 'bg-surface-3 ring-1 ring-ring' : ''}`}
                onClick={() => onSelect(asp)}
                type="button"
              >
                <span className="w-9 shrink-0 text-center text-base" style={{ color }}>
                  {glyphText(PLANET_GLYPHS[asp.a as never])} {glyphText(PLANET_GLYPHS[asp.b as never])}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-foreground-secondary">
                    {t(`planets.${asp.a}`)} <span className="text-foreground-faint">↔</span> {t(`planets.${asp.b}`)}
                  </span>
                  <span className="block text-[11px]" style={{ color }}>
                    {t(`aspects.${asp.type}Vibe`)}{' '}
                    <span className="whitespace-nowrap text-foreground-faint">
                      · {t('aspects.orbLabel')} {asp.orb}°
                    </span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
