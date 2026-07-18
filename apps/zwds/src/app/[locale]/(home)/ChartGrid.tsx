'use client'

import { Locale } from '@sobok/domain/locale'
import { useLocale, useTranslations } from 'next-intl'
import type { Label } from '@/chart/labels'
import { TIME_INDEX_NAMES_HANJA, TIME_INDEX_NAMES_KO } from '@/chart/time-index'
import type { ZwdsChart, ZwdsPalace, ZwdsPillar } from '@/chart/types'

// Traditional 명반 layout: the twelve branches run clockwise around a fixed
// 4×4 frame with 巳 at the top-left, leaving the 2×2 center for birth facts.
const GRID_POSITION: Readonly<Record<string, string>> = {
  巳: 'col-start-1 row-start-1',
  午: 'col-start-2 row-start-1',
  未: 'col-start-3 row-start-1',
  申: 'col-start-4 row-start-1',
  辰: 'col-start-1 row-start-2',
  酉: 'col-start-4 row-start-2',
  卯: 'col-start-1 row-start-3',
  戌: 'col-start-4 row-start-3',
  寅: 'col-start-1 row-start-4',
  丑: 'col-start-2 row-start-4',
  子: 'col-start-3 row-start-4',
  亥: 'col-start-4 row-start-4',
}

const MUTAGEN_BADGE_CLASSES: Readonly<Record<string, string>> = {
  화록: 'bg-accent-gold/15 text-accent-gold',
  화권: 'bg-positive/15 text-positive',
  화과: 'bg-brand/15 text-brand',
  화기: 'bg-danger/15 text-danger',
}

function pick(label: Label, locale: Locale): string {
  return locale === Locale.KO ? label.ko : label.hanja
}

function formatClock(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function PalaceCell({
  palace,
  locale,
  selected,
  onSelect,
}: {
  palace: ZwdsPalace
  locale: Locale
  selected: boolean
  onSelect?: () => void
}) {
  const t = useTranslations('Zwds.chart')

  return (
    <button
      aria-expanded={selected}
      className={`${GRID_POSITION[palace.branch] ?? ''} flex min-h-30 cursor-pointer flex-col gap-1 rounded-xl border bg-surface p-2 text-left transition ${
        selected ? 'border-accent' : 'hover:border-border-strong'
      } active:scale-[0.99] motion-reduce:active:scale-100`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex w-full items-baseline justify-between gap-1">
        <span className="flex items-baseline gap-1 text-[11px] font-bold text-accent">
          {pick(palace.name, locale)}
          {palace.isBodyPalace && (
            <span className="rounded bg-brand/15 px-1 py-px text-[9px] font-semibold text-brand">
              {t('bodyPalaceBadge')}
            </span>
          )}
        </span>
        <span className="text-[10px] text-foreground-faint" lang="zh-Hant">
          {palace.stemLabel.hanja}
          {palace.branchLabel.hanja}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        {palace.majorStars.length === 0 && <span className="text-sm text-foreground-faint">{t('emptyPalace')}</span>}
        {palace.majorStars.map((star) => (
          <span
            className="inline-flex items-baseline gap-0.5 text-sm font-semibold text-foreground"
            key={star.label.hanja}
          >
            {pick(star.label, locale)}
            {star.brightness && (
              <sup className="text-[9px] font-normal text-foreground-subtle">{pick(star.brightness, locale)}</sup>
            )}
            {star.mutagen && (
              <span
                className={`rounded px-1 py-px text-[9px] font-semibold ${MUTAGEN_BADGE_CLASSES[star.mutagen.ko] ?? ''}`}
              >
                {pick(star.mutagen, locale)}
              </span>
            )}
          </span>
        ))}
      </div>

      {palace.luckyStars.length > 0 && (
        <p className="text-[11px] leading-tight text-accent-gold/90">
          {palace.luckyStars.map((star) => (
            <span className="mr-1.5 inline-flex items-baseline gap-0.5" key={star.label.hanja}>
              {pick(star.label, locale)}
              {star.mutagen && (
                <span
                  className={`rounded px-1 py-px text-[9px] font-semibold ${MUTAGEN_BADGE_CLASSES[star.mutagen.ko] ?? ''}`}
                >
                  {pick(star.mutagen, locale)}
                </span>
              )}
            </span>
          ))}
        </p>
      )}

      {palace.unluckyStars.length > 0 && (
        <p className="text-[11px] leading-tight text-danger/90">
          {palace.unluckyStars.map((star) => (
            <span className="mr-1.5" key={star.label.hanja}>
              {pick(star.label, locale)}
            </span>
          ))}
        </p>
      )}

      <p className="mt-auto w-full text-right text-[10px] text-foreground-faint">
        {t('decadalRange', { from: palace.decadal.from, to: palace.decadal.to })}
      </p>
    </button>
  )
}

function pillarText(pillar: ZwdsPillar, locale: Locale): string {
  return locale === Locale.KO ? `${pillar.stem.ko}${pillar.branch.ko}` : `${pillar.stem.hanja}${pillar.branch.hanja}`
}

export default function ChartGrid({
  chart,
  selectedBranch,
  onSelectPalace,
}: {
  chart: ZwdsChart
  selectedBranch?: string | null
  onSelectPalace?: (branch: string) => void
}) {
  const locale = useLocale() as Locale
  const t = useTranslations('Zwds.chart')
  const timeNames = locale === Locale.KO ? TIME_INDEX_NAMES_KO : TIME_INDEX_NAMES_HANJA
  const { year, month, day, hour } = chart.fourPillars

  return (
    <div className="w-full max-w-4xl overflow-x-auto">
      <div className="grid min-w-2xl grid-cols-4 grid-rows-4 gap-1.5">
        {chart.palaces.map((palace) => (
          <PalaceCell
            key={palace.branch}
            locale={locale}
            onSelect={onSelectPalace ? () => onSelectPalace(palace.branch) : undefined}
            palace={palace}
            selected={selectedBranch === palace.branch}
          />
        ))}

        <div className="col-start-2 col-span-2 row-start-2 row-span-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-border-2 bg-surface-2 p-4 text-center">
          <h2 className="text-lg font-bold text-foreground">{t('title')}</h2>
          <p className="text-sm font-semibold text-accent">
            {chart.gender === 'male' ? t('genderMale') : t('genderFemale')} · {pick(chart.fiveElementsClass, locale)}
          </p>
          <p className="text-xs text-foreground-muted">
            {t('lunarDateLabel')} {chart.lunar.year}. {chart.lunar.isLeap ? `${t('leapMonth')} ` : ''}
            {chart.lunar.month}. {chart.lunar.day}.
          </p>
          <p className="text-xs text-foreground-muted" lang={locale === Locale.KO ? undefined : 'zh-Hant'}>
            {t('fourPillarsLabel')} {pillarText(year, locale)} {pillarText(month, locale)} {pillarText(day, locale)}{' '}
            {pillarText(hour, locale)}
          </p>
          <p className="text-[11px] leading-relaxed text-foreground-faint">
            {t('solarTimeNote', {
              time: formatClock(chart.apparentClock.hour, chart.apparentClock.minute),
              timeName: timeNames[chart.timeIndex],
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
