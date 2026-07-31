import type { AngleId, AspectType, PlanetId, SignId } from '@/chart/types'
import { ASPECT_PAIR_ORDER } from '@/content/interpretations/types'

// The full, finite vocabulary that comment topic keys are built from. Used to enumerate every /talk/[topic]
// route at build time (generateStaticParams) and to render a topic's human title. These lists are hand-kept
// mirrors of the domain types; `satisfies` catches a typo'd id, and the astrology vocabulary is stable.
// Derivation sources, if they ever move: SIGNS ← chart/data.ts SIGNS; PLANETS ← chart/data.ts PLANET_ORDER
// + derived points (northNode/southNode/fortune/lilith/chiron); ANGLES ← chart/types.ts AngleId; ASPECT_TYPES
// ← content/interpretations/types.ts AspectType (wheel-used subset).
const SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const satisfies readonly SignId[]

// Every body placed on the wheel (10 planets + derived points). Any of these can be the selected planet.
const PLANETS = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
  'northNode',
  'southNode',
  'fortune',
  'lilith',
  'chiron',
] as const satisfies readonly PlanetId[]

const ANGLES = ['asc', 'ic', 'dsc', 'mc'] as const satisfies readonly AngleId[]

const ASPECT_TYPES = [
  'conjunction',
  'trine',
  'square',
  'sextile',
  'opposition',
] as const satisfies readonly AspectType[]

const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
const CARD_TOPICS = [{ slug: 'aries-love', labelKey: 'ariesLove' }] as const

// Every valid topic key. MUST stay consistent with commentTopicKey() in (home)/comment-topic.ts — the panel
// links to one of these, so a missing key would 404. Aspect pairs use the ASPECT_PAIR_ORDER canonical order
// (i < j), matching pairKey().
export function allTopicKeys(): string[] {
  const keys: string[] = []

  for (const sign of SIGNS) {
    keys.push(`sign-${sign}`)
  }

  for (const n of HOUSES) {
    keys.push(`house-${n}`)
  }

  for (const card of CARD_TOPICS) {
    keys.push(`card-${card.slug}`)
  }

  for (const planet of PLANETS) {
    for (const sign of SIGNS) {
      keys.push(`planet-${planet}-${sign}`)
    }
  }

  for (const angle of ANGLES) {
    for (const sign of SIGNS) {
      keys.push(`angle-${angle}-${sign}`)
    }
  }

  for (let i = 0; i < ASPECT_PAIR_ORDER.length; i++) {
    for (let j = i + 1; j < ASPECT_PAIR_ORDER.length; j++) {
      for (const type of ASPECT_TYPES) {
        keys.push(`aspect-${ASPECT_PAIR_ORDER[i]}-${ASPECT_PAIR_ORDER[j]}-${type}`)
      }
    }
  }

  return keys
}

// A translator narrowed to the loose boundary shape (the strict next-intl `t` casts to this) — topic keys are
// dynamic, so this module addresses Constellation message keys by string.
export type Labeler = (key: string, values?: Record<string, number | string>) => string

// Localized human title for a topic key, built from Constellation vocabulary (signs / planets / angles /
// aspects). e.g. 'planet-sun-aries' → "양자리 태양", 'aspect-sun-moon-trine' → "태양–달 삼각".
export function topicLabel(topicKey: string, t: Labeler): string {
  const [kind, ...rest] = topicKey.split('-')

  if (kind === 'sign') {
    return t(`signs.${rest[0]}`)
  }
  if (kind === 'house') {
    return `${t('panel.house', { n: Number(rest[0]) })} · ${t(`houseThemes.${rest[0]}`)}`
  }
  if (kind === 'card') {
    const card = CARD_TOPICS.find(({ slug }) => slug === rest.join('-'))
    if (card) {
      return t(`cardTopics.${card.labelKey}`)
    }
  }
  if (kind === 'planet') {
    return `${t(`signs.${rest[1]}`)} ${t(`planets.${rest[0]}`)}`
  }
  if (kind === 'angle') {
    return `${t(`signs.${rest[1]}`)} ${t(`angleNames.${rest[0]}`)}`
  }
  if (kind === 'aspect') {
    return `${t(`planets.${rest[0]}`)}–${t(`planets.${rest[1]}`)} ${t(`aspects.${rest[2]}Name`)}`
  }

  return topicKey
}
