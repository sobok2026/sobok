'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import { big3, signOfPlanet } from '@/chart/astrology'
import { isAstrologyGlyph } from '@/chart/astrology-glyph-paths'
import type { ChartAspect, NatalChart, SignId } from '@/chart/types'
import AstroGlyph from '@/components/AstroGlyph'
import type { Interpretations, ReportChapterId } from '@/content/interpretations/types'

import { CoreSignatureArt } from './CoreSignatureArt'
import styles from './constellation.module.css'
import { NodeAxisArt } from './NodeAxisArt'
import ReportThemeArt, { type ReportThemeChapterId } from './ReportThemeArt'
import { buildReport, type Translator } from './report'

const CHAPTER_GLYPHS: Record<ReportChapterId, string> = {
  core: '☉',
  signature: '✦',
  path: '☊',
  mind: '☿',
  love: '♀',
  work: 'MC',
  money: '⊗',
  root: '☾',
  closing: '✧',
}

function ChapterGlyph({ id }: { id: ReportChapterId }) {
  const glyph = CHAPTER_GLYPHS[id]
  return isAstrologyGlyph(glyph) ? <AstroGlyph glyph={glyph} /> : <span aria-hidden>{glyph}</span>
}

function isThemeChapter(id: ReportChapterId): id is ReportThemeChapterId {
  return id === 'mind' || id === 'love' || id === 'work' || id === 'money' || id === 'root'
}

/**
 * The composed long-form reading below the wheel — weighted signature first,
 * then life-theme chapters.
 */
