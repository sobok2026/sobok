import type { Locale } from '@sobok/domain/locale'

import { elementOfSign, signOfLon, signOfPlanet } from '@/chart/astrology'
import type { ElementId, NatalChart, PlanetId, SignId } from '@/chart/types'
import { type AspectTone, aspectTone } from '@/content/interpretations/types'
import { dayOrdinal, seededPick } from '../daily'
import type { MoonPhaseId, SkyToday } from '../sky'
import type { PersonalToday } from '../transits'
import { LUCKY_COLOR_ENTRIES } from './palette'
import type { LuckyCandidate, LuckyContent, LuckyEnergy, LuckyRecommendations, LuckyTone } from './types'

/**
 * The current Moon's element outweighs every secondary signal combined. The
 * pick therefore stays inside the day's elemental pool, ranks that pool by the
 * personal placement, lunar phase, and aspect tone, then rotates through the
 * top candidates day by day — the Moon holds a sign for ~2.5 days, so without
 * the rotation the same pick would repeat until the sky itself moved on.
 */
const RULE_WEIGHTS = {
  dayElement: 8,
  personalResonance: 3,
  personalElement: 2,
  energy: 2,
  tone: 1,
} as const

/** Rotation window — the day's pick cycles through this many top-ranked candidates. */
const DAILY_TIER = 3

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
  sky: SkyToday
  natal: NatalChart | null
  /** Undefined when the exact birth time is known; one/two signs for a date-only birth. */
  natalMoonSigns?: readonly SignId[]
  personal: PersonalToday | null
  content: LuckyContent
}

export function selectLuckyRecommendations(input: SelectLuckyInput): LuckyRecommendations {
  const { locale, dateKey, sky, natal, personal, content } = input
  const dayElement = elementOfSign(sky.moonSign)
  const energy = ENERGY_BY_PHASE[sky.phase]
  const tone = recommendationTone(personal?.moonContacts[0]?.tone ?? headlineTone(sky))
  const natalMoonSign = resolveNatalMoonSign(natal, input.natalMoonSigns)
  const profileKey = natalProfileKey(natal, natalMoonSign)

  // The ranking seed deliberately excludes the date (and anything else that can
  // change between two same-sky days): the day ordinal walks the tier, and the
  // tier's id-stable order in pickDaily keeps the walk from revisiting
  // yesterday's pick as long as the tier's membership holds.
  const rankSeed = ['lucky', sky.moonSign, sky.phase, profileKey].join(':')
  const day = dayOrdinal(dateKey)

  const food = pickDaily(
    content.foods,
    `${rankSeed}:${locale}:food`,
    day,
    dayElement,
    natalMoonSign ? elementOfSign(natalMoonSign) : null,
    energy,
    tone,
  )

  const colorDefinition = pickDaily(
    LUCKY_COLOR_ENTRIES,
    `${rankSeed}:color`,
    day,
    dayElement,
    natalElement(natal, 'venus'),
    energy,
    tone,
  )

  return {
    personalized: natal !== null,
    usesNatalMoon: natal !== null && natalMoonSign !== null,
    food,
    color: {
      ...colorDefinition,
      ...content.colors[colorDefinition.id],
    },
  }
}

function pickDaily<T extends LuckyCandidate & { id: string }>(
  candidates: readonly T[],
  seed: string,
  day: number,
  dayElement: ElementId,
  personalElement: ElementId | null,
  energy: LuckyEnergy,
  tone: LuckyTone,
): T {
  const shuffled = seededPick(candidates, candidates.length, seed)

  // Scores decide only who makes the tier; the tier itself is ordered by id so
  // day-varying signals (tone, a reseeded shuffle) can reorder the RANKING
  // without moving the rotation's target. A repeat across consecutive days then
  // requires the tier's membership itself to change — rare, and it means the
  // sky genuinely shifted.
  const tier = shuffled
    .map((candidate) => ({
      candidate,
      score: candidateScore(candidate, dayElement, personalElement, energy, tone),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, DAILY_TIER)
    .sort((a, b) => (a.candidate.id < b.candidate.id ? -1 : 1))

  return tier[day % tier.length].candidate
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
  return natal ? signOfPlanet(natal, planet) : null
}

function resolveNatalMoonSign(natal: NatalChart | null, dateOnlySigns: readonly SignId[] | undefined): SignId | null {
  if (dateOnlySigns !== undefined) {
    return dateOnlySigns.length === 1 ? dateOnlySigns[0] : null
  }

  return natalSign(natal, 'moon')
}

function natalProfileKey(natal: NatalChart | null, moonSign: SignId | null): string {
  if (!natal) {
    return 'collective'
  }

  const sun = natalSign(natal, 'sun') ?? 'unknown'
  const moon = moonSign ?? 'unknown'
  const venus = natalSign(natal, 'venus') ?? 'unknown'
  const rising = natal.ascendant === null ? 'unknown' : signOfLon(natal.ascendant)

  return `${sun}.${moon}.${venus}.${rising}`
}
