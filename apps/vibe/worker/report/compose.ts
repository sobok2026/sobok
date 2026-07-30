import type { AxisCopy } from '@deep-type/content/axis-copy'
import {
  type AxisId,
  type BandCopy,
  type ClarityBand,
  type DrainFacet,
  GEM_AXES,
  type InterestFacet,
  isFirstPole,
  leadingPole,
  type NeedFacet,
  type RefinedAssessmentProfile,
  TYPE_AXES,
  WORK_FACETS,
  type WorkFacetTally,
} from '@deep-type/model'

import {
  BAND_FRAME,
  DRAIN_OPENING_TAIL,
  LEAD_JOIN,
  NO_DISTINCT_AXIS_KICKER,
  NO_DISTINCT_AXIS_LINE,
  OPENING_CLOSING,
  OPENING_KICKER,
  OPENING_NOTE_LABEL,
  POLE_SIGNATURE,
  type PoleSignature,
} from '../../deep-type/content/opening.paid'
import {
  REFLECTION_BY_DRAIN,
  REFLECTION_BY_INTEREST,
  REFLECTION_BY_NEED,
  REFLECTION_CLOSING,
  REFLECTION_SOURCE,
} from '../../deep-type/content/reflection.paid'
import type { FreeReport, FreeStrengthCard } from '../../deep-type/rules/free'
import type { DetailedFacet, OpeningReadData, ReflectionQuestionsData, ReportParagraph } from './section-data'

// The composer. It decides what the report leads with and what it closes on — the two sections that used to
// exist only when the narrator was switched on, which meant the deployment that ships today opened on a bare
// list of eight letters and ended mid-sentence on a friction table.
//
// SELECTION IS BY BAND, NEVER BY MAGNITUDE. This is the one rule the whole module is arranged around. §4.3
// rules out comparing |lean| across axes: five items an axis is an unequated within-person measurement and one
// flipped answer reorders it, so "your strongest axis" is a sentence the instrument cannot support. What it
// can support is the band, which is a statement about one axis on its own. So the composer takes the axes that
// landed in the `distinct` band — all of them, in the fixed order the eight letters are printed in — and only
// reaches for `moderate` when `distinct` did not fill the slots. Two axes in the same band are in declaration
// order and the copy never says one came first.
//
// Pure and total, like the engine it feeds. No clock, no random, no throw: an all-faint reading has its own
// authored paragraph rather than an empty section, and every table read below is complete over its key type.

/**
 * How many axis paragraphs the opening carries. Two, not more: the opening's job is to give the reader
 * somewhere to stand before the detail starts, and an opening that recites six axes has become the detail.
 */
const AXIS_PARAGRAPH_COUNT = 2

/** The bands a paragraph may be written from, in the order the composer fills its slots. */
const SELECTABLE_BANDS = ['distinct', 'moderate'] as const satisfies readonly ClarityBand[]

export interface OpeningReadInput {
  copy: AxisCopy
  /** Named and detailed by the engine, so the opening and the drain section cannot describe different facets. */
  drainLeaders: readonly DetailedFacet[]
  drainSpread: BandCopy
  free: FreeReport
  interestLeaders: readonly DetailedFacet[]
  refined: RefinedAssessmentProfile
}

export function composeOpeningRead(input: OpeningReadInput): OpeningReadData {
  const { copy, free, refined } = input
  const paragraphs: ReportParagraph[] = [
    ...axisParagraphs(refined, copy),
    ...comboParagraph(free),
    drainParagraph(input),
    ...interestParagraph(input),
  ]

  return {
    closing: OPENING_CLOSING,
    codes: free.worldJob.codes,
    // `family.method` is deliberately not here. It is the hero's subtitle, two cards above this one, and the
    // world job block repeats it again under its own label — quoting it a third time in the opening's first
    // sentence made the top of the report read as the same paragraph three times.
    lead: [free.worldJob.core.strength, LEAD_JOIN].join(' '),
    paragraphs,
    // Not rendered here — the hero carries the name — but the narrator needs it to write about the reader's
    // role without inferring it back out of two four-letter codes.
    worldJobName: free.worldJob.name,
  }
}

interface AxisReading {
  band: ClarityBand
  id: AxisId
  /** The frozen code letter, read off the code rather than off `AxisScore.pole`, which is null at a tie. */
  letter: string
}

// Inner first and then the core, the order the eight letters are printed in everywhere else.
function axisReadings(refined: RefinedAssessmentProfile): readonly AxisReading[] {
  return [
    ...TYPE_AXES.map((id, index) => ({ band: refined.inner.axes[id].band5, id, letter: refined.inner.code[index] })),
    ...GEM_AXES.map((id, index) => ({ band: refined.gem.axes[id].band5, id, letter: refined.gem.code[index] })),
  ]
}

