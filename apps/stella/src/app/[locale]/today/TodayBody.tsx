import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { elementOfSign } from '@/chart/astrology'
import { ELEMENT_COLORS, PLANET_GLYPHS } from '@/chart/data'
import AstroGlyph from '@/components/AstroGlyph'
import cardStyles from '@/components/card.module.css'
import { PersonalizeCard } from '@/components/PersonalizeCard'
import Reading from '@/components/Reading'
import { ReadingActions } from '@/components/ReadingActions'
import { SignFigure } from '@/components/SignFigure'
import { aspectTone } from '@/content/interpretations/types'

import { seededPick } from './daily'
import LuckySection from './LuckySection'
import MoonPhase from './MoonPhase'
import type { StationPlanetId } from './readings/types'
import type { DailyReading } from './useDailyReading'

/** The shared daily reading plus the one thing only /today shows. */
export type TodayData = DailyReading & {
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
          <div className="mt-3">
            <PersonalizeCard
              cta={t('personal.cta')}
              hint={t('personal.emptyHint')}
              homeHref={homeHref}
              title={t('personal.emptyTitle')}
            />
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
      <ReadingActions
        homeHref={homeHref}
        onShare={onShare}
        shareLabel={t('share.button')}
        shared={shared}
        sharedFootnote={t('tomorrow')}
        showPrivacy
      />
    </div>
  )
}
