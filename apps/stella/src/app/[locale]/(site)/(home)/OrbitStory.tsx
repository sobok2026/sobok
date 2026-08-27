'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ASPECT_STYLE, PLANET_GLYPHS } from '@/chart/data'
import { aspectScore } from '@/chart/signature'
import type { ChartAspect, NatalChart } from '@/chart/types'
import AstroGlyph from '@/components/AstroGlyph'

import AspectSection, { aspectStoryKey } from './AspectSection'
import { computeBrightPlanets, isAspectDimmed, isPlanetDimmed, type Selection } from './selection'
import ChartWheel from './wheel/ChartWheel'

type OrbitStoryProps = {
  aspects: readonly ChartAspect[]
  chart: NatalChart
  moonLongitudeRange: readonly [start: number, end: number] | null
  onSelect: (aspect: ChartAspect) => void
  selection: Selection
}

const noop = () => undefined

function aspectSelection(aspect: ChartAspect): Exclude<Selection, null> {
  return {
    kind: 'aspect',
    a: aspect.a,
    b: aspect.b,
    aspectType: aspect.type,
    orb: aspect.orb,
  }
}

/**
 * Desktop scrollytelling stage: the aspect list drives a persistent, decorative
 * copy of the natal wheel. The original wheel remains the sole interactive one.
 */
export default function OrbitStory({ aspects, chart, moonLongitudeRange, onSelect, selection }: OrbitStoryProps) {
  const t = useTranslations('Constellation')
  const sectionRef = useRef<HTMLElement>(null)
  const aspectByKey = useMemo(() => new Map(aspects.map((aspect) => [aspectStoryKey(aspect), aspect])), [aspects])
  const strongest = useMemo(() => [...aspects].sort((a, b) => aspectScore(b) - aspectScore(a))[0] ?? null, [aspects])
  const [previewKey, setPreviewKey] = useState<string | null>(null)
  const previewAspect = (previewKey ? aspectByKey.get(previewKey) : null) ?? strongest
  const storySelection = previewAspect ? aspectSelection(previewAspect) : selection
  const brightPlanets = computeBrightPlanets(storySelection, aspects, chart.planets, chart.cusps, chart.ascendant)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) {
      return
    }

    const nodes = Array.from(section.querySelectorAll<HTMLElement>('[data-orbit-aspect]'))
    const visible = new Map<Element, IntersectionObserverEntry>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target, entry)
          } else {
            visible.delete(entry.target)
          }
        }

        const nearest = [...visible.values()].sort((a, b) => {
          const focusLine = window.innerHeight * 0.42
          const aDistance = Math.abs(a.boundingClientRect.top + a.boundingClientRect.height / 2 - focusLine)
          const bDistance = Math.abs(b.boundingClientRect.top + b.boundingClientRect.height / 2 - focusLine)
          return aDistance - bDistance
        })[0]

        const key = nearest?.target.getAttribute('data-orbit-aspect')
        if (key && aspectByKey.has(key)) {
          setPreviewKey((current) => (current === key ? current : key))
        }
      },
      {
        rootMargin: '-20% 0px -48% 0px',
        threshold: [0, 0.25, 0.6],
      },
    )

    for (const node of nodes) {
      observer.observe(node)
    }

    return () => observer.disconnect()
  }, [aspectByKey])

  if (aspects.length === 0) {
    return null
  }

  const previewStyle = previewAspect ? ASPECT_STYLE[previewAspect.type] : null

  return (
    <section
      aria-label={t('aspects.title')}
      className="w-full max-w-5xl lg:grid lg:grid-cols-[minmax(18rem,0.92fr)_minmax(22rem,1.08fr)] lg:items-start lg:gap-8"
      ref={sectionRef}
    >
      <div className="hidden lg:block lg:self-stretch">
        <div className="sticky top-[calc(5rem+var(--safe-area-top))] overflow-hidden rounded-[2rem] border border-accent/15 bg-surface/80 p-5 shadow-[0_24px_80px_rgba(5,1,15,0.38)] backdrop-blur-xl">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(201,168,255,0.14),transparent_58%)]"
          />
          <div className="relative">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              {t('aspects.title')}
            </p>
            <div aria-hidden className="pointer-events-none mx-auto mt-2 max-w-[22rem]" inert>
              <ChartWheel
                aspects={aspects}
                chart={chart}
                isAspectDimmed={(aspect) => isAspectDimmed(aspect, storySelection, brightPlanets)}
                isPlanetDimmed={(id) => isPlanetDimmed(id, storySelection, brightPlanets)}
                moonLongitudeRange={moonLongitudeRange}
                onSelectAngle={noop}
                onSelectHouse={noop}
                onSelectPlanet={noop}
                onSelectSign={noop}
                revealed
                selection={storySelection}
              />
            </div>
            {previewAspect && previewStyle && (
              <div className="mx-auto mt-1 min-h-14 max-w-sm text-center">
                <p className="text-sm font-bold text-foreground">
                  <span style={{ color: previewStyle.color }}>
                    <AstroGlyph glyph={PLANET_GLYPHS[previewAspect.a]} />
                  </span>{' '}
                  {t(`planets.${previewAspect.a}`)}
                  <span aria-hidden className="mx-2 text-foreground-faint">
                    <AstroGlyph glyph={previewStyle.glyph} />
                  </span>
                  <span style={{ color: previewStyle.color }}>
                    <AstroGlyph glyph={PLANET_GLYPHS[previewAspect.b]} />
                  </span>{' '}
                  {t(`planets.${previewAspect.b}`)}
                </p>
                <p className="mt-1 text-xs" style={{ color: previewStyle.color }}>
                  {t(`aspects.${previewAspect.type}Vibe`)}
                  <span className="text-foreground-faint">
                    {' '}
                    · {t('aspects.orbLabel')} {previewAspect.orb}°
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl lg:max-w-none">
        <AspectSection
          aspects={aspects}
          onPreview={(aspect) => setPreviewKey(aspectStoryKey(aspect))}
          onSelect={onSelect}
          previewKey={previewAspect ? aspectStoryKey(previewAspect) : undefined}
          selection={selection}
          storyMode
        />
      </div>
    </section>
  )
}
