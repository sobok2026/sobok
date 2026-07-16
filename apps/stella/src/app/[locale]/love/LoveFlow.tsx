'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { computeAspects } from '@/chart/astrology'
import { computeBirthChartAnalysis } from '@/chart/ephemeris'
import cardStyles from '@/components/card.module.css'
import { HeroTitle } from '@/components/HeroTitle'
import SharedLinkError from '@/components/SharedLinkError'
import Starfield from '@/components/Starfield'
import { loadInterpretations } from '@/content/interpretations'
import { useBirthSource } from '@/hooks/useBirthSource'
import { track } from '@/lib/analytics/browser'
import { toBirthInput } from '@/lib/birth-storage'
import { buildShareURL, shareLink } from '@/lib/share'

import { deriveLoveProfile, type LoveProfile, type LoveWindow, scanLoveTransits } from './compute'
import LoveBody, { type LoveData } from './LoveBody'
import { loadLoveReadings } from './readings'

export default function LoveFlow() {
  const [data, setData] = useState<LoveData | null>(null)
  const [failed, setFailed] = useState(false)
  const birthSource = useBirthSource('love')
  const locale = useLocale()
  const t = useTranslations('Love')
  const ts = useTranslations('Shared')
  const tc = useTranslations('Constellation')

  const homeHref = `/${locale}`
  const { birth, payload: sharedPayload, shared } = birthSource
  const sourceReady = birthSource.status === 'ready'

  async function share() {
    if (!data?.birth) {
      return
    }

    const method = await shareLink({
      title: t('meta.title'),
      text: t('share.text'),
      url: buildShareURL(locale, { kind: 'love', birth: data.birth, asOf: data.asOf }),
    })

    if (method === 'clipboard') {
      toast.success(t('share.copied'))
    } else if (method === 'failed') {
      toast.error(ts('shareError'))
    }

    if (method === 'web_share' || method === 'clipboard') {
      track('share', { method, content_type: 'love' })
    }
  }

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
        const asOf = sharedPayload?.asOf ?? new Date()
        const [readings, interpretations] = await Promise.all([loadLoveReadings(locale), loadInterpretations(locale)])
        let profile: LoveProfile | null = null
        let windows: LoveWindow[] = []

        if (birth) {
          const { chart, unknownTime } = await computeBirthChartAnalysis(toBirthInput(birth))
          profile = deriveLoveProfile(chart, computeAspects(chart.planets), unknownTime?.moonSigns)
          windows = await scanLoveTransits(chart, asOf)
        }

        if (!cancelled) {
          setData({
            asOf,
            birth,
            readings,
            interpretations,
            profile,
            windows,
            timeKnown: birth?.timeKnown ?? false,
          })

          track('view_reading', {
            content_type: 'love',
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
  }, [birth, locale, shared, sharedPayload?.asOf, sourceReady])

  if (birthSource.status === 'invalid') {
    return <SharedLinkError />
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night-sky px-3 pb-16 pt-[calc(4.5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center">
        <header className="mb-6 w-full max-w-sm text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{t('hero.eyebrow')}</p>
          <HeroTitle tone="love">{t('hero.title')}</HeroTitle>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground-muted/90">{t('hero.subtitle')}</p>
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

        {data && !data.profile && <EmptyState homeHref={homeHref} />}
        {data?.profile && (
          <LoveBody
            data={{ ...data, profile: data.profile }}
            homeHref={homeHref}
            locale={locale}
            onShare={share}
            shared={shared}
          />
        )}
      </div>
    </main>
  )
}

function EmptyState({ homeHref }: { homeHref: string }) {
  const t = useTranslations('Love')

  return (
    <section className={`${cardStyles.card} w-full rounded-3xl border bg-surface-2 p-6 text-center backdrop-blur`}>
      <p className="text-sm font-semibold text-foreground-secondary">{t('empty.title')}</p>
      <p className="mx-auto mt-1 text-xs leading-relaxed text-foreground-subtle">{t('empty.hint')}</p>
      <Link
        className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white active:scale-[0.98] motion-reduce:active:scale-100"
        href={homeHref}
      >
        {t('empty.cta')}
      </Link>
    </section>
  )
}
