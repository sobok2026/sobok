import type { Locale } from '@sobok/domain/locale'

import { ABILITY, ABILITY_DETAIL, COMBO } from '../content/abilities'
import { axisCopyFor } from '../content/axis-copy'
import {
  CLARITY_BANDS_FREE,
  CLARITY_NOTE_FREE,
  DRAIN_NARROW_NOTE_FREE,
  DRAIN_SPREAD_FREE,
  DRAIN_SPREAD_MEANING,
} from '../content/band-labels.free'
import { DRAIN_LABELS } from '../content/work-labels.free'
import { resolveWorldJob } from '../content/world-job'
import { type NamedFacet, nameFacets, shownDrainFacets, weakerTentativeBand } from '../facets'
import {
  AXES,
  type AxisId,
  type BandCopy,
  type DrainFacet,
  type FreeAssessmentProfile,
  type FreeWorkProfile,
  GEM_AXES,
  type GemCode,
  type InnerCode,
  leadingPole,
  type TentativeBand,
  TYPE_AXES,
} from '../model'
import { composeFreeReading, type FreeReading } from './free-reading'

// The free engine. It is isomorphic on purpose: the free result is already computed in the browser
// (`scoreBaseAssessment`) and Phase 8 publishes the 256 world jobs as static pages, so moving this to the server
// would buy no confidentiality and would cost a round trip before the paywall.
//
// The import list above is the whole security perimeter. Paid content tables (`work-labels.paid`,
// `band-labels.paid`, `role-families`) may never appear in it, and the module may not name the paid five-item
// ruler even in prose — the CI gate in free.test.ts is a raw-text scan, so a comment about the banned token
// would fail on itself. `abilities` is on the allowed side because the strength cards are a free deliverable
// (MIGRATION §4.1 rows 1-3 mark all three free outputs as `free-only`/`mixed`), and `reading.free` is on it for
// the same reason: it explains the eight letters and the world job, which are free deliverables too.
//
// Nothing here throws. `generateEngineReport` is a total-generation contract (§4.2) and this module is the half
// of it that runs where an exception would blank the result screen rather than fail a request.

export interface AbilityCopy {
  core: string
  name: string
  shine: string
  short: string
  watch: string
}

/**
 * Stable identity of a strength and the key of its card art. Not the display name: 21 of the 32 names were
 * rewritten by a later patch script while the slugs survived, so a name is a rendering, never a join key.
 */
export type AbilitySlug = keyof typeof ABILITY_DETAIL

/**
 * The bands that clear the bar for a strength card. `faint3` is excluded by the type, not by a runtime filter:
 * its own copy says the answers landed near even, so printing an ability card off it would be a claim the three
 * items cannot carry.
 */
export type StrengthBand = Exclude<TentativeBand, 'faint3'>

export interface FreeStrengthCard {
  /** Contributing axes in `AXES` order — one id for a single-axis card, two for a combo. */
  axes: readonly AxisId[]
  band: BandCopy
  copy: AbilityCopy
  /** The pole letters this card was read from, positionally aligned with `axes`. */
  poles: readonly string[]
  slug: AbilitySlug
}

/**
 * Two sets, no ranks (§4.3). Comparing `|lean|` across axes measured by three items each is an unequated
 * within-person comparison that one flipped answer reorders, so the cards are grouped by the band they landed
 * in and the order inside a group is the fixed `AXES` / `COMBO` declaration order.
 *
 * Keyed by the `band3` values rather than by bare `distinct`/`moderate`: those two words are the paid ruler's
 * own vocabulary and N7 forbids the two scales from sharing a name.
 */
export type StrengthCardSets = Readonly<Record<StrengthBand, readonly FreeStrengthCard[]>>

export interface FreeStrengthCards {
  axis: StrengthCardSets
  /**
   * Its own slot, never merged into `axis`. A combo scores `min(A, B)`, which ties one of its parents by
   * definition, so a shared list would present a tie as an ordering.
   */
  combo: StrengthCardSets
}

export interface FreeAxisBand {
  band: BandCopy
  band3: TentativeBand
  id: AxisId
  /** Read off the frozen code letter, never off `AxisScore.pole`, which is nullable at a tie. */
  leading: string
}

export interface FreeDrainSignature {
  /** Facets tied at the top count, in canonical order. Tied, not ranked — three items cannot separate them. */
  leaders: readonly NamedFacet<DrainFacet>[]
  meaning: string
  narrowNote: string
  spread: BandCopy
}

export interface FreeWorldJob {
  codes: { gem: GemCode; inner: InnerCode }
  core: { name: string; strength: string }
  family: { method: string; name: string; role: string }
  /** One of 256 hand-authored names, looked up whole rather than composed from the two halves above. */
  name: string
}

/** Field names track the §4.1 section keys (`worldJob`, `strengthCards`, `drainSignature`) so the free screen
 * and the paid report speak of the same three blocks. The key union itself is not imported: free results are
 * never stored as report sections, and importing the worker's vocabulary would tie the browser bundle to it. */
export interface FreeReport {
  axes: { gem: readonly FreeAxisBand[]; inner: readonly FreeAxisBand[] }
  clarityNote: string
  drainSignature: FreeDrainSignature
  instrumentVersion: string
  /** The composed long-form reading. Prose over the same result, never a second computation of it. */
  reading: FreeReading
  strengthCards: FreeStrengthCards
  tier: 'free'
  worldJob: FreeWorldJob
}

