// Renders a self-contained 3:4 PNG in-browser, mirroring stella's share-card
// pattern: fixed export pixel space, palette resolved from the live CSS design
// tokens, deterministic starfield, Web Share handled by the caller. The 4×4
// 명반 grid is drawn directly from ZwdsChart — all text renders through the
// page font (Pretendard), so callers must await document.fonts.ready first.

import type { Locale } from '@sobok/domain/locale'

import { type Label, pickLabel } from '@/chart/labels'
import type { ZwdsChart, ZwdsPalace, ZwdsStar } from '@/chart/types'

/** One summary tile below the grid: label on top, value below. */
export type ShareCardCell = { label: string; value: string }

/** All localized copy the card needs — resolved by the caller. */
export type ShareCardContent = {
  eyebrow: string
  title: string
  summary: readonly ShareCardCell[]
  bodyPalaceBadge: string
  emptyPalace: string
  siteName: string
  url: string
}

// Fixed export dimensions: 3:4 portrait, authored directly in export pixels.
const CARD_W = 1080
const CARD_H = 1440
const MARGIN = 64

const HEADER_EYEBROW_Y = 72
const HEADER_TITLE_Y = 146

const GRID_TOP = 190
const GRID_GAP = 10
const CELL = (CARD_W - MARGIN * 2 - GRID_GAP * 3) / 4
const GRID_SIZE = CELL * 4 + GRID_GAP * 3

const SUMMARY_TOP = GRID_TOP + GRID_SIZE + 26
const SUMMARY_HEIGHT = 128
const WATERMARK_Y = 1372

// Traditional 명반 layout — 巳 at the top-left, twelve branches clockwise
// around the frame. Mirrors ChartGrid's GRID_POSITION.
const GRID_POSITION: Readonly<Record<string, readonly [col: number, row: number]>> = {
  巳: [0, 0],
  午: [1, 0],
  未: [2, 0],
  申: [3, 0],
  辰: [0, 1],
  酉: [3, 1],
  卯: [0, 2],
  戌: [3, 2],
  寅: [0, 3],
  丑: [1, 3],
  子: [2, 3],
  亥: [3, 3],
}

type ShareCardPalette = {
  accent: string
  accentGold: string
  base: string
  border: string
  brand: string
  danger: string
  deep: string
  faint: string
  foreground: string
  glow: string
  positive: string
  subtle: string
}

const PALETTE_VARIABLES: Record<keyof ShareCardPalette, string> = {
  accent: '--color-accent',
  accentGold: '--color-accent-gold',
  base: '--color-background',
  border: '--color-border-2',
  brand: '--color-brand',
  danger: '--color-danger',
  deep: '--color-background-deep',
  faint: '--color-foreground-faint',
  foreground: '--color-foreground',
  glow: '--color-background-glow',
  positive: '--color-positive',
  subtle: '--color-foreground-subtle',
}

/** Resolve the same CSS design tokens the live grid uses instead of copying values. */
function readPalette(): ShareCardPalette {
  const style = getComputedStyle(document.documentElement)

  const entries = Object.entries(PALETTE_VARIABLES).map(([key, variable]) => {
    const value = style.getPropertyValue(variable).trim()

    if (!value) {
      throw new Error(`missing CSS color token: ${variable}`)
    }

    return [key, value]
  })

  return Object.fromEntries(entries) as ShareCardPalette
}

function setFont(ctx: CanvasRenderingContext2D, weight: number, size: number, family: string) {
  ctx.font = `${weight} ${size}px ${family}`
}

