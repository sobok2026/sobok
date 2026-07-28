import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  type AxisId,
  type DrainFacet,
  type EnvironmentFacet,
  type FreeAssessmentProfile,
  type FreeAxisScore,
  type GemCode,
  INSTRUMENT_VERSION,
  type InnerCode,
  type InterestFacet,
  type NeedFacet,
  type PurposeFacet,
  type RefinedAssessmentProfile,
  type RefinedAxisScore,
  WORK_FACETS,
  type WorkFacetId,
  type WorkFacetTally,
} from '../../deep-type/model'
import { resolveDrainBand } from '../../deep-type/scoring'
import { acceptNarrative, requestedNarrativeKeys } from './claude'
import {
  ENGINE_MODEL,
  isNarrativeEnabled,
  isReportSettled,
  planReportPasses,
  type ReportPassStatus,
  type ReportSourceRow,
  reportDelivery,
} from './pipeline'
import {
  CURRENT_REPORT_SCHEMA_VERSION,
  type NarratedSectionKey,
  REPORT_SECTION_KEYS_V2,
  type ReportSection,
} from './section-keys'

const PASS_STATUSES: readonly ReportPassStatus[] = ['pending', 'generating', 'done', 'failed']

// Fixtures build profiles directly. The scorer has its own suite; what these exercise is the commit contract.

function freeAxis(letter: string): FreeAxisScore {
  return { answered: 3, band3: 'distinct3', firstShare: 50, lean: 1, pole: letter, score: 9, secondShare: 50 }
}

