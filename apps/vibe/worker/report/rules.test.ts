import { describe, expect, test } from 'bun:test'
import { axisCopyFor } from '@deep-type/content/axis-copy'

import { BAND_SHIFT_PAID, CLARITY_BANDS_PAID } from '../../deep-type/content/band-labels.paid'
import { PROPER_NOUNS } from '../../deep-type/content/proper-nouns'
import { GEM_CORE_READING, INNER_FAMILY_READING } from '../../deep-type/content/reading.free'
import { BLOCK_NOTES_KO, SELF_REPORT_AXIS_NOTES } from '../../deep-type/content/section-copy.paid'
import { WORLD_JOB_NAMES } from '../../deep-type/content/world-job-names'
import {
  AXIS_POLES,
  type AxisId,
  type BandShift,
  type DrainFacet,
  type EnvironmentFacet,
  type FreeAssessmentProfile,
  type FreeAxisScore,
  type FreeDrainSpread,
  GEM_AXES,
  GEM_CODES,
  type GemCode,
  INSTRUMENT_VERSION,
  type InnerCode,
  type InterestFacet,
  type NeedFacet,
  PERSONA_CODES,
  type PersonaSource,
  type PurposeFacet,
  type RefinedAssessmentProfile,
  type RefinedAxisScore,
  type TentativeBand,
  TYPE_AXES,
  WORK_FACETS,
  type WorkFacetId,
  type WorkFacetTally,
} from '../../deep-type/model'
import { buildFreeReport } from '../../deep-type/rules/free'
import { resolveDrainBand } from '../../deep-type/scoring'
import { checkClaims, SECTION_CLAIMS } from './claims'
import {
  DRAIN_MERGE_WINDOW_DAYS,
  type EngineReportDocument,
  type EngineReportInput,
  generateEngineReport,
  mergeDrainSittings,
} from './rules'
import type { DetailedFacet, ReportSection } from './section-data'
import {
  REPORT_DISPLAY_ORDER,
  REPORT_SECTION_CONTRACT,
  REPORT_SECTION_KEYS,
  type ReportSectionKey,
} from './section-keys'

// Fixtures build profiles directly rather than by scoring answer sets. The engine reads bands, codes and
// tallies, so routing every case through 40 Likert answers would test the scorer twice and this module once.

function axisScoreFor(band3: TentativeBand, letter: string): FreeAxisScore {
  const magnitude = band3 === 'distinct3' ? 9 : band3 === 'moderate3' ? 3 : 1
  const score = letter === letter.toUpperCase() ? magnitude : -magnitude
  return {
    answered: 3,
    band3,
    firstShare: 50,
    lean: score / 9,
    pole: letter,
    score,
    secondShare: 50,
  }
}

type AxisMovementFixture = { evidenceSplit?: boolean; shift?: BandShift }

function refinedAxisScoreFor(
  band3: TentativeBand,
  letter: string,
  movement: AxisMovementFixture = {},
): RefinedAxisScore {
  return {
    ...axisScoreFor(band3, letter),
    band5: band3 === 'distinct3' ? 'distinct' : band3 === 'moderate3' ? 'moderate' : 'faint',
    evidenceSplit: movement.evidenceSplit ?? false,
    shift: movement.shift ?? 'same',
  }
}

function tallyOf<Facet extends WorkFacetId>(
  facets: readonly Facet[],
  counts: Readonly<Record<Facet, number>>,
  exposure: number,
): WorkFacetTally<Facet> {
  const ranked = facets.map((facet) => counts[facet]).sort((a, b) => b - a)
  const top = ranked[0] ?? 0
  return {
    counts,
    exposure,
    leaders: facets.filter((facet) => counts[facet] === top),
    separation: top - (ranked[1] ?? 0),
  }
}

type DrainCounts = Record<DrainFacet, number>

function drainCounts(picks: readonly DrainFacet[]): DrainCounts {
  const counts = Object.fromEntries(WORK_FACETS.drain.map((facet) => [facet, 0])) as DrainCounts
  for (const facet of picks) {
    counts[facet] += 1
  }
  return counts
}

const FREE_DRAIN_DEFAULT: readonly DrainFacet[] = ['BREAK', 'BREAK', 'VAGUE']
const PAID_DRAIN_DEFAULT: readonly DrainFacet[] = ['BREAK', 'OVERLOAD', 'OVERLOAD']

function freeProfileOf(
  inner: InnerCode,
  gem: GemCode,
  options: {
    bands?: Partial<Record<AxisId, TentativeBand>>
    drain?: readonly DrainFacet[]
    personaSource?: PersonaSource
  } = {},
): FreeAssessmentProfile {
  const band = (axis: AxisId) => options.bands?.[axis] ?? 'distinct3'
  const counts = drainCounts(options.drain ?? FREE_DRAIN_DEFAULT)
  const spread: FreeDrainSpread = resolveDrainBand(counts, 2)

  return {
    gem: {
      axes: {
        RM: axisScoreFor(band('RM'), gem[0]),
        OA: axisScoreFor(band('OA'), gem[1]),
        VH: axisScoreFor(band('VH'), gem[2]),
        UO: axisScoreFor(band('UO'), gem[3]),
      },
      code: gem,
    },
    inner: {
      axes: {
        EI: axisScoreFor(band('EI'), inner[0]),
        SN: axisScoreFor(band('SN'), inner[1]),
        TF: axisScoreFor(band('TF'), inner[2]),
        JP: axisScoreFor(band('JP'), inner[3]),
      },
      code: inner,
    },
    instrumentVersion: INSTRUMENT_VERSION,
    personaSource: options.personaSource ?? 'unknown',
    tier: 'free',
    work: { drain: { ...tallyOf(WORK_FACETS.drain, counts, 2), spread }, scope: 'free' },
  }
}

