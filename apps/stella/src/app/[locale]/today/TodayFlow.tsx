'use client'

import { LOCALE_LANGUAGE_TAGS } from '@sobok/domain/locale'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { computeBirthChartAnalysis, type UnknownBirthTimeAnalysis } from '@/chart/ephemeris'
import type { NatalChart } from '@/chart/types'
import { useCityCatalog } from '@/components/CityCatalogProvider'
import { HeroTitle } from '@/components/HeroTitle'
import SharedLinkError from '@/components/SharedLinkError'
import Starfield from '@/components/Starfield'
import { useBirthSource } from '@/hooks/useBirthSource'
import { track } from '@/lib/analytics/browser'
import { toBirthInput } from '@/lib/birth-storage'
import { buildShareURL, shareLink } from '@/lib/share'

import { localDayAnchor, snapshotAtLocalNoon } from './daily'
import { loadReadings } from './readings'
import { loadLuckyContent } from './recommendations'
import { selectLuckyRecommendations } from './recommendations/select'
import { computeSkyToday } from './sky'
import TodayBody, { type TodayData } from './TodayBody'
import { computePersonalToday, type PersonalToday } from './transits'
import { useLiveDateKey } from './useLiveDateKey'

export default function TodayFlow() {
  const [data, setData] = useState<TodayData | null>(null)
  const [failed, setFailed] = useState(false)
  const birthSource = useBirthSource('today')
  const locale = useLocale()
  const cityCatalog = useCityCatalog()
  const t = useTranslations('Today')
  const ts = useTranslations('Shared')
  const tc = useTranslations('Constellation')

  const { birth, payload: sharedPayload, shared } = birthSource
  const liveDateKey = useLiveDateKey(!shared)

  const sourceReady = birthSource.status === 'ready'
  const dayReady = shared || liveDateKey !== null

  useEffect(() => {
    let cancelled = false

    if (!sourceReady || !dayReady) {
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

        const [sky, readings, luckyContent] = await Promise.all([
          computeSkyToday(snapshotAt),
          loadReadings(locale),
          loadLuckyContent(locale),
        ])

        let natal: NatalChart | null = null
        let unknownTime: UnknownBirthTimeAnalysis | null = null
        let personal: PersonalToday | null = null

        if (birth) {
          const analysis = await computeBirthChartAnalysis(toBirthInput(birth, cityCatalog))
          natal = analysis.chart
          unknownTime = analysis.unknownTime
          personal = computePersonalToday(sky.positions, natal, { natalMoonExact: birth.timeKnown })
        }

        const lucky = selectLuckyRecommendations({
          locale,
          dateKey: anchor.dateKey,
          utcOffsetMinutes: anchor.utcOffsetMinutes,
          sky,
          natal,
          natalMoonSigns: unknownTime?.moonSigns,
          personal,
          content: luckyContent,
        })

        if (!cancelled) {
          setData({
            dateKey: anchor.dateKey,
            utcOffsetMinutes: anchor.utcOffsetMinutes,
            birth,
            sky,
            readings,
            natal,
            unknownTime,
            personal,
            lucky,
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
  }, [
    birth,
    cityCatalog,
    dayReady,
    liveDateKey,
    locale,
    shared,
    sharedPayload?.dateKey,
    sharedPayload?.utcOffsetMinutes,
    sourceReady,
  ])

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
      text: t('share.textWithLuck', { food: data.lucky.food.name, color: data.lucky.color.name }),
      url,
    })

    if (method === 'clipboard') {
      toast.success(t('share.copied'))
    } else if (method === 'failed') {
      toast.error(ts('shareError'))
    }

    if (method === 'web_share' || method === 'clipboard') {
      track('share', {
        method,
        content_type: 'today',
        lucky_food_id: data.lucky.food.id,
        lucky_color_id: data.lucky.color.id,
      })
    }
  }

  const homeHref = `/${locale}`

  if (birthSource.status === 'invalid') {
    return <SharedLinkError />
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night-sky px-3 pb-16 pt-[calc(4.5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center">
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
