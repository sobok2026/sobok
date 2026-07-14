// Renders a self-contained 3:4 PNG of the natal chart for sharing/saving — drawn
// with the Canvas 2D API rather than by rasterizing the live SVG wheel. The live
// wheel leans on CSS-module classes, CSS variables and the Pretendard webfont,
// none of which survive an `<img>`-based SVG rasterization; drawing to canvas
// with the document's own loaded font (passed in as `fontFamily`) reproduces the
// brand look deterministically and renders the CJK service names (별무리/星屑/星黛洛)
// correctly. Geometry is shared with the on-screen wheel via `polar`/`placePlanets`
// so the exported chart is pixel-faithful to what the visitor sees.

import { computeAspects, elementOfSign, signOfLon } from '../chart/astrology'
import { ASPECT_STYLE, ELEMENT_COLORS, SIGNS } from '../chart/data'
import { type Point, placePlanets, polar, RADIUS, TOKEN, VIEW } from '../chart/geometry'
import type { NatalChart } from '../chart/types'
import { glyphText } from './glyphs'

/** One Big-3 tile: the body's glyph, its localized label and its sign name. */
export type ShareCardCell = { glyph: string; label: string; value: string }

/** All localized copy the card needs — resolved by the caller from next-intl. */
export type ShareCardContent = {
  eyebrow: string
  title: string
  big3: readonly ShareCardCell[]
  siteName: string
  url: string
}

// Fixed export dimensions: 3:4 portrait at a resolution that stays crisp on
// retina phones and in KakaoTalk/Instagram. Everything below is authored in this
// pixel space (no separate device-pixel-ratio pass — this canvas is never shown).
const CARD_W = 1080
const CARD_H = 1440
const MARGIN = 76

// Wheel placement. `K` scales the 360-unit VIEW space (padded to ~392 on screen)
// up to the card; strokes and font sizes are multiplied by it so proportions
// match the live wheel exactly.
const WHEEL_CX = 540
const WHEEL_CY = 650
const K = 2

// Palette mirrors src/app/globals.css (canvas can't read CSS variables).
const COLOR = {
  glow: '#1a0f3a',
  base: '#0a0618',
  deep: '#05010f',
  foreground: '#f1f5f9',
  muted: '#cbd5e1',
  subtle: '#94a3b8',
  faint: '#64748b',
  brand: '#f5bcff',
  accent: '#c9a8ff',
  cool: '#7cc4ff',
  warm: '#ffd66b',
  danger: '#fb7185',
} as const

/** Map a VIEW-space point onto the card so shared geometry lands identically. */
function toCard(p: Point): Point {
  return { x: WHEEL_CX + (p.x - VIEW / 2) * K, y: WHEEL_CY + (p.y - VIEW / 2) * K }
}

