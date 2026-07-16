import { Locale } from '@sobok/domain/locale'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { signOfLon } from '@/chart/astrology'
import type { ChartAspect, NatalChart, SignId } from '@/chart/types'
import { ORIGIN, SITE_NAME } from '@/constants'
import { track } from '@/lib/analytics/browser'
import type { StoredBirth } from '@/lib/birth-storage'
import { buildShareURL, shareLink } from '@/lib/share'
import { createNatalShareCard } from './share-card'
import { HOUSE_NUMBERS } from './wheel/wheel-scene'

type ConstellationActionsProps = {
  aspects: readonly ChartAspect[]
  birth: StoredBirth | null
  chart: NatalChart
  moonLongitudeRange: readonly [start: number, end: number] | null
  moonSigns: readonly SignId[] | null
  shared: boolean
}

/** Result sharing, export, and follow-up navigation for one completed chart. */
export function ConstellationActions({
  aspects,
  birth,
  chart,
  moonLongitudeRange,
  moonSigns,
  shared,
}: ConstellationActionsProps) {
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
      const displayedMoonSigns = moonSigns ?? [signOfLon(moonLon)]

      const blob = await createNatalShareCard(
        chart,
        aspects,
        {
          eyebrow: t('hero.eyebrow'),
          title: t('hero.title'),
          big3: [
            {
              glyph: '☉',
              label: t('big3.sunLabel'),
              value: t(`signs.${signOfLon(sunLon)}`),
            },
            {
              glyph: '☾',
              label: t('big3.moonLabel'),
              value: displayedMoonSigns.map((sign) => t(`signs.${sign}`)).join(' ↔ '),
            },
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
        moonLongitudeRange,
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
      {shared ? (
        <div className="flex flex-col items-center text-center">
          <a
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-95 motion-reduce:active:scale-100"
            href={`/${locale}`}
          >
            {ts('createOwn')}
          </a>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              aria-busy={imageBusy}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-95 motion-reduce:active:scale-100 disabled:opacity-60"
              disabled={imageBusy}
              onClick={shareImage}
              type="button"
            >
              {t('share.imageButton')}
            </button>
            <button
              className="rounded-full border border-border-2 bg-surface-2 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-surface-3 active:scale-95 motion-reduce:active:scale-100"
              onClick={share}
              type="button"
            >
              {t('share.button')}
            </button>
          </div>
          <p className="max-w-sm text-center text-[11px] leading-relaxed text-foreground-subtle">{ts('privacy')}</p>
        </>
      )}
    </div>
  )
}
