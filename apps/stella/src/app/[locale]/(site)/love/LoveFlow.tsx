'use client'

import { useLocale, useTranslations } from 'next-intl'

import { computeAspects } from '@/chart/astrology'
import { computeBirthChartAnalysis } from '@/chart/ephemeris'
import cardStyles from '@/components/card.module.css'
import { PersonalizeCard } from '@/components/PersonalizeCard'
import { loadInterpretations } from '@/content/interpretations'
import { toBirthInput } from '@/lib/birth-storage'

import DailyPageShell from '../today/DailyPageShell'
import { useDailyShare } from '../today/useDailyShare'
import { type ReadingLoadInput, useReadingLoad } from '../today/useReadingLoad'
import { deriveLoveProfile, type LoveProfile, type LoveWindow, scanLoveTransits } from './compute'
import LoveBody, { type LoveData } from './LoveBody'
import { loadLoveReadings } from './readings'

export default function LoveFlow() {
  const { data, failed, invalid, shared } = useReadingLoad('love', resolveLoveReading)
  const share = useDailyShare('love', data)
  const t = useTranslations('Love')
  const locale = useLocale()
  const homeHref = `/${locale}`

  return (
    <DailyPageShell
      failed={failed}
      heroTone="love"
      invalid={invalid}
      loading={!data}
      namespace="Love"
      shared={shared}
      subtitle={t('hero.subtitle')}
    >
      {data && !data.profile && (
        <section className={`${cardStyles.card} w-full rounded-3xl border bg-surface-2 p-6 text-center backdrop-blur`}>
          <PersonalizeCard cta={t('empty.cta')} hint={t('empty.hint')} homeHref={homeHref} title={t('empty.title')} />
        </section>
      )}
      {data?.profile && (
        <LoveBody
          data={{ ...data, profile: data.profile }}
          homeHref={homeHref}
          locale={locale}
          onShare={share}
          shared={shared}
        />
      )}
    </DailyPageShell>
  )
}

async function resolveLoveReading({ locale, birth, payload }: ReadingLoadInput<'love'>): Promise<LoveData> {
  const asOf = payload?.asOf ?? new Date()
  const [readings, interpretations] = await Promise.all([loadLoveReadings(locale), loadInterpretations(locale)])
  let profile: LoveProfile | null = null
  let windows: LoveWindow[] = []

  if (birth) {
    const { chart, unknownTime } = await computeBirthChartAnalysis(toBirthInput(birth))
    profile = deriveLoveProfile(chart, computeAspects(chart.planets), unknownTime?.moonSigns)
    windows = await scanLoveTransits(chart, asOf)
  }

  return {
    asOf,
    birth,
    readings,
    interpretations,
    profile,
    windows,
    timeKnown: birth?.timeKnown ?? false,
  }
}