/**
 * `locale` reaches the axis names and pole labels the reading's kickers are built from, and nothing else. The
 * reading's own paragraphs are ko today, exactly like the paid engine's tables — the locale argument is what
 * makes filling the other three a content job rather than a refactor.
 */
export function buildFreeReport(profile: FreeAssessmentProfile, locale: Locale): FreeReport {
  const readings = readAxes(profile)
  const gem = profile.gem.code
  const inner = profile.inner.code
  const axes = {
    gem: GEM_AXES.map((axis) => axisBand(axis, readings[axis])),
    inner: TYPE_AXES.map((axis) => axisBand(axis, readings[axis])),
  }

  return {
    axes,
    clarityNote: CLARITY_NOTE_FREE,
    drainSignature: buildDrainSignature(profile.work.drain),
    instrumentVersion: profile.instrumentVersion,
    reading: composeFreeReading({ axes, codes: { gem, inner }, copy: axisCopyFor(locale) }),
    strengthCards: { axis: axisCards(readings), combo: comboCards(readings) },
    tier: 'free',
    // Three items per axis put `|S3|` on {1,3,5,7,9}, so an exact tie is unreachable and both codes are always
    // eight decided letters. That is what makes the world job a single card with no tie branch to render.
    worldJob: { codes: { gem, inner }, ...resolveWorldJob(inner, gem) },
  }
}

interface AxisReading {
  band3: TentativeBand
  letter: string
}

function readAxes(profile: FreeAssessmentProfile): Record<AxisId, AxisReading> {
  const entries = [
    ...TYPE_AXES.map((axis, index) => [axis, reading(profile.inner.axes[axis].band3, profile.inner.code[index])]),
    ...GEM_AXES.map((axis, index) => [axis, reading(profile.gem.axes[axis].band3, profile.gem.code[index])]),
  ]
  return Object.fromEntries(entries) as Record<AxisId, AxisReading>
}

function reading(band3: TentativeBand, letter: string | undefined): AxisReading {
  return { band3, letter: letter ?? '' }
}

function axisBand(axis: AxisId, { band3, letter }: AxisReading): FreeAxisBand {
  return { band: CLARITY_BANDS_FREE[band3], band3, id: axis, leading: leadingPole(axis, letter) }
}

// `ABILITY[axis]` is one of eight two-key objects and the checker cannot correlate it with a runtime letter, so
// the widening happens once here instead of at every call site. The key is produced by `poleOf`, which returns
// only letters the table declares, so the lookup cannot miss.
function abilitySlugFor(axis: AxisId, letter: string): AbilitySlug {
  const poles: Readonly<Record<string, AbilitySlug>> = ABILITY[axis]
  return poles[leadingPole(axis, letter)]
}

function isStrengthBand(band3: TentativeBand): band3 is StrengthBand {
  return band3 !== 'faint3'
}

type MutableSets = { [Band in StrengthBand]: FreeStrengthCard[] }

function emptySets(): MutableSets {
  return { distinct3: [], moderate3: [] }
}

function axisCards(readings: Record<AxisId, AxisReading>): StrengthCardSets {
  const sets = emptySets()

  for (const axis of AXES) {
    const { band3, letter } = readings[axis]
    if (!isStrengthBand(band3)) {
      continue
    }
    const slug = abilitySlugFor(axis, letter)
    sets[band3].push({
      axes: [axis],
      band: CLARITY_BANDS_FREE[band3],
      copy: ABILITY_DETAIL[slug],
      poles: [leadingPole(axis, letter)],
      slug,
    })
  }

  return sets
}

// A combo inherits the weaker of its two parents' bands, so a combo card exists only where both parents already
// earned one. Dropping to `min` rather than averaging is the same rule the origin scored with, minus the rarity
// sort it used to justify putting combos on top.
function comboCards(readings: Record<AxisId, AxisReading>): StrengthCardSets {
  const sets = emptySets()

  for (const pair of COMBO) {
    const first = readings[pair.a]
    const second = readings[pair.b]
    if (!isStrengthBand(first.band3) || !isStrengthBand(second.band3)) {
      continue
    }

    const band3 = weakerTentativeBand(first.band3, second.band3)
    const poles = [leadingPole(pair.a, first.letter), leadingPole(pair.b, second.letter)]
    const cells: Readonly<Record<string, AbilitySlug>> = pair.n
    const slug = cells[poles.join('')]

    sets[band3].push({
      axes: [pair.a, pair.b],
      band: CLARITY_BANDS_FREE[band3],
      copy: ABILITY_DETAIL[slug],
      poles,
      slug,
    })
  }

  return sets
}

// `spread` is typed `FreeDrainSpread`, so the `single` band the paid tier owns is not reachable from here and
// `DRAIN_SPREAD_FREE` has no cell for it. The shown set is sized by the band rather than by `drain.leaders` —
// see `shownDrainFacets`, which both engines call.
function buildDrainSignature(drain: FreeWorkProfile['drain']): FreeDrainSignature {
  const shown = shownDrainFacets(drain.counts, drain.spread)

  return {
    leaders: nameFacets(shown, DRAIN_LABELS),
    meaning: DRAIN_SPREAD_MEANING,
    narrowNote: DRAIN_NARROW_NOTE_FREE,
    spread: DRAIN_SPREAD_FREE[drain.spread],
  }
}