function refinedAxis(letter: string): RefinedAxisScore {
  return { ...freeAxis(letter), band5: 'distinct', evidenceSplit: false, shift: 'same' }
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

function drainCounts(picks: readonly DrainFacet[]): Record<DrainFacet, number> {
  const counts = Object.fromEntries(WORK_FACETS.drain.map((facet) => [facet, 0])) as Record<DrainFacet, number>
  for (const facet of picks) {
    counts[facet] += 1
  }
  return counts
}

const INNER: InnerCode = 'ENFJ'
const GEM: GemCode = 'ROVU'
const FREE_DRAIN: readonly DrainFacet[] = ['BREAK', 'BREAK', 'VAGUE']
const PAID_DRAIN: readonly DrainFacet[] = ['BREAK', 'OVERLOAD', 'OVERLOAD']
const INTEREST: Record<InterestFacet, number> = { MAKE: 3, ANALYZE: 2, CREATE: 1, HELP: 0, LEAD: 0, ORDER: 0 }
const NEED: Record<NeedFacet, number> = { AUT: 3, MASTER: 2, IMPACT: 1, BELONG: 0, STABLE: 0, NOVEL: 0 }
const PURPOSE: Record<PurposeFacet, number> = { SOLVE: 2, UNDERSTAND: 1, EXPRESS: 0, CARE: 0, MOVE: 0, STEADY: 0 }
const ENVIRONMENT: Record<EnvironmentFacet, number> = {
  FOCUS_ENV: 2,
  TOGETHER_ENV: 1,
  FREEDOM_ENV: 0,
  CLEAR_ENV: 0,
  VARIETY_ENV: 0,
  VISIBLE_ENV: 0,
}

const axesOf = <Score>(code: string, score: (letter: string) => Score, ids: readonly AxisId[]) =>
  Object.fromEntries(ids.map((axis, index) => [axis, score(code[index] ?? '')])) as Record<AxisId, Score>

function freeProfile(): FreeAssessmentProfile {
  const counts = drainCounts(FREE_DRAIN)
  return {
    gem: { axes: axesOf(GEM, freeAxis, ['RM', 'OA', 'VH', 'UO']), code: GEM },
    inner: { axes: axesOf(INNER, freeAxis, ['EI', 'SN', 'TF', 'JP']), code: INNER },
    instrumentVersion: INSTRUMENT_VERSION,
    personaSource: 'unknown',
    tier: 'free',
    work: { drain: { ...tallyOf(WORK_FACETS.drain, counts, 2), spread: resolveDrainBand(counts, 2) }, scope: 'free' },
  }
}

function refinedProfile(): RefinedAssessmentProfile {
  const counts = drainCounts([...FREE_DRAIN, ...PAID_DRAIN])
  return {
    gem: { axes: axesOf(GEM, refinedAxis, ['RM', 'OA', 'VH', 'UO']), code: GEM },
    inner: { axes: axesOf(INNER, refinedAxis, ['EI', 'SN', 'TF', 'JP']), code: INNER },
    instrumentVersion: INSTRUMENT_VERSION,
    personaSource: 'unknown',
    tier: 'refined',
    work: {
      drain: { ...tallyOf(WORK_FACETS.drain, counts, 4), spread: resolveDrainBand(counts, 4) },
      environment: tallyOf(WORK_FACETS.environment, ENVIRONMENT, 2),
      interest: tallyOf(WORK_FACETS.interest, INTEREST, 4),
      need: tallyOf(WORK_FACETS.need, NEED, 4),
      purpose: tallyOf(WORK_FACETS.purpose, PURPOSE, 2),
      scope: 'refined',
    },
  }
}

function sourceOf(overrides: Partial<ReportSourceRow> = {}): ReportSourceRow {
  return {
    declaredPersona: null,
    freeProfile: freeProfile(),
    freeWorkAnswersAt: new Date('2026-07-01T00:00:00.000Z'),
    locale: 'ko',
    refinedAt: new Date('2026-07-02T00:00:00.000Z'),
    refinedProfile: refinedProfile(),
    ...overrides,
  }
}

describe('delivery gating (D4 = A)', () => {
  test('caching and stamping are the same condition on every status', () => {
    for (const status of PASS_STATUSES) {
      const plan = reportDelivery(status)
      expect(plan.readCached).toBe(plan.stamp)
      expect(plan.stamp).toBe(isReportSettled(status))
    }
  })

  test('an unsettled narrative is delivered without stamping viewed_at', () => {
    expect(reportDelivery('pending').stamp).toBe(false)
    expect(reportDelivery('generating').stamp).toBe(false)
  })

  test('both terminal states settle delivery, so a failed narration still stamps', () => {
    expect(reportDelivery('done').stamp).toBe(true)
    expect(reportDelivery('failed').stamp).toBe(true)
  })
})

describe('engine-first commit', () => {
  test('the engine commit is rules-only at the current schema version, narration off or on', () => {
    const plan = planReportPasses(sourceOf())

    expect(isNarrativeEnabled('0')).toBe(false)
    expect(isNarrativeEnabled('1')).toBe(true)
    expect(isNarrativeEnabled(undefined)).toBe(true)

    expect(plan?.engine.model).toBe(ENGINE_MODEL)
    expect(plan?.engine.model).toBe('rules-only')
    // Explicit: the column defaults to '1' and a v2 body stored under it reads back as v1 forever.
    expect(plan?.engine.schemaVersion).toBe(CURRENT_REPORT_SCHEMA_VERSION)
    expect(plan?.engine.schemaVersion).toBe('2')
  })

  test('every committed section carries v2 keys and a body', () => {
    const plan = planReportPasses(sourceOf())
    expect(plan).not.toBeNull()

    for (const section of plan?.engine.sections ?? []) {
      expect(REPORT_SECTION_KEYS_V2 as readonly string[]).toContain(section.key)
      expect(section.body.length).toBeGreaterThan(0)
      expect(section.title.length).toBeGreaterThan(0)
    }
    expect(plan?.engine.sections.length).toBeGreaterThan(0)
  })

  test('an unpaid or malformed row is a value, not a throw', () => {
    expect(planReportPasses(sourceOf({ refinedProfile: null }))).toBeNull()
    expect(planReportPasses(sourceOf({ refinedProfile: freeProfile() }))).toBeNull()
    expect(planReportPasses(sourceOf({ freeProfile: refinedProfile() }))).toBeNull()
  })

  test('the narrator receives no raw answers', () => {
    const plan = planReportPasses(sourceOf())
    const serialized = JSON.stringify(plan?.profile ?? {})
    for (const forbidden of ['answers', 'itemId', 'optionIndex', 'percentile', 'rarity']) {
      expect(serialized).not.toContain(forbidden)
    }
  })
})

describe('narration never invalidates the engine body', () => {
  test('a claim-boundary violation drops the narration and leaves the engine sections whole', () => {
    const plan = planReportPasses(sourceOf())
    const engine = plan?.engine.sections ?? []
    const before = engine.length
    const requested = requestedNarrativeKeys(engine)

    const accepted = new Map<NarratedSectionKey, ReportSection>()
    const dropped = acceptNarrative(
      JSON.stringify({
        sections: [
          {
            key: 'openingRead',
            title: '여는 읽기',
            body: '상위 3% 에 해당해요.',
            claims: ['rarity_and_percentile'],
          },
        ],
      }),
      requested,
      accepted,
    )

    expect(dropped).toEqual([{ key: 'openingRead', reason: 'claims' }])
    expect(accepted.size).toBe(0)
    expect(engine.length).toBe(before)
  })
})

describe('the sample report is gone', () => {
  const NEEDLE = ['[샘플', '모드]'].join(' ')
  const ROOT = join(import.meta.dir, '..', '..')
  const SKIP = new Set(['node_modules', 'out', '.next', '.wrangler'])

  function* sourceFiles(dir: string): Generator<string> {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || SKIP.has(entry.name)) {
        continue
      }
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        yield* sourceFiles(path)
        // Code only. MIGRATION.md quotes the retired string when it records the defect (§11 L3), and a
        // history that cannot name what it removed is not a history.
      } else if (/\.(ts|tsx|json|jsonc)$/.test(entry.name)) {
        yield path
      }
    }
  }

  test('no placeholder body survives anywhere in the app source', () => {
    // This file names the needle in two halves for exactly this reason: the scan would otherwise fail on
    // itself. The killswitch now ships a rules-only report, so a reader can never be shown filler.
    const offenders = [...sourceFiles(ROOT)].filter(
      (path) => !path.endsWith('pipeline.test.ts') && readFileSync(path, 'utf8').includes(NEEDLE),
    )
    expect(offenders).toEqual([])
  })
})
