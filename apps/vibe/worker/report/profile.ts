import { type AxisCopy, axisCopyFor } from '@deep-type/content/axis-copy'
import { resolveWorldJob } from '@deep-type/content/world-job'
import { type NamedFacet, nameFacets } from '@deep-type/facets'
import {
  AXIS_POLES,
  type AxisId,
  type BandCopy,
  GEM_AXES,
  type GemCode,
  type InnerCode,
  isFirstPole,
  type PersonaSource,
  type RefinedAssessmentProfile,
  type RefinedAxisScore,
  TYPE_AXES,
} from '@deep-type/model'
import type { Locale } from '@sobok/domain/locale'
import {
  BAND_SHIFT_PAID,
  CLARITY_BANDS_PAID,
  CLARITY_NOTE_PAID,
  DRAIN_SPREAD_MEANING,
  DRAIN_SPREAD_PAID,
} from '../../deep-type/content/band-labels.paid'
import { DRAIN_LABELS } from '../../deep-type/content/work-labels.free'
import {
  ENVIRONMENT_LABELS,
  INTEREST_LABELS,
  NEED_LABELS,
  PURPOSE_LABELS,
} from '../../deep-type/content/work-labels.paid'
import { INTERPRETATION_BOUNDARY } from './claims'

// The narration boundary. What crosses it is what the engine has already settled, named in the reader's own
// vocabulary; what does not cross it is every input the engine settled it from.
//
// The old shape handed `{ assessment, locale }` straight to the model, so the model received `RM` and `OA` as
// bare two-letter ids with no axis name, no pole labels and no pole meanings, and wrote about them anyway. It
// also received `lean`, `firstShare` and `score` for all eight axes. Those numbers are gone here and their
// absence is the point: comparing |lean| across axes measured by five items each is an unequated within-person
// comparison, so a model handed the numbers will rank the axes and the ranking will not survive one flipped
// answer. The band is the settled reading, so the band is what travels.

export interface NamedPole {
  /** The letter as it appears in the code. Ambiguous alone — `O` is OA's and UO's — so never read without `id`. */
  code: string
  label: string
  meaning: string
}

export interface NamedAxis {
  /** Copy for the band this axis landed in, already resolved. Always the paid ruler's. */
  band: BandCopy
  /** True when the paid items lean against the frozen letter. The letter still does not move. */
  evidenceSplit: boolean
  id: AxisId
  /** The frozen pole, taken from the code rather than recomputed, so a tie cannot erase it. */
  leading: NamedPole
  meaning: string
  name: string
  poles: readonly [NamedPole, NamedPole]
  /** Free-to-paid movement of the ruler. Never null: only a refined profile reaches the narrator. */
  shift: BandCopy
}

export interface NamedDrainSignature {
  /** Facets tied at the top count, in canonical order. Tied, not ranked — three items cannot separate them. */
  leaders: readonly NamedFacet[]
  meaning: string
  spread: BandCopy
}

export interface NamedWorkProfile {
  drain: NamedDrainSignature
  environment: readonly NamedFacet[]
  interest: readonly NamedFacet[]
  need: readonly NamedFacet[]
  purpose: readonly NamedFacet[]
}

export interface NamedWorldJob {
  core: { name: string; strength: string }
  family: { method: string; name: string; role: string }
  /** One of 256 authored names. Hand-written, not composed from the two halves above. */
  name: string
}

export interface ReportProfile {
  axes: { gem: readonly NamedAxis[]; inner: readonly NamedAxis[] }
  clarityNote: string
  codes: { gem: GemCode; inner: InnerCode }
  instrumentVersion: string
  /** §4.3: travels with the profile so no section can be assembled without it in reach. */
  interpretationBoundary: string
  locale: Locale
  /** `unknown` is the omit condition for `contextShift` — there is no second reading to contrast against. */
  selfDeclaration: PersonaSource
  work: NamedWorkProfile
  worldJob: NamedWorldJob
}

/**
 * Refined only, and the parameters are the two values rather than an object wrapping them.
 *
 * There used to be a free branch here — a whole second band resolver, a `scope: 'free'` work profile, a
 * `'free' | 'refined'` tier field and a nullable `shift` — and none of it was reachable. The one caller is
 * `planReportPasses`, which returns null fifteen lines earlier unless the stored profile's tier is `refined`,
 * so the narrator has never once been handed a free profile. What the dead branch cost was not the lines: it
 * made `shift` nullable in the JSON the model receives, for a case that cannot occur.
 */