const INTEREST_DEFAULT: Record<InterestFacet, number> = { MAKE: 3, ANALYZE: 2, CREATE: 1, HELP: 0, LEAD: 0, ORDER: 0 }
const NEED_DEFAULT: Record<NeedFacet, number> = { AUT: 3, MASTER: 2, IMPACT: 1, BELONG: 0, STABLE: 0, NOVEL: 0 }
const PURPOSE_DEFAULT: Record<PurposeFacet, number> = {
  SOLVE: 2,
  UNDERSTAND: 1,
  EXPRESS: 0,
  CARE: 0,
  MOVE: 0,
  STEADY: 0,
}
const ENVIRONMENT_DEFAULT: Record<EnvironmentFacet, number> = {
  FOCUS_ENV: 2,
  TOGETHER_ENV: 1,
  FREEDOM_ENV: 0,
  CLEAR_ENV: 0,
  VARIETY_ENV: 0,
  VISIBLE_ENV: 0,
}

function refinedProfileOf(
  inner: InnerCode,
  gem: GemCode,
  options: {
    bands?: Partial<Record<AxisId, TentativeBand>>
    environment?: Record<EnvironmentFacet, number>
    interest?: Record<InterestFacet, number>
    mergedDrain?: readonly DrainFacet[]
    movement?: Partial<Record<AxisId, AxisMovementFixture>>
    need?: Record<NeedFacet, number>
    personaSource?: PersonaSource
    purpose?: Record<PurposeFacet, number>
  } = {},
): RefinedAssessmentProfile {
  const band = (axis: AxisId) => options.bands?.[axis] ?? 'distinct3'
  const moved = (axis: AxisId) => options.movement?.[axis] ?? {}
  const counts = drainCounts(options.mergedDrain ?? [...FREE_DRAIN_DEFAULT, ...PAID_DRAIN_DEFAULT])

  return {
    gem: {
      axes: {
        RM: refinedAxisScoreFor(band('RM'), gem[0], moved('RM')),
        OA: refinedAxisScoreFor(band('OA'), gem[1], moved('OA')),
        VH: refinedAxisScoreFor(band('VH'), gem[2], moved('VH')),
        UO: refinedAxisScoreFor(band('UO'), gem[3], moved('UO')),
      },
      code: gem,
    },
    inner: {
      axes: {
        EI: refinedAxisScoreFor(band('EI'), inner[0], moved('EI')),
        SN: refinedAxisScoreFor(band('SN'), inner[1], moved('SN')),
        TF: refinedAxisScoreFor(band('TF'), inner[2], moved('TF')),
        JP: refinedAxisScoreFor(band('JP'), inner[3], moved('JP')),
      },
      code: inner,
    },
    instrumentVersion: INSTRUMENT_VERSION,
    personaSource: options.personaSource ?? 'unknown',
    tier: 'refined',
    work: {
      drain: { ...tallyOf(WORK_FACETS.drain, counts, 4), spread: resolveDrainBand(counts, 4) },
      environment: tallyOf(WORK_FACETS.environment, options.environment ?? ENVIRONMENT_DEFAULT, 2),
      interest: tallyOf(WORK_FACETS.interest, options.interest ?? INTEREST_DEFAULT, 4),
      need: tallyOf(WORK_FACETS.need, options.need ?? NEED_DEFAULT, 4),
      purpose: tallyOf(WORK_FACETS.purpose, options.purpose ?? PURPOSE_DEFAULT, 2),
      scope: 'refined',
    },
  }
}

function inputOf(overrides: Partial<EngineReportInput> = {}): EngineReportInput {
  const inner: InnerCode = 'ENFJ'
  const gem: GemCode = 'ROVU'
  return {
    declaredPersona: null,
    free: freeProfileOf(inner, gem),
    locale: 'ko',
    mergedDrainWindow: true,
    refined: refinedProfileOf(inner, gem),
    ...overrides,
  }
}

/** Generation order, which is the section table's own 1..12 minus whatever this input omits. */
const GENERATION_ORDER: readonly ReportSectionKey[] = [
  'worldJob',
  'strengthCards',
  'drainSignature',
  'happinessConditions',
  'interestProfile',
  'roleFamilies',
  'weekQuest',
  'threePaths',
  'fitAndFriction',
  'openingRead',
  'reflectionQuestions',
]

function keysOf(document: EngineReportDocument): readonly ReportSectionKey[] {
  return document.blocks.map((block) => block.section.key)
}

/** The opening's paragraphs across its blocks, for the assertions that are about the reading as a whole. */
function openingParagraphs(data: Extract<ReportSection, { key: 'openingRead' }>['data']) {
  return data.blocks.flatMap((entry) => entry.paragraphs)
}

