import { describe, expect, test } from 'bun:test'

import { PROPER_NOUNS } from '../../deep-type/content/proper-nouns'
import { WORLD_JOB_NAMES } from '../../deep-type/content/world-job-names'
import {
  type AxisId,
  type DrainFacet,
  type EnvironmentFacet,
  type FreeAssessmentProfile,
  type FreeAxisScore,
  type FreeDrainSpread,
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
  WORK_FACETS,
  type WorkFacetId,
  type WorkFacetTally,
} from '../../deep-type/model'
import { buildFreeReport } from '../../deep-type/rules/free'
import { resolveDrainBand } from '../../deep-type/scoring'
import { checkClaims, SECTION_CLAIMS } from './claims'
import {
  DRAIN_MERGE_WINDOW_DAYS,
  type EngineReportInput,
  generateEngineReport,
  mergeDrainSittings,
  type NamedFacet,
} from './rules'
import { REPORT_SECTION_CONTRACT, REPORT_SECTION_KEYS_V2 } from './section-keys'

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

function refinedAxisScoreFor(band3: TentativeBand, letter: string): RefinedAxisScore {
  return {
    ...axisScoreFor(band3, letter),
    band5: band3 === 'distinct3' ? 'distinct' : band3 === 'moderate3' ? 'moderate' : 'faint',
    evidenceSplit: false,
    shift: 'same',
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
    need?: Record<NeedFacet, number>
    personaSource?: PersonaSource
    purpose?: Record<PurposeFacet, number>
  } = {},
): RefinedAssessmentProfile {
  const band = (axis: AxisId) => options.bands?.[axis] ?? 'distinct3'
  const counts = drainCounts(options.mergedDrain ?? [...FREE_DRAIN_DEFAULT, ...PAID_DRAIN_DEFAULT])

  return {
    gem: {
      axes: {
        RM: refinedAxisScoreFor(band('RM'), gem[0]),
        OA: refinedAxisScoreFor(band('OA'), gem[1]),
        VH: refinedAxisScoreFor(band('VH'), gem[2]),
        UO: refinedAxisScoreFor(band('UO'), gem[3]),
      },
      code: gem,
    },
    inner: {
      axes: {
        EI: refinedAxisScoreFor(band('EI'), inner[0]),
        SN: refinedAxisScoreFor(band('SN'), inner[1]),
        TF: refinedAxisScoreFor(band('TF'), inner[2]),
        JP: refinedAxisScoreFor(band('JP'), inner[3]),
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

type AnyBlock = ReturnType<typeof generateEngineReport>['blocks'][number]

/** Every facet the block named, in one list, so the corpus check does not have to know which section it came from. */
function facetsOf(block: AnyBlock): readonly NamedFacet[] {
  switch (block.key) {
    case 'drainSignature':
      return [...block.data.leaders, ...block.data.contrast.freeShown]
    case 'happinessConditions':
      return [...block.data.needs, ...block.data.environments]
    case 'interestProfile':
      return [...block.data.interests, ...block.data.purposes]
    case 'fitAndFriction':
      return block.data.conditions
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
        expect(document.blocks.map((block) => block.key)).toEqual([
          'worldJob',
          'strengthCards',
          'drainSignature',
          'happinessConditions',
          'interestProfile',
          'roleFamilies',
          'weekQuest',
          'threePaths',
          'fitAndFriction',
        ])
      }
    }
  })

  test('an all-faint reading still ships every section with a non-empty body', () => {
    const bands = Object.fromEntries(
      [...WORK_FACETS.drain, 'EI', 'SN', 'TF', 'JP', 'RM', 'OA', 'VH', 'UO'].map((axis) => [axis, 'faint3']),
    ) as Partial<Record<AxisId, TentativeBand>>

    const document = generateEngineReport(
      inputOf({ free: freeProfileOf('ISTJ', 'MAHO', { bands }), refined: refinedProfileOf('ISTJ', 'MAHO', { bands }) }),
    )

    expect(document.blocks).toHaveLength(9)
    for (const block of document.blocks) {
      expect(block.body.length).toBeGreaterThan(0)
      expect(block.title.length).toBeGreaterThan(0)
    }
    const strengths = document.blocks.find((block) => block.key === 'strengthCards')
    expect(strengths?.body).toContain('강점 카드를 뽑지 않았어요')
  })

  test('sections mirror blocks and carry the v2 schema version', () => {
    const document = generateEngineReport(inputOf({ declaredPersona: 'ENFP' }))
    expect(document.schemaVersion).toBe('2')
    expect(document.sections).toEqual(document.blocks.map(({ body, key, title }) => ({ body, key, title })))
    for (const section of document.sections) {
      expect(REPORT_SECTION_KEYS_V2).toContain(section.key)
    }
  })
})

