'use client'

import { track } from '@sobok/analytics/browser'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { buildShareURL, shareLink } from '@/lib/share'

import { DAILY_NAMESPACE, type DailySurface } from './daily'
import type { DailyReading } from './useDailyReading'

/**
 * Shares the day both daily pages describe. Only a birth-pinned link reproduces the sender's picks — an
 * unpinned one recomputes with the recipient's own day and profile, so it must not name what the sender got.
 */
export function useDailyShare(surface: DailySurface, reading: DailyReading | null): () => Promise<void> {
  const locale = useLocale()
  const t = useTranslations(DAILY_NAMESPACE[surface])
  const ts = useTranslations('Shared')

  return async function share() {
    if (!reading) {
      return
    }

    const url = reading.birth
      ? buildShareURL(locale, {
          kind: surface,
          birth: reading.birth,
          dateKey: reading.dateKey,
          utcOffsetMinutes: reading.utcOffsetMinutes,
        })
      : new URL(`/${locale}/${surface}`, window.location.origin).toString()

    const method = await shareLink({
      title: t('meta.title'),
      text: reading.birth
        ? t('share.textWithLuck', { food: reading.lucky.food.name, color: reading.lucky.color.name })
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
        content_type: surface,
        lucky_food_id: reading.lucky.food.id,
        lucky_color_id: reading.lucky.color.id,
      })
    }
  }
}