/**
 * The section under `key`, narrowed. Throws when absent rather than returning undefined: every caller below
 * would otherwise assert on `undefined?.data` and pass.
 */
function sectionOf<Key extends ReportSectionKey>(
  document: EngineReportDocument,
  key: Key,
): Extract<ReportSection, { key: Key }> {
  const found = document.sections.find((section) => section.key === key)
  if (!found || found.key !== key) {
    throw new Error(`section ${key} missing`)
  }
  return found as Extract<ReportSection, { key: Key }>
}

/** Every facet the section named, so the corpus check does not have to know which section it came from. */
function facetsOf(section: ReportSection): readonly DetailedFacet[] {
  switch (section.key) {
    case 'drainSignature':
      return [...section.data.leaders, ...section.data.contrast.freeShown]
    case 'happinessConditions':
      return [...section.data.needs, ...section.data.environments]
    case 'interestProfile':
      return [...section.data.interests, ...section.data.purposes]
    case 'fitAndFriction':
      return section.data.conditions
    default:
      return []
  }
}

function stringsOf(value: unknown, into: string[] = []): string[] {
  if (typeof value === 'string') {
    into.push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) {
      stringsOf(item, into)
    }
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      stringsOf(item, into)
    }
  }
  return into
}

describe('generateEngineReport totality', () => {
  test('every inner x gem pair produces the full section set without throwing', () => {
    for (const inner of PERSONA_CODES) {
      for (const gem of GEM_CODES) {
        const document = generateEngineReport(
          inputOf({ free: freeProfileOf(inner, gem), refined: refinedProfileOf(inner, gem) }),
        )
        expect(keysOf(document)).toEqual(GENERATION_ORDER)
      }
    }
  })

  // The two sections that used to exist only when the narrator was switched on. A deployment with no model id
  // is the normal deployment, so their absence was the normal report — an opening on nothing and no close.
  test('the opening and the closing questions are engine output, not narration', () => {
    const document = generateEngineReport(inputOf())
    const opening = sectionOf(document, 'openingRead')
    const reflection = sectionOf(document, 'reflectionQuestions')

    expect(opening.data.lead.length).toBeGreaterThan(0)
    expect(opening.data.worldJobName).toBe(WORLD_JOB_NAMES.ENFJ_ROVU)
    // Both layers in full plus the work block. All eight axes are printed, so a selection that quietly dropped
    // one would surface here rather than as a shorter report nobody counted.
    expect(openingParagraphs(opening.data).length).toBeGreaterThanOrEqual(10)
    expect(opening.data.blocks.map((entry) => entry.paragraphs.length).slice(0, 2)).toEqual([4, 4])
    for (const entry of opening.data.blocks) {
      expect(entry.heading.length).toBeGreaterThan(0)
    }
    for (const paragraph of openingParagraphs(opening.data)) {
      expect(paragraph.kicker.length).toBeGreaterThan(0)
      expect(paragraph.text.length).toBeGreaterThan(0)
    }

    expect(reflection.data.questions).toHaveLength(3)
    // One question per tally, never three readings of the same one.
    expect(new Set(reflection.data.questions.map((question) => question.source)).size).toBe(3)
    for (const question of reflection.data.questions) {
      expect(question.text.endsWith('?')).toBe(true)
    }
  })

  // Nothing is selected by band and nothing by magnitude (§4.3), so an all-faint reading is not a special case
  // for the opening — it prints the same eight axes and says `faint` beside each of them.
  test('an all-faint reading still ships every section, opening included', () => {
    const bands = Object.fromEntries(
      ['EI', 'SN', 'TF', 'JP', 'RM', 'OA', 'VH', 'UO'].map((axis) => [axis, 'faint3']),
    ) as Partial<Record<AxisId, TentativeBand>>

    const document = generateEngineReport(
      inputOf({ free: freeProfileOf('ISTJ', 'MAHO', { bands }), refined: refinedProfileOf('ISTJ', 'MAHO', { bands }) }),
    )

    expect(document.blocks).toHaveLength(11)
    for (const block of document.blocks) {
      expect(block.section.title.length).toBeGreaterThan(0)
      expect(block.section.intro.length).toBeGreaterThan(0)
      expect(stringsOf(block.section.data).length).toBeGreaterThan(0)
    }

    expect(sectionOf(document, 'strengthCards').data.emptyNote).toBe(BLOCK_NOTES_KO.strengthEmpty)
    expect(sectionOf(document, 'strengthCards').data.groups).toEqual([])
    // Eight axes plus drain and interest. The combo paragraph is the only conditional one, and an all-faint
    // reading is exactly the case that has no combo card to write it from.
    expect(openingParagraphs(sectionOf(document, 'openingRead').data)).toHaveLength(10)
  })

  test('stored sections are the blocks in reading order', () => {
    const document = generateEngineReport(
      inputOf({
        declaredPersona: 'ENFP',
        free: freeProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }),
        refined: refinedProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }),
      }),
    )

    expect(document.sections.map((section) => section.key)).toEqual([...REPORT_DISPLAY_ORDER])
    expect([...document.sections].map((section) => section.key).sort()).toEqual(keysOf(document).toSorted())
    for (const section of document.sections) {
      expect(REPORT_SECTION_KEYS).toContain(section.key)
    }
  })

  // Reading order is a permutation of generation order, not an independent list: the opening reads the seven
  // sections above it and cannot be built first, and it is read first because an opening is read first.
  test('an omitted section leaves no hole in reading order', () => {
    const document = generateEngineReport(inputOf())
    expect(keysOf(document)).not.toContain('contextShift')
    expect(document.sections.map((section) => section.key)).toEqual(
      REPORT_DISPLAY_ORDER.filter((key) => key !== 'contextShift'),
    )
  })
})

