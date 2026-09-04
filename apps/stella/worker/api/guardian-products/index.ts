import { Hono } from 'hono'
import type { AppEnv } from '../../env'
import { CURRENT_GUARDIAN_MANIFEST } from '../../guardian/manifest'
import { guardianLoveRarityOdds } from '../../guardian/rarity-odds'

export const guardianProducts = new Hono<AppEnv>()

// Public sales metadata only. Payment transition, credit use, and collection reads stay
// outside this route; checkout and paid-question reads use their own mutation/capability boundaries.
guardianProducts.get('/current', (c) => {
  const manifest = CURRENT_GUARDIAN_MANIFEST
  const loveFamilyIds = new Set(manifest.families.filter(({ slot }) => slot === 'love').map(({ id }) => id))
  const lovePools = manifest.editionPools.filter(({ familyId }) => loveFamilyIds.has(familyId))

  return c.json(
    {
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
            rarities: guardianLoveRarityOdds(pool, manifest),
          }
        }),
      },
      guarantee: {
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
      // `/current` includes mutable price and policy data, so it must match the catalog checkout uses now.
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  )
})
