'use client'

import { track } from '@sobok/analytics/browser'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { pickLabel } from '@/chart/labels'
import type { ZwdsChart } from '@/chart/types'
import { ORIGIN, SITE_NAME } from '@/constants'
import type { StoredBirth } from '@/lib/birth-storage'
import { buildShareUrl, shareLink } from '@/lib/share'

import { createChartShareCard } from './share-card'

type ShareStatus = 'copied' | 'error' | 'idle' | 'linkError' | 'saved'

type Props = {
  birth: StoredBirth | null
  chart: ZwdsChart
  shared: boolean
}

/**
 * Result sharing for one completed chart. A link carries the birth in the URL
 * hash (reproduces the chart in-browser); an image renders entirely in-browser
 * with a Web Share Level 2 → download fallback. Both keep birth data off any
 * server. A visitor viewing someone else's shared chart only gets "create own".
 */
export default function ZwdsActions({ birth, chart, shared }: Props) {
  const locale = useLocale()
  const t = useTranslations('Zwds')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<ShareStatus>('idle')
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function flashStatus(next: ShareStatus) {
    setStatus(next)

    if (statusTimer.current) {
      clearTimeout(statusTimer.current)
    }
    statusTimer.current = setTimeout(() => setStatus('idle'), 4000)
  }

  async function shareChartLink() {
    if (!birth) {
      return
    }

    const method = await shareLink({
      title: t('meta.title'),
      text: t('share.text'),
      url: buildShareUrl(locale, birth),
    })

    if (method === 'clipboard') {
      flashStatus('copied')
    } else if (method === 'failed') {
      flashStatus('linkError')
    }

    if (method === 'web_share' || method === 'clipboard') {
      track('share', { method, content_type: 'link' })
    }
  }

  async function shareImage() {
    if (busy) {
      return
    }

    setBusy(true)

    try {
      await document.fonts.ready

      const lifePalace = chart.palaces.find((palace) => palace.key === 'life')
      const bodyPalace = chart.palaces.find((palace) => palace.isBodyPalace)
      const lifeStars = lifePalace?.majorStars.length
        ? lifePalace.majorStars.map((star) => pickLabel(star.label, locale)).join('·')
        : t('chart.emptyPalace')

      const blob = await createChartShareCard(
        chart,
        [
          t('chart.title'),
          `${chart.gender === 'male' ? t('chart.genderMale') : t('chart.genderFemale')} · ${pickLabel(chart.fiveElementsClass, locale)}`,
          `${t('chart.lunarDateLabel')} ${chart.lunar.year}. ${chart.lunar.isLeap ? `${t('chart.leapMonth')} ` : ''}${chart.lunar.month}. ${chart.lunar.day}.`,
        ],
        {
          eyebrow: t('hero.eyebrow'),
          title: t('hero.title'),
          summary: [
            { label: t('share.lifeStarsLabel'), value: lifeStars },
            { label: t('chart.bodyPalaceBadge'), value: bodyPalace ? pickLabel(bodyPalace.name, locale) : '' },
            { label: t('chart.fiveElementsLabel'), value: pickLabel(chart.fiveElementsClass, locale) },
          ],
          bodyPalaceBadge: t('chart.bodyPalaceBadge'),
          emptyPalace: t('chart.emptyPalace'),
          siteName: SITE_NAME[locale],
          url: new URL(ORIGIN).host,
        },
        getComputedStyle(document.body).fontFamily,
        locale,
      )

      const file = new File([blob], 'ziwei-chart.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: t('share.text'), title: t('meta.title') })
        track('share', { method: 'web_share', content_type: 'image' })
        return
      }

      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.download = 'ziwei-chart.png'
      anchor.href = objectUrl
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)
      track('share', { method: 'download', content_type: 'image' })
      flashStatus('saved')
    } catch (error) {
      // Dismissing the native share sheet is not an application failure.
      if (!(error instanceof Error && error.name === 'AbortError')) {
        flashStatus('error')
      }
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    return () => {
      if (statusTimer.current) {
        clearTimeout(statusTimer.current)
      }
    }
  }, [])

  if (shared) {
    return (
      <a
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-95 motion-reduce:active:scale-100"
        href={`/${locale}`}
      >
        {t('shared.createOwn')}
      </a>
    )
  }

  const positive = status === 'saved' || status === 'copied'

  const statusText =
    status === 'saved'
      ? t('share.saved')
      : status === 'copied'
        ? t('share.copied')
        : status === 'linkError'
          ? t('share.linkError')
          : t('share.imageError')

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button
          aria-busy={busy}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-95 motion-reduce:active:scale-100 disabled:opacity-60"
          disabled={busy}
          onClick={shareImage}
          type="button"
        >
          {t('share.imageButton')}
        </button>
        <button
          className="rounded-full border border-border-strong bg-surface-2 px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-3 active:scale-95 motion-reduce:active:scale-100"
          onClick={shareChartLink}
          type="button"
        >
          {t('share.linkButton')}
        </button>
      </div>
      <p className="max-w-sm text-center text-[11px] leading-relaxed text-foreground-subtle">{t('share.privacy')}</p>
      {status !== 'idle' && (
        <p aria-live="polite" className={`text-xs ${positive ? 'text-positive' : 'text-danger'}`}>
          {statusText}
        </p>
      )}
    </div>
  )
}