describe('claim boundary', () => {
  test('every block declares claims inside its section table entry', () => {
    const document = generateEngineReport(
      inputOf({ declaredPersona: 'ENFP', refined: refinedProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }) }),
    )
    expect(document.blocks).toHaveLength(12)
    for (const block of document.blocks) {
      expect(checkClaims(block.section.key, block.claims)).toEqual([])
      expect(block.claims.length).toBeGreaterThan(0)
    }
  })

  // The engine composes both of the once-LLM-only sections, so neither may rest on `llm_report` — that entry
  // licenses the narration written over them and nothing the engine itself produced.
  test('the engine never claims the narration evidence', () => {
    const document = generateEngineReport(inputOf())
    for (const block of document.blocks) {
      expect(block.claims).not.toContain('llm_report' as never)
    }
  })

  test('no block rests on the retired rarity result', () => {
    const document = generateEngineReport(inputOf())
    for (const block of document.blocks) {
      expect(block.claims).not.toContain('rarity_and_percentile' as never)
      expect(SECTION_CLAIMS[block.section.key]).not.toContain('rarity_and_percentile' as never)
    }
  })
})

describe('input source', () => {
  // `strengthCards` is `mixed` and reads the paid AXES, never the paid work tallies — the only thing varying
  // between these two documents. So it belongs in this list alongside the free-only section.
  test('sections that do not read the paid work sitting ignore it entirely', () => {
    const free = freeProfileOf('ENFJ', 'ROVU')
    const one = generateEngineReport(inputOf({ free, refined: refinedProfileOf('ENFJ', 'ROVU') }))
    const other = generateEngineReport(
      inputOf({
        free,
        refined: refinedProfileOf('ENFJ', 'ROVU', {
          environment: { FOCUS_ENV: 0, TOGETHER_ENV: 0, FREEDOM_ENV: 3, CLEAR_ENV: 0, VARIETY_ENV: 0, VISIBLE_ENV: 0 },
          interest: { MAKE: 0, ANALYZE: 0, CREATE: 0, HELP: 6, LEAD: 0, ORDER: 0 },
          need: { AUT: 0, MASTER: 0, IMPACT: 0, BELONG: 6, STABLE: 0, NOVEL: 0 },
        }),
      }),
    )

    expect(sectionOf(one, 'worldJob').data).toEqual(sectionOf(other, 'worldJob').data)
    expect(sectionOf(one, 'strengthCards').data).toEqual(sectionOf(other, 'strengthCards').data)
    expect(sectionOf(one, 'happinessConditions').data).not.toEqual(sectionOf(other, 'happinessConditions').data)
    expect(sectionOf(one, 'roleFamilies').data).not.toEqual(sectionOf(other, 'roleFamilies').data)
  })

  test('each block reports the input source the section contract declares', () => {
    const document = generateEngineReport(
      inputOf({ declaredPersona: 'ENFP', refined: refinedProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }) }),
    )
    for (const block of document.blocks) {
      expect(block.inputSource).toBe(REPORT_SECTION_CONTRACT[block.section.key].inputSource)
    }
  })

  test('sections 1 to 3 repeat the free engine rather than recomputing it', () => {
    const free = freeProfileOf('INTP', 'MOHU')
    const expected = buildFreeReport(free, 'ko')
    const document = generateEngineReport(inputOf({ free, refined: refinedProfileOf('INTP', 'MOHU') }))

    // `reading` is the section's own addition, and it is looked up from the same two codes rather than being a
    // second computation of them — so the free half of the section still has to match byte for byte.
    const { reading, ...worldJob } = sectionOf(document, 'worldJob').data
    expect(worldJob).toEqual(expected.worldJob)
    expect(reading).toEqual({ core: GEM_CORE_READING[expected.worldJob.codes.gem], family: INNER_FAMILY_READING.INTP })
    // The cards, not the whole section. `bandMovement` is the paid tier's own addition (D14) and has no free
    // counterpart to be equal to, so it is compared in its own describe below.
    const grouped = sectionOf(document, 'strengthCards').data.groups.flatMap((group) => group.cards)
    expect(grouped).toEqual([
      ...expected.strengthCards.axis.distinct3,
      ...expected.strengthCards.axis.moderate3,
      ...expected.strengthCards.combo.distinct3,
      ...expected.strengthCards.combo.moderate3,
    ])
  })
})

