import { Hono } from 'hono'
import type { AppEnv } from '../../env'
import { CURRENT_GUARDIAN_MANIFEST, guardianEdition } from '../../guardian/manifest'

export const guardianProducts = new Hono<AppEnv>()

// Public, immutable-by-version sales metadata only. Purchase creation, payment transition, credit use, and
// collection reads stay unexposed until PortOne verification and Stella account/guest capabilities are wired.
guardianProducts.get('/current', (c) => {
  const manifest = CURRENT_GUARDIAN_MANIFEST
  const loveFamilyIds = new Set(manifest.families.filter(({ slot }) => slot === 'love').map(({ id }) => id))
  const lovePools = manifest.editionPools.filter(({ familyId }) => loveFamilyIds.has(familyId))

  return c.json(
    {
      manifestVersion: manifest.manifestVersion,
      selectionRuleVersion: manifest.selectionRuleVersion,
      oddsVersion: manifest.oddsVersion,
      products: manifest.products.map((product) =>
        product.kind === 'full_report'
          ? {
              sku: product.sku,
              kind: product.kind,
              prices: product.prices,
            }
          : {
              sku: product.sku,
              kind: product.kind,
              prices: product.prices,
              redrawCredits: product.redrawCredits,
            },
      ),
      loveDraw: {
        pools: lovePools.map((pool) => {
          if (pool.selection !== 'weighted_random') {
            throw new Error(`Guardian love pool ${pool.id} must expose weighted odds`)
          }
          return {
            familyId: pool.familyId,
            rarities: pool.candidates.map((candidate) => {
              const edition = guardianEdition(candidate.editionId, manifest)
              return {
                rarity: edition.rarity,
                weight: candidate.weight,
                weightScale: manifest.weightScale,
              }
            }),
          }
        }),
      },
      guarantee: {
        ruleVersion: manifest.guarantee.ruleVersion,
        paidDrawInterval: manifest.guarantee.paidDrawInterval,
        scope: manifest.guarantee.scope,
        unownedWhenAvailable: true,
        initialReportCountsTowardProgress: false,
        accountSaveReward: {
          credits: 1,
          guaranteedUnownedWhenAvailable: true,
          countsTowardPaidProgress: false,
        },
      },
    },
    200,
    {
      // `/current` is a mutable pointer and includes price. A version-addressed catalog endpoint may be
      // immutable later; this pointer must not show an old price while checkout uses a new manifest.
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  )
})
