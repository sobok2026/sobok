import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { ABILITY, ABILITY_DETAIL, COMBO } from '../content/abilities'
import { CLARITY_BANDS_FREE, DRAIN_SPREAD_FREE } from '../content/band-labels.free'
import { BAND_SHIFT_PAID, CLARITY_BANDS_PAID, DRAIN_SPREAD_PAID } from '../content/band-labels.paid'
import { DRAIN_LABELS } from '../content/work-labels.free'
import { ENVIRONMENT_LABELS, INTEREST_LABELS, NEED_LABELS, PURPOSE_LABELS } from '../content/work-labels.paid'
import { WORLD_JOB_CORE, WORLD_JOB_FAMILY } from '../content/world-job'
import { WORLD_JOB_NAMES } from '../content/world-job-names'
import {
  AXES,
  AXIS_POLES,
  type AxisId,
  type FreeAssessmentProfile,
  type FreeAxisScore,
  type FreeWorkProfile,
  GEM_AXES,
  type GemAxisId,
  type GemCode,
  INSTRUMENT_VERSION,
  type InnerCode,
  type ItemAnswer,
  type OptionIndex,
  type TentativeBand,
  TYPE_AXES,
  type TypeAxisId,
  type WorkAnswer,
} from '../model'
import { FREE_LIKERT_ITEMS, FREE_WORK_ITEMS } from '../questionnaire'
import { scoreBaseAssessment } from '../scoring'
import { buildFreeReport } from './free'

const RULES_DIR = dirname(import.meta.path)
const VIBE_ROOT = resolve(RULES_DIR, '../..')

// ---------------------------------------------------------------------------
// CI gate 1 — the free module graph, resolved transitively.
// ---------------------------------------------------------------------------

/**
 * Every in-repo module reachable from `free.ts`, not just its direct imports: a paid table re-exported through
 * an allowed file would pass a one-level check.
 *
 * Alias specifiers are followed too. Matching only `'./…'` left `@deep-type/content/work-labels.paid` outside
 * the closure entirely, so the perimeter could be crossed by writing the import the way the rest of the app
 * already writes it — the gate would stay green while the paid table shipped in the free bundle.
 */
function relativeImportClosure(entry: string): Set<string> {
  const seen = new Set<string>()
  const queue = [entry]

  while (queue.length > 0) {
    const file = queue.pop()
    if (!file || seen.has(file)) {
      continue
    }
    seen.add(file)

    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/(?:from|import)\s*'([^']+)'/g)) {
      const resolved = resolveSpecifier(match[1], dirname(file))
      if (resolved) {
        queue.push(resolved)
      }
    }
  }

  return seen
}

/** The two path aliases `tsconfig.json` declares for this app. Anything else is a package and out of scope. */
const ALIASES: readonly [string, string][] = [
  ['@deep-type/', join(VIBE_ROOT, 'deep-type/')],
  ['@/', join(VIBE_ROOT, 'src/')],
]

function resolveSpecifier(specifier: string | undefined, from: string): string | null {
  if (!specifier) {
    return null
  }
  for (const [prefix, target] of ALIASES) {
    if (specifier.startsWith(prefix)) {
      return resolveModule(target + specifier.slice(prefix.length))
    }
  }
  return specifier.startsWith('.') ? resolveModule(join(from, specifier)) : null
}

function resolveModule(base: string): string {
  return base.endsWith('.ts') ? base : `${base}.ts`
}

const FREE_ENTRY = join(RULES_DIR, 'free.ts')

/** Relative to apps/vibe so a failure names the file rather than a machine-specific absolute path. */
const EXPECTED_CLOSURE = [
  'deep-type/content/abilities.ts',
  'deep-type/content/band-labels.free.ts',
  'deep-type/content/work-labels.free.ts',
  'deep-type/content/world-job-names.ts',
  'deep-type/content/world-job.ts',
  // Facet naming, shared with the paid engine. It carries no copy of its own — it is generic over whichever
  // label table the caller passes — which is what lets the free bundle import it at all.
  'deep-type/facets.ts',
  'deep-type/model.ts',
  'deep-type/rules/free.ts',
]