describe('claim boundary', () => {
  test('every block declares claims inside its section table entry', () => {
    const document = generateEngineReport(
      inputOf({ declaredPersona: 'ENFP', refined: refinedProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }) }),
    )
    expect(document.blocks).toHaveLength(10)
    for (const block of document.blocks) {
      expect(checkClaims(block.key, block.claims)).toEqual([])
      expect(block.claims.length).toBeGreaterThan(0)
    }
  })

  test('no block rests on the retired rarity result', () => {
    const document = generateEngineReport(inputOf())
    for (const block of document.blocks) {
      expect(block.claims).not.toContain('rarity_and_percentile' as never)
      expect(SECTION_CLAIMS[block.key]).not.toContain('rarity_and_percentile' as never)
    }
  })
})

describe('input source', () => {
  test('free-only sections ignore the paid sitting entirely', () => {
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

    const bodyAt = (document: typeof one, key: string) => document.blocks.find((block) => block.key === key)?.body

    expect(bodyAt(one, 'worldJob')).toBe(bodyAt(other, 'worldJob') ?? '')
    expect(bodyAt(one, 'strengthCards')).toBe(bodyAt(other, 'strengthCards') ?? '')
    expect(bodyAt(one, 'happinessConditions')).not.toBe(bodyAt(other, 'happinessConditions') ?? '')
    expect(bodyAt(one, 'roleFamilies')).not.toBe(bodyAt(other, 'roleFamilies') ?? '')
  })

  test('each block reports the input source the section contract declares', () => {
    const document = generateEngineReport(
      inputOf({ declaredPersona: 'ENFP', refined: refinedProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }) }),
    )
    for (const block of document.blocks) {
      expect(block.inputSource).toBe(REPORT_SECTION_CONTRACT[block.key].inputSource)
    }
  })

  test('sections 1 to 3 repeat the free engine rather than recomputing it', () => {
    const free = freeProfileOf('INTP', 'MOHU')
    const expected = buildFreeReport(free)
    const document = generateEngineReport(inputOf({ free, refined: refinedProfileOf('INTP', 'MOHU') }))

    const worldJob = document.blocks.find((block) => block.key === 'worldJob')
    const strengths = document.blocks.find((block) => block.key === 'strengthCards')
    expect(worldJob?.data).toEqual(expected.worldJob)
    expect(strengths?.data).toEqual(expected.strengthCards)
  })
})

describe('drain signature', () => {
  function drainDataOf(input: EngineReportInput) {
    const block = generateEngineReport(input).blocks.find((candidate) => candidate.key === 'drainSignature')
    if (block?.key !== 'drainSignature') {
      throw new Error('drainSignature missing')
    }
    return block.data
  }

  test('the contrast against the free display set is always present', () => {
    const data = drainDataOf(inputOf())
    expect(data.contrast.freeShown.length).toBeGreaterThan(0)
    expect(data.contrast.sentence.length).toBeGreaterThan(0)
    expect(data.mergedWindow).toBe(true)
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
    expect(data.contrast.sentence).toContain('정밀 답만')
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
    const block = generateEngineReport(inputOf()).blocks.find((candidate) => candidate.key === 'weekQuest')
    if (block?.key !== 'weekQuest') {
      throw new Error('weekQuest missing')
    }

    expect(block.data.days).toHaveLength(7)
    block.data.days.forEach((day, index) => {
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

  test('the strength day and the role day read the profile', () => {
    const block = generateEngineReport(inputOf()).blocks.find((candidate) => candidate.key === 'weekQuest')
    if (block?.key !== 'weekQuest') {
      throw new Error('weekQuest missing')
    }
    expect(block.data.days[3].task).toContain('오늘 쓸 강점')
    expect(block.data.days[4].task).toContain('살펴볼 역할군')
  })
})

describe('self report contrast', () => {
  test('omitted when nothing was declared', () => {
    const keys = generateEngineReport(inputOf()).blocks.map((block) => block.key)
    expect(keys).not.toContain('contextShift')
  })

  test('omitted when a code is present but the source says unknown', () => {
    const keys = generateEngineReport(inputOf({ declaredPersona: 'ENFP' })).blocks.map((block) => block.key)
    expect(keys).not.toContain('contextShift')
  })

  test('names the split axes when a declaration exists', () => {
    const block = generateEngineReport(
      inputOf({
        declaredPersona: 'ENFP',
        free: freeProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }),
        refined: refinedProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }),
      }),
    ).blocks.find((candidate) => candidate.key === 'contextShift')

    if (block?.key !== 'contextShift') {
      throw new Error('contextShift missing')
    }
    expect(block.data.declaredCode).toBe('ENFP')
    expect(block.data.measuredCode).toBe('ENFJ')
    expect(block.data.axes.filter((axis) => !axis.matched).map((axis) => axis.id)).toEqual(['JP'])
    for (const axis of block.data.axes) {
      expect(axis.declared.label.length).toBeGreaterThan(0)
      expect(axis.measured.label.length).toBeGreaterThan(0)
    }
  })
})

