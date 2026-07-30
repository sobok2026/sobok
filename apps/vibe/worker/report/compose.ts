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
  OPENING_BLOCK,
  OPENING_CLOSING,
  OPENING_KICKER,
  OPENING_NOTE_LABEL,
} from '../../deep-type/content/opening.paid'
import { AXIS_SCENE, type AxisScene } from '../../deep-type/content/reading.free'
import {
  REFLECTION_BY_DRAIN,
  REFLECTION_BY_INTEREST,
  REFLECTION_BY_NEED,
  REFLECTION_CLOSING,
  REFLECTION_SOURCE,
  REFLECTION_WHY,
} from '../../deep-type/content/reflection.paid'
import type { FreeReport, FreeStrengthCard } from '../../deep-type/rules/free'
import type {
  DetailedFacet,
  OpeningBlock,
  OpeningReadData,
  ReflectionQuestionsData,
  ReportParagraph,
} from './section-data'

// The composer. It writes what the report opens on and what it closes on — the two sections that used to exist
// only when the narrator was switched on, which meant the deployment that ships today opened on a bare list of
// eight letters and ended mid-sentence on a friction table.
//
// NO RANKING, EVER. This is the one rule the whole module is arranged around. §4.3 rules out comparing |lean|
// across axes: five items an axis is an unequated within-person measurement and one flipped answer reorders it,
// so "your strongest axis" is a sentence the instrument cannot support. It used to be honoured by SELECTING two
// axes by band, which was one rule obeyed and another one broken — a selection of two out of eight is itself a
// statement that those two matter more. So all eight are printed, in the fixed order the letters are printed
// in, and what distinguishes them is the band each one carries about itself.
//
// The prose comes out of `reading.free.ts`, the same table the free result screen reads. That is deliberate:
// the eight letters are a free deliverable, so the sentences that explain them belong to the tier that gives
// them away, and one table means the free screen and the paid opening cannot describe a pole two ways. What
// this module adds on the paid side is the settled band beside each scene, and the work-profile paragraphs the
// free tier has no answers for.
//
// Pure and total, like the engine it feeds. No clock, no random, no throw, and every table read below is
// complete over its key type.

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
  const blocks: OpeningBlock[] = [
    { heading: OPENING_BLOCK.inner, paragraphs: axisParagraphs(TYPE_AXES, refined.inner, copy) },
    { heading: OPENING_BLOCK.gem, paragraphs: axisParagraphs(GEM_AXES, refined.gem, copy) },
    {
      heading: OPENING_BLOCK.work,
      paragraphs: [...comboParagraph(free), drainParagraph(input), ...interestParagraph(input)],
    },
  ]

  return {
    blocks,
    closing: OPENING_CLOSING,
    codes: free.worldJob.codes,
    // `family.method` is deliberately not here. It is the hero's subtitle, two cards above this one, and the
    // world job block repeats it again under its own label — quoting it a third time in the opening's first
    // sentence made the top of the report read as the same paragraph three times.
    lead: [free.worldJob.core.strength, LEAD_JOIN].join(' '),
    // Not rendered here — the hero carries the name — but the narrator needs it to write about the reader's
    // role without inferring it back out of two four-letter codes.
    worldJobName: free.worldJob.name,
  }
}

/**
 * One layer's four axes, in the order its letters are printed. All four, never a selection — see the module
 * note. The scene says what the pole looks like at work and the band says how firmly it landed; they are two
 * fields rather than one joined sentence, so a renderer can set the ruler quieter than the reading.
 */
function axisParagraphs<Axis extends AxisId>(
  axes: readonly Axis[],
  layer: { axes: Record<Axis, { band5: ClarityBand }>; code: string },
  copy: AxisCopy,
): readonly ReportParagraph[] {
  return axes.map((id, index) => {
    const axis = copy[id]
    const letter = layer.code[index] ?? ''
    // `AXIS_SCENE[id]` is one of eight two-key objects and the checker cannot correlate it with a runtime
    // letter, so the widening happens once. `leadingPole` returns only letters the table declares, so the
    // lookup cannot miss.
    const poles: Readonly<Record<string, AxisScene>> = AXIS_SCENE[id]
    const pole = isFirstPole(id, letter) ? axis.first : axis.second

    return {
      kicker: `${axis.name} · ${pole.label}`,
      note: BAND_FRAME[layer.axes[id].band5],
      text: poles[leadingPole(id, letter)].scene,
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
        why: REFLECTION_WHY.drain,
      },
      {
        source: REFLECTION_SOURCE.interest,
        text: REFLECTION_BY_INTEREST[leadingFacet(WORK_FACETS.interest, input.interest.counts)],
        why: REFLECTION_WHY.interest,
      },
      {
        source: REFLECTION_SOURCE.need,
        text: REFLECTION_BY_NEED[leadingFacet(WORK_FACETS.need, input.need.counts)],
        why: REFLECTION_WHY.need,
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