function axisParagraphs(refined: RefinedAssessmentProfile, copy: AxisCopy): readonly ReportParagraph[] {
  const readings = axisReadings(refined)
  // One pass per band rather than a sort: a sort needs a comparator over the two bands and a comparator is a
  // ranking, which is the thing this module may not build. Concatenating two filtered lists says only that
  // `distinct` fills the slots first.
  const selected = SELECTABLE_BANDS.flatMap((band) => readings.filter((reading) => reading.band === band)).slice(
    0,
    AXIS_PARAGRAPH_COUNT,
  )

  if (selected.length === 0) {
    return [{ kicker: NO_DISTINCT_AXIS_KICKER, note: null, text: NO_DISTINCT_AXIS_LINE }]
  }

  return selected.map((reading) => {
    const axis = copy[reading.id]
    // `POLE_SIGNATURE[id]` is one of eight two-key objects and the checker cannot correlate it with a runtime
    // letter, so the widening happens once. `leadingPole` returns only letters the table declares, so the lookup
    // cannot miss.
    const poles: Readonly<Record<string, PoleSignature>> = POLE_SIGNATURE[reading.id]
    const pole = isFirstPole(reading.id, reading.letter) ? axis.first : axis.second

    return {
      kicker: `${axis.name} · ${pole.label}`,
      note: null,
      text: `${poles[leadingPole(reading.id, reading.letter)].line} ${BAND_FRAME[reading.band]}`,
    }
  })
}

/**
 * Zero or one paragraph. A combo card exists only where both of its parent axes already earned one, so a
 * reading with no combo card is an ordinary reading and not a gap to fill with a substitute.
 */
function comboParagraph(free: FreeReport): readonly ReportParagraph[] {
  const card: FreeStrengthCard | undefined =
    free.strengthCards.combo.distinct3[0] ?? free.strengthCards.combo.moderate3[0]
  if (!card) {
    return []
  }
  return [
    {
      kicker: `${OPENING_KICKER.combo} · ${card.copy.name}`,
      note: null,
      text: `${card.copy.core} ${card.copy.shine}`,
    },
  ]
}

// Always present: the drain block is the one finding both tiers carry, so the opening can always point at it.
function drainParagraph(input: OpeningReadInput): ReportParagraph {
  return {
    kicker: `${OPENING_KICKER.drain} · ${input.drainSpread.label}`,
    note: noteLine(OPENING_NOTE_LABEL.drain, input.drainLeaders),
    text: `${input.drainSpread.detail} ${DRAIN_OPENING_TAIL}`,
  }
}

function interestParagraph(input: OpeningReadInput): readonly ReportParagraph[] {
  const leading = input.interestLeaders[0]
  if (!leading) {
    return []
  }
  return [
    {
      kicker: `${OPENING_KICKER.interest} · ${leading.label}`,
      note: noteLine(OPENING_NOTE_LABEL.interest, input.interestLeaders),
      text: leading.detail,
    },
  ]
}

// Interpolated Korean nouns sit at the end of a line or in front of ' — ', never in front of a particle:
// 은/는 and 이/가 split on the final consonant of the preceding word, so a template that attached one would be
// wrong for roughly half of any table it reads.
function noteLine(label: string, facets: readonly DetailedFacet[]): string | null {
  return facets.length === 0 ? null : `${label} — ${facets.map((facet) => facet.label).join(' · ')}`
}

export interface ReflectionInput {
  drain: WorkFacetTally<DrainFacet>
  interest: WorkFacetTally<InterestFacet>
  need: WorkFacetTally<NeedFacet>
}

/**
 * Three questions from three different tallies. Drawing all three from one would make the closing a fourth
 * restatement of a block the reader has already met twice, and the point of closing on questions is to hand
 * back something the report cannot answer.
 */
export function composeReflectionQuestions(input: ReflectionInput): ReflectionQuestionsData {
  return {
    closing: REFLECTION_CLOSING,
    questions: [
      {
        source: REFLECTION_SOURCE.drain,
        text: REFLECTION_BY_DRAIN[leadingFacet(WORK_FACETS.drain, input.drain.counts)],
      },
      {
        source: REFLECTION_SOURCE.interest,
        text: REFLECTION_BY_INTEREST[leadingFacet(WORK_FACETS.interest, input.interest.counts)],
      },
      {
        source: REFLECTION_SOURCE.need,
        text: REFLECTION_BY_NEED[leadingFacet(WORK_FACETS.need, input.need.counts)],
      },
    ],
  }
}

/**
 * The top-counted facet, with ties broken by declaration order. Reads the whole facet list rather than
 * `tally.leaders` for one reason: `leaders` is a possibly-empty array as far as the checker knows, and a
 * question chosen from a fallback would be a question the reader's answers did not ask for. A non-empty tuple
 * has a first element by its type, so this is total without inventing anything.
 *
 * The order it falls back on carries no meaning. `WORK_FACETS` is an authoring sequence, and it is here so
 * that a tie resolves the same way twice, not so that one facet outranks another.
 */
function leadingFacet<Facet extends string>(
  facets: readonly [Facet, ...Facet[]],
  counts: Readonly<Record<Facet, number>>,
): Facet {
  let leading = facets[0]
  for (const facet of facets) {
    if (counts[facet] > counts[leading]) {
      leading = facet
    }
  }
  return leading
}
