import type { Locale } from '@sobok/domain/locale'
import { useTranslations } from 'next-intl'

import type { SignId } from '@/chart/types'
import cardStyles from '@/components/card.module.css'
import Reading from '@/components/Reading'
import type { Interpretations } from '@/content/interpretations/types'
import { aspectTone, fill, pairKey } from '@/content/interpretations/types'
import type { StoredBirth } from '@/lib/birth-storage'

import type { LoveProfile, LoveWindow } from './compute'
import { LoveSignatureArt } from './LoveSignatureArt'
import { LoveTimeline } from './LoveTimeline'
import PersonaArt from './PersonaArt'
import type { LoveReadings } from './readings/types'

/** How many timing windows the section shows at most. */
const MAX_WINDOWS = 6

/** Everything the page resolves asynchronously before the reading can render at once. */
export type LoveData = {
  asOf: Date
  birth: StoredBirth | null
  readings: LoveReadings
  /** Natal venus copy and aspect pairs, shared with the chart page. */
  interpretations: Interpretations
  /** Null until the visitor has saved birth data on the home page. */
  profile: LoveProfile | null
  windows: LoveWindow[]
  timeKnown: boolean
}

type LoveBodyProps = {
  data: LoveData & { profile: LoveProfile }
  homeHref: string
  locale: Locale
  onShare: () => void
  shared: boolean
}

export default function LoveBody({ data, homeHref, locale, onShare, shared }: LoveBodyProps) {
  const t = useTranslations('Love')
  const tc = useTranslations('Constellation')
  const ts = useTranslations('Shared')

  const { readings, interpretations, profile, windows, timeKnown } = data
  const venusRetroText = profile.venusRetro ? interpretations.retro.venus?.[profile.venusSign] : undefined
  const venusText = venusRetroText ?? interpretations.planets.venus[profile.venusSign]
  const aspectText = resolveAspectText(profile, interpretations)
  const persona = readings.persona[profile.descendantSign]
  const stableMoonSign = profile.moonSigns.length === 1 ? profile.moonSigns[0] : null
  const shownWindows = windows.slice(0, MAX_WINDOWS)
  const today = data.asOf

  const signName = (id: SignId) => tc(`signs.${id}`)

  return (
    <div className="w-full space-y-3 sm:space-y-5">
      {/* How you love */}
      <section className={`${cardStyles.card} p-4 rounded-3xl border bg-surface-2 backdrop-blur sm:p-5`}>
        <h2 className="text-sm font-bold text-foreground">{t('style.title')}</h2>
        <LoveSignatureArt profile={profile} />
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
      <section className={`${cardStyles.card} p-4 rounded-3xl border bg-surface-2 backdrop-blur sm:p-5`}>
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
          {stableMoonSign ? (
            <>
              <Reading
                label={t('magnetism.innerKicker', { sign: signName(stableMoonSign) })}
                text={readings.inner[stableMoonSign]}
              />
              {!timeKnown && (
                <p className="text-[11px] leading-relaxed text-foreground-faint">
                  {t('magnetism.moonDateNote', { sign: signName(stableMoonSign) })}
                </p>
              )}
            </>
          ) : (
            <p className="rounded-xl bg-accent/10 px-3 py-2.5 text-[11px] leading-relaxed text-foreground-subtle">
              {t('magnetism.moonRangeNote', {
                from: signName(profile.moonSigns[0]),
                to: signName(profile.moonSigns[1]),
              })}
            </p>
          )}
        </div>
      </section>

      {/* Using your charm — a playbook */}
      <section className={`${cardStyles.card} p-4 rounded-3xl border bg-surface-2 backdrop-blur sm:p-5`}>
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
      <section className={`${cardStyles.card} p-4 rounded-3xl border bg-surface-2 backdrop-blur sm:p-5`}>
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
      <section className={`${cardStyles.card} p-4 rounded-3xl border bg-surface-2 backdrop-blur sm:p-5`}>
        <h2 className="text-sm font-bold text-foreground">{t('timing.title')}</h2>

        <div className="mt-3 space-y-5">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              {t('timing.natalKicker')}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground-secondary">
              {readings.natalLove[profile.natalLove]}
            </p>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              {t('timing.upcomingKicker')}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground-subtle">{t('timing.subtitle')}</p>
            {shownWindows.length === 0 && (
              <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">{readings.timing.empty}</p>
            )}
            {shownWindows.length > 0 && (
              <LoveTimeline locale={locale} readings={readings} today={today} windows={shownWindows} />
            )}
            {!timeKnown && (
              <p className="mt-3 text-[11px] leading-relaxed text-foreground-faint">{t('timing.noTimeNote')}</p>
            )}
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
