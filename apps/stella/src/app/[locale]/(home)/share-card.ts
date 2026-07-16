// Renders a self-contained 3:4 PNG in-browser. The surrounding card is Canvas-
// specific, while the wheel consumes the same scene and resting visual contract
// as the interactive SVG so their static, unselected representations stay aligned.

import type { ChartAspect, NatalChart } from '@/chart/types'
import { HERO_TITLE_STYLE } from '@/components/hero-title-style'
import { ASTROLOGY_GLYPH_UNITS_PER_EM, getAstrologyGlyphPath } from './wheel/astrology-glyph-paths'
import { CENTER, type Point, TOKEN, VIEW } from './wheel/geometry'
import {
  buildWheelScene,
  WHEEL_STYLE,
  WHEEL_VIEWBOX_PADDING,
  type WheelRing,
  type WheelScene,
} from './wheel/wheel-scene'

/** One Big-3 tile: the body's glyph, its localized label and its sign name. */
export type ShareCardCell = { glyph: string; label: string; value: string }

/** All localized copy the card needs — resolved by the caller from next-intl. */
export type ShareCardContent = {
  eyebrow: string
  title: string
  big3: readonly ShareCardCell[]
  houseThemes: readonly string[]
  siteName: string
  url: string
}

// Fixed export dimensions: 3:4 portrait at a resolution that stays crisp on
// retina phones and in KakaoTalk/Instagram. Everything below is authored in this
// pixel space (no separate device-pixel-ratio pass — this canvas is never shown).
const CARD_W = 1080
const CARD_H = 1440
const MARGIN = 76

// Fit the page wheel's canonical padded viewport into the card's content-safe
// width. The Canvas then uses the SVG's 360-unit coordinate space as-is.
const WHEEL_VIEWBOX_SIZE = VIEW + WHEEL_VIEWBOX_PADDING * 2
const WHEEL_VIEWPORT_SIZE = CARD_W - MARGIN * 2
const WHEEL_VIEWPORT_TOP = 188
const WHEEL_CX = CARD_W / 2
const WHEEL_CY = WHEEL_VIEWPORT_TOP + WHEEL_VIEWPORT_SIZE / 2
const K = WHEEL_VIEWPORT_SIZE / WHEEL_VIEWBOX_SIZE

// Vertical rhythm after enlarging the wheel: the invisible viewBox padding ends
// just before Big 3, while the visible angle labels retain additional clearance.
const HEADER_EYEBROW_Y = 76
const HEADER_TITLE_Y = 154
const BIG3_TOP = WHEEL_VIEWPORT_TOP + WHEEL_VIEWPORT_SIZE + 4
const BIG3_HEIGHT = 146
const WATERMARK_Y = 1324

const HERO_GRADIENT_SAMPLES = 32

type ShareCardPalette = {
  accent: string
  base: string
  brand: string
  cool: string
  danger: string
  deep: string
  faint: string
  foreground: string
  glow: string
  subtle: string
  warm: string
}

const PALETTE_VARIABLES: Record<keyof ShareCardPalette, string> = {
  accent: '--color-accent',
  base: '--color-background',
  brand: '--color-brand',
  cool: '--color-accent-cool',
  danger: '--color-danger',
  deep: '--color-background-deep',
  faint: '--color-foreground-faint',
  foreground: '--color-foreground',
  glow: '--color-background-glow',
  subtle: '--color-foreground-subtle',
  warm: '--color-accent-warm',
}

/** Resolve the same CSS design tokens used by the live wheel instead of copying values. */
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

/**
 * Canvas gradients interpolate in sRGB, while Tailwind's page gradient upgrades
 * to OKLab when the browser supports it. Sampling CSS color-mix reproduces that
 * perceptual interpolation without maintaining a second set of title colors.
 */