// D14's paid half. The free tier labels its bands tentatively; what earns that hedge is the paid pass saying
// where the ruler landed and which way it moved. These pins exist because both facts used to travel only in the
// model request, so §4.3's planned narration failure took the whole statement with it.
describe('band movement', () => {
  function movementOf(refined: RefinedAssessmentProfile) {
    return sectionOf(generateEngineReport(inputOf({ refined })), 'strengthCards').data
  }

  test('all eight axes are reported, inner first', () => {
    const data = movementOf(refinedProfileOf('ENFJ', 'ROVU'))
    expect(data.bandMovement.map((axis) => axis.id)).toEqual([...TYPE_AXES, ...GEM_AXES])
  })

  test('the settled band and the movement both reach the section', () => {
    const data = movementOf(
      refinedProfileOf('ENFJ', 'ROVU', { bands: { EI: 'moderate3' }, movement: { EI: { shift: 'up' } } }),
    )
    const labels = data.bandMovement.map((axis) => `${axis.band.label} · ${axis.shift.label}`)
    expect(labels).toContain(`${CLARITY_BANDS_PAID.moderate.label} · ${BAND_SHIFT_PAID.up.label}`)
    for (const axis of data.bandMovement) {
      expect(axis.name.length).toBeGreaterThan(0)
      expect(axis.leading.length).toBeGreaterThan(0)
    }
  })

  // The ladder is drawn from `step`, so the three rungs have to follow the three bands and nothing else. A
  // step derived from |lean| would be a bar with a percentage hidden in its width.
  test('the rung follows the band and never a magnitude', () => {
    const distinct = movementOf(refinedProfileOf('ENFJ', 'ROVU'))
    const faint = movementOf(refinedProfileOf('ENFJ', 'ROVU', { bands: { EI: 'faint3' } }))
    const moderate = movementOf(refinedProfileOf('ENFJ', 'ROVU', { bands: { EI: 'moderate3' } }))

    const stepAt = (data: typeof distinct) => data.bandMovement.find((axis) => axis.id === 'EI')?.step
    expect(stepAt(distinct)).toBe(3)
    expect(stepAt(moderate)).toBe(2)
    expect(stepAt(faint)).toBe(1)
  })

  // The one sentence D14 names. A downgrade must reach the reader as words even when nothing else runs.
  test('a downgraded axis says so in the section', () => {
    const data = movementOf(refinedProfileOf('ENFJ', 'ROVU', { movement: { JP: { shift: 'down' } } }))
    const jp = data.bandMovement.find((axis) => axis.id === 'JP')
    expect(jp?.shift.label).toBe(BAND_SHIFT_PAID.down.label)
    expect(jp?.shiftDirection).toBe('down')
    expect(BAND_SHIFT_PAID.down.label).toBe('답이 갈렸어요')
  })

  test('split axes are named and the pole freeze is repeated beside them', () => {
    const data = movementOf(
      refinedProfileOf('ENFJ', 'ROVU', {
        movement: { SN: { evidenceSplit: true, shift: 'down' }, VH: { evidenceSplit: true, shift: 'down' } },
      }),
    )
    const copy = axisCopyFor('ko')
    expect(data.splitAxisNames).toEqual([copy.SN.name, copy.VH.name])
    expect(data.splitNote).toBe(BAND_SHIFT_PAID.down.detail)
    expect(data.splitNote).toContain('여덟 글자는 그대로예요')
  })

  test('no split is stated rather than left out', () => {
    const data = movementOf(refinedProfileOf('ENFJ', 'ROVU'))
    expect(data.bandMovement.every((axis) => !axis.evidenceSplit)).toBe(true)
    expect(data.splitAxisNames).toEqual([])
    expect(data.splitNote).toBe(BLOCK_NOTES_KO.noEvidenceSplit)
  })

  // The letter is frozen at the free pass and a split axis is exactly where the bar and the letter disagree, so
  // the label has to come off the code rather than off the recomputed score.
  test('the named pole follows the frozen code letter even on a split axis', () => {
    const data = movementOf(
      refinedProfileOf('ISTJ', 'MAHO', { movement: { EI: { evidenceSplit: true, shift: 'down' } } }),
    )
    const copy = axisCopyFor('ko')
    const ei = data.bandMovement.find((axis) => axis.id === 'EI')
    // Widened on purpose: reading the fold off the table rather than hard-coding 'I' keeps the pin alive if
    // `AXIS_POLES` is ever reordered.
    const poles: readonly string[] = AXIS_POLES.EI
    expect(ei?.leading).toBe(poles[0] === 'I' ? copy.EI.first.label : copy.EI.second.label)
  })
})

