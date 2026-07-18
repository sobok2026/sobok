'use client'

import type { Locale } from '@sobok/domain/locale'
import { useLocale, useTranslations } from 'next-intl'

import { pickLabel } from '@/chart/labels'
import { oppositePalace } from '@/chart/patterns'
import type { ZwdsChart, ZwdsPalace } from '@/chart/types'
import type { Interpretations, MutagenStarKey } from '@/content/interpretations/types'
import { fill } from '@/content/interpretations/types'
import { useInterpretations } from '@/hooks/useInterpretations'

type Reading = {
  kicker: string
  note?: string
  text: string
}

/**
 * 궁 탭 상세 — 장문 리딩과 같은 별×궁 테이블을 읽는 Phase 1(c)의 표면.
 * 컴포저와 달리 전역 dedup 없이 이 궁의 모든 조각을 그대로 보여준다.
 */
function collectReadings(chart: ZwdsChart, palace: ZwdsPalace, interp: Interpretations, locale: Locale): Reading[] {
  if (!palace.key) {
    return []
  }

  const palaceName = pickLabel(palace.name, locale)
  const readings: Reading[] = []

  if (palace.majorStars.length === 0) {
    const emptyText = interp.emptyPalace[palace.key]
    if (emptyText) {
      readings.push({ kicker: fill(interp.report.kicker.empty, { palace: palaceName }), text: emptyText })
    }

    for (const star of oppositePalace(chart, palace)?.majorStars ?? []) {
      if (!star.key) {
        continue
      }
      const text = interp.stars[star.key][palace.key]
      if (text) {
        readings.push({
          kicker: fill(interp.report.kicker.borrowed, { star: pickLabel(star.label, locale), palace: palaceName }),
          note: readings.length <= 1 ? interp.report.borrowedNote || undefined : undefined,
          text,
        })
      }
    }
  } else {
    for (const star of palace.majorStars) {
      if (!star.key) {
        continue
      }
      const text = interp.stars[star.key][palace.key]
      if (text) {
        readings.push({
          kicker: fill(interp.report.kicker.palaceStar, {
            star: pickLabel(star.label, locale),
            palace: palaceName,
          }),
          text,
        })
      }
    }
  }

  // 이 궁에 앉은 생년 사화 — 주성이든 보좌성이든 조각이 있으면 붙인다.
  for (const star of [...palace.majorStars, ...palace.luckyStars]) {
    if (!star.key || !star.mutagenKey || !star.mutagen) {
      continue
    }
    const text = interp.mutagens[star.mutagenKey][star.key as MutagenStarKey]
    if (text) {
      readings.push({
        kicker: fill(interp.report.kicker.mutagen, {
          star: pickLabel(star.label, locale),
          mutagen: pickLabel(star.mutagen, locale),
          palace: palaceName,
        }),
        text,
      })
    }
  }

  return readings
}

export default function PalaceDetail({
  chart,
  palace,
  onClose,
}: {
  chart: ZwdsChart
  palace: ZwdsPalace
  onClose: () => void
}) {
  const locale = useLocale()
  const t = useTranslations('Zwds.chart')
  const interpretations = useInterpretations(locale)

  if (!interpretations) {
    return null
  }

  const readings = collectReadings(chart, palace, interpretations, locale)

  return (
    <section className="w-full max-w-2xl rounded-2xl border border-border-strong bg-surface-2 p-5">
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="flex items-baseline gap-2 text-lg font-bold text-foreground">
          {pickLabel(palace.name, locale)}
          <span className="text-xs font-normal text-foreground-faint">
            {pickLabel(palace.stemLabel, locale)}
            {pickLabel(palace.branchLabel, locale)}
          </span>
          {palace.isBodyPalace && (
            <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
              {t('bodyPalaceBadge')}
            </span>
          )}
        </h2>
        <button
          className="rounded-full border border-border-strong px-3 py-1 text-xs font-semibold text-foreground-secondary transition hover:bg-surface-3"
          onClick={onClose}
          type="button"
        >
          {t('closeDetail')}
        </button>
      </header>

      {readings.length === 0 ? (
        <p className="text-sm text-foreground-subtle">{t('noReading')}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {readings.map((reading, index) => (
            <div key={index}>
              <p className="mb-1 text-xs font-semibold tracking-wide text-accent-gold">{reading.kicker}</p>
              <p className="text-sm leading-relaxed text-foreground-secondary">{reading.text}</p>
              {reading.note && <p className="mt-1.5 text-xs leading-relaxed text-foreground-subtle">{reading.note}</p>}
            </div>
          ))}
          {palace.key === 'health' && interpretations.report.health.disclaimer && (
            <p className="text-xs leading-relaxed text-foreground-faint">{interpretations.report.health.disclaimer}</p>
          )}
        </div>
      )}
    </section>
  )
}
