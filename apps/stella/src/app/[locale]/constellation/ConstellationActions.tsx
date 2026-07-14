import { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { ORIGIN, SITE_NAME } from '@/constants'
import { track } from '@/lib/analytics/browser'

import type { StoredBirth } from '../birth-storage'
import { signOfLon } from '../chart/astrology'
import type { ChartAspect, NatalChart } from '../chart/types'
import { buildShareURL, shareLink } from '../share'
import { createNatalShareCard } from './share-card'
import { HOUSE_NUMBERS } from './wheel-scene'

type ConstellationActionsProps = {
  aspects: readonly ChartAspect[]
  birth: StoredBirth | null
  chart: NatalChart
  onRecompute: () => void
  shared: boolean
}

/** Result sharing, export, and follow-up navigation for one completed chart. */
export function ConstellationActions({ aspects, birth, chart, onRecompute, shared }: ConstellationActionsProps) {
  const [imageBusy, setImageBusy] = useState(false)
  const t = useTranslations('Constellation')
  const ts = useTranslations('Shared')
  const locale = useLocale()

  async function share() {
    if (!birth) {
      return
    }

    const method = await shareLink({
      title: t('meta.title'),
      text: t('share.text'),
      url: buildShareURL(locale, { kind: 'chart', birth }),
    })

    if (method === 'clipboard') {
      toast.success(t('share.copied'))
    } else if (method === 'failed') {
      toast.error(ts('shareError'))
    }

    if (method === 'web_share' || method === 'clipboard') {
      track('share', { method, content_type: 'natal' })
    }
  }

  // Renders the chart entirely in-browser, then uses file sharing where
  // available and a download elsewhere. Birth data never leaves the device.
  async function shareImage() {
    if (imageBusy) {
      return
    }

    setImageBusy(true)

    try {
      await document.fonts.ready

      const sunLon = chart.planets.find((planet) => planet.id === 'sun')?.lon ?? 0
      const moonLon = chart.planets.find((planet) => planet.id === 'moon')?.lon ?? 0
      const risingSign = chart.ascendant !== null ? signOfLon(chart.ascendant) : null

      const blob = await createNatalShareCard(
        chart,
        aspects,
        {
          eyebrow: t('hero.eyebrow'),
          title: t('hero.title'),
          big3: [
            { glyph: '☉', label: t('big3.sunLabel'), value: t(`signs.${signOfLon(sunLon)}`) },
            { glyph: '☾', label: t('big3.moonLabel'), value: t(`signs.${signOfLon(moonLon)}`) },
            {
              glyph: 'Asc',
              label: t('big3.risingLabel'),
              value: risingSign ? t(`signs.${risingSign}`) : t('form.risingUnknown'),
            },
          ],
          houseThemes: HOUSE_NUMBERS.map((n) => t(`houseThemes.${n}`)),
          siteName: SITE_NAME[locale as Locale] ?? SITE_NAME[Locale.EN],
          url: new URL(ORIGIN).host,
        },
        getComputedStyle(document.body).fontFamily,
      )

      const file = new File([blob], 'stella-natal.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: t('share.text'), title: t('meta.title') })
        track('share', { method: 'image_web_share', content_type: 'natal' })
        return
      }

      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.download = 'stella-natal.png'
      anchor.href = objectUrl
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)
      toast.success(t('share.saved'))
      track('share', { method: 'image_download', content_type: 'natal' })
    } catch (error) {
      // Dismissing the native share sheet is not an application failure.
      if (!(error instanceof Error && error.name === 'AbortError')) {
        toast.error(t('share.imageError'))
      }
    } finally {
      setImageBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {!shared && (
        <>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              className="rounded-full border border-border-2 bg-surface-2 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition active:scale-95 motion-reduce:active:scale-100 hover:bg-surface-3"
              onClick={share}
              type="button"
            >
              {t('share.button')}
            </button>
            <button
              aria-busy={imageBusy}
              className="rounded-full border border-border-2 bg-surface-2 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition active:scale-95 motion-reduce:active:scale-100 hover:bg-surface-3 disabled:opacity-60"
              disabled={imageBusy}
              onClick={shareImage}
              type="button"
            >
              {t('share.imageButton')}
            </button>
          </div>
          <p className="max-w-sm text-center text-[11px] leading-relaxed text-foreground-faint">{ts('privacy')}</p>
        </>
      )}
      {shared ? (
        <a
          className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
          href={`/${locale}`}
        >
          {ts('createOwn')}
        </a>
      ) : (
        <>
          <Link
            className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
            href={`/${locale}/today`}
          >
            {t('todayCta')}
          </Link>
          <Link
            className="text-xs text-foreground-subtle underline-offset-4 transition hover:text-foreground-secondary hover:underline"
            href={`/${locale}/love`}
          >
            {t('loveCta')}
          </Link>
        </>
      )}
      <p className="mt-1 text-xs text-foreground-faint">{t('footer')}</p>
    </div>
  )
}