describe('drain signature', () => {
  function drainDataOf(input: EngineReportInput) {
    return sectionOf(generateEngineReport(input), 'drainSignature').data
  }

  test('the contrast against the free display set is always present', () => {
    const data = drainDataOf(inputOf())
    expect(data.contrast.freeShown.length).toBeGreaterThan(0)
    expect(data.contrast.sentence.length).toBeGreaterThan(0)
    expect(data.mergedWindow).toBe(true)
  })

  // The strand count IS the spread, so a drawing derived from it cannot disagree with the words beside it.
  test('the drawn strand count follows the shown facet count', () => {
    const data = drainDataOf(inputOf())
    expect(data.strands).toBe(data.leaders.length as typeof data.strands)
  })

  // Every facet the section names carries the authored paragraph, not only a label and an action.
  test('each named facet carries its detail', () => {
    const data = drainDataOf(inputOf())
    for (const facet of [...data.leaders, ...data.contrast.freeShown]) {
      expect(facet.detail.length).toBeGreaterThan(0)
      expect(facet.detail).not.toBe(facet.label)
      expect(facet.detail).not.toBe(facet.action)
    }
  })

  test('a paid leader that left the free display set reads as shifted', () => {
    const data = drainDataOf(
      inputOf({
        free: freeProfileOf('ENFJ', 'ROVU', { drain: ['BREAK', 'BREAK', 'VAGUE'] }),
        refined: refinedProfileOf('ENFJ', 'ROVU', {
          mergedDrain: ['BREAK', 'BREAK', 'VAGUE', 'STUCK', 'STUCK', 'STUCK'],
        }),
      }),
    )
    // Free BREAK 2 · VAGUE 1 → gap 1 → double → shows both. Paid STUCK 3 · BREAK 2 · VAGUE 1 → gap 1 →
    // double → STUCK and BREAK. One facet entered the set and one left it.
    expect(data.contrast.relation).toBe('shifted')
    expect(data.leaders.map((facet) => facet.id)).toEqual(['STUCK', 'BREAK'])
    expect(data.contrast.added.map((facet) => facet.id)).toEqual(['STUCK'])
    expect(data.contrast.dropped.map((facet) => facet.id)).toEqual(['VAGUE'])
    expect(data.contrast.freeShown.map((facet) => facet.id)).toEqual(['BREAK', 'VAGUE'])
  })

  // Paid BREAK 3 · VAGUE/EMPTY/STUCK 1 → gap 2 → single. Going from a two-facet free set to one paid facet
  // is exactly what `narrowed` names, and it is the shape the paid tier is sold on.
  test('a paid read that pulls one facet clear of the free pair reads as narrowed', () => {
    const data = drainDataOf(
      inputOf({
        free: freeProfileOf('ENFJ', 'ROVU', { drain: ['BREAK', 'BREAK', 'VAGUE'] }),
        refined: refinedProfileOf('ENFJ', 'ROVU', {
          mergedDrain: ['BREAK', 'BREAK', 'VAGUE', 'BREAK', 'EMPTY', 'STUCK'],
        }),
      }),
    )
    expect(data.contrast.relation).toBe('narrowed')
    expect(data.leaders.map((facet) => facet.id)).toEqual(['BREAK'])
    expect(data.contrast.added).toEqual([])
    expect(data.contrast.dropped.map((facet) => facet.id)).toEqual(['VAGUE'])
  })

  // Paid BREAK 2 · VAGUE 2 · EMPTY 1 · STUCK 1 → gap 0 → triple. EMPTY joins on declaration order ahead of
  // STUCK, which carries the same count.
  test('a paid read that opens the field to three reads as widened', () => {
    const data = drainDataOf(
      inputOf({
        free: freeProfileOf('ENFJ', 'ROVU', { drain: ['BREAK', 'BREAK', 'VAGUE'] }),
        refined: refinedProfileOf('ENFJ', 'ROVU', {
          mergedDrain: ['BREAK', 'BREAK', 'VAGUE', 'VAGUE', 'EMPTY', 'STUCK'],
        }),
      }),
    )
    expect(data.contrast.relation).toBe('widened')
    expect(data.leaders.map((facet) => facet.id)).toEqual(['BREAK', 'VAGUE', 'EMPTY'])
    expect(data.contrast.added.map((facet) => facet.id)).toEqual(['EMPTY'])
    expect(data.contrast.dropped).toEqual([])
  })

  test('a paid read that resolves a three-way free tie reads as narrowed', () => {
    const data = drainDataOf(
      inputOf({
        free: freeProfileOf('ENFJ', 'ROVU', { drain: ['BREAK', 'VAGUE', 'EMPTY'] }),
        refined: refinedProfileOf('ENFJ', 'ROVU', {
          mergedDrain: ['BREAK', 'VAGUE', 'EMPTY', 'BREAK', 'BREAK', 'STUCK'],
        }),
      }),
    )
    expect(data.contrast.relation).toBe('narrowed')
    expect(data.contrast.added).toEqual([])
    expect(data.contrast.dropped.map((facet) => facet.id)).toEqual(['VAGUE', 'EMPTY'])
  })

  test('a broken window drops the free half by subtraction', () => {
    const input = inputOf({
      free: freeProfileOf('ENFJ', 'ROVU', { drain: ['BREAK', 'BREAK', 'VAGUE'] }),
      mergedDrainWindow: false,
      refined: refinedProfileOf('ENFJ', 'ROVU', {
        mergedDrain: ['BREAK', 'BREAK', 'VAGUE', 'TENSION', 'TENSION', 'STUCK'],
      }),
    })
    const data = drainDataOf(input)

    expect(data.mergedWindow).toBe(false)
    // Paid-only TENSION 2 · STUCK 1 → gap 1 → double, so the runner-up rides along.
    expect(data.leaders.map((facet) => facet.id)).toEqual(['TENSION', 'STUCK'])
    expect(data.contrast.sentence).toContain('심층 답만')
  })

  test('an inconsistent subtraction keeps the merged read and says so', () => {
    const data = drainDataOf(
      inputOf({
        free: freeProfileOf('ENFJ', 'ROVU', { drain: ['STUCK', 'STUCK', 'EMPTY'] }),
        mergedDrainWindow: false,
        // Merged counts that cannot contain the free ones: the subtraction goes negative on STUCK.
        refined: refinedProfileOf('ENFJ', 'ROVU', {
          mergedDrain: ['BREAK', 'BREAK', 'VAGUE', 'TENSION', 'TENSION', 'STUCK'],
        }),
      }),
    )
    expect(data.mergedWindow).toBe(true)
  })

  test('the window rule reads two instants and no clock', () => {
    const free = new Date('2026-01-01T00:00:00.000Z')
    const inside = new Date(free.getTime() + DRAIN_MERGE_WINDOW_DAYS * 86_400_000)
    const outside = new Date(inside.getTime() + 1)
    expect(mergeDrainSittings(free, inside)).toBe(true)
    expect(mergeDrainSittings(free, outside)).toBe(false)
    expect(mergeDrainSittings(null, outside)).toBe(true)
    expect(mergeDrainSittings(free, null)).toBe(true)
  })
})