function addHeroGradientStops(gradient: CanvasGradient, colors: readonly [string, string, string]) {
  const supportsOklab =
    CSS.supports('background-image', 'linear-gradient(in lab, red, blue)') &&
    CSS.supports('color', 'color-mix(in oklab, red, blue)')

  if (!supportsOklab) {
    gradient.addColorStop(0, colors[0])
    gradient.addColorStop(0.5, colors[1])
    gradient.addColorStop(1, colors[2])
    return
  }

  const probe = document.createElement('span')
  probe.style.pointerEvents = 'none'
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  document.body.append(probe)

  try {
    for (let index = 0; index <= HERO_GRADIENT_SAMPLES; index++) {
      const offset = index / HERO_GRADIENT_SAMPLES
      const firstHalf = offset <= 0.5
      const from = firstHalf ? colors[0] : colors[1]
      const to = firstHalf ? colors[1] : colors[2]
      const progress = firstHalf ? offset * 2 : (offset - 0.5) * 2

      probe.style.color = `color-mix(in oklab, ${from} ${(1 - progress) * 100}%, ${to} ${progress * 100}%)`
      gradient.addColorStop(offset, getComputedStyle(probe).color)
    }
  } finally {
    probe.remove()
  }
}

function createHeroTitleGradient(
  ctx: CanvasRenderingContext2D,
  fontSize: number,
  color: ShareCardPalette,
): CanvasGradient {
  // HeroTitle uses a centered 24rem gradient behind 1.875rem text. Preserve
  // that ratio at the share-card title's larger font size.
  const width = fontSize * HERO_TITLE_STYLE.gradientWidthEm
  const gradient = ctx.createLinearGradient(CARD_W / 2 - width / 2, 0, CARD_W / 2 + width / 2, 0)
  addHeroGradientStops(gradient, [color.cool, color.brand, color.warm])
  return gradient
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
  const bg = ctx.createRadialGradient(WHEEL_CX, -120, 120, WHEEL_CX, 300, CARD_H)
  bg.addColorStop(0, color.glow)
  bg.addColorStop(0.45, color.base)
  bg.addColorStop(1, color.deep)
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

function ring(ctx: CanvasRenderingContext2D, entry: WheelRing) {
  ctx.beginPath()
  ctx.arc(CENTER, CENTER, entry.radius, 0, Math.PI * 2)
  ctx.strokeStyle = entry.stroke
  ctx.lineWidth = entry.strokeWidth
  ctx.setLineDash(entry.dash ? [...entry.dash] : [])
  ctx.stroke()
  ctx.setLineDash([])
}

function line(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  stroke: string,
  width: number,
  dash?: readonly number[],
  opacity = 1,
  lineCap: CanvasLineCap = 'butt',
) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.globalAlpha = opacity
  ctx.strokeStyle = stroke
  ctx.lineWidth = width
  ctx.setLineDash(dash ? [...dash] : [])
  ctx.lineCap = lineCap
  ctx.stroke()
  ctx.restore()
}

function fillPath(ctx: CanvasRenderingContext2D, path: string, fill: string, opacity: number) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = fill
  ctx.fill(new Path2D(path))
  ctx.restore()
}

const canvasGlyphPaths = new Map<string, Path2D>()

/** Fill the same ink-bounds-centered outline consumed by the page SVG. */
function fillGlyph(ctx: CanvasRenderingContext2D, glyph: string, x: number, y: number, size: number, fill: string) {
  let path = canvasGlyphPaths.get(glyph)

  if (!path) {
    path = new Path2D(getAstrologyGlyphPath(glyph))
    canvasGlyphPaths.set(glyph, path)
  }

  const scale = size / ASTROLOGY_GLYPH_UNITS_PER_EM
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.fillStyle = fill
  ctx.fill(path)
  ctx.restore()
}