describe('context-dependent confidence', () => {
  test('the stay route and the whole friction section stay pinned', () => {
    const document = generateEngineReport(inputOf())
    const paths = document.blocks.find((block) => block.key === 'threePaths')
    const friction = document.blocks.find((block) => block.key === 'fitAndFriction')
    const roles = document.blocks.find((block) => block.key === 'roleFamilies')

    if (paths?.key !== 'threePaths' || friction?.key !== 'fitAndFriction' || roles?.key !== 'roleFamilies') {
      throw new Error('sections missing')
    }
    expect(paths.data.paths[0].confidence).toBe('needsMoreInput')
    expect(friction.data.confidence).toBe('needsMoreInput')
    for (const card of roles.data.cards) {
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
        const block = document.blocks.find((candidate) => candidate.key === 'worldJob')
        if (block?.key !== 'worldJob') {
          throw new Error('worldJob missing')
        }
        const row = worldJobRows.find((candidate) => candidate.key === `${inner}_${gem}`)
        expect(row?.text).toBe(WORLD_JOB_NAMES[`${inner}_${gem}`])
        expect(block.data.name).toBe(row?.text ?? '')
        expect(block.body).toContain(row?.text ?? '')
      }
    }
  })

  test('named tables reach the output byte for byte and no mutated variant appears', () => {
    const corpus = new Set<string>(PROPER_NOUNS.map((row) => row.text))
    const emitted = new Set<string>()
    // Every value the engine printed under a key the corpus owns. A rewrite anywhere between the table and the
    // block surfaces here as a string the corpus does not contain.
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
        for (const value of stringsOf(document.blocks)) {
          emitted.add(value)
        }
        for (const block of document.blocks) {
          if (block.key === 'worldJob') {
            const { core, family, name } = block.data
            for (const value of [name, family.name, family.method, family.role, core.name, core.strength]) {
              named.add(value)
            }
          }
          if (block.key === 'strengthCards') {
            for (const set of [block.data.axis, block.data.combo]) {
              for (const card of [...set.distinct3, ...set.moderate3]) {
                named.add(card.copy.name)
              }
            }
          }
          for (const facet of facetsOf(block)) {
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

  test('facet labels and world job halves reach the body unchanged', () => {
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
    const joined = document.blocks.map((block) => block.body).join('\n')

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
  // FAKE_METRIC and DETERMINISM from MIGRATION §8.5, plus the ranking words §4.3 rules out. Terms the engine
  // only relays from a frozen content table are not scanned here — the corpus test above owns those strings.
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

  test('no engine-authored string carries a metric or a determinism claim', () => {
    const document = generateEngineReport(
      inputOf({
        declaredPersona: 'ENFP',
        free: freeProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }),
        refined: refinedProfileOf('ENFJ', 'ROVU', { personaSource: 'declared' }),
      }),
    )
    const joined = document.blocks.map((block) => block.body).join('\n')

    for (const banned of ENGINE_AUTHORED_BANS) {
      expect(joined).not.toContain(banned)
    }
  })
})
