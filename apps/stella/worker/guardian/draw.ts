import {
  CURRENT_GUARDIAN_MANIFEST,
  GUARDIAN_REPORT_SLOTS,
  type GuardianCardEdition,
  type GuardianCardFamily,
  type GuardianContextScoredEditionPool,
  type GuardianContextScoredFamilyPool,
  type GuardianProductManifest,
  type GuardianReportSlot,
  type GuardianSelectionContext,
  type GuardianWeightedEdition,
  guardianEdition,
  guardianEditionPool,
  guardianFamily,
} from './manifest'

const UINT32_RANGE = 2 ** 32

export type GuardianFamilyScorer = (
  family: GuardianCardFamily,
  context: GuardianSelectionContext,
  pool: GuardianContextScoredFamilyPool,
) => number

export type GuardianEditionScorer = (
  edition: GuardianCardEdition,
  context: GuardianSelectionContext,
  pool: GuardianContextScoredEditionPool,
) => number

export interface GuardianSelectedCard {
  slot: GuardianReportSlot
  familyId: string
  editionId: string
  rarity: GuardianCardEdition['rarity']
}

export type GuardianFamilySelection = Record<GuardianReportSlot, string>

export interface GuardianInitialDraw {
  families: GuardianFamilySelection
  cards: GuardianSelectedCard[]
}

export interface GuardianCardDrawSnapshot {
  familySelection: {
    poolId: string | null
    method: 'single' | 'context_scored' | 'retained_report_family'
    candidates: readonly {
      familyId: string
      tieBreakOrder: number | null
    }[]
    selectedFamilyId: string
  }
  editionSelection: {
    poolId: string
    method: 'single' | 'context_scored' | 'weighted_random'
    candidates: readonly {
      editionId: string
      tieBreakOrder: number | null
      weight: number | null
    }[]
    selectedEditionId: string
    weightScale: number | null
  }
  guarantee: {
    paidDrawInterval: number
    scope: 'card_family'
    due: boolean
    applied: boolean
  } | null
}

export interface GuardianRedrawDecision {
  card: GuardianSelectedCard
  guaranteeDue: boolean
  guaranteedUnowned: boolean
  eligibleEditionIds: readonly string[]
}

type RandomInt = (maxExclusive: number) => number

export interface GuardianDrawOptions {
  manifest?: GuardianProductManifest
  familyScorer?: GuardianFamilyScorer
  editionScorer?: GuardianEditionScorer
  randomInt?: RandomInt
}

export function selectGuardianFamilies(
  context: GuardianSelectionContext,
  options: Pick<GuardianDrawOptions, 'familyScorer' | 'manifest'> = {},
): GuardianFamilySelection {
  const manifest = options.manifest ?? CURRENT_GUARDIAN_MANIFEST

  return Object.fromEntries(
    GUARDIAN_REPORT_SLOTS.map((slot) => {
      const pool = manifest.familyPools[slot]
      if (pool.selection === 'single') {
        const selected = pool.candidates[0]
        if (!selected) {
          throw new Error(`Guardian family pool ${pool.id} has no candidate`)
        }
        return [slot, selected.familyId]
      }
      const scorer = options.familyScorer
      if (!scorer) {
        throw new Error(`Guardian family pool ${pool.id} requires a context scorer`)
      }
      const ranked = pool.candidates
        .map((candidate) => ({
          candidate,
          score: scorer(guardianFamily(candidate.familyId, manifest), context, pool),
        }))
        .sort((left, right) => right.score - left.score || left.candidate.tieBreakOrder - right.candidate.tieBreakOrder)
      const selected = ranked[0]
      if (!selected || !Number.isFinite(selected.score)) {
        throw new Error(`Guardian scorer did not produce a finite candidate for ${slot}`)
      }
      return [slot, selected.candidate.familyId]
    }),
  ) as GuardianFamilySelection
}

export function drawInitialGuardianReport(
  context: GuardianSelectionContext,
  options: GuardianDrawOptions = {},
): GuardianInitialDraw {
  const families = selectGuardianFamilies(context, options)
  return { families, cards: drawInitialGuardianCards(context, families, options) }
}

