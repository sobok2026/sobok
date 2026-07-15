import type { Locale } from '@sobok/domain/locale'

import { elementOfSign, signOfLon } from '../../chart/astrology'
import type { ElementId, NatalChart, PlanetId, SignId } from '../../chart/types'
import { type AspectTone, aspectTone } from '../../interpretations/types'
import { seededPick } from '../daily'
import type { MoonPhaseId, SkyToday } from '../sky'
import type { PersonalToday } from '../transits'
import { LUCKY_COLORS } from './palette'
import type { LuckyCandidate, LuckyContent, LuckyEnergy, LuckyRecommendations, LuckyTone } from './types'

/**
 * The current Moon's element outweighs every secondary signal combined. V1
 * therefore stays inside today's elemental pool, then ranks that pool by the
 * personal placement, lunar phase, and aspect tone.
 */
const RULE_WEIGHTS = {
  dayElement: 8,
  personalResonance: 3,
  personalElement: 2,
  energy: 2,
  tone: 1,
} as const

const ENERGY_BY_PHASE: Record<MoonPhaseId, LuckyEnergy> = {
  newMoon: 'begin',
  waxingCrescent: 'begin',
  firstQuarter: 'build',
  waxingGibbous: 'build',
  fullMoon: 'peak',
  waningGibbous: 'peak',
  lastQuarter: 'release',
  waningCrescent: 'release',
}

type SelectLuckyInput = {
  locale: Locale
  dateKey: string
  utcOffsetMinutes: number
  sky: SkyToday
  natal: NatalChart | null
  personal: PersonalToday | null
  content: LuckyContent
}

export function selectLuckyRecommendations(input: SelectLuckyInput): LuckyRecommendations {
  const { locale, dateKey, utcOffsetMinutes, sky, natal, personal, content } = input
  const dayElement = elementOfSign(sky.moonSign)
  const energy = ENERGY_BY_PHASE[sky.phase]
  const tone = recommendationTone(personal?.moonContacts[0]?.tone ?? headlineTone(sky))
  const profileKey = natalProfileKey(natal)
  const seedBase = ['lucky', dateKey, utcOffsetMinutes, sky.moonSign, sky.phase, profileKey].join(':')

  const food = pickBest(
    content.foods,
    `${seedBase}:${locale}:food`,
    dayElement,
    natalElement(natal, 'moon'),
    energy,
    tone,
  )
  const colorDefinition = pickBest(
    LUCKY_COLORS,
    `${seedBase}:color`,
    dayElement,
    natalElement(natal, 'venus'),
    energy,
    tone,
  )

  return {
    personalized: natal !== null,
    food,
    color: {
      ...colorDefinition,
      ...content.colors[colorDefinition.id],
    },
  }
}

function pickBest<T extends LuckyCandidate & { id: string }>(
  candidates: readonly T[],
  seed: string,
  dayElement: ElementId,
  personalElement: ElementId | null,
  energy: LuckyEnergy,
  tone: LuckyTone,
): T {
  const shuffled = seededPick(candidates, candidates.length, seed)

  return shuffled
    .map((candidate) => ({
      candidate,
      score: candidateScore(candidate, dayElement, personalElement, energy, tone),
    }))
    .sort((a, b) => b.score - a.score)[0].candidate
}

function candidateScore(
  candidate: LuckyCandidate,
  dayElement: ElementId,
  personalElement: ElementId | null,
  energy: LuckyEnergy,
  tone: LuckyTone,
): number {
  let score = candidate.element === dayElement ? RULE_WEIGHTS.dayElement : 0

  if (personalElement !== null) {
    if (candidate.resonatesWith.includes(personalElement)) {
      score += RULE_WEIGHTS.personalResonance
    } else if (candidate.element === personalElement) {
      score += RULE_WEIGHTS.personalElement
    }
  }

  if (candidate.energies.includes(energy)) {
    score += RULE_WEIGHTS.energy
  }
  if (candidate.tones.includes(tone)) {
    score += RULE_WEIGHTS.tone
  }

  return score
}

function headlineTone(sky: SkyToday): AspectTone | undefined {
  return sky.headline ? aspectTone(sky.headline.type) : undefined
}

function recommendationTone(tone: AspectTone | undefined): LuckyTone {
  switch (tone) {
    case 'conjunction':
      return 'lift'
    case 'square':
    case 'opposition':
      return 'ground'
    default:
      return 'flow'
  }
}

function natalElement(natal: NatalChart | null, planet: PlanetId): ElementId | null {
  const sign = natalSign(natal, planet)
  return sign ? elementOfSign(sign) : null
}

function natalSign(natal: NatalChart | null, planet: PlanetId): SignId | null {
  const position = natal?.planets.find((entry) => entry.id === planet)
  return position ? signOfLon(position.lon) : null
}

function natalProfileKey(natal: NatalChart | null): string {
  if (!natal) {
    return 'collective'
  }

  const sun = natalSign(natal, 'sun') ?? 'unknown'
  const moon = natalSign(natal, 'moon') ?? 'unknown'
  const venus = natalSign(natal, 'venus') ?? 'unknown'
  const rising = natal.ascendant === null ? 'unknown' : signOfLon(natal.ascendant)

  return `${sun}.${moon}.${venus}.${rising}`
}
