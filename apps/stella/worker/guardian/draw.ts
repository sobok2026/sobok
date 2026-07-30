import {
  GUARDIAN_MVP_MANIFEST,
  GUARDIAN_REPORT_SLOTS,
  type GuardianCardEdition,
  type GuardianCardFamily,
  type GuardianEditionPool,
  type GuardianFamilyPool,
  type GuardianProductManifest,
  type GuardianReportSlot,
  type GuardianSelectionContext,
  type GuardianWeightedEdition,
  guardianEdition,
  guardianFamily,
} from './manifest'

const UINT32_RANGE = 2 ** 32

export type GuardianFamilyScorer = (
  family: GuardianCardFamily,
  context: GuardianSelectionContext,
  pool: GuardianFamilyPool,
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

export interface GuardianRedrawDecision {
  card: GuardianSelectedCard
  guaranteeDue: boolean
  guaranteedUnowned: boolean
  nextPaidDrawsInCycle: number
}

type RandomInt = (maxExclusive: number) => number

/**
 * The MVP scorer intentionally gives every candidate the same score. Because every current pool contains one
 * candidate, cards are fixed without creating an `if fixedCard` branch. A later chart/answer scorer replaces
 * this function while selection, snapshots, and draw persistence remain unchanged.
 */
export const scoreMvpGuardianFamily: GuardianFamilyScorer = () => 0

export function selectGuardianFamilies(
  context: GuardianSelectionContext,
  scorer: GuardianFamilyScorer = scoreMvpGuardianFamily,
  manifest: GuardianProductManifest = GUARDIAN_MVP_MANIFEST,
): GuardianFamilySelection {
  return Object.fromEntries(
    GUARDIAN_REPORT_SLOTS.map((slot) => {
      const pool = manifest.familyPools[slot]
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
  scorer: GuardianFamilyScorer = scoreMvpGuardianFamily,
  randomInt: RandomInt = secureRandomInt,
  manifest: GuardianProductManifest = GUARDIAN_MVP_MANIFEST,
): GuardianInitialDraw {
  const families = selectGuardianFamilies(context, scorer, manifest)
  return { families, cards: drawInitialGuardianCards(families, randomInt, manifest) }
}

export function drawInitialGuardianCards(
  families: GuardianFamilySelection,
  randomInt: RandomInt = secureRandomInt,
  manifest: GuardianProductManifest = GUARDIAN_MVP_MANIFEST,
): GuardianSelectedCard[] {
  const cards = GUARDIAN_REPORT_SLOTS.map((slot): GuardianSelectedCard => {
    const family = guardianFamily(families[slot], manifest)
    const edition =
      slot === 'love'
        ? drawWeightedLoveEdition(family.id, new Set(), false, randomInt, manifest)
        : guardianEdition(singleEditionId(family), manifest)

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
  randomInt: RandomInt = secureRandomInt,
  manifest: GuardianProductManifest = GUARDIAN_MVP_MANIFEST,
): GuardianRedrawDecision {
  const family = guardianFamily(input.familyId, manifest)
  if (family.slot !== 'love') {
    throw new Error(`Guardian redraw family ${family.id} is not a love-card family`)
  }

  const interval = manifest.guarantee.paidDrawInterval
  if (!Number.isInteger(input.paidDrawsInCycle) || input.paidDrawsInCycle < 0 || input.paidDrawsInCycle >= interval) {
    throw new Error(`Invalid guardian guarantee progress: ${input.paidDrawsInCycle}`)
  }

  const guaranteeDue = input.creditKind === 'account_save_reward' || input.paidDrawsInCycle === interval - 1
  const pool = loveEditionPoolFor(family.id, manifest)
  const hasUnowned = pool.candidates.some(({ editionId }) => !input.ownedEditionIds.has(editionId))
  const guaranteedUnowned = guaranteeDue && hasUnowned
  const edition = drawWeightedLoveEdition(family.id, input.ownedEditionIds, guaranteedUnowned, randomInt, manifest)

  return {
    card: selectedCard(edition),
    guaranteeDue,
    guaranteedUnowned,
    nextPaidDrawsInCycle:
      input.creditKind === 'paid' ? (guaranteeDue ? 0 : input.paidDrawsInCycle + 1) : input.paidDrawsInCycle,
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

function drawWeightedLoveEdition(
  familyId: string,
  ownedEditionIds: ReadonlySet<string>,
  unownedOnly: boolean,
  randomInt: RandomInt,
  manifest: GuardianProductManifest,
): GuardianCardEdition {
  const pool = loveEditionPoolFor(familyId, manifest)
  const candidates = pool.candidates.filter(({ editionId }) => !unownedOnly || !ownedEditionIds.has(editionId))
  const selected = weightedCandidate(candidates, randomInt)
  return guardianEdition(selected.editionId, manifest)
}

function loveEditionPoolFor(familyId: string, manifest: GuardianProductManifest): GuardianEditionPool {
  const pool = manifest.loveEditionPools.find((candidate) => candidate.familyId === familyId)
  if (!pool) {
    throw new Error(`Guardian love family ${familyId} has no published edition pool`)
  }
  return pool
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

function singleEditionId(family: GuardianCardFamily): string {
  if (family.editionIds.length !== 1) {
    throw new Error(`Guardian fixed family ${family.id} must have exactly one published edition`)
  }
  return family.editionIds[0]
}

function selectedCard(edition: GuardianCardEdition): GuardianSelectedCard {
  return {
    slot: edition.slot,
    familyId: edition.familyId,
    editionId: edition.id,
    rarity: edition.rarity,
  }
}
