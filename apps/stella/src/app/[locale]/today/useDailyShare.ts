'use client'

import { track } from '@sobok/analytics/browser'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import type { StoredBirth } from '@/lib/birth-storage'
import { buildShareURL, shareLink } from '@/lib/share'

import { DAILY_NAMESPACE } from './daily'
import type { DailyReading } from './useDailyReading'

type ShareReading = {
  birth: StoredBirth | null
  /** Daily surfaces only — the pinned calendar day. */
  dateKey?: string
  utcOffsetMinutes?: number
  /** Love only — the moment the sender's year-ahead scan was computed. */
  asOf?: Date
  /** Daily surfaces only — the names the share text names. */
  lucky?: DailyReading['lucky']
}

/**
 * Shares the reading a surface describes. Only a birth-pinned link reproduces the sender's picks — an
 * unpinned one recomputes with the recipient's own day and profile, so it must not name what the sender
 * got (love only shares a birth-pinned link at all).
 */
export function useDailyShare(
  surface: 'today' | 'tomorrow' | 'love',
  reading: ShareReading | null,
): () => Promise<void> {
  const locale = useLocale()
  const t = useTranslations(surface === 'love' ? 'Love' : DAILY_NAMESPACE[surface])
  const ts = useTranslations('Shared')

  return async function share() {
    if (!reading) {
      return
    }

    let url: string

    if (surface === 'love') {
      if (!reading.birth || !reading.asOf) {
        return
      }

      url = buildShareURL(locale, { kind: 'love', birth: reading.birth, asOf: reading.asOf })
    } else if (reading.birth && reading.dateKey && reading.utcOffsetMinutes !== undefined) {
      url = buildShareURL(locale, {
        kind: surface,
        birth: reading.birth,
        dateKey: reading.dateKey,
        utcOffsetMinutes: reading.utcOffsetMinutes,
      })
    } else {
      url = new URL(`/${locale}/${surface}`, window.location.origin).toString()
    }

    const text =
      reading.birth && reading.lucky
        ? t('share.textWithLuck', { food: reading.lucky.food.name, color: reading.lucky.color.name })
        : t('share.text')

    const method = await shareLink({
      title: t('meta.title'),
      text,
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
        lucky_food_id: reading.lucky?.food.id,
        lucky_color_id: reading.lucky?.color.id,
      })
    }
  }
}
