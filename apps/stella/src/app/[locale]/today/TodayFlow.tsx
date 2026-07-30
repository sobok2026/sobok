'use client'

import { track } from '@sobok/analytics/browser'
import { LOCALE_LANGUAGE_TAGS } from '@sobok/domain/locale'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { computeBirthChartAnalysis } from '@/chart/ephemeris'
import { HeroTitle } from '@/components/HeroTitle'
import SharedLinkError from '@/components/SharedLinkError'
import Starfield from '@/components/Starfield'
import { useBirthSource } from '@/hooks/useBirthSource'
import { toBirthInput } from '@/lib/birth-storage'
import { buildShareURL, shareLink } from '@/lib/share'

import { formatDateKey, localDayAnchor, nextLocalDayAnchor } from './daily'
import { computeDailyLucky, type DailyLuckyInputs } from './daily-lucky'
import { loadReadings } from './readings'
import { loadLuckyContent } from './recommendations'
import TodayBody, { type TodayData } from './TodayBody'
import { useLiveDateKey } from './useLiveDateKey'

export default function TodayFlow() {
  const [data, setData] = useState<TodayData | null>(null)
  const [failed, setFailed] = useState(false)
  const birthSource = useBirthSource('today')
  const locale = useLocale()
  const t = useTranslations('Today')
  const ts = useTranslations('Shared')
  const tc = useTranslations('Constellation')

  const { birth, payload: sharedPayload, shared } = birthSource
  const liveDateKey = useLiveDateKey(!shared)

  const sourceReady = birthSource.status === 'ready'
  const dayReady = shared || liveDateKey !== null
  const homeHref = `/${locale}`

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

    // Only a birth-pinned link reproduces the sender's picks — an unpinned one
    // recomputes with the recipient's own day and profile, so it must not name them.
    const method = await shareLink({
      title: t('meta.title'),
      text: data.birth
        ? t('share.textWithLuck', { food: data.lucky.food.name, color: data.lucky.color.name })
        : t('share.text'),
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

        const [readings, luckyContent, analysis] = await Promise.all([
          loadReadings(locale),
          loadLuckyContent(locale),
          birth ? computeBirthChartAnalysis(toBirthInput(birth)) : null,
        ])

        const natal = analysis?.chart ?? null
        const unknownTime = analysis?.unknownTime ?? null

        const inputs: DailyLuckyInputs = {
          locale,
          natal,
          natalMoonSigns: unknownTime?.moonSigns,
          natalMoonExact: birth?.timeKnown ?? false,
          content: luckyContent,
        }

        const { sky, personal, lucky } = await computeDailyLucky(anchor, inputs)

        if (cancelled) {
          return
        }

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
          tomorrowFood: null,
        })

        track('view_reading', {
          content_type: 'today',
          personalized: birth !== null,
          time_known: birth?.timeKnown ?? false,
          shared,
        })

        // The teaser arrives after the reading is on screen and fails alone —
        // tomorrow's computation must never blank or delay today's page.
        if (!sharedPayload) {
          try {
            const next = await computeDailyLucky(nextLocalDayAnchor(), inputs)

            if (!cancelled) {
              setData((prev) => (prev ? { ...prev, tomorrowFood: next.lucky.food.name } : prev))
            }
          } catch {
            /* the teaser is optional — today's reading stands */
          }
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
    dayReady,
    liveDateKey,
    locale,
    shared,
    sharedPayload?.dateKey,
    sharedPayload?.utcOffsetMinutes,
    sourceReady,
  ])

  if (birthSource.status === 'invalid') {
    return <SharedLinkError />
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night-sky px-3 pb-16 pt-[calc(4.5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center">
        <header className="mb-6 w-full text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{t('hero.eyebrow')}</p>
          <HeroTitle>{t('hero.title')}</HeroTitle>
          {data && (
            <p className="mt-3 text-sm text-foreground-muted/90">
              {formatDateKey(LOCALE_LANGUAGE_TAGS[locale], data.dateKey)}
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
