'use client'

import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { track } from '@/lib/analytics/browser'

import { loadBirth, toBirthInput } from '../birth-storage'
import { computeAspects } from '../chart/astrology'
import type { SignId } from '../chart/types'
import styles from '../constellation.module.css'
import { computeChart } from '../ephemeris'
import { loadInterpretations } from '../interpretations'
import type { Interpretations } from '../interpretations/types'
import { aspectTone, fill, pairKey } from '../interpretations/types'
import Starfield from '../Starfield'
import {
  deriveLoveProfile,
  type LoveProfile,
  type LoveWindow,
  type LoveWindowPurpose,
  scanLoveTransits,
  windowPurpose,
} from './compute'
import PersonaArt from './PersonaArt'
import { loadLoveReadings } from './readings'
import type { LoveReadings } from './readings/types'

/** How many timing windows the section shows at most. */
const MAX_WINDOWS = 6

/** Chip color per window purpose — accent invites, green opens, danger warns. */
const PURPOSE_CHIP: Record<LoveWindowPurpose, string> = {
  meeting: 'bg-accent/15 text-accent',
  opening: 'bg-positive/15 text-positive',
  deepening: 'bg-foreground/10 text-foreground-secondary',
  caution: 'bg-danger/15 text-danger',
}

type Data = {
  readings: LoveReadings
  /** Natal venus copy and aspect pairs, shared with the chart page. */
  interpretations: Interpretations
  /** Null until the visitor has saved birth data on the home page. */
  profile: LoveProfile | null
  windows: LoveWindow[]
  timeKnown: boolean
}

export default function LoveFlow() {
  const t = useTranslations('Love')
  const tc = useTranslations('Constellation')
  const locale = useLocale()
  const [data, setData] = useState<Data | null>(null)
  const [failed, setFailed] = useState(false)
  const homeHref = `/${locale}`

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const payload = { title: t('meta.title'), text: t('share.text'), url }

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(payload)
        track('share', { method: 'web_share', content_type: 'love' })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success(t('share.copied'))
      track('share', { method: 'clipboard', content_type: 'love' })
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  }

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const [readings, interpretations] = await Promise.all([loadLoveReadings(locale), loadInterpretations(locale)])
        const stored = loadBirth()?.birth ?? null
        let profile: LoveProfile | null = null
        let windows: LoveWindow[] = []

        if (stored) {
          const chart = await computeChart(toBirthInput(stored))
          profile = deriveLoveProfile(chart, computeAspects(chart.planets))
          windows = await scanLoveTransits(chart, new Date())
        }

        if (!cancelled) {
          setData({
            readings,
            interpretations,
            profile,
            windows,
            timeKnown: stored?.timeKnown ?? false,
          })

          track('view_reading', {
            content_type: 'love',
            personalized: stored !== null,
            time_known: stored?.timeKnown ?? false,
          })
        }
      } catch {
        if (!cancelled) {
          setFailed(true)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [locale])

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night-sky px-3 pb-16 pt-[calc(4rem+var(--safe-area-top))] text-foreground sm:px-4 md:pt-[calc(2rem+var(--safe-area-top))]">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center">
        <header className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{t('hero.eyebrow')}</p>
          <h1 className="mt-2 bg-hero-gradient bg-clip-text text-3xl font-extrabold text-transparent">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground-muted/90">{t('hero.subtitle')}</p>
        </header>

        {!data && !failed && (
          <p className="mt-10 animate-pulse text-sm text-foreground-subtle motion-reduce:animate-none">
            {t('computing')}
          </p>
        )}
        {failed && <p className="mt-10 text-sm text-danger">{tc('form.error')}</p>}

        {data && !data.profile && <EmptyState homeHref={homeHref} />}
        {data?.profile && (
          <LoveBody data={{ ...data, profile: data.profile }} homeHref={homeHref} locale={locale} onShare={share} />
        )}
      </div>
    </main>
  )
}