function paintWheel(
  ctx: CanvasRenderingContext2D,
  scene: WheelScene,
  houseThemes: readonly string[],
  family: string,
  color: ShareCardPalette,
) {
  ctx.save()
  ctx.translate(WHEEL_CX, WHEEL_CY)
  ctx.scale(K, K)
  ctx.translate(-CENTER, -CENTER)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const entry of scene.rings) {
    ring(ctx, entry)
  }

  for (const sign of scene.signs) {
    fillPath(ctx, sign.sectorPath, sign.color, WHEEL_STYLE.sign.fillOpacity)
    fillGlyph(ctx, sign.glyph, sign.glyphPoint.x, sign.glyphPoint.y, WHEEL_STYLE.sign.glyphSize, sign.color)
  }

  for (const house of scene.houses) {
    line(ctx, house.cuspFrom, house.cuspTo, house.cuspStroke, house.cuspStrokeWidth)
    fillPath(ctx, house.sectorPath, WHEEL_STYLE.house.fill, WHEEL_STYLE.house.fillOpacity)
    setFont(ctx, 400, WHEEL_STYLE.house.labelFontSize, family)
    ctx.fillStyle = WHEEL_STYLE.house.labelFill
    ctx.fillText(houseThemes[house.n - 1] ?? '', house.labelPoint.x, house.labelPoint.y)
  }

  for (const angle of scene.angles) {
    setFont(ctx, angle.fontWeight, angle.fontSize, family)
    ctx.fillStyle = angle.fill
    ctx.fillText(angle.id.toUpperCase(), angle.point.x, angle.point.y)
  }

  for (const aspect of scene.aspects) {
    line(
      ctx,
      aspect.from,
      aspect.to,
      aspect.color,
      WHEEL_STYLE.aspect.strokeWidth,
      aspect.dashed ? WHEEL_STYLE.aspect.dash : undefined,
      WHEEL_STYLE.aspect.opacity,
    )
  }

  if (scene.moonRange) {
    const range = scene.moonRange

    for (const segment of range.segments) {
      fillPath(ctx, segment.sectorPath, segment.color, WHEEL_STYLE.moonRange.fillOpacity)
    }

    line(
      ctx,
      range.startTick.inner,
      range.startTick.outer,
      range.startTick.color,
      WHEEL_STYLE.moonRange.endpointStrokeWidth,
      undefined,
      WHEEL_STYLE.moonRange.endpointOpacity,
      'round',
    )
    line(
      ctx,
      range.endTick.inner,
      range.endTick.outer,
      range.endTick.color,
      WHEEL_STYLE.moonRange.endpointStrokeWidth,
      undefined,
      WHEEL_STYLE.moonRange.endpointOpacity,
      'round',
    )
    ctx.save()
    ctx.globalAlpha = 0.82
    ctx.fillStyle = color.base
    ctx.beginPath()
    ctx.arc(range.glyphPoint.x, range.glyphPoint.y, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    fillGlyph(
      ctx,
      range.glyph,
      range.glyphPoint.x,
      range.glyphPoint.y,
      WHEEL_STYLE.moonRange.glyphSize,
      range.glyphColor,
    )
  }

  for (const planet of scene.planets) {
    if (planet.connector) {
      line(
        ctx,
        planet.connector.from,
        planet.connector.to,
        planet.color,
        WHEEL_STYLE.planet.connectorStrokeWidth,
        WHEEL_STYLE.planet.connectorDash,
        WHEEL_STYLE.planet.connectorOpacity,
        'round',
      )
    }

    line(
      ctx,
      planet.tick.inner,
      planet.tick.outer,
      planet.color,
      WHEEL_STYLE.planet.tickStrokeWidth,
      undefined,
      WHEEL_STYLE.planet.tickOpacity,
      'round',
    )
  }

  for (const planet of scene.planets) {
    ctx.save()
    ctx.globalAlpha = WHEEL_STYLE.planet.glowOpacity
    ctx.fillStyle = planet.color
    ctx.beginPath()
    ctx.arc(planet.point.x, planet.point.y, TOKEN.glow, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.beginPath()
    ctx.arc(planet.point.x, planet.point.y, TOKEN.disc, 0, Math.PI * 2)
    ctx.fillStyle = color.base
    ctx.fill()
    ctx.lineWidth = WHEEL_STYLE.planet.discStrokeWidth
    ctx.strokeStyle = planet.color
    ctx.stroke()

    fillGlyph(ctx, planet.planet.glyph, planet.point.x, planet.point.y, WHEEL_STYLE.planet.glyphSize, planet.color)

    if (planet.planet.retrograde) {
      const rx = planet.point.x + WHEEL_STYLE.planet.retrogradeOffset
      const ry = planet.point.y - WHEEL_STYLE.planet.retrogradeOffset
      ctx.beginPath()
      ctx.arc(rx, ry, WHEEL_STYLE.planet.retrogradeRadius, 0, Math.PI * 2)
      ctx.fillStyle = color.base
      ctx.fill()
      ctx.save()
      ctx.globalAlpha = WHEEL_STYLE.planet.retrogradeStrokeOpacity
      ctx.lineWidth = WHEEL_STYLE.planet.retrogradeStrokeWidth
      ctx.strokeStyle = color.danger
      ctx.stroke()
      ctx.restore()
      fillGlyph(ctx, '℞', rx, ry, WHEEL_STYLE.planet.retrogradeGlyphSize, color.danger)
    }
  }

  ctx.restore()
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
  setFont(ctx, 600, 26, family)
  ctx.letterSpacing = '6px'
  ctx.fillStyle = color.accent
  ctx.fillText(content.eyebrow.toUpperCase(), CARD_W / 2, HEADER_EYEBROW_Y)
  ctx.restore()

  const maxWidth = CARD_W - MARGIN * 2
  const size = fitFont(ctx, content.title, HERO_TITLE_STYLE.fontWeight, 62, family, maxWidth)
  setFont(ctx, HERO_TITLE_STYLE.fontWeight, size, family)
  ctx.fillStyle = createHeroTitleGradient(ctx, size, color)
  ctx.fillText(content.title, CARD_W / 2, HEADER_TITLE_Y)
}

function paintBig3(
  ctx: CanvasRenderingContext2D,
  cells: readonly ShareCardCell[],
  family: string,
  color: ShareCardPalette,
) {
  const gap = 24
  const width = (CARD_W - MARGIN * 2 - gap * 2) / 3

  cells.slice(0, 3).forEach((cell, i) => {
    const x = MARGIN + i * (width + gap)
    const cx = x + width / 2

    ctx.beginPath()
    ctx.roundRect(x, BIG3_TOP, width, BIG3_HEIGHT, 20)
    ctx.fillStyle = 'rgba(20,26,56,0.72)'
    ctx.fill()
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(148,163,184,0.22)'
    ctx.stroke()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    setFont(ctx, 500, 27, family)
    ctx.fillStyle = color.subtle
    ctx.fillText(`${cell.glyph} ${cell.label}`, cx, BIG3_TOP + 47)

    const value = cell.value
    const size = fitFont(ctx, value, 600, 40, family, width - 28)
    setFont(ctx, 600, size, family)
    ctx.fillStyle = color.foreground
    ctx.fillText(value, cx, BIG3_TOP + 98)
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

function paintWatermark(
  ctx: CanvasRenderingContext2D,
  content: ShareCardContent,
  family: string,
  color: ShareCardPalette,
) {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  setFont(ctx, 600, 34, family)
  const nameWidth = ctx.measureText(content.siteName).width
  const total = 20 + 14 + nameWidth
  const startX = CARD_W / 2 - total / 2

  sparkle(ctx, startX + 10, WATERMARK_Y, 11, color.warm)
  ctx.fillStyle = color.foreground
  ctx.fillText(content.siteName, startX + 34, WATERMARK_Y)

  ctx.textAlign = 'center'
  setFont(ctx, 400, 24, family)
  ctx.letterSpacing = '2px'
  ctx.fillStyle = color.faint
  ctx.fillText(content.url, CARD_W / 2, WATERMARK_Y + 44)
  ctx.letterSpacing = '0px'
}

/**
 * Draw the whole card onto a fresh offscreen canvas and return it as a PNG blob.
 * The caller must `await document.fonts.ready` first so localized prose uses
 * its intended font. Astrology markers use deterministic vector outlines.
 */
export async function createNatalShareCard(
  chart: NatalChart,
  aspects: readonly ChartAspect[],
  content: ShareCardContent,
  fontFamily: string,
  moonLongitudeRange: readonly [start: number, end: number] | null = null,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('2d context unavailable')
  }

  const color = readPalette()
  const scene = buildWheelScene(chart, aspects, { moonLongitudeRange })

  paintBackground(ctx, color)
  paintWheel(ctx, scene, content.houseThemes, fontFamily, color)
  paintHeader(ctx, content, fontFamily, color)
  paintBig3(ctx, content.big3, fontFamily, color)
  paintWatermark(ctx, content, fontFamily, color)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))), 'image/png')
  })
}
