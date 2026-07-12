'use client'

import { LOCALE_LANGUAGE_TAGS, type PublicLocale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { track } from '@/lib/analytics/browser'

import { loadBirth, toBirthInput } from '../birth-storage'
import { elementOfSign } from '../chart/astrology'
import { ELEMENT_COLORS, PLANET_GLYPHS } from '../chart/data'
import type { NatalChart } from '../chart/types'
import styles from '../constellation.module.css'
import { computeChart } from '../ephemeris'
import { aspectTone } from '../interpretations/types'
import Starfield from '../Starfield'
import { localDateKey, seededPick } from './daily'
import MoonPhase from './MoonPhase'
import { loadReadings } from './readings'
import type { StationPlanetId, TodayReadings } from './readings/types'
import SignArt from './SignArt'
import { computeSkyToday, type SkyToday } from './sky'
import { computePersonalToday, type PersonalToday } from './transits'

type Data = {
  date: Date
  dateKey: string
  sky: SkyToday
  readings: TodayReadings
  natal: NatalChart | null
  personal: PersonalToday | null
}

export default function TodayFlow() {
  const t = useTranslations('Today')
  const tc = useTranslations('Constellation')
  const locale = useLocale() as PublicLocale
  const [data, setData] = useState<Data | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const now = new Date()
        const [sky, readings] = await Promise.all([computeSkyToday(now), loadReadings(locale)])
        const stored = loadBirth()
        let natal: NatalChart | null = null
        let personal: PersonalToday | null = null

        if (stored) {
          natal = await computeChart(toBirthInput(stored))
          personal = computePersonalToday(sky.positions, natal)
        }

        if (!cancelled) {
          setData({ date: now, dateKey: localDateKey(now), sky, readings, natal, personal })
          track('today_open', { personalized: stored !== null })
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

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const payload = { title: t('meta.title'), text: t('share.text'), url }

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(payload)
        track('today_share', { method: 'web_share' })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success(t('share.copied'))
      track('today_share', { method: 'clipboard' })
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  }

  const homeHref = `/${locale}/`

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night-sky px-3 pb-16 pt-[calc(4rem+var(--safe-area-top))] text-foreground sm:px-4 md:pt-[calc(2rem+var(--safe-area-top))]">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center">
        <header className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{t('hero.eyebrow')}</p>
          <h1 className="mt-2 bg-hero-gradient bg-clip-text text-3xl font-extrabold text-transparent">
            {t('hero.title')}
          </h1>
          {data && (
            <p className="mt-3 text-sm text-foreground-muted/90">
              {new Intl.DateTimeFormat(LOCALE_LANGUAGE_TAGS[locale], { dateStyle: 'full' }).format(data.date)}
            </p>
          )}
        </header>

        {!data && !failed && <p className="mt-10 animate-pulse text-sm text-foreground-subtle">{t('computing')}</p>}
        {failed && <p className="mt-10 text-sm text-danger">{tc('form.error')}</p>}

        {data && <TodayBody data={data} homeHref={homeHref} onShare={share} t={t} tc={tc} />}
      </div>
    </main>
  )
}

type T = ReturnType<typeof useTranslations>