/** Deterministic PRNG so the starfield is stable across re-renders of one chart. */
function mulberry32(seed: number): () => number {
  let a = seed

  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function paintBackground(ctx: CanvasRenderingContext2D, color: ShareCardPalette) {
  const bg = ctx.createRadialGradient(CARD_W / 2, -120, 120, CARD_W / 2, 300, CARD_H)
  bg.addColorStop(0, color.glow)
  bg.addColorStop(0.45, color.base)
  bg.addColorStop(1, color.deep)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const rng = mulberry32(0x2d5d5)
  ctx.fillStyle = '#ffffff'

  for (let i = 0; i < 60; i++) {
    const x = rng() * CARD_W
    const y = rng() * CARD_H
    const r = 0.8 + rng() * 2.2
    ctx.globalAlpha = 0.15 + rng() * 0.55
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

/** Shrink `size` until `text` fits `maxWidth`, then return the size actually used. */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  size: number,
  family: string,
  maxWidth: number,
): number {
  let s = size

  while (s > 12) {
    setFont(ctx, weight, s, family)

    if (ctx.measureText(text).width <= maxWidth) {
      break
    }

    s -= 2
  }

  return s
}

function paintHeader(
  ctx: CanvasRenderingContext2D,
  content: ShareCardContent,
  family: string,
  color: ShareCardPalette,
) {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  ctx.save()
  setFont(ctx, 600, 25, family)
  ctx.letterSpacing = '6px'
  ctx.fillStyle = color.accent
  ctx.fillText(content.eyebrow, CARD_W / 2, HEADER_EYEBROW_Y)
  ctx.restore()

  const maxWidth = CARD_W - MARGIN * 2
  const size = fitFont(ctx, content.title, 700, 58, family, maxWidth)
  setFont(ctx, 700, size, family)
  const gradient = ctx.createLinearGradient(CARD_W / 2 - 300, 0, CARD_W / 2 + 300, 0)
  gradient.addColorStop(0, color.accent)
  gradient.addColorStop(0.5, color.brand)
  gradient.addColorStop(1, color.accentGold)
  ctx.fillStyle = gradient
  ctx.fillText(content.title, CARD_W / 2, HEADER_TITLE_Y)
}

function mutagenColor(mutagen: Label, color: ShareCardPalette): string {
  if (mutagen.ko === '화록') {
    return color.accentGold
  }
  if (mutagen.ko === '화기') {
    return color.danger
  }
  return color.positive
}

/** One line of star names; mutagen carriers get their 사화 glyph appended in color. */
function paintStarLine(
  ctx: CanvasRenderingContext2D,
  stars: readonly ZwdsStar[],
  x: number,
  y: number,
  maxWidth: number,
  weight: number,
  size: number,
  family: string,
  fill: string,
  locale: Locale,
  color: ShareCardPalette,
  withBrightness: boolean,
): number {
  let cursor = x

  for (const star of stars) {
    const name = pickLabel(star.label, locale)
    setFont(ctx, weight, size, family)

    if (cursor + ctx.measureText(name).width > x + maxWidth) {
      break
    }

    ctx.fillStyle = fill
    ctx.fillText(name, cursor, y)
    cursor += ctx.measureText(name).width

    if (withBrightness && star.brightness) {
      const brightness = pickLabel(star.brightness, locale)
      setFont(ctx, 400, size * 0.62, family)
      ctx.fillStyle = color.subtle
      ctx.fillText(brightness, cursor + 1, y - size * 0.32)
      cursor += ctx.measureText(brightness).width + 2
    }

    if (star.mutagen) {
      const mutagen = pickLabel(star.mutagen, locale)
      setFont(ctx, 600, size * 0.62, family)
      ctx.fillStyle = mutagenColor(star.mutagen, color)
      ctx.fillText(mutagen, cursor + 2, y)
      cursor += ctx.measureText(mutagen).width + 4
    }

    cursor += size * 0.34
  }

  return cursor
}

function paintPalaceCell(
  ctx: CanvasRenderingContext2D,
  palace: ZwdsPalace,
  x: number,
  y: number,
  content: ShareCardContent,
  family: string,
  color: ShareCardPalette,
  locale: Locale,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, CELL, CELL, 14)
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = color.border
  ctx.stroke()

  const pad = 14
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // Header row: palace name (+신궁 badge) left, stem-branch right.
  setFont(ctx, 700, 21, family)
  ctx.fillStyle = color.accent
  const palaceName = pickLabel(palace.name, locale)
  ctx.fillText(palaceName, x + pad, y + pad + 18)

  if (palace.isBodyPalace) {
    const nameWidth = ctx.measureText(palaceName).width
    setFont(ctx, 600, 15, family)
    ctx.fillStyle = color.brand
    ctx.fillText(content.bodyPalaceBadge, x + pad + nameWidth + 7, y + pad + 18)
  }

  setFont(ctx, 400, 16, family)
  ctx.fillStyle = color.faint
  ctx.textAlign = 'right'
  ctx.fillText(`${palace.stemLabel.hanja}${palace.branchLabel.hanja}`, x + CELL - pad, y + pad + 18)
  ctx.textAlign = 'left'

  // Major stars with brightness + 사화.
  const starY = y + pad + 58
  if (palace.majorStars.length === 0) {
    setFont(ctx, 500, 22, family)
    ctx.fillStyle = color.faint
    ctx.fillText(content.emptyPalace, x + pad, starY)
  } else {
    paintStarLine(
      ctx,
      palace.majorStars,
      x + pad,
      starY,
      CELL - pad * 2,
      700,
      24,
      family,
      color.foreground,
      locale,
      color,
      true,
    )
  }

  // 길성 (gold) and 살성 (danger) rows.
  if (palace.luckyStars.length > 0) {
    paintStarLine(
      ctx,
      palace.luckyStars,
      x + pad,
      starY + 34,
      CELL - pad * 2,
      500,
      17,
      family,
      color.accentGold,
      locale,
      color,
      false,
    )
  }
  if (palace.unluckyStars.length > 0) {
    paintStarLine(
      ctx,
      palace.unluckyStars,
      x + pad,
      starY + 62,
      CELL - pad * 2,
      500,
      17,
      family,
      color.danger,
      locale,
      color,
      false,
    )
  }

  // Decadal range bottom-right.
  setFont(ctx, 400, 15, family)
  ctx.fillStyle = color.faint
  ctx.textAlign = 'right'
  ctx.fillText(`${palace.decadal.from}-${palace.decadal.to}`, x + CELL - pad, y + CELL - pad)
  ctx.textAlign = 'left'
}

function paintCenter(ctx: CanvasRenderingContext2D, lines: readonly string[], family: string, color: ShareCardPalette) {
  const x = MARGIN + CELL + GRID_GAP
  const y = GRID_TOP + CELL + GRID_GAP
  const size = CELL * 2 + GRID_GAP

  ctx.beginPath()
  ctx.roundRect(x, y, size, size, 14)
  ctx.fillStyle = 'rgba(255,255,255,0.055)'
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = color.border
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const cx = x + size / 2
  const startY = y + size / 2 - ((lines.length - 1) * 44) / 2

  lines.forEach((text, index) => {
    const heading = index === 0
    const fitted = fitFont(ctx, text, heading ? 700 : 400, heading ? 34 : 22, family, size - 40)
    setFont(ctx, heading ? 700 : 400, fitted, family)
    ctx.fillStyle = heading ? color.foreground : color.subtle
    ctx.fillText(text, cx, startY + index * 44)
  })

  ctx.textBaseline = 'alphabetic'
}

function paintGrid(
  ctx: CanvasRenderingContext2D,
  chart: ZwdsChart,
  centerLines: readonly string[],
  content: ShareCardContent,
  family: string,
  color: ShareCardPalette,
  locale: Locale,
) {
  for (const palace of chart.palaces) {
    const position = GRID_POSITION[palace.branch]

    if (!position) {
      continue
    }

    const x = MARGIN + position[0] * (CELL + GRID_GAP)
    const y = GRID_TOP + position[1] * (CELL + GRID_GAP)
    paintPalaceCell(ctx, palace, x, y, content, family, color, locale)
  }

  paintCenter(ctx, centerLines, family, color)
}

function paintSummary(
  ctx: CanvasRenderingContext2D,
  cells: readonly ShareCardCell[],
  family: string,
  color: ShareCardPalette,
) {
  const gap = 20
  const width = (CARD_W - MARGIN * 2 - gap * 2) / 3

  cells.slice(0, 3).forEach((cell, i) => {
    const x = MARGIN + i * (width + gap)
    const cx = x + width / 2

    ctx.beginPath()
    ctx.roundRect(x, SUMMARY_TOP, width, SUMMARY_HEIGHT, 18)
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.fill()
    ctx.lineWidth = 1
    ctx.strokeStyle = color.border
    ctx.stroke()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    setFont(ctx, 500, 24, family)
    ctx.fillStyle = color.subtle
    ctx.fillText(cell.label, cx, SUMMARY_TOP + 40)

    const size = fitFont(ctx, cell.value, 600, 36, family, width - 28)
    setFont(ctx, 600, size, family)
    ctx.fillStyle = color.foreground
    ctx.fillText(cell.value, cx, SUMMARY_TOP + 86)
  })

  ctx.textBaseline = 'alphabetic'
}

/** A small four-point sparkle centered at (cx, cy). */
function sparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, fill: string) {
  ctx.beginPath()
  ctx.moveTo(cx, cy - s)
  ctx.lineTo(cx + s * 0.28, cy - s * 0.28)
  ctx.lineTo(cx + s, cy)
  ctx.lineTo(cx + s * 0.28, cy + s * 0.28)
  ctx.lineTo(cx, cy + s)
  ctx.lineTo(cx - s * 0.28, cy + s * 0.28)
  ctx.lineTo(cx - s, cy)
  ctx.lineTo(cx - s * 0.28, cy - s * 0.28)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function paintWatermark(
  ctx: CanvasRenderingContext2D,
  content: ShareCardContent,
  family: string,
  color: ShareCardPalette,
) {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  setFont(ctx, 600, 32, family)
  const nameWidth = ctx.measureText(content.siteName).width
  const total = 20 + 14 + nameWidth
  const startX = CARD_W / 2 - total / 2

  sparkle(ctx, startX + 10, WATERMARK_Y, 11, color.accentGold)
  ctx.fillStyle = color.foreground
  ctx.fillText(content.siteName, startX + 34, WATERMARK_Y)

  ctx.textAlign = 'center'
  setFont(ctx, 400, 22, family)
  ctx.letterSpacing = '2px'
  ctx.fillStyle = color.faint
  ctx.fillText(content.url, CARD_W / 2, WATERMARK_Y + 42)
  ctx.letterSpacing = '0px'
}

/**
 * Draw the whole card onto a fresh offscreen canvas and return it as a PNG
 * blob. The caller must `await document.fonts.ready` first so every string
 * renders in the page font.
 */
export async function createChartShareCard(
  chart: ZwdsChart,
  centerLines: readonly string[],
  content: ShareCardContent,
  fontFamily: string,
  locale: Locale,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('2d context unavailable')
  }

  const color = readPalette()

  paintBackground(ctx, color)
  paintHeader(ctx, content, fontFamily, color)
  paintGrid(ctx, chart, centerLines, content, fontFamily, color, locale)
  paintSummary(ctx, content.summary, fontFamily, color)
  paintWatermark(ctx, content, fontFamily, color)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))), 'image/png')
  })
}
