'use client'

import { LOCALE_LANGUAGE_TAGS } from '@sobok/domain/locale'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { track } from '@/lib/analytics/browser'
import type { StoredBirth } from '../birth-storage'
import { toBirthInput } from '../birth-storage'
import { elementOfSign } from '../chart/astrology'
import { ELEMENT_COLORS, PLANET_GLYPHS } from '../chart/data'
import type { NatalChart } from '../chart/types'
import styles from '../constellation.module.css'
import { computeChart } from '../ephemeris'
import { HeroTitle } from '../HeroTitle'
import { aspectTone } from '../interpretations/types'
import SharedLinkError from '../SharedLinkError'
import Starfield from '../Starfield'
import { buildShareURL, shareLink } from '../share'
import { useBirthSource } from '../useBirthSource'
import { localDayAnchor, seededPick, snapshotAtLocalNoon } from './daily'
import MoonPhase from './MoonPhase'
import { loadReadings } from './readings'
import type { StationPlanetId, TodayReadings } from './readings/types'
import SignArt from './SignArt'
import { computeSkyToday, type SkyToday } from './sky'
import { computePersonalToday, type PersonalToday } from './transits'

type Data = {
  dateKey: string
  utcOffsetMinutes: number
  birth: StoredBirth | null
  sky: SkyToday
  readings: TodayReadings
  natal: NatalChart | null
  personal: PersonalToday | null
}

export default function TodayFlow() {
  const [data, setData] = useState<Data | null>(null)
  const [failed, setFailed] = useState(false)
  const birthSource = useBirthSource('today')
  const locale = useLocale()
  const t = useTranslations('Today')
  const ts = useTranslations('Shared')
  const tc = useTranslations('Constellation')

  const { birth, payload: sharedPayload, shared } = birthSource
  const sourceReady = birthSource.status === 'ready'

  useEffect(() => {
    let cancelled = false

    if (!sourceReady) {
      return () => {
        cancelled = true
      }
    }

    async function run() {
      try {
        setFailed(false)
        setData(null)

        const anchor = sharedPayload ?? localDayAnchor()
        const snapshotAt = snapshotAtLocalNoon(anchor)
        const [sky, readings] = await Promise.all([computeSkyToday(snapshotAt), loadReadings(locale)])

        let natal: NatalChart | null = null
        let personal: PersonalToday | null = null

        if (birth) {
          natal = await computeChart(toBirthInput(birth))
          personal = computePersonalToday(sky.positions, natal)
        }

        if (!cancelled) {
          setData({
            dateKey: anchor.dateKey,
            utcOffsetMinutes: anchor.utcOffsetMinutes,
            birth,
            sky,
            readings,
            natal,
            personal,
          })

          track('view_reading', {
            content_type: 'today',
            personalized: birth !== null,
            time_known: birth?.timeKnown ?? false,
            shared,
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
  }, [birth, locale, shared, sharedPayload?.dateKey, sharedPayload?.utcOffsetMinutes, sourceReady])

  async function share() {
    if (!data) {
      return
    }

    const url = data.birth
      ? buildShareURL(locale, {
          kind: 'today',
          birth: data.birth,
          dateKey: data.dateKey,
          utcOffsetMinutes: data.utcOffsetMinutes,
        })
      : new URL(`/${locale}/today`, window.location.origin).toString()

    const method = await shareLink({
      title: t('meta.title'),
      text: t('share.text'),
      url,
    })

    if (method === 'clipboard') {
      toast.success(t('share.copied'))
    } else if (method === 'failed') {
      toast.error(ts('shareError'))
    }

    if (method === 'web_share' || method === 'clipboard') {
      track('share', { method, content_type: 'today' })
    }
  }

  const homeHref = `/${locale}`

  if (birthSource.status === 'invalid') {
    return <SharedLinkError />
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night-sky px-3 pb-16 pt-[calc(4rem+var(--safe-area-top))] text-foreground sm:px-4 md:pt-[calc(2rem+var(--safe-area-top))]">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center">
        <header className="mb-6 w-full max-w-sm text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{t('hero.eyebrow')}</p>
          <HeroTitle>{t('hero.title')}</HeroTitle>
          {data && (
            <p className="mt-3 text-sm text-foreground-muted/90">
              {new Intl.DateTimeFormat(LOCALE_LANGUAGE_TAGS[locale], { dateStyle: 'full', timeZone: 'UTC' }).format(
                new Date(`${data.dateKey}T12:00:00Z`),
              )}
            </p>
          )}
          {shared && (
            <p className="mx-auto mt-3 w-fit rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent">
              {ts('viewing')}
            </p>
          )}
        </header>

        {!data && !failed && (
          <p className="mt-10 animate-pulse text-sm text-foreground-subtle motion-reduce:animate-none">
            {t('computing')}
          </p>
        )}
        {failed && <p className="mt-10 text-sm text-danger">{tc('form.error')}</p>}

        {data && <TodayBody data={data} homeHref={homeHref} onShare={share} shared={shared} />}
      </div>
    </main>
  )
}

type TodayBodyProps = {
  data: Data
  homeHref: string
  onShare: () => void
  shared: boolean
}

function TodayBody({ data, homeHref, onShare, shared }: TodayBodyProps) {
  const t = useTranslations('Today')
  const tc = useTranslations('Constellation')
  const ts = useTranslations('Shared')
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
          </div>
        ) : (
          <div className="mt-3 text-center">
            <p className="text-sm font-semibold text-foreground-secondary">{t('personal.emptyTitle')}</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-foreground-subtle">
              {t('personal.emptyHint')}
            </p>
            <Link
              className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white active:scale-[0.98] motion-reduce:active:scale-100"
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
        {!shared && (
          <button
            className="rounded-full border border-border-2 bg-surface-2 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition active:scale-95 motion-reduce:active:scale-100 hover:bg-surface-3"
            onClick={onShare}
            type="button"
          >
            {t('share.button')}
          </button>
        )}
        {data.birth && (
          <p className="max-w-sm text-center text-[11px] leading-relaxed text-foreground-faint">{ts('privacy')}</p>
        )}
        {shared ? (
          <a
            className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
            href={homeHref}
          >
            {ts('createOwn')}
          </a>
        ) : (
          <>
            <Link
              className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
              href={homeHref}
            >
              {t('toChart')}
            </Link>
            <Link
              className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
              href={`${homeHref}/love`}
            >
              {t('toLove')}
            </Link>
          </>
        )}
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
