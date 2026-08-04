// The renderer-neutral visual contract for the natal wheel. The interactive SVG
// and the share-card Canvas both consume this scene so geometry, visible content,
// and resting styles come from one source in both outputs.

import { angularGap, elementOfSign, norm360, signOfLon } from '@/chart/astrology'
import { ASPECT_STYLE, ELEMENT_COLORS, PLANET_GLYPHS, SIGNS } from '@/chart/data'
import type { AngleId, ChartAspect, HouseNumber, NatalChart, PlanetId, SignId } from '@/chart/types'
import { annularSector, type PlacedPlanet, type Point, placePlanets, polar, RADIUS, VIEW } from './geometry'

export const HOUSE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const satisfies readonly HouseNumber[]

export const WHEEL_VIEWBOX_PADDING = 16

// Enlarged tap target for the ASC/MC/IC/DSC labels. It stays outside the
// zodiac sectors, and narrows when two angles are close so targets never overlap.
const ANGLE_HIT_INNER = RADIUS.zodiacOuter
const ANGLE_HIT_OUTER = RADIUS.zodiacOuter + 20
const ANGLE_HIT_HALF_MAX = 6
const ANGLE_HIT_HALF_MIN = 3.2
const ANGLE_HIT_GAP = 1

/** Every resting visual value shared by the SVG and Canvas renderers. */
export const WHEEL_STYLE = {
  rings: [
    { radius: RADIUS.zodiacOuter, stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1, dash: null },
    { radius: RADIUS.zodiacInner, stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, dash: null },
    { radius: RADIUS.houseInner, stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1, dash: null },
    { radius: RADIUS.planet + 14, stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1, dash: [2, 4] },
  ],
  sign: {
    fillOpacity: 0.14,
    selectedFillOpacity: 0.4,
    selectedStrokeWidth: 1,
    glyphSize: 16,
  },
  house: {
    fill: '#ffffff',
    fillOpacity: 0.02,
    selectedFillOpacity: 0.16,
    selectedStroke: 'rgba(255,255,255,0.5)',
    selectedStrokeWidth: 0.8,
    labelFill: 'rgba(255,255,255,0.4)',
    selectedLabelFill: 'rgba(255,255,255,0.9)',
    labelFontSize: 8,
    cusp: {
      primary: { stroke: 'rgba(245,188,255,0.5)', strokeWidth: 1.2 },
      secondary: { stroke: 'rgba(245,188,255,0.3)', strokeWidth: 0.9 },
      regular: { stroke: 'rgba(255,255,255,0.1)', strokeWidth: 0.6 },
    },
  },
  angle: {
    selectedFill: '#f5bcff',
    primaryFill: 'rgba(245,188,255,0.85)',
    secondaryFill: 'rgba(245,188,255,0.5)',
    primaryFontSize: 8,
    secondaryFontSize: 7,
    primaryFontWeight: 700,
    secondaryFontWeight: 600,
    selectedUnderlineWidth: 0.9,
  },
  aspect: {
    opacity: 0.85,
    strokeWidth: 1.2,
    dimOpacity: 0.12,
    dimStrokeWidth: 0.5,
    dash: [4, 3],
  },
  planet: {
    connectorOpacity: 0.5,
    connectorStrokeWidth: 0.9,
    selectedConnectorOpacity: 0.9,
    selectedConnectorStrokeWidth: 1.5,
    connectorDash: [1.5, 2],
    tickOpacity: 0.9,
    tickStrokeWidth: 1.4,
    selectedTickOpacity: 1,
    selectedTickStrokeWidth: 2.4,
    glowOpacity: 0.18,
    discStrokeWidth: 1.2,
    selectedDiscStrokeWidth: 2,
    glyphSize: 13.5,
    retrogradeOffset: 9.5,
    retrogradeRadius: 5.2,
    retrogradeStrokeOpacity: 0.55,
    retrogradeStrokeWidth: 0.8,
    retrogradeGlyphSize: 7,
  },
  moonRange: {
    fillOpacity: 0.28,
    selectedFillOpacity: 0.58,
    endpointOpacity: 0.75,
    endpointStrokeWidth: 1.2,
    glyphSize: 10,
    mixedGlyphColor: 'rgba(255,255,255,0.92)',
  },
} as const

export type WheelRing = (typeof WHEEL_STYLE.rings)[number]

export type WheelSign = {
  id: SignId
  color: string
  glyph: string
  glyphPoint: Point
  index: number
  sectorPath: string
}

