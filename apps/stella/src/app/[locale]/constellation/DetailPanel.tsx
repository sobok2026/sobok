'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { degreeMinuteInSign, elementOfSign, houseOfLon, signOfLon } from '../chart/astrology'
import { ASPECT_STYLE, ELEMENT_COLORS, PLANET_GLYPHS, SIGNS } from '../chart/data'
import type { NatalChart, PlanetId, SignId } from '../chart/types'
import styles from '../constellation.module.css'
import { aspectTone, orbTier, pairKey } from '../interpretations/types'
import { glyphText } from './glyphs'
import type { Selection } from './selection'

export interface DetailPanelProps {
  ascendant: number | null
  chart: NatalChart
  onClose: () => void
  selection: Selection
}

/** The reading card under the wheel — one layout per selection kind (sign / aspect / house / planet). */
export default function DetailPanel({ ascendant, chart, onClose, selection }: DetailPanelProps) {
  const t = useTranslations('Constellation')
  const [showDetail, setShowDetail] = useState(false)

  if (!selection) {
    return (
      <div className="rounded-2xl border bg-surface p-4 text-center sm:p-5">
        <p className="text-sm font-semibold text-foreground-secondary">{t('panel.empty')}</p>
        <p className="mt-1 text-xs text-foreground-subtle">{t('panel.emptyHint')}</p>
      </div>
    )
  }

  if (selection.kind === 'sign') {
    const element = elementOfSign(selection.id as SignId)
    const color = ELEMENT_COLORS[element]
    const glyph = SIGNS.find((s) => s.id === selection.id)?.glyph ?? '★'

    return (
      <div className={`${styles.sheetIn} relative rounded-2xl border bg-surface-2 p-4 backdrop-blur sm:p-5`}>
        <CloseButton label={t('panel.close')} onClose={onClose} />
        <div className="flex items-center gap-3">
          <span className="text-2xl" style={{ color }}>
            {glyphText(glyph)}
          </span>
          <div>
            <p className="text-base font-bold text-foreground">{t(`signs.${selection.id}`)}</p>
            <Chip color={color} label={t(`elements.${element}`)} />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{t(`signKeywords.${selection.id}`)}</p>
      </div>
    )
  }

  if (selection.kind === 'aspect') {
    const color = ASPECT_STYLE[selection.aspectType].color
    const pairKeyId = pairKey(selection.a as PlanetId, selection.b as PlanetId)
    const tone = aspectTone(selection.aspectType)
    const specificKey = `readings.aspectPairs.${pairKeyId}.${tone}`
    const legacyKey = `readings.aspectPairs.${pairKeyId}.friction`

    const pairReadingKey = t.has(specificKey)
      ? specificKey
      : (tone === 'square' || tone === 'opposition') && t.has(legacyKey)
        ? legacyKey
        : `aspects.${selection.aspectType}Desc`

    const pairReading = t(pairReadingKey)
    const tier = orbTier(selection.orb)
    const intensityKey = tier ? `readings.aspectIntensity.${tier}` : null
    const intensity = intensityKey && t.has(intensityKey) ? t(intensityKey) : null

    return (
      <div className={`${styles.sheetIn} relative rounded-2xl border bg-surface-2 p-4 backdrop-blur sm:p-5`}>
        <CloseButton label={t('panel.close')} onClose={onClose} />
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-2xl" style={{ color }}>
            {glyphText(PLANET_GLYPHS[selection.a as never])} {glyphText(PLANET_GLYPHS[selection.b as never])}
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-foreground">
              {t(`planets.${selection.a}`)} <span className="text-foreground-faint">↔</span>{' '}
              {t(`planets.${selection.b}`)}
            </p>
            <span className="text-xs font-medium" style={{ color }}>
              {t(`aspects.${selection.aspectType}Vibe`)}{' '}
              <span className="text-foreground-faint">
                · {t(`aspects.${selection.aspectType}Name`)} · {t('aspects.orbLabel')} {selection.orb}°
              </span>
            </span>
          </div>
        </div>
        {intensity && (
          <p
            className={`mt-3 text-xs font-semibold ${tier === 'wide' ? 'text-foreground-subtle' : ''}`}
            style={tier === 'tight' ? { color } : undefined}
          >
            {intensity}
          </p>
        )}
        <p className={`${intensity ? 'mt-2' : 'mt-3'} text-sm leading-relaxed text-foreground-secondary`}>
          {pairReading}
        </p>
      </div>
    )
  }

  if (selection.kind === 'house') {
    const n = selection.n
    const residents = chart.planets.filter((p) => houseOfLon(p.lon, chart.cusps, ascendant) === n)

    return (
      <div className={`${styles.sheetIn} relative rounded-2xl border bg-surface-2 p-4 backdrop-blur sm:p-5`}>
        <CloseButton label={t('panel.close')} onClose={onClose} />
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full border"
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
          >
            <span className="text-base font-bold">{n}</span>
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-foreground">{t('panel.house', { n })}</p>
            <p className="text-xs text-foreground-subtle">{t(`houseThemes.${n}`)}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{t(`houseIntros.${n}`)}</p>
        {residents.length === 0 ? (
          <p className="mt-3 border-t pt-3 text-sm leading-relaxed text-foreground-subtle">{t('panel.emptyHouse')}</p>
        ) : (
          residents.map((p) => {
            const residentSign = signOfLon(p.lon)
            const residentColor = ELEMENT_COLORS[elementOfSign(residentSign)]
            const readingKey = `readings.houses.${p.id}.${n}`

            return (
              <div className="mt-3 border-t pt-3" key={p.id}>
                <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: residentColor }}>
                  {glyphText(PLANET_GLYPHS[p.id])} {t(`planets.${p.id}`)}
                  <span className="font-medium text-foreground-faint">· {t(`signs.${residentSign}`)}</span>
                </p>
                {t.has(readingKey) && (
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground-secondary">{t(readingKey)}</p>
                )}
              </div>
            )
          })
        )}
      </div>
    )
  }

  const planet = chart.planets.find((p) => p.id === selection.id)

  if (!planet) {
    return null
  }

  const sign = signOfLon(planet.lon)
  const element = elementOfSign(sign)
  const color = ELEMENT_COLORS[element]
  const dm = degreeMinuteInSign(planet.lon)
  const house = houseOfLon(planet.lon, chart.cusps, ascendant)
  const retroKey = `readings.retro.${planet.id}.${sign}`
  const reading = planet.retrograde && t.has(retroKey) ? t(retroKey) : t(`readings.planets.${planet.id}.${sign}`)

  return (
    <div className={`${styles.sheetIn} relative rounded-2xl border bg-surface-2 p-4 backdrop-blur sm:p-5`}>
      <CloseButton label={t('panel.close')} onClose={onClose} />
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full border"
          style={{ borderColor: color, color }}
        >
          <span className="text-xl">{glyphText(PLANET_GLYPHS[planet.id])}</span>
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-base font-bold text-foreground">
            {t(`planets.${planet.id}`)}
            {planet.retrograde && (
              <span className="rounded bg-danger/20 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                ℞ {t('panel.retrograde')}
              </span>
            )}
          </p>
          <p className="text-xs text-foreground-subtle">
            {t(`signs.${sign}`)}
            {house !== null && <> · {t('panel.area', { name: t(`houseThemes.${house}`) })}</>}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">{reading}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip color={color} label={`${t('panel.elementLabel')}: ${t(`elements.${element}`)}`} />
        <Chip color="var(--color-accent)" label={`${t('panel.keywordLabel')}: ${t(`signKeywords.${sign}`)}`} />
      </div>
      <button
        className="mt-3 text-[11px] text-foreground-subtle underline-offset-2 transition hover:text-foreground-secondary hover:underline"
        onClick={() => setShowDetail((v) => !v)}
        type="button"
      >
        {showDetail ? t('panel.hideDetail') : t('panel.showDetail')}
      </button>
      {showDetail && (
        <div className="mt-2 rounded-xl bg-surface px-3 py-2.5">
          <p className="text-xs font-medium text-foreground-secondary">
            {t(`signs.${sign}`)} {dm.degree}°{String(dm.minute).padStart(2, '0')}′
            {house !== null && <> · {t('panel.house', { n: house })}</>} ·{' '}
            {planet.retrograde ? t('panel.retrograde') : t('panel.direct')}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground-faint">{t('panel.detailHint')}</p>
        </div>
      )}
    </div>
  )
}

interface CloseButtonProps {
  label: string
  onClose: () => void
}

function CloseButton({ label, onClose }: CloseButtonProps) {
  return (
    <button
      aria-label={label}
      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-sm text-foreground-subtle transition hover:bg-surface-3 hover:text-foreground"
      onClick={onClose}
      type="button"
    >
      ✕
    </button>
  )
}

interface ChipProps {
  color: string
  label: string
}

function Chip({ color, label }: ChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
      // color-mix instead of hex-alpha concat so both raw hexes and var() tokens work
      style={{ backgroundColor: `color-mix(in srgb, ${color} 13%, transparent)`, color }}
    >
      {label}
    </span>
  )
}
