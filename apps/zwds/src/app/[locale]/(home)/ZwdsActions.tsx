'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { pickLabel } from '@/chart/labels'
import type { ZwdsChart } from '@/chart/types'
import { ORIGIN, SITE_NAME } from '@/constants'
import { track } from '@/lib/analytics/browser'

import { createChartShareCard } from './share-card'

type ShareStatus = 'error' | 'idle' | 'saved'

/**
 * Image sharing for one completed chart — stella's flow: render entirely
 * in-browser, prefer Web Share Level 2, fall back to a download. Birth data
 * never leaves the device.
 */
export default function ZwdsActions({ chart }: { chart: ZwdsChart }) {
  const locale = useLocale()
  const t = useTranslations('Zwds')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<ShareStatus>('idle')
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (statusTimer.current) {
        clearTimeout(statusTimer.current)
      }
    }
  }, [])

  function flashStatus(next: ShareStatus) {
    setStatus(next)

    if (statusTimer.current) {
      clearTimeout(statusTimer.current)
    }
    statusTimer.current = setTimeout(() => setStatus('idle'), 4000)
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
        track('share', { method: 'web_share' })
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
      track('share', { method: 'download' })
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

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        aria-busy={busy}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-95 motion-reduce:active:scale-100 disabled:opacity-60"
        disabled={busy}
        onClick={shareImage}
        type="button"
      >
        {t('share.imageButton')}
      </button>
      {status !== 'idle' && (
        <p aria-live="polite" className={`text-xs ${status === 'saved' ? 'text-positive' : 'text-danger'}`}>
          {status === 'saved' ? t('share.saved') : t('share.imageError')}
        </p>
      )}
    </div>
  )
}