function EmptyState({ homeHref }: { homeHref: string }) {
  const t = useTranslations('Love')

  return (
    <section className={`${styles.card} w-full rounded-3xl border bg-surface-2 p-6 text-center backdrop-blur`}>
      <p className="text-sm font-semibold text-foreground-secondary">{t('empty.title')}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-foreground-subtle">{t('empty.hint')}</p>
      <Link
        className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white active:scale-[0.98] motion-reduce:active:scale-100"
        href={homeHref}
      >
        {t('empty.cta')}
      </Link>
    </section>
  )
}

type LoveBodyProps = {
  data: Data & { profile: LoveProfile }
  homeHref: string
  locale: Locale
  onShare: () => void
}

function LoveBody({ data, homeHref, locale, onShare }: LoveBodyProps) {
  const t = useTranslations('Love')
  const tc = useTranslations('Constellation')
  const { readings, interpretations, profile, windows, timeKnown } = data
  const signName = (id: SignId) => tc(`signs.${id}`)

  // Natal Venus copy is shared with the chart page — retro-aware like the detail panel.
  const venusRetroText = profile.venusRetro ? interpretations.retro.venus?.[profile.venusSign] : undefined
  const venusText = venusRetroText ?? interpretations.planets.venus[profile.venusSign]
  const aspectText = resolveAspectText(profile, interpretations)
  const persona = readings.persona[profile.descendantSign]
  const shownWindows = windows.slice(0, MAX_WINDOWS)
  const today = new Date()

  return (
    <div className="w-full space-y-5">
      {/* How you love */}
      <section className={`${styles.card} rounded-3xl border bg-surface-2 p-5 backdrop-blur`}>
        <h2 className="text-sm font-bold text-foreground">{t('style.title')}</h2>
        <div className="mt-3 space-y-4">
          <Reading
            label={fill(interpretations.report.kicker.venus, { sign: signName(profile.venusSign) })}
            text={venusText}
          />
          <Reading
            label={t('style.marsKicker', { sign: signName(profile.marsSign) })}
            text={readings.marsInLove[profile.marsSign]}
          />
          {aspectText && <Reading label={t('style.habitKicker')} text={aspectText} />}
        </div>
      </section>

      {/* My magnetism — outer (rising) and inner (moon) */}
      <section className={`${styles.card} rounded-3xl border bg-surface-2 p-5 backdrop-blur`}>
        <h2 className="text-sm font-bold text-foreground">{t('magnetism.title')}</h2>
        <div className="mt-3 space-y-4">
          {profile.risingSign ? (
            <Reading
              label={t('magnetism.looksKicker', { sign: signName(profile.risingSign) })}
              text={readings.looks[profile.risingSign]}
            />
          ) : (
            <p className="text-[11px] leading-relaxed text-foreground-faint">{t('magnetism.noRisingNote')}</p>
          )}
          <Reading
            label={t('magnetism.innerKicker', { sign: signName(profile.moonSign) })}
            text={readings.inner[profile.moonSign]}
          />
        </div>
      </section>

      {/* Using your charm — a playbook */}
      <section className={`${styles.card} rounded-3xl border bg-surface-2 p-5 backdrop-blur`}>
        <h2 className="text-sm font-bold text-foreground">{t('playbook.title')}</h2>
        <div className="mt-3 space-y-4">
          <Reading
            label={t('playbook.stylingKicker', { sign: signName(profile.venusSign) })}
            text={readings.styling[profile.venusSign]}
          />
          <Reading
            label={t('playbook.flirtKicker', { sign: signName(profile.marsSign) })}
            text={readings.flirting[profile.marsSign]}
          />
          <Reading label={t('playbook.cautionKicker')} text={readings.caution[profile.venusSign]} />
        </div>
      </section>

      {/* Destined partner */}
      <section className={`${styles.card} rounded-3xl border bg-surface-2 p-5 backdrop-blur`}>
        <h2 className="text-sm font-bold text-foreground">{t('partner.title')}</h2>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
          {t('partner.kicker', { sign: signName(profile.descendantSign) })}
        </p>
        <PersonaArt className="mx-auto mt-3 h-32 w-32" sign={profile.descendantSign} />
        <p className="mt-2 text-center text-lg font-bold text-foreground">{persona.name}</p>
        <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">{persona.text}</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-surface px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-positive">
              {t('partner.matchLabel')}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground-secondary">{persona.match}</p>
          </div>
          <div className="rounded-xl bg-surface px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-danger">
              {t('partner.frictionLabel')}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground-subtle">{persona.friction}</p>
          </div>
        </div>
        {profile.seventhHouse.length > 0 && (
          <div className="mt-4 space-y-3">
            {profile.seventhHouse.map((id) => (
              <Reading
                key={id}
                label={t('partner.houseKicker', { planet: tc(`planets.${id}`) })}
                text={readings.seventhPlanet[id]}
              />
            ))}
          </div>
        )}
        {profile.solarDescendant && (
          <p className="mt-4 text-[11px] leading-relaxed text-foreground-faint">{t('partner.solarNote')}</p>
        )}
      </section>

      {/* Love timing — natal baseline + the year ahead */}
      <section className={`${styles.card} rounded-3xl border bg-surface-2 p-5 backdrop-blur`}>
        <h2 className="text-sm font-bold text-foreground">{t('timing.title')}</h2>

        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">{t('timing.natalKicker')}</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground-secondary">
            {readings.natalLove[profile.natalLove]}
          </p>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">{t('timing.upcomingKicker')}</p>
          <p className="mt-1 text-xs leading-relaxed text-foreground-subtle">{t('timing.subtitle')}</p>
          {shownWindows.length === 0 && (
            <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">{readings.timing.empty}</p>
          )}
          {shownWindows.length > 0 && (
            <ol className="mt-3 space-y-3">
              {shownWindows.map((w, i) => {
                const purpose = windowPurpose(w)
                return (
                  <li className="rounded-xl bg-surface px-3 py-2.5" key={`${w.kind}-${i}`}>
                    <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-accent">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${PURPOSE_CHIP[purpose]}`}
                      >
                        {t(`timing.purpose.${purpose}`)}
                      </span>
                      {formatWindowRange(w, locale)}
                      {w.start <= today && (
                        <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                          {t('timing.now')}
                        </span>
                      )}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground-secondary">
                      {windowText(w, readings)}
                    </p>
                  </li>
                )
              })}
            </ol>
          )}
          {!timeKnown && (
            <p className="mt-3 text-[11px] leading-relaxed text-foreground-faint">{t('timing.noTimeNote')}</p>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 pt-1">
        <button
          className="rounded-full border border-border-2 bg-surface-2 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition active:scale-95 motion-reduce:active:scale-100 hover:bg-surface-3"
          onClick={onShare}
          type="button"
        >
          {t('share.button')}
        </button>
        <Link
          className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
          href={`/${locale}/today`}
        >
          {t('toToday')}
        </Link>
        <Link
          className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
          href={homeHref}
        >
          {t('toChart')}
        </Link>
      </div>
    </div>
  )
}

/** Pair fragment for the tightest Venus aspect — same sparse-pair guard as the detail panel. */
function resolveAspectText(profile: LoveProfile, interpretations: Interpretations): string | null {
  if (!profile.venusAspect) {
    return null
  }

  const { a, b, type } = profile.venusAspect
  return interpretations.aspects[pairKey(a, b)]?.[aspectTone(type)] ?? null
}

function windowText(w: LoveWindow, readings: LoveReadings): string {
  if (w.kind === 'venusRetro') {
    return readings.timing.venusRetro
  }
  if (w.kind === 'jupiterDescendant') {
    return readings.timing.jupiterDescendant
  }

  const table = w.kind === 'jupiterVenus' ? readings.timing.jupiterVenus : readings.timing.saturnVenus
  return table[w.tone ?? 'conjunction']
}

/** Month-level range — the 5-day scan step makes day precision an overclaim. */
function formatWindowRange(w: LoveWindow, locale: Locale): string {
  const fmt = new Intl.DateTimeFormat(LOCALE_LANGUAGE_TAGS[locale], { year: 'numeric', month: 'long' })
  return fmt.formatRange(w.start, w.end)
}

function Reading({ label, text }: { label: string; text: string }) {
  if (!text) {
    return null
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground-secondary">{text}</p>
    </div>
  )
}
