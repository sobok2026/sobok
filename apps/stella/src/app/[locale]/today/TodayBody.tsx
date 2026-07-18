import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { elementOfSign } from '@/chart/astrology'
import { ELEMENT_COLORS, PLANET_GLYPHS } from '@/chart/data'
import type { UnknownBirthTimeAnalysis } from '@/chart/ephemeris'
import type { NatalChart } from '@/chart/types'
import AstroGlyph from '@/components/AstroGlyph'
import cardStyles from '@/components/card.module.css'
import Reading from '@/components/Reading'
import { SignFigure } from '@/components/SignFigure'
import { aspectTone } from '@/content/interpretations/types'
import type { StoredBirth } from '@/lib/birth-storage'

import { seededPick } from './daily'
import LuckySection from './LuckySection'
import MoonPhase from './MoonPhase'
import type { StationPlanetId, TodayReadings } from './readings/types'
import type { LuckyRecommendations } from './recommendations/types'
import type { SkyToday } from './sky'
import type { PersonalToday } from './transits'

/** Everything the page resolves asynchronously before the reading can render at once. */
export type TodayData = {
  dateKey: string
  utcOffsetMinutes: number
  birth: StoredBirth | null
  sky: SkyToday
  readings: TodayReadings
  natal: NatalChart | null
  unknownTime: UnknownBirthTimeAnalysis | null
  personal: PersonalToday | null
  lucky: LuckyRecommendations
  /** Tomorrow's lucky food name for the preview teaser — null on shared views, which pin a past day. */
  tomorrowFood: string | null
}

type TodayBodyProps = {
  data: TodayData
  homeHref: string
  onShare: () => void
  shared: boolean
}

export default function TodayBody({ data, homeHref, onShare, shared }: TodayBodyProps) {
  const t = useTranslations('Today')
  const tc = useTranslations('Constellation')
  const ts = useTranslations('Shared')
  const { sky, readings, personal, lucky, dateKey, unknownTime } = data
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
    <div className="w-full space-y-3 sm:space-y-5">
      {/* Moon visual + today's sky */}
      <section className={`${cardStyles.card} p-4 rounded-3xl border bg-surface-2 backdrop-blur sm:p-5`}>
        <div className="flex items-center justify-center gap-5">
          <MoonPhase className="h-20 w-20 shrink-0" phaseAngle={sky.phaseAngle} />
          <SignFigure className="h-24 w-24 shrink-0" sign={sky.moonSign} />
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <p className="text-base font-bold text-foreground">
            {t('sky.moonIn', { sign: tc(`signs.${sky.moonSign}`) })}
          </p>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {tc(`phases.${sky.phase}`)}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">{readings.moonInSign[sky.moonSign]}</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{readings.moonPhase[sky.phase]}</p>

        {headlineText && (
          <p className="mt-3 rounded-xl bg-surface px-3 py-2.5 text-sm leading-relaxed text-foreground-secondary">
            {headline && (
              <span className="mr-1.5 text-brand">
                <AstroGlyph glyph={PLANET_GLYPHS[headline.a]} /> <AstroGlyph glyph={PLANET_GLYPHS[headline.b]} />
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
                <AstroGlyph glyph="℞" /> {t('retroChip', { name: tc(`planets.${id}`) })}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Personal layer */}
      <section className={`${cardStyles.card} p-4 rounded-3xl border bg-surface-2 backdrop-blur sm:p-5`}>
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
            {unknownTime && (
              <p className="rounded-xl bg-accent/10 px-3 py-2.5 text-[11px] leading-relaxed text-foreground-subtle">
                {t('personal.noTimeNote')}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-3 text-center">
            <p className="text-sm font-semibold text-foreground-secondary">{t('personal.emptyTitle')}</p>
            <p className="mx-auto mt-1 text-xs leading-relaxed text-foreground-subtle">{t('personal.emptyHint')}</p>
            <Link
              className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white active:scale-[0.98] motion-reduce:active:scale-100"
              href={homeHref}
            >
              {t('personal.cta')}
            </Link>
          </div>
        )}
      </section>

      <LuckySection lucky={lucky} namespace="Today" sky={sky} />

      {data.tomorrowFood && (
        <Link
          className={`${cardStyles.card} block rounded-3xl border bg-surface-2 p-4 backdrop-blur transition hover:bg-surface-3 sm:p-5`}
          href={`${homeHref}/tomorrow`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">{t('teaser.kicker')}</p>
              <p className="mt-1 text-sm font-bold text-foreground">{t('teaser.food', { food: data.tomorrowFood })}</p>
            </div>
            <span aria-hidden="true" className="shrink-0 text-lg text-accent">
              →
            </span>
          </div>
        </Link>
      )}

      {/* Do & Don't */}
      <section className={`${cardStyles.card} p-4 rounded-3xl border bg-surface-2 backdrop-blur sm:p-5`}>
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
        {shared ? (
          <a
            className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
            href={homeHref}
          >
            {ts('createOwn')}
          </a>
        ) : (
          <>
            <button
              className="rounded-full border border-border-2 bg-surface-2 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition active:scale-95 motion-reduce:active:scale-100 hover:bg-surface-3"
              onClick={onShare}
              type="button"
            >
              {t('share.button')}
            </button>
            <p className="max-w-sm text-center text-[11px] leading-relaxed text-foreground-faint">{ts('privacy')}</p>
          </>
        )}
        {shared && <p className="mt-1 text-xs text-foreground-faint">{t('tomorrow')}</p>}
      </div>
    </div>
  )
}