export type WheelHouse = {
  cuspFrom: Point
  cuspStroke: string
  cuspStrokeWidth: number
  cuspTo: Point
  labelPoint: Point
  n: HouseNumber
  sectorPath: string
}

export type WheelAngle = {
  fill: string
  fontSize: number
  fontWeight: number
  hitPath: string
  id: AngleId
  point: Point
}

export type WheelAspect = {
  aspect: ChartAspect
  color: string
  dashed: boolean
  from: Point
  key: string
  to: Point
}

export type WheelPlanet = PlacedPlanet & { color: string; sign: SignId }

export type WheelMoonRangeSegment = {
  color: string
  key: string
  sectorPath: string
}

type WheelMoonRangeTick = {
  color: string
  inner: Point
  outer: Point
}

export type WheelMoonRange = {
  endSign: SignId
  endTick: WheelMoonRangeTick
  glyph: string
  glyphColor: string
  glyphPoint: Point
  hitPath: string
  segments: readonly WheelMoonRangeSegment[]
  startSign: SignId
  startTick: WheelMoonRangeTick
}

export type WheelScene = {
  angles: readonly WheelAngle[]
  aspects: readonly WheelAspect[]
  houses: readonly WheelHouse[]
  moonRange: WheelMoonRange | null
  planets: readonly WheelPlanet[]
  pointById: ReadonlyMap<PlanetId, Point>
  rings: readonly WheelRing[]
  signs: readonly WheelSign[]
  viewBox: string
}

export type WheelSceneOptions = {
  moonLongitudeRange?: readonly [start: number, end: number] | null
}

function buildAngles(ascendant: number, midheaven: number | null): WheelAngle[] {
  const entries: { id: AngleId; lon: number; primary: boolean }[] = [
    { id: 'asc', lon: norm360(ascendant), primary: true },
    { id: 'dsc', lon: norm360(ascendant + 180), primary: false },
  ]

  if (midheaven !== null) {
    entries.push({ id: 'mc', lon: norm360(midheaven), primary: true })
    entries.push({ id: 'ic', lon: norm360(midheaven + 180), primary: false })
  }

  return entries.map(({ id, lon, primary }) => {
    const nearest = entries.reduce(
      (min, other) => (other.id === id ? min : Math.min(min, angularGap(lon, other.lon))),
      Number.POSITIVE_INFINITY,
    )

    const hitHalf = Math.max(ANGLE_HIT_HALF_MIN, Math.min(ANGLE_HIT_HALF_MAX, nearest / 2 - ANGLE_HIT_GAP))

    return {
      fill: primary ? WHEEL_STYLE.angle.primaryFill : WHEEL_STYLE.angle.secondaryFill,
      fontSize: primary ? WHEEL_STYLE.angle.primaryFontSize : WHEEL_STYLE.angle.secondaryFontSize,
      fontWeight: primary ? WHEEL_STYLE.angle.primaryFontWeight : WHEEL_STYLE.angle.secondaryFontWeight,
      hitPath: annularSector(lon - hitHalf, lon + hitHalf, ANGLE_HIT_OUTER, ANGLE_HIT_INNER, ascendant),
      id,
      point: polar(lon, RADIUS.zodiacOuter + 8, ascendant),
    }
  })
}

function buildMoonRange(range: readonly [start: number, end: number], anchor: number): WheelMoonRange {
  const [start, end] = range
  const span = norm360(end - start)
  const endUnwrapped = start + span
  const middle = norm360(start + span / 2)
  const rangeInner = RADIUS.trueMark - 4
  const rangeOuter = RADIUS.trueMark + 4
  const startSign = signOfLon(start)
  const endSign = signOfLon(end)
  const startColor = ELEMENT_COLORS[elementOfSign(startSign)]
  const endColor = ELEMENT_COLORS[elementOfSign(endSign)]
  const segments: WheelMoonRangeSegment[] = []
  let segmentStart = start

  // The Moon normally crosses at most one sign boundary per day, but walking
  // every boundary keeps the scene correct for any wider future date range.
  while (segmentStart < endUnwrapped) {
    const sign = signOfLon(segmentStart)
    const nextBoundary = (Math.floor(segmentStart / 30) + 1) * 30
    const segmentEnd = Math.min(endUnwrapped, nextBoundary)

    if (segmentEnd <= segmentStart) {
      break
    }

    segments.push({
      color: ELEMENT_COLORS[elementOfSign(sign)],
      key: `${sign}-${segmentStart}`,
      sectorPath: annularSector(segmentStart, segmentEnd, rangeOuter, rangeInner, anchor),
    })
    segmentStart = segmentEnd
  }

  return {
    endSign,
    endTick: {
      color: endColor,
      inner: polar(end, rangeInner - 2, anchor),
      outer: polar(end, rangeOuter + 2, anchor),
    },
    glyph: PLANET_GLYPHS.moon,
    glyphColor: startSign === endSign ? startColor : WHEEL_STYLE.moonRange.mixedGlyphColor,
    glyphPoint: polar(middle, RADIUS.trueMark, anchor),
    hitPath: annularSector(start - 3, end + 3, rangeOuter + 5, rangeInner - 5, anchor),
    segments,
    startSign,
    startTick: {
      color: startColor,
      inner: polar(start, rangeInner - 2, anchor),
      outer: polar(start, rangeOuter + 2, anchor),
    },
  }
}