export function drawInitialGuardianCards(
  context: GuardianSelectionContext,
  families: GuardianFamilySelection,
  options: Pick<GuardianDrawOptions, 'editionScorer' | 'manifest' | 'randomInt'> = {},
): GuardianSelectedCard[] {
  const manifest = options.manifest ?? CURRENT_GUARDIAN_MANIFEST
  const randomInt = options.randomInt ?? secureRandomInt

  const cards = GUARDIAN_REPORT_SLOTS.map((slot): GuardianSelectedCard => {
    const family = guardianFamily(families[slot], manifest)
    const pool = guardianEditionPool(family.id, manifest)
    const edition = selectInitialGuardianEdition(context, pool, options.editionScorer, randomInt, manifest)
    return selectedCard(edition)
  })

  return cards
}

export function drawLoveRedraw(
  input: {
    familyId: string
    ownedEditionIds: ReadonlySet<string>
    paidDrawsInCycle: number
    creditKind: 'paid' | 'account_save_reward'
  },
  options: Pick<GuardianDrawOptions, 'manifest' | 'randomInt'> = {},
): GuardianRedrawDecision {
  const manifest = options.manifest ?? CURRENT_GUARDIAN_MANIFEST
  const randomInt = options.randomInt ?? secureRandomInt
  const family = guardianFamily(input.familyId, manifest)
  if (family.slot !== 'love') {
    throw new Error(`Guardian redraw family ${family.id} is not a love-card family`)
  }

  const interval = manifest.guarantee.paidDrawInterval
  if (!Number.isInteger(input.paidDrawsInCycle) || input.paidDrawsInCycle < 0 || input.paidDrawsInCycle >= interval) {
    throw new Error(`Invalid guardian guarantee progress: ${input.paidDrawsInCycle}`)
  }

  const guaranteeDue = input.creditKind === 'account_save_reward' || input.paidDrawsInCycle === interval - 1
  const pool = guardianEditionPool(family.id, manifest)
  if (pool.selection !== 'weighted_random') {
    throw new Error(`Guardian redraw family ${family.id} does not use weighted_random editions`)
  }
  const hasUnowned = pool.candidates.some(({ editionId }) => !input.ownedEditionIds.has(editionId))
  const guaranteedUnowned = guaranteeDue && hasUnowned
  const edition = drawWeightedEdition(pool.candidates, input.ownedEditionIds, guaranteedUnowned, randomInt, manifest)

  return {
    card: selectedCard(edition),
    guaranteeDue,
    guaranteedUnowned,
    eligibleEditionIds: pool.candidates
      .filter(({ editionId }) => !guaranteedUnowned || !input.ownedEditionIds.has(editionId))
      .map(({ editionId }) => editionId),
  }
}

export function guardianCardDrawSnapshot(
  card: GuardianSelectedCard,
  options: {
    manifest?: GuardianProductManifest
    eligibleEditionIds?: readonly string[]
    familySelection?: 'catalog' | 'retained_report_family'
    guarantee?: Pick<GuardianRedrawDecision, 'guaranteeDue' | 'guaranteedUnowned'>
  } = {},
): GuardianCardDrawSnapshot {
  const manifest = options.manifest ?? CURRENT_GUARDIAN_MANIFEST
  const familyPool = manifest.familyPools[card.slot]
  const editionPool = guardianEditionPool(card.familyId, manifest)
  const eligibleEditionIds = options.eligibleEditionIds ? new Set(options.eligibleEditionIds) : null
  const editionCandidates = editionPool.candidates
    .filter((candidate) => !eligibleEditionIds || eligibleEditionIds.has(candidate.editionId))
    .map((candidate) => ({
      editionId: candidate.editionId,
      tieBreakOrder:
        'tieBreakOrder' in candidate && typeof candidate.tieBreakOrder === 'number' ? candidate.tieBreakOrder : null,
      weight: 'weight' in candidate && typeof candidate.weight === 'number' ? candidate.weight : null,
    }))

  return {
    familySelection:
      options.familySelection === 'retained_report_family'
        ? {
            poolId: null,
            method: 'retained_report_family',
            candidates: [{ familyId: card.familyId, tieBreakOrder: null }],
            selectedFamilyId: card.familyId,
          }
        : {
            poolId: familyPool.id,
            method: familyPool.selection,
            candidates: familyPool.candidates.map((candidate) => ({
              familyId: candidate.familyId,
              tieBreakOrder: 'tieBreakOrder' in candidate ? candidate.tieBreakOrder : null,
            })),
            selectedFamilyId: card.familyId,
          },
    editionSelection: {
      poolId: editionPool.id,
      method: editionPool.selection,
      candidates: editionCandidates,
      selectedEditionId: card.editionId,
      weightScale:
        editionPool.selection === 'weighted_random'
          ? editionCandidates.reduce((total, candidate) => total + (candidate.weight ?? 0), 0)
          : null,
    },
    guarantee: options.guarantee
      ? {
          paidDrawInterval: manifest.guarantee.paidDrawInterval,
          scope: manifest.guarantee.scope,
          due: options.guarantee.guaranteeDue,
          applied: options.guarantee.guaranteedUnowned,
        }
      : null,
  }
}