describe('week quest', () => {
  test('seven days, each inside the cost and contact limits', () => {
    const data = sectionOf(generateEngineReport(inputOf()), 'weekQuest').data

    expect(data.days).toHaveLength(7)
    data.days.forEach((day, index) => {
      expect(day.day).toBe((index + 1) as typeof day.day)
      expect(day.estimatedMinutes).toBeGreaterThanOrEqual(10)
      expect(day.estimatedMinutes).toBeLessThanOrEqual(30)
      expect(day.requiredCost).toBe(0)
      expect(day.needsExternalContact).toBe(false)
      for (const value of [day.completionCheck, day.purpose, day.reflectionQuestion, day.safetyNote, day.task]) {
        expect(value.length).toBeGreaterThan(0)
      }
    })
  })

  // Only days 3, 4 and 5 read the profile. `taskAnchor` is where that shows, so a day that quotes the reader's
  // own result carries one and the four that run the same week for everyone carry none.
  test('the profile-reading days are the ones that carry an anchor', () => {
    const data = sectionOf(generateEngineReport(inputOf()), 'weekQuest').data
    const anchored = data.days.filter((day) => day.taskAnchor !== null).map((day) => day.day)
    expect(anchored).toEqual([3, 4, 5])
    expect(data.days[3].taskAnchor?.label).toBe('오늘 쓸 강점')
    expect(data.days[4].taskAnchor?.label).toBe('살펴볼 역할군')
    for (const day of data.days) {
      expect(day.taskAnchor?.value.length ?? 1).toBeGreaterThan(0)
    }
  })
})

describe('self report contrast', () => {
  test('omitted when nothing was declared', () => {
    expect(keysOf(generateEngineReport(inputOf()))).not.toContain('contextShift')
  })

  test('omitted when a code is present but the source says unknown', () => {
    expect(keysOf(generateEngineReport(inputOf({ declaredPersona: 'ENFP' })))).not.toContain('contextShift')
  })

  test('names the split axes when a declaration exists', () => {
    const data = sectionOf(
      generateEngineReport(
        inputOf({
          declaredPersona: 'ENFP',
          free: freeProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }),
          refined: refinedProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }),
        }),
      ),
      'contextShift',
    ).data

    expect(data.declaredCode).toBe('ENFP')
    expect(data.measuredCode).toBe('ENFJ')
    expect(data.axes.filter((axis) => !axis.matched).map((axis) => axis.id)).toEqual(['JP'])
    for (const axis of data.axes) {
      expect(axis.declared.label.length).toBeGreaterThan(0)
      expect(axis.measured.label.length).toBeGreaterThan(0)
      expect(axis.note.length).toBeGreaterThan(0)
    }
    // Per axis and per reading. A note shared across axes, or across the matched and split cases, would be a
    // heading pretending to be a finding.
    for (const axis of data.axes) {
      const notes = SELF_REPORT_AXIS_NOTES[axis.id]
      expect(axis.note).toBe(axis.matched ? notes.matched : notes.split)
      expect(notes.matched).not.toBe(notes.split)
    }
    expect(new Set(data.axes.map((axis) => axis.note)).size).toBe(data.axes.length)
  })
})

describe('context-dependent confidence', () => {
  test('the stay route and the whole friction section stay pinned', () => {
    const document = generateEngineReport(inputOf())
    expect(sectionOf(document, 'threePaths').data.paths[0].confidence).toBe('needsMoreInput')
    expect(sectionOf(document, 'fitAndFriction').data.confidence).toBe('needsMoreInput')
    for (const card of sectionOf(document, 'roleFamilies').data.cards) {
      expect(card.carryOver.confidence).toBe('needsMoreInput')
    }
  })
})