/** Build the one canonical, fully revealed and unselected natal-wheel scene. */
export function buildWheelScene(
  chart: NatalChart,
  aspects: readonly ChartAspect[],
  options: WheelSceneOptions = {},
): WheelScene {
  const anchor = chart.ascendant ?? 0
  const moonLongitudeRange = options.moonLongitudeRange ?? null
  const visiblePlanets = moonLongitudeRange ? chart.planets.filter((planet) => planet.id !== 'moon') : chart.planets
  const placed = placePlanets(visiblePlanets, anchor)
  const pointById = new Map<PlanetId, Point>(placed.map((entry) => [entry.planet.id, entry.point]))

  const signs = SIGNS.map((sign, index): WheelSign => {
    const lonStart = index * 30

    return {
      color: ELEMENT_COLORS[sign.element],
      glyph: sign.glyph,
      glyphPoint: polar(lonStart + 15, RADIUS.zodiacGlyph, anchor),
      id: sign.id,
      index,
      sectorPath: annularSector(lonStart, lonStart + 30, RADIUS.zodiacOuter, RADIUS.zodiacInner, anchor),
    }
  })

  const houses: WheelHouse[] = []
  let angles: WheelAngle[] = []

  if (chart.ascendant !== null && chart.cusps) {
    const cusps = chart.cusps

    cusps.forEach((lon, index) => {
      const n = (index + 1) as HouseNumber
      const span = norm360(cusps[(index + 1) % 12] - lon)

      const cuspStyle =
        index === 0 || index === 9
          ? WHEEL_STYLE.house.cusp.primary
          : index === 3 || index === 6
            ? WHEEL_STYLE.house.cusp.secondary
            : WHEEL_STYLE.house.cusp.regular

      houses.push({
        cuspFrom: polar(lon, RADIUS.aspect, anchor),
        cuspStroke: cuspStyle.stroke,
        cuspStrokeWidth: cuspStyle.strokeWidth,
        cuspTo: polar(lon, RADIUS.houseOuter, anchor),
        labelPoint: polar(lon + span / 2, RADIUS.houseLabel, anchor),
        n,
        sectorPath: annularSector(lon, lon + span, RADIUS.houseOuter, RADIUS.houseInner, anchor),
      })
    })

    angles = buildAngles(chart.ascendant, chart.midheaven)
  }

  const aspectLines: WheelAspect[] = []

  for (const aspect of aspects) {
    const from = pointById.get(aspect.a)
    const to = pointById.get(aspect.b)

    if (!from || !to) {
      continue
    }

    const style = ASPECT_STYLE[aspect.type]
    aspectLines.push({
      aspect,
      color: style.color,
      dashed: style.dashed,
      from,
      key: `${aspect.a}-${aspect.b}-${aspect.type}`,
      to,
    })
  }

  const planets = placed.map((entry): WheelPlanet => {
    const sign = signOfLon(entry.planet.lon)

    return {
      ...entry,
      color: ELEMENT_COLORS[elementOfSign(sign)],
      sign,
    }
  })

  return {
    angles,
    aspects: aspectLines,
    houses,
    moonRange: moonLongitudeRange ? buildMoonRange(moonLongitudeRange, anchor) : null,
    planets,
    pointById,
    rings: WHEEL_STYLE.rings,
    signs,
    viewBox: `${-WHEEL_VIEWBOX_PADDING} ${-WHEEL_VIEWBOX_PADDING} ${VIEW + WHEEL_VIEWBOX_PADDING * 2} ${VIEW + WHEEL_VIEWBOX_PADDING * 2}`,
  }
}
