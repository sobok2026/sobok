'use client'

import { LOCALE_LANGUAGE_TAGS } from '@sobok/domain/locale'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { computeBirthChartAnalysis } from '@/chart/ephemeris'
import cardStyles from '@/components/card.module.css'
import { HeroTitle } from '@/components/HeroTitle'
import SharedLinkError from '@/components/SharedLinkError'
import Starfield from '@/components/Starfield'
import { useBirthSource } from '@/hooks/useBirthSource'
import { track } from '@/lib/analytics/browser'
import { type StoredBirth, toBirthInput } from '@/lib/birth-storage'
import { buildShareURL, shareLink } from '@/lib/share'

import { formatDateKey, nextLocalDayAnchor } from '../today/daily'
import { computeDailyLucky, type DailyLuckyInputs } from '../today/daily-lucky'
import LuckySection from '../today/LuckySection'
import { loadLuckyContent } from '../today/recommendations'
import type { LuckyRecommendations } from '../today/recommendations/types'
import type { SkyToday } from '../today/sky'
import { useLiveDateKey } from '../today/useLiveDateKey'

/** Everything the page resolves asynchronously before the preview can render at once. */
type TomorrowData = {
  dateKey: string
  utcOffsetMinutes: number
  birth: StoredBirth | null
  sky: SkyToday
  lucky: LuckyRecommendations
}

export default function TomorrowFlow() {
  const [data, setData] = useState<TomorrowData | null>(null)
  const [failed, setFailed] = useState(false)
  const birthSource = useBirthSource('tomorrow')
  const locale = useLocale()
  const t = useTranslations('Tomorrow')
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

        const anchor = sharedPayload ?? nextLocalDayAnchor()

        const [content, analysis] = await Promise.all([
          loadLuckyContent(locale),
          birth ? computeBirthChartAnalysis(toBirthInput(birth)) : null,
        ])

        const inputs: DailyLuckyInputs = {
          locale,
          natal: analysis?.chart ?? null,
          natalMoonSigns: analysis?.unknownTime?.moonSigns,
          natalMoonExact: birth?.timeKnown ?? false,
          content,
        }

        const { sky, lucky } = await computeDailyLucky(anchor, inputs)

        if (!cancelled) {
          setData({
            dateKey: anchor.dateKey,
            utcOffsetMinutes: anchor.utcOffsetMinutes,
            birth,
            sky,
            lucky,
          })

          track('view_reading', {
            content_type: 'tomorrow',
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
          kind: 'tomorrow',
          birth: data.birth,
          dateKey: data.dateKey,
          utcOffsetMinutes: data.utcOffsetMinutes,
        })
      : new URL(`/${locale}/tomorrow`, window.location.origin).toString()

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
        content_type: 'tomorrow',
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

        {data && (
          <div className="w-full space-y-3 sm:space-y-5">
            <LuckySection lucky={data.lucky} namespace="Tomorrow" sky={data.sky} />

            <p className="text-center text-[11px] leading-relaxed text-foreground-faint">{t('note')}</p>

            {!data.birth && (
              <section
                className={`${cardStyles.card} p-4 rounded-3xl border bg-surface-2 text-center backdrop-blur sm:p-5`}
              >
                <p className="text-sm font-semibold text-foreground-secondary">{t('personalize.title')}</p>
                <p className="mx-auto mt-1 text-xs leading-relaxed text-foreground-subtle">{t('personalize.hint')}</p>
                <Link
                  className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white active:scale-[0.98] motion-reduce:active:scale-100"
                  href={homeHref}
                >
                  {t('personalize.cta')}
                </Link>
              </section>
            )}

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
                    onClick={share}
                    type="button"
                  >
                    {t('share.button')}
                  </button>
                  {data.birth && (
                    <p className="max-w-sm text-center text-[11px] leading-relaxed text-foreground-faint">
                      {ts('privacy')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