function TodayBody({
  data,
  homeHref,
  onShare,
  t,
  tc,
}: {
  data: Data
  homeHref: string
  onShare: () => void
  t: T
  tc: T
}) {
  const { sky, readings, personal, dateKey } = data
  const element = elementOfSign(sky.moonSign)
  const color = ELEMENT_COLORS[element]

  const headline = sky.headline
  const headlineText = headline
    ? readings.headline[aspectTone(headline.type)]
        .replace('{a}', tc(`planets.${headline.a}`))
        .replace('{b}', tc(`planets.${headline.b}`))
    : null

  const stationNotes = sky.stations
    .map((s) => readings.station[s.planet as StationPlanetId]?.[s.kind])
    .filter((note): note is string => Boolean(note))

  const dos = seededPick(readings.do[element], 3, `${dateKey}:do`)
  const donts = seededPick(readings.dont[element], 3, `${dateKey}:dont`)

  return (
    <div className="w-full space-y-5">
      {/* Moon visual + today's sky */}
      <section className={`${styles.card} rounded-3xl border bg-surface-2 p-5 backdrop-blur`}>
        <div className="flex items-center justify-center gap-5">
          <MoonPhase className="h-20 w-20 shrink-0" phaseAngle={sky.phaseAngle} />
          <SignArt className="h-24 w-24 shrink-0" sign={sky.moonSign} />
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <p className="text-base font-bold text-foreground">
            {t('sky.moonIn', { sign: tc(`signs.${sky.moonSign}`) })}
          </p>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {t(`phases.${sky.phase}`)}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">{readings.moonInSign[sky.moonSign]}</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{readings.moonPhase[sky.phase]}</p>

        {headlineText && (
          <p className="mt-3 rounded-xl bg-surface px-3 py-2.5 text-sm leading-relaxed text-foreground-secondary">
            {headline && (
              <span className="mr-1.5 text-brand">
                {PLANET_GLYPHS[headline.a]} {PLANET_GLYPHS[headline.b]}
              </span>
            )}
            {headlineText}
          </p>
        )}

        {stationNotes.map((note) => (
          <p
            className="mt-3 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-sm leading-relaxed text-foreground-secondary"
            key={note}
          >
            {note}
          </p>
        ))}

        {sky.retrogrades.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {sky.retrogrades.map((id) => (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-danger/15 px-2.5 py-1 text-[11px] font-medium text-danger"
                key={id}
              >
                ℞ {t('retroChip', { name: tc(`planets.${id}`) })}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Personal layer */}
      <section className={`${styles.card} rounded-3xl border bg-surface-2 p-5 backdrop-blur`}>
        <h2 className="text-sm font-bold text-foreground">{t('personal.title')}</h2>

        {personal ? (
          <div className="mt-3 space-y-3">
            {personal.moonHouse !== null && (
              <Reading label={t('personal.stageTitle')} text={readings.moonHouse[personal.moonHouse]} />
            )}
            {personal.moonContacts.map((c) => (
              <Reading
                key={c.target}
                label={t('personal.highlightTitle')}
                text={readings.moonContact[c.target][c.tone] ?? ''}
              />
            ))}
            {personal.slowTransit && (
              <Reading
                label={t('personal.bigFlowTitle')}
                text={(readings.slowTransit[personal.slowTransit.planet][personal.slowTransit.tone] ?? '').replace(
                  '{point}',
                  readings.points[personal.slowTransit.point],
                )}
              />
            )}
            <p className="pt-1 text-[11px] leading-relaxed text-foreground-faint">{t('personal.privacy')}</p>
          </div>
        ) : (
          <div className="mt-3 text-center">
            <p className="text-sm font-semibold text-foreground-secondary">{t('personal.emptyTitle')}</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-foreground-subtle">
              {t('personal.emptyHint')}
            </p>
            <Link
              className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white active:scale-[0.98]"
              href={homeHref}
            >
              {t('personal.cta')}
            </Link>
            <p className="mt-3 text-[11px] leading-relaxed text-foreground-faint">{t('personal.privacy')}</p>
          </div>
        )}
      </section>

      {/* Do & Don't */}
      <section className={`${styles.card} rounded-3xl border bg-surface-2 p-5 backdrop-blur`}>
        <h2 className="text-sm font-bold text-foreground">{t('doDont.title')}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-positive">
              {t('doDont.doLabel')}
            </p>
            <ul className="space-y-1.5">
              {dos.map((item) => (
                <li className="text-xs leading-relaxed text-foreground-secondary" key={item}>
                  ✦ {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-danger">
              {t('doDont.dontLabel')}
            </p>
            <ul className="space-y-1.5">
              {donts.map((item) => (
                <li className="text-xs leading-relaxed text-foreground-subtle" key={item}>
                  ✧ {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 pt-1">
        <button
          className="rounded-full border border-border-2 bg-surface-2 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition active:scale-95 hover:bg-surface-3"
          onClick={onShare}
          type="button"
        >
          {t('share.button')}
        </button>
        <Link
          className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
          href={homeHref}
        >
          {t('toChart')}
        </Link>
        <Link
          className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
          href={`${homeHref}love/`}
        >
          {t('toLove')}
        </Link>
        <p className="mt-1 text-xs text-foreground-faint">{t('tomorrow')}</p>
      </div>
    </div>
  )
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