/**
 * Web Crypto plus rejection sampling keeps every integer equally likely. `% totalWeight` alone slightly
 * overweights the first buckets whenever 2^32 is not divisible by the weight total.
 */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > UINT32_RANGE) {
    throw new Error(`Random upper bound must be an integer from 1 to ${UINT32_RANGE}`)
  }

  const limit = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive
  const random = new Uint32Array(1)
  do {
    crypto.getRandomValues(random)
  } while (random[0] >= limit)
  return random[0] % maxExclusive
}

function drawWeightedEdition(
  candidates: readonly GuardianWeightedEdition[],
  ownedEditionIds: ReadonlySet<string>,
  unownedOnly: boolean,
  randomInt: RandomInt,
  manifest: GuardianProductManifest,
): GuardianCardEdition {
  const eligible = candidates.filter(({ editionId }) => !unownedOnly || !ownedEditionIds.has(editionId))
  const selected = weightedCandidate(eligible, randomInt)
  return guardianEdition(selected.editionId, manifest)
}

function selectInitialGuardianEdition(
  context: GuardianSelectionContext,
  pool: ReturnType<typeof guardianEditionPool>,
  scorer: GuardianEditionScorer | undefined,
  randomInt: RandomInt,
  manifest: GuardianProductManifest,
): GuardianCardEdition {
  if (pool.selection === 'single') {
    const selected = pool.candidates[0]
    if (!selected) {
      throw new Error(`Guardian edition pool ${pool.id} has no candidate`)
    }
    return guardianEdition(selected.editionId, manifest)
  }
  if (pool.selection === 'weighted_random') {
    return drawWeightedEdition(pool.candidates, new Set(), false, randomInt, manifest)
  }
  if (!scorer) {
    throw new Error(`Guardian edition pool ${pool.id} requires a context scorer`)
  }

  const ranked = pool.candidates
    .map((candidate) => ({
      candidate,
      score: scorer(guardianEdition(candidate.editionId, manifest), context, pool),
    }))
    .sort((left, right) => right.score - left.score || left.candidate.tieBreakOrder - right.candidate.tieBreakOrder)
  const selected = ranked[0]
  if (!selected || !Number.isFinite(selected.score)) {
    throw new Error(`Guardian edition scorer did not produce a finite candidate for ${pool.familyId}`)
  }
  return guardianEdition(selected.candidate.editionId, manifest)
}

function weightedCandidate(
  candidates: readonly GuardianWeightedEdition[],
  randomInt: RandomInt,
): GuardianWeightedEdition {
  const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0)
  if (totalWeight < 1) {
    throw new Error('Guardian draw has no eligible weighted editions')
  }

  const target = randomInt(totalWeight)
  let cursor = 0
  for (const candidate of candidates) {
    cursor += candidate.weight
    if (target < cursor) {
      return candidate
    }
  }
  throw new Error('Guardian weighted draw did not resolve a candidate')
}

function selectedCard(edition: GuardianCardEdition): GuardianSelectedCard {
  return {
    slot: edition.slot,
    familyId: edition.familyId,
    editionId: edition.id,
    rarity: edition.rarity,
  }
}
