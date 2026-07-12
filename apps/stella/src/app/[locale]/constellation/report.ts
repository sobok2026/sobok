// Composes the long-form reading below the wheel: scores the chart's features,
// leads with the strongest ones and assembles life-theme chapters from the
// loaded interpretation tables plus the report copy. Pure — the section
// component passes the data in and renders the result; next-intl only supplies
// the small name vocabulary (planets, signs, house themes).

import { elementCounts, houseOfLon, signOfLon } from '../chart/astrology'
import { ELEMENT_IDS } from '../chart/data'
import { chartRuler, computeSignature, dignityOf, SIGN_RULERS, type SignatureFeature } from '../chart/signature'
import type { ChartAspect, NatalChart, PlanetId } from '../chart/types'
import type { AngleKey, Interpretations, ReportChapterId } from '../interpretations/types'
import { aspectTone, fill, houseText, orbTier, pairKey } from '../interpretations/types'

/** The name vocabulary the composer needs from next-intl — content comes from the loaded interpretations. */
export type Translator = (key: string, params?: Record<string, number | string>) => string

export type ReportParagraph = {
  /** Small label above the paragraph, e.g. "사자자리 금성" or an aspect summary. */
  kicker?: string
  /** Extra emphasis line between kicker and body (tight-orb call-outs). */
  note?: string
  text: string
}

export type ReportChapter = {
  id: ReportChapterId
  title: string
  intro?: string
  paragraphs: ReportParagraph[]
}

/** How many signature features headline the report. */
const SIGNATURE_COUNT = 3
/** Features below this score don't make the signature chapter (keeps flat charts honest). */
const SIGNATURE_FLOOR = 45
/** At most this many house residents per themed chapter, personal planets first. */
const MAX_HOUSE_PARAGRAPHS = 2