/** Card-space point for an ecliptic longitude at wheel radius `r`. */
function at(lon: number, r: number, ascendant: number): Point {
  return toCard(polar(lon, r, ascendant))
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

function paintBackground(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createRadialGradient(WHEEL_CX, -120, 120, WHEEL_CX, 300, CARD_H)
  bg.addColorStop(0, COLOR.glow)
  bg.addColorStop(0.45, COLOR.base)
  bg.addColorStop(1, COLOR.deep)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const rng = mulberry32(0x5713a)
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

/** Trace an annular wedge by sampling the two arcs — avoids canvas arc-direction pitfalls. */
function annularWedge(
  ctx: CanvasRenderingContext2D,
  lonStart: number,
  lonEnd: number,
  rOuter: number,
  rInner: number,
  ascendant: number,
) {
  const steps = 16
  ctx.beginPath()

  for (let i = 0; i <= steps; i++) {
    const lon = lonStart + ((lonEnd - lonStart) * i) / steps
    const p = at(lon, rOuter, ascendant)
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
  }

  for (let i = steps; i >= 0; i--) {
    const lon = lonStart + ((lonEnd - lonStart) * i) / steps
    const p = at(lon, rInner, ascendant)
    ctx.lineTo(p.x, p.y)
  }

  ctx.closePath()
}

function ring(ctx: CanvasRenderingContext2D, r: number, stroke: string, width: number, dash?: number[]) {
  ctx.beginPath()
  ctx.arc(WHEEL_CX, WHEEL_CY, r * K, 0, Math.PI * 2)
  ctx.strokeStyle = stroke
  ctx.lineWidth = width * K
  ctx.setLineDash(dash ? dash.map((d) => d * K) : [])
  ctx.stroke()
  ctx.setLineDash([])
}

function line(ctx: CanvasRenderingContext2D, a: Point, b: Point, stroke: string, width: number, dash?: number[]) {
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.strokeStyle = stroke
  ctx.lineWidth = width * K
  ctx.setLineDash(dash ? dash.map((d) => d * K) : [])
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.setLineDash([])
  ctx.lineCap = 'butt'
}

function paintWheel(ctx: CanvasRenderingContext2D, chart: NatalChart, family: string) {
  const anchor = chart.ascendant ?? 0
  const aspects = computeAspects(chart.planets)
  const placed = placePlanets(chart.planets, anchor)
  const pointById = new Map(placed.map((p) => [p.planet.id, toCard(p.point)]))

  // Rings.
  ring(ctx, RADIUS.zodiacOuter, 'rgba(255,255,255,0.12)', 1)
  ring(ctx, RADIUS.zodiacInner, 'rgba(255,255,255,0.1)', 1)
  ring(ctx, RADIUS.houseInner, 'rgba(255,255,255,0.08)', 1)
  ring(ctx, RADIUS.planet + 14, 'rgba(255,255,255,0.06)', 1, [2, 4])

  // Zodiac sectors + glyphs, tinted by element.
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  SIGNS.forEach((sign, i) => {
    const color = ELEMENT_COLORS[sign.element]
    annularWedge(ctx, i * 30, i * 30 + 30, RADIUS.zodiacOuter, RADIUS.zodiacInner, anchor)
    ctx.globalAlpha = 0.14
    ctx.fillStyle = color
    ctx.fill()
    ctx.globalAlpha = 1

    const g = at(i * 30 + 15, RADIUS.zodiacGlyph, anchor)
    setFont(ctx, 400, 16 * K, family)
    ctx.fillStyle = color
    ctx.fillText(glyphText(sign.glyph), g.x, g.y)
  })

  // House cusps (only with a birth time).
  if (chart.ascendant !== null && chart.cusps) {
    chart.cusps.forEach((lon, k) => {
      const inner = at(lon, RADIUS.aspect, anchor)
      const outer = at(lon, RADIUS.houseOuter, anchor)
      const primary = k === 0 || k === 9
      const secondary = k === 3 || k === 6
      const stroke = primary ? 'rgba(245,188,255,0.5)' : secondary ? 'rgba(245,188,255,0.3)' : 'rgba(255,255,255,0.1)'
      line(ctx, inner, outer, stroke, primary ? 1.2 : secondary ? 0.9 : 0.6)
    })
  }

  // Aspect web under the tokens.
  for (const aspect of aspects) {
    const a = pointById.get(aspect.a)
    const b = pointById.get(aspect.b)

    if (!a || !b) {
      continue
    }

    const style = ASPECT_STYLE[aspect.type]
    ctx.globalAlpha = 0.85
    line(ctx, a, b, style.color, 1.2, style.dashed ? [4, 3] : undefined)
  }

  ctx.globalAlpha = 1

  // Center hub glow.
  const hub = ctx.createRadialGradient(WHEEL_CX, WHEEL_CY, 0, WHEEL_CX, WHEEL_CY, 10 * K)
  hub.addColorStop(0, '#ffffff')
  hub.addColorStop(0.6, COLOR.brand)
  hub.addColorStop(1, 'rgba(124,196,255,0)')
  ctx.fillStyle = hub
  ctx.beginPath()
  ctx.arc(WHEEL_CX, WHEEL_CY, 10 * K, 0, Math.PI * 2)
  ctx.fill()

  // True-longitude ticks.
  for (const p of placed) {
    const color = ELEMENT_COLORS[elementOfSign(signOfLon(p.planet.lon))]

    if (p.connector) {
      line(ctx, toCard(p.connector.from), toCard(p.connector.to), color, 0.9, [1.5, 2])
    }

    line(ctx, toCard(p.tick.inner), toCard(p.tick.outer), color, 1.4)
  }

  // Planet tokens.
  placed.forEach((p) => {
    const point = toCard(p.point)
    const color = ELEMENT_COLORS[elementOfSign(signOfLon(p.planet.lon))]

    ctx.globalAlpha = 0.18
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(point.x, point.y, TOKEN.glow * K, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    ctx.beginPath()
    ctx.arc(point.x, point.y, TOKEN.disc * K, 0, Math.PI * 2)
    ctx.fillStyle = COLOR.base
    ctx.fill()
    ctx.lineWidth = 1.2 * K
    ctx.strokeStyle = color
    ctx.stroke()

    setFont(ctx, 400, 13.5 * K, family)
    ctx.fillStyle = color
    ctx.fillText(glyphText(p.planet.glyph), point.x, point.y + 0.5 * K)

    if (p.planet.retrograde) {
      const rx = point.x + 9.5 * K
      const ry = point.y - 9.5 * K
      ctx.beginPath()
      ctx.arc(rx, ry, 5.2 * K, 0, Math.PI * 2)
      ctx.fillStyle = COLOR.base
      ctx.fill()
      ctx.lineWidth = 0.8 * K
      ctx.strokeStyle = 'rgba(251,113,133,0.55)'
      ctx.stroke()
      setFont(ctx, 700, 7 * K, family)
      ctx.fillStyle = COLOR.danger
      ctx.fillText('℞', rx, ry + 0.3 * K)
    }
  })
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

function paintHeader(ctx: CanvasRenderingContext2D, content: ShareCardContent, family: string) {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  ctx.save()
  setFont(ctx, 600, 26, family)
  ctx.letterSpacing = '6px'
  ctx.fillStyle = COLOR.accent
  ctx.fillText(content.eyebrow.toUpperCase(), CARD_W / 2, 150)
  ctx.restore()

  const maxWidth = CARD_W - MARGIN * 2
  const size = fitFont(ctx, content.title, 700, 62, family, maxWidth)
  const half = Math.min(ctx.measureText(content.title).width, maxWidth) / 2
  const grad = ctx.createLinearGradient(CARD_W / 2 - half, 0, CARD_W / 2 + half, 0)
  grad.addColorStop(0, COLOR.cool)
  grad.addColorStop(0.5, COLOR.brand)
  grad.addColorStop(1, COLOR.warm)
  setFont(ctx, 700, size, family)
  ctx.fillStyle = grad
  ctx.fillText(content.title, CARD_W / 2, 232)
}

function paintBig3(ctx: CanvasRenderingContext2D, cells: readonly ShareCardCell[], family: string) {
  const top = 1044
  const height = 168
  const gap = 24
  const width = (CARD_W - MARGIN * 2 - gap * 2) / 3

  cells.slice(0, 3).forEach((cell, i) => {
    const x = MARGIN + i * (width + gap)
    const cx = x + width / 2

    ctx.beginPath()
    ctx.roundRect(x, top, width, height, 20)
    ctx.fillStyle = 'rgba(20,26,56,0.72)'
    ctx.fill()
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(148,163,184,0.22)'
    ctx.stroke()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    setFont(ctx, 500, 27, family)
    ctx.fillStyle = COLOR.subtle
    ctx.fillText(`${cell.glyph} ${cell.label}`, cx, top + 58)

    const value = cell.value
    const size = fitFont(ctx, value, 600, 40, family, width - 28)
    setFont(ctx, 600, size, family)
    ctx.fillStyle = COLOR.foreground
    ctx.fillText(value, cx, top + 112)
  })
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

function paintWatermark(ctx: CanvasRenderingContext2D, content: ShareCardContent, family: string) {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  setFont(ctx, 600, 34, family)
  const nameWidth = ctx.measureText(content.siteName).width
  const total = 20 + 14 + nameWidth
  const startX = CARD_W / 2 - total / 2
  const y = 1300

  sparkle(ctx, startX + 10, y, 11, COLOR.warm)
  ctx.fillStyle = COLOR.foreground
  ctx.fillText(content.siteName, startX + 34, y)

  ctx.textAlign = 'center'
  setFont(ctx, 400, 24, family)
  ctx.letterSpacing = '2px'
  ctx.fillStyle = COLOR.faint
  ctx.fillText(content.url, CARD_W / 2, y + 44)
  ctx.letterSpacing = '0px'
}

/**
 * Draw the whole card onto a fresh offscreen canvas and return it as a PNG blob.
 * The caller must `await document.fonts.ready` first so Pretendard is available —
 * canvas text otherwise falls back to a system font mid-load.
 */
export async function createNatalShareCard(
  chart: NatalChart,
  content: ShareCardContent,
  fontFamily: string,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('2d context unavailable')
  }

  paintBackground(ctx)
  paintWheel(ctx, chart, fontFamily)
  paintHeader(ctx, content, fontFamily)
  paintBig3(ctx, content.big3, fontFamily)
  paintWatermark(ctx, content, fontFamily)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))), 'image/png')
  })
}