export function buildReportProfile(locale: Locale, profile: RefinedAssessmentProfile): ReportProfile {
  const copy = axisCopyFor(locale)
  const inner = profile.inner.code
  const gem = profile.gem.code

  return {
    axes: {
      gem: GEM_AXES.map((axis, index) => namedAxis(axis, gem[index], copy, refinedBand(profile.gem.axes[axis]))),
      inner: TYPE_AXES.map((axis, index) => namedAxis(axis, inner[index], copy, refinedBand(profile.inner.axes[axis]))),
    },
    clarityNote: CLARITY_NOTE_PAID,
    codes: { gem, inner },
    instrumentVersion: profile.instrumentVersion,
    interpretationBoundary: INTERPRETATION_BOUNDARY,
    locale,
    selfDeclaration: profile.personaSource,
    work: {
      drain: {
        leaders: nameFacets(profile.work.drain.leaders, DRAIN_LABELS),
        meaning: DRAIN_SPREAD_MEANING,
        spread: DRAIN_SPREAD_PAID[profile.work.drain.spread],
      },
      environment: nameFacets(profile.work.environment.leaders, ENVIRONMENT_LABELS),
      interest: nameFacets(profile.work.interest.leaders, INTEREST_LABELS),
      need: nameFacets(profile.work.need.leaders, NEED_LABELS),
      purpose: nameFacets(profile.work.purpose.leaders, PURPOSE_LABELS),
    },
    worldJob: resolveWorldJob(inner, gem),
  }
}

type ResolvedBand = Pick<NamedAxis, 'band' | 'evidenceSplit' | 'shift'>

function refinedBand(score: RefinedAxisScore): ResolvedBand {
  return {
    band: CLARITY_BANDS_PAID[score.band5],
    evidenceSplit: score.evidenceSplit,
    shift: BAND_SHIFT_PAID[score.shift],
  }
}

// The leading pole is read off the frozen code letter, never off `AxisScore.pole`. `pole` is nullable at an
// exact tie and this function has to be total: a report that drops an axis because the tie guard fired is worse
// than one that names the letter the reader was already shown.
function namedAxis(axis: AxisId, letter: string | undefined, copy: AxisCopy, band: ResolvedBand): NamedAxis {
  const content = copy[axis]
  const [firstCode, secondCode] = AXIS_POLES[axis]
  const first: NamedPole = { code: firstCode, label: content.first.label, meaning: content.first.description }
  const second: NamedPole = { code: secondCode, label: content.second.label, meaning: content.second.description }

  return {
    ...band,
    id: axis,
    leading: isFirstPole(axis, letter) ? first : second,
    meaning: content.description,
    name: content.name,
    poles: [first, second],
  }
}

// Compile-time form of the research matrix's privacy clause on `llm_report`: per-item evidence does not leave
// the browser. `ReportProfile` is serialized whole into the model request, so "we never send the answers" has to
// be a property of the type rather than a habit of whoever edits the request body next. The same guard bans the
// percentile family that §4.3 retires — there is no `Percentile` brand to grep for precisely because the field
// can never be declared.
type ForbiddenProfileKey =
  | 'answers'
  | 'baseAnswers'
  | 'itemId'
  | 'optionIndex'
  | 'percentile'
  | 'rarity'
  | 'refinementAnswers'
  | 'workAnswers'
  | 'zScore'

type Scrubbed<T> = T extends readonly unknown[]
  ? { [Index in keyof T]: Scrubbed<T[Index]> }
  : T extends object
    ? { [Key in keyof T as Exclude<Key, ForbiddenProfileKey>]: Scrubbed<T[Key]> }
    : T

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false

// The constraint is what does the work: a type alias that merely evaluates to `never` is not an error, so the
// proof has to be a parameter that only `true` satisfies.
type Assert<Proof extends true> = Proof

/** Fails to compile the moment `ReportProfile` grows a field named in `ForbiddenProfileKey`, at any depth. */
export type NoRawAnswersReachTheNarrator = Assert<Equals<ReportProfile, Scrubbed<ReportProfile>>>