describe('proper noun identity', () => {
  const worldJobRows = PROPER_NOUNS.filter((row) => row.source === 'markdown:WORLD_JOB_NAMES')

  test('all 256 world job names survive the engine byte for byte', () => {
    expect(worldJobRows).toHaveLength(256)

    for (const inner of PERSONA_CODES) {
      for (const gem of GEM_CODES) {
        const document = generateEngineReport(
          inputOf({ free: freeProfileOf(inner, gem), refined: refinedProfileOf(inner, gem) }),
        )
        const row = worldJobRows.find((candidate) => candidate.key === `${inner}_${gem}`)
        expect(row?.text).toBe(WORLD_JOB_NAMES[`${inner}_${gem}`])
        expect(sectionOf(document, 'worldJob').data.name).toBe(row?.text ?? '')
        // The composed opening leads with the same name, so a rewrite in the composer surfaces here too.
        expect(sectionOf(document, 'openingRead').data.worldJobName).toBe(row?.text ?? '')
      }
    }
  })

  test('named tables reach the output byte for byte and no mutated variant appears', () => {
    const corpus = new Set<string>(PROPER_NOUNS.map((row) => row.text))
    const emitted = new Set<string>()
    // Every value the engine printed under a key the corpus owns. A rewrite anywhere between the table and the
    // section surfaces here as a string the corpus does not contain.
    const named = new Set<string>()

    for (const inner of PERSONA_CODES) {
      for (const gem of GEM_CODES) {
        const document = generateEngineReport(
          inputOf({
            declaredPersona: 'ENFP',
            free: freeProfileOf(inner, gem, { personaSource: 'declared' }),
            refined: refinedProfileOf(inner, gem, { personaSource: 'declared' }),
          }),
        )
        for (const value of stringsOf(document.sections)) {
          emitted.add(value)
        }
        for (const section of document.sections) {
          if (section.key === 'worldJob') {
            const { core, family, name } = section.data
            for (const value of [name, family.name, family.method, family.role, core.name, core.strength]) {
              named.add(value)
            }
          }
          if (section.key === 'strengthCards') {
            for (const group of section.data.groups) {
              for (const card of group.cards) {
                named.add(card.copy.name)
              }
            }
          }
          for (const facet of facetsOf(section)) {
            named.add(facet.label)
          }
        }
      }
    }

    const worldJobNames = new Set<string>(worldJobRows.map((row) => row.text))
    expect([...named].filter((value) => worldJobNames.has(value))).toHaveLength(256)
    expect(named.size).toBeGreaterThan(256)
    for (const value of named) {
      expect(corpus.has(value)).toBe(true)
    }

    const joined = [...emitted].join('\u0000')
    // The eight rows the origin's polish chain rewrote (proper-nouns.ts header). None may reappear here.
    for (const mutated of [
      '먼길 선택잡이',
      '무대 위 이야기꾼',
      '마음의 반복된 모습연구가',
      '사람 과정 배치관',
      '믿는 선택이 생기면 사람들과 함께 먼저 움직여요.',
      '내 공간과 시간을 지키며 편한 과정을 만들어요.',
      '여러 말 속에서 중요한 뜻을 찾아 다음 선택을 정해요.',
      '선택을 맞춤',
    ]) {
      expect(joined).not.toContain(mutated)
    }

    for (const name of worldJobNames) {
      expect(corpus.has(name)).toBe(true)
    }
  })

  test('facet labels and world job halves reach the sections unchanged', () => {
    const facetRows = PROPER_NOUNS.filter((row) => row.source === 'render:SIGNAL_COPY_V47')
    const document = generateEngineReport(
      inputOf({
        refined: refinedProfileOf('ENFJ', 'ROVU', {
          environment: { FOCUS_ENV: 3, TOGETHER_ENV: 0, FREEDOM_ENV: 0, CLEAR_ENV: 0, VARIETY_ENV: 0, VISIBLE_ENV: 0 },
          interest: { MAKE: 6, ANALYZE: 0, CREATE: 0, HELP: 0, LEAD: 0, ORDER: 0 },
          need: { AUT: 6, MASTER: 0, IMPACT: 0, BELONG: 0, STABLE: 0, NOVEL: 0 },
          purpose: { SOLVE: 3, UNDERSTAND: 0, EXPRESS: 0, CARE: 0, MOVE: 0, STEADY: 0 },
        }),
      }),
    )
    const joined = stringsOf(document.sections).join('\n')

    for (const key of ['MAKE', 'AUT', 'SOLVE', 'FOCUS_ENV']) {
      const row = facetRows.find((candidate) => candidate.key === key && candidate.field === 'name')
      expect(row).toBeDefined()
      expect(joined).toContain(row?.text ?? '')
    }

    const family = PROPER_NOUNS.find((row) => row.source === 'render:WORLD_JOB_FAMILY' && row.key === 'ENFJ')
    const core = PROPER_NOUNS.find((row) => row.source === 'render:WORLD_JOB_CORE' && row.key === 'ROVU')
    expect(joined).toContain(family?.text ?? '')
    expect(joined).toContain(core?.text ?? '')
  })
})

describe('forbidden vocabulary', () => {
  // FAKE_METRIC and DETERMINISM from MIGRATION §8.5, plus the ranking words §4.3 rules out. The scan covers
  // every string the sections carry, frozen tables included — the corpus test above already pins those byte
  // for byte, so a hit here is a real leak rather than a table this list forgot about.
  const ENGINE_AUTHORED_BANS = [
    '상위',
    '백분위',
    '희소',
    '희귀',
    '확률',
    '적합도',
    '퍼센트',
    '%',
    '확정',
    '정확히',
    '1위',
    '순위',
    '반드시',
    'MBTI',
  ] as const

  test('no string the sections carry holds a metric or a determinism claim', () => {
    const document = generateEngineReport(
      inputOf({
        declaredPersona: 'ENFP',
        free: freeProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }),
        refined: refinedProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }),
      }),
    )
    const joined = stringsOf(document.sections).join('\n')

    for (const banned of ENGINE_AUTHORED_BANS) {
      expect(joined).not.toContain(banned)
    }
  })
})
