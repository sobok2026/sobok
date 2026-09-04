import {
  GUARDIAN_RARITIES,
  type GuardianEditionPool,
  type GuardianProductManifest,
  type GuardianRarity,
  guardianEdition,
} from './manifest'

export interface GuardianRarityOdds {
  rarity: GuardianRarity
  weight: number
  weightScale: number
}

export function guardianLoveRarityOdds(
  pool: GuardianEditionPool,
  manifest: GuardianProductManifest,
): GuardianRarityOdds[] {
  const family = manifest.families.find(({ id }) => id === pool.familyId)
  if (family?.slot !== 'love' || pool.selection !== 'weighted_random') {
    throw new Error(`Guardian love pool ${pool.id} must use weighted_random selection`)
  }
  if (!Number.isSafeInteger(manifest.weightScale) || manifest.weightScale < 1) {
    throw new Error('Guardian love rarity weight scale must be a positive safe integer')
  }

  const weightByRarity = Object.fromEntries(GUARDIAN_RARITIES.map((rarity) => [rarity, 0])) as Record<
    GuardianRarity,
    number
  >
  let totalWeight = 0
  for (const candidate of pool.candidates) {
    if (!Number.isSafeInteger(candidate.weight) || candidate.weight <= 0) {
      throw new Error(`Guardian love pool ${pool.id} has an invalid candidate weight`)
    }
    const edition = guardianEdition(candidate.editionId, manifest)
    if (edition.familyId !== pool.familyId || edition.slot !== 'love' || edition.rarity === null) {
      throw new Error(`Guardian love pool ${pool.id} contains invalid edition ${candidate.editionId}`)
    }
    weightByRarity[edition.rarity] += candidate.weight
    totalWeight += candidate.weight
  }

  if (totalWeight !== manifest.weightScale) {
    throw new Error(`Guardian love pool ${pool.id} weights must total ${manifest.weightScale}; received ${totalWeight}`)
  }

  return GUARDIAN_RARITIES.map((rarity) => {
    const weight = weightByRarity[rarity]
    if (weight <= 0) {
      throw new Error(`Guardian love pool ${pool.id} has no ${rarity} weight`)
    }
    return { rarity, weight, weightScale: manifest.weightScale }
  })
}