export default function ReportSection({
  aspects,
  chart,
  interpretations,
  moonSigns,
  moonSignUncertain = false,
}: {
  aspects: ChartAspect[]
  chart: NatalChart
  interpretations: Interpretations
  moonSigns?: readonly SignId[]
  moonSignUncertain?: boolean
}) {
  const t = useTranslations('Constellation')
  const locale = useLocale()
  const { report } = interpretations

  // report.ts is decoupled from next-intl (its own loose Translator); the typed
  // `t` only supplies the name vocabulary, so hand it across the seam as that type.
  const chapters = useMemo(
    () => buildReport(chart, aspects, interpretations, t as Translator, { moonSignUncertain }),
    [aspects, chart, interpretations, moonSignUncertain, t],
  )
  const chapterNodes = useRef(new Map<ReportChapterId, HTMLElement>())
  const chapterKey = chapters.map((chapter) => chapter.id).join(':')
  const [activeId, setActiveId] = useState<ReportChapterId | null>(chapters[0]?.id ?? null)

  const { sunSign, moonSign, risingSign } = big3(chart)
  const reportMoonSigns = moonSigns ?? (moonSign ? [moonSign] : [])
  const southNodeSign = signOfPlanet(chart, 'southNode')
  const northNodeSign = signOfPlanet(chart, 'northNode')
  const resolvedActiveId = activeId && chapters.some((chapter) => chapter.id === activeId) ? activeId : chapters[0]?.id
  const activeIndex = Math.max(
    0,
    chapters.findIndex((chapter) => chapter.id === resolvedActiveId),
  )
  const progress = chapters.length <= 1 ? 1 : activeIndex / (chapters.length - 1)

  useEffect(() => {
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
          const focusLine = window.innerHeight * 0.34
          const aDistance = Math.abs(
            a.boundingClientRect.top + Math.min(a.boundingClientRect.height / 2, 140) - focusLine,
          )
          const bDistance = Math.abs(
            b.boundingClientRect.top + Math.min(b.boundingClientRect.height / 2, 140) - focusLine,
          )
          return aDistance - bDistance
        })[0]

        const id = nearest?.target.getAttribute('data-report-chapter') as ReportChapterId | null
        if (id) {
          setActiveId((current) => (current === id ? current : id))
        }
      },
      {
        rootMargin: '-16% 0px -58% 0px',
        threshold: [0, 0.15, 0.5],
      },
    )

    for (const node of chapterNodes.current.values()) {
      observer.observe(node)
    }

    return () => observer.disconnect()
  }, [chapterKey])

  return (
    <section className="w-full max-w-5xl">
      <header className="mx-auto max-w-xl text-center">
        <h2 className="text-lg font-bold text-foreground">{report.title}</h2>
        <p className="mx-auto mt-1 text-xs leading-relaxed text-foreground-subtle">{report.subtitle}</p>
        {chart.ascendant === null && <p className="mt-2 text-[11px] text-foreground-faint">{report.noTimeNote}</p>}
      </header>

      <div className="mt-4 lg:grid lg:grid-cols-[13rem_minmax(0,36rem)] lg:justify-center lg:gap-8">
        <nav aria-label={report.title} className="hidden lg:block">
          <div className="sticky top-[calc(5rem+var(--safe-area-top))] rounded-2xl border border-accent/10 bg-surface/70 p-4 backdrop-blur-xl">
            <div aria-hidden className="absolute bottom-6 left-[2.125rem] top-6 w-px bg-white/10" />
            <div
              aria-hidden
              className="absolute left-[2.125rem] top-6 h-[calc(100%-3rem)] w-px origin-top bg-linear-to-b from-accent-cool via-brand to-accent-warm transition-transform duration-500"
              style={{ transform: `scaleY(${progress})` }}
            />
            <ol className="relative space-y-1">
              {chapters.map((chapter, index) => {
                const active = chapter.id === resolvedActiveId
                const reached = index <= activeIndex

                return (
                  <li key={chapter.id}>
                    <a
                      aria-current={active ? 'location' : undefined}
                      className={`group flex items-center gap-2.5 rounded-xl px-1.5 py-2 text-xs transition ${active ? 'bg-accent/10 text-foreground' : 'text-foreground-subtle hover:bg-surface-2 hover:text-foreground-secondary'}`}
                      href={`#report-chapter-${chapter.id}`}
                    >
                      <span
                        className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-[#120b24] text-[11px] transition ${active ? 'scale-110 border-accent text-accent shadow-[0_0_18px_rgba(201,168,255,0.35)]' : reached ? 'border-brand/50 text-brand' : 'border-white/15 text-foreground-faint'}`}
                      >
                        <ChapterGlyph id={chapter.id} />
                      </span>
                      <span className="leading-tight">{chapter.title}</span>
                    </a>
                  </li>
                )
              })}
            </ol>
          </div>
        </nav>

        <div className="space-y-7 lg:space-y-5">
          {chapters.map((chapter, index) => (
            <article
              className={`${styles.storyChapter} ${chapter.id === resolvedActiveId ? styles.storyChapterActive : ''} scroll-mt-32 rounded-2xl border bg-surface-2 p-4 backdrop-blur sm:p-5`}
              data-report-chapter={chapter.id}
              id={`report-chapter-${chapter.id}`}
              key={chapter.id}
              ref={(node) => {
                if (node) {
                  chapterNodes.current.set(chapter.id, node)
                } else {
                  chapterNodes.current.delete(chapter.id)
                }
              }}
            >
              <header className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-sm text-accent lg:hidden">
                  <ChapterGlyph id={chapter.id} />
                </span>
                <h3 className="min-w-0 flex-1 text-base font-bold text-foreground">{chapter.title}</h3>
                <span className="shrink-0 text-[11px] tabular-nums text-foreground-faint lg:hidden">
                  {index + 1} / {chapters.length}
                </span>
              </header>
              <div aria-hidden className="mt-3 h-0.5 overflow-hidden rounded-full bg-white/8 lg:hidden">
                <div
                  className="h-full origin-left rounded-full bg-linear-to-r from-accent-cool via-brand to-accent-warm"
                  style={{ transform: `scaleX(${(index + 1) / chapters.length})` }}
                />
              </div>
              {chapter.id === 'core' && sunSign && (
                <CoreSignatureArt moonSigns={reportMoonSigns} risingSign={risingSign} sunSign={sunSign} />
              )}
              {chapter.id === 'path' && southNodeSign && northNodeSign && (
                <NodeAxisArt
                  familiarLabel={report.path.familiarLabel}
                  growthLabel={report.path.growthLabel}
                  northSign={northNodeSign}
                  southSign={southNodeSign}
                />
              )}
              {isThemeChapter(chapter.id) && chapter.visual && (
                <ReportThemeArt chapterId={chapter.id} chart={chart} visual={chapter.visual} />
              )}
              {chapter.intro && <p className="mt-2 text-xs leading-relaxed text-foreground-subtle">{chapter.intro}</p>}
              {chapter.paragraphs.map((para) => (
                <div className="mt-4 first-of-type:mt-3" key={`${chapter.id}-${para.kicker ?? para.text}`}>
                  {para.kicker && <p className="text-xs font-semibold text-accent">{para.kicker}</p>}
                  {para.note && <p className="mt-1 text-xs font-semibold text-foreground-subtle">{para.note}</p>}
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground-secondary">{para.text}</p>
                </div>
              ))}
              {chapter.id === 'love' && (
                <p className="mt-4">
                  <Link
                    className="text-xs font-semibold text-accent underline-offset-4 transition hover:underline"
                    href={`/${locale}/love`}
                  >
                    {report.loveCta}
                  </Link>
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