describe('free bundle perimeter', () => {
  test('the transitive module closure is exactly the allowed set', () => {
    const closure = [...relativeImportClosure(FREE_ENTRY)]
      .map((file) => file.slice(VIBE_ROOT.length + 1))
      .sort((a, b) => a.localeCompare(b))

    expect(closure).toEqual(EXPECTED_CLOSURE)
  })

  test('no paid content table is reachable', () => {
    const closure = [...relativeImportClosure(FREE_ENTRY)]
    const forbidden = ['band-labels.paid', 'work-labels.paid', 'role-families']

    for (const name of forbidden) {
      expect(closure.filter((file) => file.includes(name))).toEqual([])
    }
  })
})

// ---------------------------------------------------------------------------
// CI gate 2 — banned tokens in the free sources themselves.
// ---------------------------------------------------------------------------

/** Non-test sources under `rules/`. Test files are excluded: this file imports the paid tables on purpose. */
function freeRuleSources(): { name: string; source: string }[] {
  return readdirSync(RULES_DIR)
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
    .map((name) => ({ name, source: readFileSync(join(RULES_DIR, name), 'utf8') }))
}

/**
 * Strings only the paid copy modules own. A free source containing one has copied it, imported or not.
 *
 * The free tables are subtracted rather than assumed disjoint. `DRAIN_SPREAD_MEANING` is authored free-side and
 * re-exported by the paid module, and `NEED_LABELS.IMPACT.action` is character-for-character
 * `DRAIN_LABELS.EMPTY.action` — a genuine duplicate across the tiers, which the gate must not read as a leak.
 */
function paidCopyLiterals(): string[] {
  const bands = [CLARITY_BANDS_PAID, DRAIN_SPREAD_PAID, BAND_SHIFT_PAID].flatMap((table) =>
    Object.values(table).flatMap((copy) => [copy.detail, copy.label]),
  )
  const facets = [ENVIRONMENT_LABELS, INTEREST_LABELS, NEED_LABELS, PURPOSE_LABELS].flatMap((table) =>
    Object.values(table).flatMap((label) => [label.action, label.name]),
  )
  const free = new Set([
    ...Object.values(CLARITY_BANDS_FREE).flatMap((copy) => [copy.detail, copy.label]),
    ...Object.values(DRAIN_SPREAD_FREE).flatMap((copy) => [copy.detail, copy.label]),
    ...Object.values(DRAIN_LABELS).flatMap((label) => [label.action, label.name]),
  ])

  return [...new Set([...bands, ...facets])].filter((literal) => !free.has(literal))
}

describe('free sources', () => {
  test('never name the paid five-item ruler', () => {
    // A raw-text scan, which is why `free.ts` may not mention the token even in a comment. An AST walk would
    // let prose through, and prose is exactly how a reference gets reintroduced by the next editor.
    for (const { name, source } of freeRuleSources()) {
      expect([name, source.includes('band5')]).toEqual([name, false])
    }
  })

  test('never import a paid content module', () => {
    for (const { name, source } of freeRuleSources()) {
      const specifiers = [...source.matchAll(/from\s*'([^']+)'/g)].map((match) => match[1] ?? '')
      const paid = specifiers.filter((specifier) => /paid|role-families/.test(specifier))
      expect([name, paid]).toEqual([name, []])
    }
  })

  test('never inline a paid copy string', () => {
    const literals = paidCopyLiterals()
    for (const { name, source } of freeRuleSources()) {
      const copied = literals.filter((literal) => source.includes(literal))
      expect([name, copied]).toEqual([name, []])
    }
  })
})

// ---------------------------------------------------------------------------
// Content invariants the engine's totality rests on.
// ---------------------------------------------------------------------------

const ABILITY_SLUGS = new Set(Object.keys(ABILITY_DETAIL))