export function buildReport(
  chart: NatalChart,
  aspects: readonly ChartAspect[],
  interp: Interpretations,
  t: Translator,
): ReportChapter[] {
  const used = new Set<string>()
  const features = computeSignature(chart, aspects)
  const rankedAspects = features.filter((f): f is Extract<SignatureFeature, { kind: 'aspect' }> => f.kind === 'aspect')

  const { report } = interp
  const planetName = (id: PlanetId) => t(`planets.${id}`)
  const signName = (id: string) => t(`signs.${id}`)
  const position = (id: PlanetId) => chart.planets.find((p) => p.id === id)

  // Kicker templates for the bodies the chapters introduce by placement.
  const placementKickers: Partial<Record<PlanetId, string>> = {
    sun: report.kicker.sun,
    moon: report.kicker.moon,
    mercury: report.kicker.mercury,
    venus: report.kicker.venus,
    southNode: report.kicker.southNode,
    northNode: report.kicker.northNode,
  }

  // Angle copy only covers the classical bodies — nodes and fortune stay out.
  const angleTexts: Partial<Record<PlanetId, Record<AngleKey, string>>> = report.angles

  /** Sign fragment for a body, retro-aware like the detail panel. Null when already told. */
  function planetParagraph(id: PlanetId, kicker?: string): ReportParagraph | null {
    const p = position(id)

    if (!p) {
      return null
    }

    const sign = signOfLon(p.lon)
    const retroText = p.retrograde ? interp.retro[id]?.[sign] : undefined
    const text = retroText ?? interp.planets[id][sign]
    const key = retroText ? `retro.${id}.${sign}` : `planets.${id}.${sign}`

    if (used.has(key)) {
      return null
    }

    used.add(key)
    const template = placementKickers[id]

    return {
      kicker: kicker ?? (template ? fill(template, { sign: signName(sign) }) : undefined),
      text,
    }
  }

  /** Pair fragment for an aspect — same sparse-pair guard as the detail panel. */
  function aspectParagraph(aspect: ChartAspect): ReportParagraph | null {
    const pair = pairKey(aspect.a, aspect.b)
    const tone = aspectTone(aspect.type)
    const text = interp.aspects[pair]?.[tone]
    const key = `aspects.${pair}.${tone}`

    if (!text || used.has(key)) {
      return null
    }

    used.add(key)
    const tier = orbTier(aspect.orb)

    return {
      kicker: fill(report.kicker.aspect, {
        a: planetName(aspect.a),
        b: planetName(aspect.b),
        name: t(`aspects.${aspect.type}Name`),
        orb: aspect.orb,
      }),
      note: tier === 'tight' ? interp.aspectIntensity.tight : undefined,
      text,
    }
  }

  /** House fragment for one resident body. */
  function houseParagraph(id: PlanetId, n: number): ReportParagraph | null {
    const text = houseText(interp.houses[id], n)
    const key = `houses.${id}.${n}`

    if (!text || used.has(key)) {
      return null
    }

    used.add(key)
    return { kicker: fill(report.kicker.house, { planet: planetName(id), n }), text }
  }

  /** Up to MAX_HOUSE_PARAGRAPHS resident readings across the given houses. */
  function residentParagraphs(houseNumbers: readonly number[]): ReportParagraph[] {
    const result: ReportParagraph[] = []

    for (const p of chart.planets) {
      if (result.length >= MAX_HOUSE_PARAGRAPHS) {
        break
      }

      const n = houseOfLon(p.lon, chart.cusps, chart.ascendant)

      if (n === null || !houseNumbers.includes(n)) {
        continue
      }

      const para = houseParagraph(p.id, n)

      if (para) {
        result.push(para)
      }
    }

    return result
  }

  function signatureParagraph(feature: SignatureFeature): ReportParagraph | null {
    if (feature.kind === 'angle') {
      const text = angleTexts[feature.planet]?.[feature.angle]
      const key = `angles.${feature.planet}.${feature.angle}`

      if (!text || used.has(key)) {
        return null
      }

      used.add(key)

      return {
        kicker: fill(report.angleKicker[feature.angle], {
          planet: planetName(feature.planet),
          orb: feature.orb,
        }),
        text,
      }
    }

    if (feature.kind === 'aspect') {
      return aspectParagraph(feature.aspect)
    }

    if (feature.kind === 'dignity') {
      const key = `dignity.${feature.dignity}:${feature.planet}`

      if (used.has(key)) {
        return null
      }

      used.add(key)

      const params = { planet: planetName(feature.planet), sign: signName(feature.sign) }
      const base = fill(report.dignity[feature.dignity], params)
      const text = feature.isChartRuler ? `${base} ${report.dignity.chartRulerNote}` : base

      return { kicker: fill(report.kicker.dignity, params), text }
    }

    const { sign, planets } = feature.stellium

    return {
      kicker: fill(report.kicker.stellium, {
        sign: signName(sign),
        count: planets.length,
      }),
      text: fill(report.stellium, {
        sign: signName(sign),
        planets: planets.map(planetName).join(' · '),
        keyword: t(`signKeywords.${sign}`),
      }),
    }
  }

  // ── Chapters ──────────────────────────────────────────────────────────────

  function core(): ReportChapter {
    const paragraphs: ReportParagraph[] = []
    const ascSign = chart.ascendant !== null ? signOfLon(chart.ascendant) : null

    if (ascSign) {
      paragraphs.push({
        kicker: fill(report.kicker.rising, { sign: signName(ascSign) }),
        text: report.rising[ascSign],
      })
    }

    const sun = planetParagraph('sun')
    const moon = planetParagraph('moon')

    if (sun) {
      paragraphs.push(sun)
    }
    if (moon) {
      paragraphs.push(moon)
    }

    const sunPos = position('sun')
    const moonPos = position('moon')

    if (sunPos && moonPos) {
      const params = { sun: signName(signOfLon(sunPos.lon)), moon: signName(signOfLon(moonPos.lon)) }

      paragraphs.push(
        ascSign
          ? { text: fill(report.core.bridge, { ...params, rising: signName(ascSign) }) }
          : { text: fill(report.core.bridgeNoTime, params) },
      )
    }

    return { id: 'core', title: report.chapterTitles.core, paragraphs }
  }

  function signature(): ReportChapter {
    const paragraphs: ReportParagraph[] = []

    for (const feature of features) {
      if (paragraphs.length >= SIGNATURE_COUNT || feature.score < SIGNATURE_FLOOR) {
        break
      }

      const para = signatureParagraph(feature)

      if (para) {
        paragraphs.push(para)
      }
    }

    return {
      id: 'signature',
      title: report.chapterTitles.signature,
      intro: report.signatureIntro,
      paragraphs,
    }
  }

  function path(): ReportChapter {
    const paragraphs: ReportParagraph[] = []
    const south = planetParagraph('southNode')
    const north = planetParagraph('northNode')

    if (south) {
      paragraphs.push(south)
    }
    if (north) {
      paragraphs.push(north)
    }

    const southPos = position('southNode')
    const northPos = position('northNode')

    if (southPos && northPos) {
      paragraphs.push({
        text: fill(report.path.bridge, {
          from: signName(signOfLon(southPos.lon)),
          to: signName(signOfLon(northPos.lon)),
        }),
      })

      const n = houseOfLon(northPos.lon, chart.cusps, chart.ascendant)

      if (n !== null) {
        paragraphs.push({ text: fill(report.path.houseNote, { n, theme: t(`houseThemes.${n}`) }) })
      }
    }

    return {
      id: 'path',
      title: report.chapterTitles.path,
      paragraphs,
    }
  }

  /** A personal-planet chapter: the placement itself plus its loudest untold aspect. */
  function personal(id: 'mercury' | 'venus', chapterId: 'love' | 'mind', houses: readonly number[]): ReportChapter {
    const paragraphs: ReportParagraph[] = []
    const placement = planetParagraph(id)

    if (placement) {
      paragraphs.push(placement)
    }

    // Loudest aspect of this planet not yet told elsewhere — skip past consumed ones.
    for (const f of rankedAspects) {
      if (f.aspect.a !== id && f.aspect.b !== id) {
        continue
      }

      const para = aspectParagraph(f.aspect)

      if (para) {
        paragraphs.push(para)
        break
      }
    }

    paragraphs.push(...residentParagraphs(houses))

    return {
      id: chapterId,
      title: report.chapterTitles[chapterId],
      paragraphs,
    }
  }

  function work(): ReportChapter {
    const paragraphs: ReportParagraph[] = []

    if (chart.midheaven !== null) {
      const mcSign = signOfLon(chart.midheaven)

      paragraphs.push({
        text: fill(report.work.mc, { sign: signName(mcSign), keyword: t(`signKeywords.${mcSign}`) }),
      })

      const mcRuler = SIGN_RULERS[mcSign]
      const rulerPos = position(mcRuler)

      if (rulerPos) {
        const para = planetParagraph(
          mcRuler,
          fill(report.kicker.mcRuler, { planet: planetName(mcRuler), sign: signName(signOfLon(rulerPos.lon)) }),
        )

        if (para) {
          paragraphs.push(para)
        }
      }
    }

    paragraphs.push(...residentParagraphs([10]))

    return {
      id: 'work',
      title: report.chapterTitles.work,
      paragraphs,
    }
  }

  function money(): ReportChapter {
    const paragraphs: ReportParagraph[] = []

    // Houses are the money axis — without a birth time the chapter simply stays out.
    if (chart.cusps !== null || chart.ascendant !== null) {
      const residents = residentParagraphs([2, 8])

      paragraphs.push(...(residents.length > 0 ? residents : [{ text: report.money.empty }]))
    }

    return {
      id: 'money',
      title: report.chapterTitles.money,
      paragraphs,
    }
  }

  function root(): ReportChapter {
    const paragraphs: ReportParagraph[] = []
    const ruler = chartRuler(chart)

    if (ruler) {
      const rulerSign = signOfLon(ruler.position.lon)

      paragraphs.push({
        kicker: fill(report.kicker.ruler, { planet: planetName(ruler.ruler) }),
        text: fill(report.root.ruler, { planet: planetName(ruler.ruler), sign: signName(rulerSign) }),
      })

      const placement = planetParagraph(ruler.ruler, fill(report.kicker.rulerPlacement, { sign: signName(rulerSign) }))

      if (placement) {
        paragraphs.push(placement)
      }

      const dignity = dignityOf(ruler.ruler, rulerSign)

      if ((dignity === 'domicile' || dignity === 'exaltation') && !used.has(`dignity.${dignity}:${ruler.ruler}`)) {
        used.add(`dignity.${dignity}:${ruler.ruler}`)

        paragraphs.push({
          text: fill(report.dignity[dignity], {
            planet: planetName(ruler.ruler),
            sign: signName(rulerSign),
          }),
        })
      }
    }

    paragraphs.push(...residentParagraphs([4]))

    return {
      id: 'root',
      title: report.chapterTitles.root,
      paragraphs,
    }
  }

  function closing(): ReportChapter {
    const counts = elementCounts(chart.planets)
    const dominant = ELEMENT_IDS.reduce((best, id) => (counts[id] > counts[best] ? id : best), ELEMENT_IDS[0])

    return {
      id: 'closing',
      title: report.chapterTitles.closing,
      paragraphs: [{ text: report.closing[dominant] }, { text: report.closing.outro }],
    }
  }

  const chapters = [
    core(),
    signature(),
    path(),
    personal('mercury', 'mind', [3]),
    personal('venus', 'love', [5, 7]),
    work(),
    money(),
    root(),
    closing(),
  ]

  return chapters.filter((c) => c.paragraphs.length > 0)
}