describe('strength tables', () => {
  test('every axis declares exactly its two poles, in AXIS_POLES order', () => {
    for (const axis of AXES) {
      expect(Object.keys(ABILITY[axis])).toEqual([...AXIS_POLES[axis]])
    }
  })

  test('every combo declares the four cells its two axes can produce', () => {
    for (const pair of COMBO) {
      const [firstA, secondA] = AXIS_POLES[pair.a]
      const [firstB, secondB] = AXIS_POLES[pair.b]
      const cells = [`${firstA}${firstB}`, `${firstA}${secondB}`, `${secondA}${firstB}`, `${secondA}${secondB}`]
      expect(Object.keys(pair.n).sort()).toEqual(cells.sort())
    }
  })

  test('ABILITY_DETAIL covers all 32 slugs and nothing else', () => {
    const single = AXES.flatMap((axis) => Object.values(ABILITY[axis]))
    const combo = COMBO.flatMap((pair) => Object.values(pair.n))

    expect(single.length).toBe(16)
    expect(combo.length).toBe(16)
    expect(new Set([...single, ...combo]).size).toBe(32)
    expect(ABILITY_SLUGS.size).toBe(32)
    for (const slug of [...single, ...combo]) {
      expect(ABILITY_SLUGS.has(slug)).toBe(true)
    }
  })

  test('the 256 world-job names are complete and distinct', () => {
    const keys = Object.keys(WORLD_JOB_NAMES)
    const values = Object.values(WORLD_JOB_NAMES)

    expect(keys.length).toBe(256)
    expect(new Set(values).size).toBe(256)
    for (const inner of Object.keys(WORLD_JOB_FAMILY)) {
      for (const gem of Object.keys(WORLD_JOB_CORE)) {
        expect(keys).toContain(`${inner}_${gem}`)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Profile fixtures.
// ---------------------------------------------------------------------------

const BAND_ORDER = ['faint3', 'moderate3', 'distinct3'] as const satisfies readonly TentativeBand[]
/** (pole index, band index) flattened. Six per axis, which is the full state space one axis can present. */
const AXIS_STATES = 6

function stateBand(state: number): TentativeBand {
  return BAND_ORDER[Math.floor(state / 2)] ?? 'faint3'
}

function stateLetter(axis: AxisId, state: number): string {
  return AXIS_POLES[axis][state % 2]
}

// Numbers no engine path reads: `buildFreeReport` consumes `band3` and the frozen code letters only. Filling
// them with a fixed placeholder keeps the sweep honest — if the engine ever starts reading `lean` or `score`,
// the equivalence test against real scoring below fails rather than passing on fabricated agreement.
function axisScoreFor(band3: TentativeBand): FreeAxisScore {
  return { answered: 3, band3, firstShare: 50, lean: 0, pole: null, score: 0, secondShare: 50 }
}

const FLAT_DRAIN: FreeWorkProfile = {
  drain: {
    counts: { BREAK: 2, EMPTY: 0, OVERLOAD: 0, STUCK: 0, TENSION: 0, VAGUE: 1 },
    exposure: 2,
    leaders: ['BREAK'],
    separation: 1,
    spread: 'double',
  },
  scope: 'free',
}

function profileFor(states: readonly number[], work: FreeWorkProfile = FLAT_DRAIN): FreeAssessmentProfile {
  const innerAxes = {} as Record<TypeAxisId, FreeAxisScore>
  const gemAxes = {} as Record<GemAxisId, FreeAxisScore>
  let inner = ''
  let gem = ''

  TYPE_AXES.forEach((axis, index) => {
    const state = states[index] ?? 0
    innerAxes[axis] = axisScoreFor(stateBand(state))
    inner += stateLetter(axis, state)
  })
  GEM_AXES.forEach((axis, index) => {
    const state = states[index + TYPE_AXES.length] ?? 0
    gemAxes[axis] = axisScoreFor(stateBand(state))
    gem += stateLetter(axis, state)
  })

  return {
    gem: { axes: gemAxes, code: gem as GemCode },
    inner: { axes: innerAxes, code: inner as InnerCode },
    instrumentVersion: INSTRUMENT_VERSION,
    personaSource: 'unknown',
    tier: 'free',
    work,
  }
}

function decodeStates(index: number): number[] {
  const states: number[] = []
  let rest = index
  for (let position = 0; position < AXES.length; position++) {
    states.push(rest % AXIS_STATES)
    rest = Math.floor(rest / AXIS_STATES)
  }
  return states
}

const TOTAL_STATE_VECTORS = AXIS_STATES ** AXES.length

// Precomputed so the 6^8 loops below stay inside the default test timeout: the low four base-6 digits of a
// vector index are the inner code and the high four are the gem code, 6^4 = 1,296 each.
const QUAD_VECTORS = AXIS_STATES ** 4

function codesForQuad(axes: readonly AxisId[]): string[] {
  return Array.from({ length: QUAD_VECTORS }, (_, quad) =>
    axes.map((axis, position) => stateLetter(axis, Math.floor(quad / AXIS_STATES ** position) % AXIS_STATES)).join(''),
  )
}

const INNER_CODES = codesForQuad(TYPE_AXES)
const GEM_CODES = codesForQuad(GEM_AXES)
const AXIS_POSITION = Object.fromEntries(AXES.map((axis, position) => [axis, position])) as Record<AxisId, number>
const COMBO_CELLS = new Map<string, Readonly<Record<string, string>>>(
  COMBO.map((pair) => [`${pair.a}|${pair.b}`, pair.n]),
)

// ---------------------------------------------------------------------------
// Exhaustive sweep over the axis half of the input space.
// ---------------------------------------------------------------------------

describe('exhaustive axis sweep', () => {
  /**
   * 6^8 = 1,679,616 vectors: every (pole, band) assignment the eight axes can present, which is the complete
   * axis-side input space and covers all 256 codes 6,561 times over. The drain tally is held fixed here and
   * swept separately below; the factorization test that follows is what makes the two sweeps add up to full
   * coverage rather than to two partial ones.
   */
  test('produces a complete report for every state vector', () => {
    const failures: string[] = []
    const bands: TentativeBand[] = []
    let cardless = 0
    let bandMismatch = 0

    for (let index = 0; index < TOTAL_STATE_VECTORS; index++) {
      const states = decodeStates(index)
      const report = buildFreeReport(profileFor(states))
      // Both codes are rebuilt from the state vector rather than read back off the report, so a card that is
      // internally consistent but attached to the wrong code still fails.
      const inner = INNER_CODES[index % QUAD_VECTORS] ?? ''
      const gem = GEM_CODES[Math.floor(index / QUAD_VECTORS)] ?? ''

      if (report.worldJob.codes.inner !== inner || report.worldJob.codes.gem !== gem) {
        failures.push(`codes ${index}`)
      }
      if (report.worldJob.name !== WORLD_JOB_NAMES[`${inner}_${gem}` as keyof typeof WORLD_JOB_NAMES]) {
        failures.push(`world job ${index}`)
      }
      if (report.worldJob.family !== WORLD_JOB_FAMILY[inner as keyof typeof WORLD_JOB_FAMILY]) {
        failures.push(`family ${index}`)
      }
      if (report.worldJob.core !== WORLD_JOB_CORE[gem as keyof typeof WORLD_JOB_CORE]) {
        failures.push(`core ${index}`)
      }
      if (report.axes.inner.length !== 4 || report.axes.gem.length !== 4) {
        failures.push(`axes ${index}`)
      }

      let strengthAxes = 0
      let distinctAxes = 0
      states.forEach((state, position) => {
        const band = stateBand(state)
        bands[position] = band
        if (band !== 'faint3') {
          strengthAxes += 1
        }
        if (band === 'distinct3') {
          distinctAxes += 1
        }
      })
      const axisCards = report.strengthCards.axis
      if (axisCards.distinct3.length + axisCards.moderate3.length !== strengthAxes) {
        failures.push(`axis cards ${index}`)
      }
      if (axisCards.distinct3.length !== distinctAxes) {
        bandMismatch += 1
      }

      // Each axis block reports the letter that is actually in the code at that position. Without this the
      // whole sweep survives a pole inversion: every downstream lookup still resolves, just to the other pole.
      for (let position = 0; position < TYPE_AXES.length; position++) {
        if (report.axes.inner[position]?.leading !== inner[position]) {
          failures.push(`leading inner ${index} ${position}`)
        }
        if (report.axes.gem[position]?.leading !== gem[position]) {
          failures.push(`leading gem ${index} ${position}`)
        }
      }

      const combos = report.strengthCards.combo
      // A combo needs both parents past faint, and a distinct combo needs both parents distinct — `min(A, B)`
      // stated as a count and a membership rule rather than recomputed with the engine's own comparison.
      let expectedCombos = 0
      for (const pair of COMBO) {
        if (bands[AXIS_POSITION[pair.a]] !== 'faint3' && bands[AXIS_POSITION[pair.b]] !== 'faint3') {
          expectedCombos += 1
        }
      }
      if (combos.distinct3.length + combos.moderate3.length !== expectedCombos) {
        failures.push(`combo count ${index}`)
      }
      for (const card of combos.distinct3) {
        if (card.axes.some((axis) => bands[AXIS_POSITION[axis]] !== 'distinct3')) {
          failures.push(`combo band ${index} ${card.slug}`)
        }
      }

      const cards = [...axisCards.distinct3, ...axisCards.moderate3, ...combos.distinct3, ...combos.moderate3]
      if (cards.length === 0) {
        cardless += 1
      }
      const slugs = new Set<string>()
      for (const card of cards) {
        slugs.add(card.slug)
        if (!ABILITY_SLUGS.has(card.slug) || card.copy !== ABILITY_DETAIL[card.slug]) {
          failures.push(`slug ${index} ${card.slug}`)
        }
        if (card.axes.length !== card.poles.length) {
          failures.push(`poles ${index} ${card.slug}`)
        }
        for (let position = 0; position < card.axes.length; position++) {
          const axis = card.axes[position]!
          const offset = AXIS_POSITION[axis]
          const letter = offset < 4 ? inner[offset] : gem[offset - 4]
          if (card.poles[position] !== letter) {
            failures.push(`card poles ${index} ${card.slug}`)
          }
        }
        // The cell the frozen letters name, resolved from the table rather than from the engine's own key.
        if (card.axes.length === 1) {
          const poles: Readonly<Record<string, string>> = ABILITY[card.axes[0]!]
          if (poles[card.poles[0] ?? ''] !== card.slug) {
            failures.push(`ability cell ${index} ${card.slug}`)
          }
        } else {
          const cells = COMBO_CELLS.get(`${card.axes[0]}|${card.axes[1]}`)
          if (cells?.[card.poles.join('')] !== card.slug) {
            failures.push(`combo cell ${index} ${card.slug}`)
          }
        }
      }
      if (slugs.size !== cards.length) {
        failures.push(`duplicate ${index}`)
      }
    }

    expect(failures.slice(0, 5)).toEqual([])
    expect(bandMismatch).toBe(0)
    // Only the all-faint vectors: 2 poles x 1 band per axis, so 2^8 of 6^8. Asserted rather than tolerated —
    // a renderer has to have an empty-state for the strength block, and this is the size of the case.
    expect(cardless).toBe(2 ** AXES.length)
  }, 60_000)

  test('no emitted string belongs to the paid copy tables', () => {
    // Enumerated over the generators of the output rather than over 6^8: every string the engine can emit comes
    // from one axis state, one combo state, one code pair or one drain tally, so their union is the full range.
    const emitted = new Set<string>()
    const collect = (value: unknown) => {
      if (typeof value === 'string') {
        emitted.add(value)
      } else if (Array.isArray(value)) {
        value.forEach(collect)
      } else if (value && typeof value === 'object') {
        Object.values(value).forEach(collect)
      }
    }

    for (let axisIndex = 0; axisIndex < AXES.length; axisIndex++) {
      for (let state = 0; state < AXIS_STATES; state++) {
        const uniform = AXES.map((_, position) => (position === axisIndex ? state : 5))
        collect(buildFreeReport(profileFor(uniform)))
      }
    }
    for (let index = 0; index < TOTAL_STATE_VECTORS; index += 4801) {
      collect(buildFreeReport(profileFor(decodeStates(index))))
    }
    for (const work of allFreeWorkProfiles()) {
      collect(buildFreeReport(profileFor([5, 5, 5, 5, 5, 5, 5, 5], work)))
    }

    const leaked = paidCopyLiterals().filter((literal) => emitted.has(literal))
    expect(leaked).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// The drain half, swept over real answers.
// ---------------------------------------------------------------------------

function allFreeWorkProfiles(): FreeWorkProfile[] {
  const profiles: FreeWorkProfile[] = []
  const patterns = 4 ** FREE_WORK_ITEMS.length

  for (let pattern = 0; pattern < patterns; pattern++) {
    const answers: WorkAnswer[] = FREE_WORK_ITEMS.map((item, index) => ({
      itemId: item.id,
      optionIndex: (Math.floor(pattern / 4 ** index) % 4) as OptionIndex,
    }))
    profiles.push(scoreBaseAssessment(FLAT_ANSWERS, answers, null).work)
  }

  return profiles
}

describe('drain signature', () => {
  test('covers all 64 free work answer patterns without a narrowing claim', () => {
    const spreads = new Set<string>()

    for (const work of allFreeWorkProfiles()) {
      const report = buildFreeReport(profileFor([0, 0, 0, 0, 0, 0, 0, 0], work))
      const signature = report.drainSignature

      // Sized by the band, not by the tied set. `double` shows two and `triple` shows three so the true
      // leader stays inside the list the copy talks about; `work.drain.leaders` holds only the facets that
      // tie for top, which is a single facet in every reachable `double` vector.
      expect(signature.leaders.length).toBe(work.drain.spread === 'double' ? 2 : 3)
      // Whatever ties for top must be inside the shown set — that is the property the band buys.
      for (const leader of work.drain.leaders) {
        expect(signature.leaders.map((shown) => shown.id)).toContain(leader)
      }
      // Shown in descending count order, ties on declaration order.
      const shownCounts = signature.leaders.map((leader) => work.drain.counts[leader.id])
      expect([...shownCounts].sort((a, b) => b - a)).toEqual(shownCounts)
      for (const leader of signature.leaders) {
        expect(leader.label).toBe(DRAIN_LABELS[leader.id].name)
        expect(leader.action).toBe(DRAIN_LABELS[leader.id].action)
      }
      expect(signature.spread).toBe(DRAIN_SPREAD_FREE[work.drain.spread])
      spreads.add(work.drain.spread)
    }

    // `single` is structurally unreachable at exposure 2 and its copy lives only in the paid module, so the
    // free path can never render a narrowing claim. Both reachable spreads do occur.
    expect([...spreads].sort()).toEqual(['double', 'triple'])
  })
})

// ---------------------------------------------------------------------------
// Factorization: the two sweeps above compose.
// ---------------------------------------------------------------------------

describe('block independence', () => {
  test('the drain block ignores the axes and the axis blocks ignore the drain', () => {
    const works = allFreeWorkProfiles()
    const vectors = [0, 285941, 794531, 1_679_615].map(decodeStates)
    const baseline = buildFreeReport(profileFor(vectors[0]!, works[0]!))

    for (const work of works) {
      for (const states of vectors) {
        const report = buildFreeReport(profileFor(states, work))
        expect(report.drainSignature).toEqual(buildFreeReport(profileFor(vectors[0]!, work)).drainSignature)
        expect(report.worldJob).toEqual(buildFreeReport(profileFor(states, works[0]!)).worldJob)
        expect(report.strengthCards).toEqual(buildFreeReport(profileFor(states, works[0]!)).strengthCards)
      }
    }

    expect(baseline.clarityNote).toBe(buildFreeReport(profileFor(vectors[3]!, works[63]!)).clarityNote)
  })
})

// ---------------------------------------------------------------------------
// The fabricated profiles stand in for real ones.
// ---------------------------------------------------------------------------

const AGREEMENT_SCORE = { 1: -3, 2: -1, 3: 1, 4: 3 } as const

const AGREEMENT_BY_STATE = buildAgreementTable()

/**
 * For each axis and each of its six states, a real three-answer pattern that scores to it. Found by brute force
 * over the 64 patterns rather than hand-written, so a change to the item bank's reverse keying re-derives
 * instead of silently mismatching.
 */
function buildAgreementTable(): Map<string, ItemAnswer[]> {
  const table = new Map<string, ItemAnswer[]>()

  for (const axis of AXES) {
    const items = FREE_LIKERT_ITEMS.filter((item) => item.axis === axis)
    for (let state = 0; state < AXIS_STATES; state++) {
      for (let pattern = 0; pattern < 64; pattern++) {
        const answers = items.map((item, index) => ({
          itemId: item.id,
          value: ((Math.floor(pattern / 4 ** index) % 4) + 1) as ItemAnswer['value'],
        }))
        if (matchesState(axis, answers, state)) {
          table.set(`${axis}:${state}`, answers)
          break
        }
      }
    }
  }

  return table
}

function matchesState(axis: AxisId, answers: readonly ItemAnswer[], state: number): boolean {
  const items = FREE_LIKERT_ITEMS.filter((item) => item.axis === axis)
  const total = items.reduce((sum, item, index) => {
    const value = AGREEMENT_SCORE[answers[index]!.value]
    return sum + (item.reverse ? -value : value)
  }, 0)
  const magnitude = Math.abs(total)
  const band: TentativeBand = magnitude >= 5 ? 'distinct3' : magnitude === 3 ? 'moderate3' : 'faint3'
  const letter = total > 0 ? AXIS_POLES[axis][0] : AXIS_POLES[axis][1]

  return band === stateBand(state) && letter === stateLetter(axis, state)
}

const FLAT_ANSWERS: ItemAnswer[] = FREE_LIKERT_ITEMS.map((item) => ({ itemId: item.id, value: 4 }))

function realAnswersFor(states: readonly number[]): ItemAnswer[] {
  return AXES.flatMap((axis, position) => AGREEMENT_BY_STATE.get(`${axis}:${states[position] ?? 0}`) ?? [])
}

describe('real scoring conformance', () => {
  test('every axis can actually reach all six states', () => {
    expect(AGREEMENT_BY_STATE.size).toBe(AXES.length * AXIS_STATES)
  })

  test('scored profiles agree with the fabricated ones', () => {
    // 4^24 real answer sets cannot be enumerated, so the sweep above runs on fabricated profiles. This is the
    // bridge: on a deterministic sample, the report built from real `scoreBaseAssessment` output is byte-equal
    // to the report built from the fabricated stand-in for the same state vector.
    const work = FREE_WORK_ITEMS.map((item, index) => ({
      itemId: item.id,
      optionIndex: (index % 4) as OptionIndex,
    }))
    let checked = 0

    for (let index = 0; index < TOTAL_STATE_VECTORS; index += 577) {
      const states = decodeStates(index)
      const scored = scoreBaseAssessment(realAnswersFor(states), work, null)
      const fabricated = profileFor(states, scored.work)

      expect(scored.inner.code).toBe(fabricated.inner.code)
      expect(scored.gem.code).toBe(fabricated.gem.code)
      expect(buildFreeReport(scored)).toEqual(buildFreeReport(fabricated))
      checked += 1
    }

    expect(checked).toBe(2911)
  })

  test('a scored free axis never ties, so the world job is always one card', () => {
    for (let index = 0; index < TOTAL_STATE_VECTORS; index += 4801) {
      const states = decodeStates(index)
      const scored = scoreBaseAssessment(realAnswersFor(states), FREE_WORK, null)
      for (const axis of TYPE_AXES) {
        expect(scored.inner.axes[axis].pole).not.toBeNull()
      }
      for (const axis of GEM_AXES) {
        expect(scored.gem.axes[axis].pole).not.toBeNull()
      }
      expect(buildFreeReport(scored).worldJob.name.length).toBeGreaterThan(0)
    }
  })
})

const FREE_WORK: WorkAnswer[] = FREE_WORK_ITEMS.map((item) => ({ itemId: item.id, optionIndex: 0 }))

describe('band copy', () => {
  test('every axis carries the free ruler and every card carries its own band', () => {
    for (let index = 0; index < TOTAL_STATE_VECTORS; index += 1777) {
      const report = buildFreeReport(profileFor(decodeStates(index)))
      for (const entry of [...report.axes.inner, ...report.axes.gem]) {
        expect(entry.band).toBe(CLARITY_BANDS_FREE[entry.band3])
        expect((AXIS_POLES[entry.id] as readonly string[]).includes(entry.leading)).toBe(true)
      }
      for (const card of report.strengthCards.axis.distinct3) {
        expect(card.band).toBe(CLARITY_BANDS_FREE.distinct3)
      }
      for (const card of report.strengthCards.axis.moderate3) {
        expect(card.band).toBe(CLARITY_BANDS_FREE.moderate3)
      }
    }
  })
})
