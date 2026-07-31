import type { Locale } from '@sobok/domain/locale'
import type { GuardianQuestionnaireAnswerSnapshot, GuardianQuestionnaireSignalSnapshot } from './questionnaire'

export const GUARDIAN_REPORT_SLOTS = ['self', 'love', 'work', 'choice'] as const
export const GUARDIAN_RARITIES = ['orbit', 'nebula', 'eclipse', 'stella'] as const
export const GUARDIAN_PRODUCT_KINDS = ['full_report', 'love_redraw'] as const
export const GUARDIAN_FULL_REPORT_PRODUCT_SKUS = ['guardian-report-full-v1'] as const
export const GUARDIAN_LOVE_REDRAW_PRODUCT_SKUS = ['guardian-love-redraw-1-v1', 'guardian-love-redraw-5-v1'] as const
export const GUARDIAN_PRODUCT_SKUS = [
  ...GUARDIAN_FULL_REPORT_PRODUCT_SKUS,
  ...GUARDIAN_LOVE_REDRAW_PRODUCT_SKUS,
] as const

export type GuardianReportSlot = (typeof GUARDIAN_REPORT_SLOTS)[number]
export type GuardianRarity = (typeof GUARDIAN_RARITIES)[number]
export type GuardianProductKind = (typeof GUARDIAN_PRODUCT_KINDS)[number]
export type GuardianFullReportProductSku = (typeof GUARDIAN_FULL_REPORT_PRODUCT_SKUS)[number]
export type GuardianLoveRedrawProductSku = (typeof GUARDIAN_LOVE_REDRAW_PRODUCT_SKUS)[number]
export type GuardianProductSku = (typeof GUARDIAN_PRODUCT_SKUS)[number]

export type GuardianJsonValue =
  | string
  | number
  | boolean
  | null
  | readonly GuardianJsonValue[]
  | { readonly [key: string]: GuardianJsonValue }

export interface GuardianReportInputSnapshot {
  chart: Readonly<Record<string, GuardianJsonValue>>
  previewAnswers: Readonly<Record<string, string>>
}

export interface GuardianSelectionContext extends GuardianReportInputSnapshot {
  paidAnswers: GuardianQuestionnaireAnswerSnapshot
  paidSignals: GuardianQuestionnaireSignalSnapshot
}

export interface GuardianCardFamily {
  id: string
  slot: GuardianReportSlot
}

export interface GuardianCardEdition {
  id: string
  familyId: string
  slot: GuardianReportSlot
  rarity: GuardianRarity | null
  artworkPath: string
  messageKey: string
}

export interface GuardianFamilyCandidate {
  familyId: string
}

export interface GuardianContextScoredFamilyCandidate extends GuardianFamilyCandidate {
  tieBreakOrder: number
}

interface GuardianFamilyPoolBase {
  id: string
  slot: GuardianReportSlot
}

export interface GuardianSingleFamilyPool extends GuardianFamilyPoolBase {
  selection: 'single'
  candidates: readonly GuardianFamilyCandidate[]
}

export interface GuardianContextScoredFamilyPool extends GuardianFamilyPoolBase {
  selection: 'context_scored'
  candidates: readonly GuardianContextScoredFamilyCandidate[]
}

export type GuardianFamilyPool = GuardianSingleFamilyPool | GuardianContextScoredFamilyPool

export interface GuardianEditionCandidate {
  editionId: string
}

export interface GuardianContextScoredEditionCandidate extends GuardianEditionCandidate {
  tieBreakOrder: number
}

export interface GuardianWeightedEdition {
  editionId: string
  weight: number
}

interface GuardianEditionPoolBase {
  id: string
  familyId: string
}

export interface GuardianSingleEditionPool extends GuardianEditionPoolBase {
  selection: 'single'
  candidates: readonly GuardianEditionCandidate[]
}

export interface GuardianContextScoredEditionPool extends GuardianEditionPoolBase {
  selection: 'context_scored'
  candidates: readonly GuardianContextScoredEditionCandidate[]
}

export interface GuardianWeightedEditionPool extends GuardianEditionPoolBase {
  selection: 'weighted_random'
  candidates: readonly GuardianWeightedEdition[]
}

export type GuardianEditionPool =
  | GuardianSingleEditionPool
  | GuardianContextScoredEditionPool
  | GuardianWeightedEditionPool

export interface GuardianPriceDefinition {
  market: string
  currency: string
  amountMinor: number
}

interface GuardianProductDefinitionBase {
  prices: readonly GuardianPriceDefinition[]
}

export interface GuardianFullReportProductDefinition extends GuardianProductDefinitionBase {
  sku: GuardianFullReportProductSku
  kind: 'full_report'
  questionnaireVersions: Partial<Record<Locale, string>>
}

export interface GuardianLoveRedrawProductDefinition extends GuardianProductDefinitionBase {
  sku: GuardianLoveRedrawProductSku
  kind: 'love_redraw'
  redrawCredits: number
}

export type GuardianProductDefinition = GuardianFullReportProductDefinition | GuardianLoveRedrawProductDefinition

export interface GuardianProductManifest {
  manifestVersion: string
  selectionRuleVersion: string
  oddsVersion: string
  copyVersion: string
  renderVersion: string
  weightScale: number
  guarantee: {
    ruleVersion: string
    paidDrawInterval: number
    scope: 'card_family'
  }
  families: readonly GuardianCardFamily[]
  editions: readonly GuardianCardEdition[]
  familyPools: Readonly<Record<GuardianReportSlot, GuardianFamilyPool>>
  editionPools: readonly GuardianEditionPool[]
  products: readonly GuardianProductDefinition[]
}

/**
 * The paid MVP is data, not a separate runtime path. Each base-card pool happens to contain one candidate
 * today; adding candidates and a scorer later keeps the same selection pipeline and persisted snapshot shape.
 *
 * Edition IDs name real assets. Season/outfit/rarity values must never be combined into an edition that was
 * not explicitly published here.
 */
export const CURRENT_GUARDIAN_MANIFEST = {
  manifestVersion: 'guardian-paid-2026-07-31.1',
  selectionRuleVersion: 'guardian-family-selection-v1',
  oddsVersion: 'guardian-love-rarity-v1',
  copyVersion: 'guardian-report-copy-v1',
  renderVersion: 'guardian-card-render-v1',
  weightScale: 10_000,
  guarantee: {
    ruleVersion: 'guardian-unowned-every-5-paid-v1',
    paidDrawInterval: 5,
    scope: 'card_family',
  },
  families: [
    { id: 'cancer.self', slot: 'self' },
    { id: 'aries.love', slot: 'love' },
    { id: 'taurus.work', slot: 'work' },
    { id: 'libra.choice', slot: 'choice' },
  ],
  editions: [
    {
      id: 'cancer.self.base',
      familyId: 'cancer.self',
      slot: 'self',
      rarity: null,
      artworkPath: '/images/zodiac-guardians/cancer-self.webp',
      messageKey: 'cards.cancer.self',
    },
    {
      id: 'aries.love.orbit',
      familyId: 'aries.love',
      slot: 'love',
      rarity: 'orbit',
      artworkPath: '/images/zodiac-guardians/aries-love-orbit.webp',
      messageKey: 'cards.aries.love.orbit',
    },
    {
      id: 'aries.love.nebula',
      familyId: 'aries.love',
      slot: 'love',
      rarity: 'nebula',
      artworkPath: '/images/zodiac-guardians/aries-love-nebula.webp',
      messageKey: 'cards.aries.love.nebula',
    },
    {
      id: 'aries.love.eclipse',
      familyId: 'aries.love',
      slot: 'love',
      rarity: 'eclipse',
      artworkPath: '/images/zodiac-guardians/aries-love-eclipse.webp',
      messageKey: 'cards.aries.love.eclipse',
    },
    {
      id: 'aries.love.stella',
      familyId: 'aries.love',
      slot: 'love',
      rarity: 'stella',
      artworkPath: '/images/zodiac-guardians/aries-love-stella.webp',
      messageKey: 'cards.aries.love.stella',
    },
    {
      id: 'taurus.work.base',
      familyId: 'taurus.work',
      slot: 'work',
      rarity: null,
      artworkPath: '/images/zodiac-guardians/taurus-work.webp',
      messageKey: 'cards.taurus.work',
    },
    {
      id: 'libra.choice.base',
      familyId: 'libra.choice',
      slot: 'choice',
      rarity: null,
      artworkPath: '/images/zodiac-guardians/libra-choice.webp',
      messageKey: 'cards.libra.choice',
    },
  ],
  familyPools: {
    self: {
      id: 'guardian-mvp-self-v1',
      slot: 'self',
      selection: 'single',
      candidates: [{ familyId: 'cancer.self' }],
    },
    love: {
      id: 'guardian-mvp-love-v1',
      slot: 'love',
      selection: 'single',
      candidates: [{ familyId: 'aries.love' }],
    },
    work: {
      id: 'guardian-mvp-work-v1',
      slot: 'work',
      selection: 'single',
      candidates: [{ familyId: 'taurus.work' }],
    },
    choice: {
      id: 'guardian-mvp-choice-v1',
      slot: 'choice',
      selection: 'single',
      candidates: [{ familyId: 'libra.choice' }],
    },
  },
  editionPools: [
    {
      id: 'cancer-self-edition-v1',
      familyId: 'cancer.self',
      selection: 'single',
      candidates: [{ editionId: 'cancer.self.base' }],
    },
    {
      id: 'aries-love-rarity-v1',
      familyId: 'aries.love',
      selection: 'weighted_random',
      candidates: [
        { editionId: 'aries.love.orbit', weight: 5_500 },
        { editionId: 'aries.love.nebula', weight: 3_000 },
        { editionId: 'aries.love.eclipse', weight: 1_200 },
        { editionId: 'aries.love.stella', weight: 300 },
      ],
    },
    {
      id: 'taurus-work-edition-v1',
      familyId: 'taurus.work',
      selection: 'single',
      candidates: [{ editionId: 'taurus.work.base' }],
    },
    {
      id: 'libra-choice-edition-v1',
      familyId: 'libra.choice',
      selection: 'single',
      candidates: [{ editionId: 'libra.choice.base' }],
    },
  ],
  products: [
    {
      sku: 'guardian-report-full-v1',
      kind: 'full_report',
      prices: [{ market: 'KR', currency: 'KRW', amountMinor: 3_900 }],
      questionnaireVersions: {
        ko: 'guardian-paid-ko-mvp-v1',
      },
    },
    {
      sku: 'guardian-love-redraw-1-v1',
      kind: 'love_redraw',
      prices: [{ market: 'KR', currency: 'KRW', amountMinor: 700 }],
      redrawCredits: 1,
    },
    {
      sku: 'guardian-love-redraw-5-v1',
      kind: 'love_redraw',
      prices: [{ market: 'KR', currency: 'KRW', amountMinor: 2_500 }],
      redrawCredits: 5,
    },
  ],
} as const satisfies GuardianProductManifest

// Keep an old manifest registered while any purchase or unused redraw grant references it. Replacing an
// object in place would make a retry produce a different result from the original paid transaction.
const GUARDIAN_PUBLISHED_MANIFESTS: readonly GuardianProductManifest[] = [CURRENT_GUARDIAN_MANIFEST]
const GUARDIAN_MANIFESTS = new Map(
  GUARDIAN_PUBLISHED_MANIFESTS.map((manifest) => [manifest.manifestVersion, manifest] as const),
)

export function guardianManifest(version: string): GuardianProductManifest {
  const manifest = GUARDIAN_MANIFESTS.get(version)
  if (!manifest) {
    throw new Error(`Unknown guardian manifest: ${version}`)
  }
  return manifest
}

export function guardianQuestionnaireVersion(
  sku: GuardianFullReportProductSku,
  locale: Locale,
  manifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST,
): string {
  const product = guardianProduct(sku, manifest)
  if (product.kind !== 'full_report') {
    throw new Error(`Guardian product ${sku} has no questionnaire for locale ${locale}`)
  }
  const version = product.questionnaireVersions[locale]
  if (!version) {
    throw new Error(`Guardian product ${sku} has no questionnaire for locale ${locale}`)
  }
  return version
}

export function guardianFamily(
  familyId: string,
  manifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST,
): GuardianCardFamily {
  const family = manifest.families.find((candidate) => candidate.id === familyId)
  if (!family) {
    throw new Error(`Unknown guardian family: ${familyId}`)
  }
  return family
}

export function guardianEdition(
  editionId: string,
  manifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST,
): GuardianCardEdition {
  const edition = manifest.editions.find((candidate) => candidate.id === editionId)
  if (!edition) {
    throw new Error(`Unknown guardian edition: ${editionId}`)
  }
  return edition
}

export function guardianEditionPool(
  familyId: string,
  manifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST,
): GuardianEditionPool {
  const pool = manifest.editionPools.find((candidate) => candidate.familyId === familyId)
  if (!pool) {
    throw new Error(`Guardian family ${familyId} has no edition pool`)
  }
  return pool
}

export function guardianProduct(
  sku: string,
  manifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST,
): GuardianProductDefinition {
  const product = manifest.products.find((candidate) => candidate.sku === sku)
  if (!product) {
    throw new Error(`Unknown guardian product: ${sku}`)
  }
  return product
}

export function guardianProductPrice(
  sku: string,
  market: string,
  manifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST,
): GuardianPriceDefinition {
  const product = guardianProduct(sku, manifest)
  const price = product.prices.find((candidate) => candidate.market === market)
  if (!price) {
    throw new Error(`Guardian product ${sku} has no price for market ${market}`)
  }
  return price
}

function validateGuardianManifest(manifest: GuardianProductManifest): void {
  const familyIds = new Set(manifest.families.map(({ id }) => id))
  const editionIds = new Set(manifest.editions.map(({ id }) => id))
  const productSkus = new Set(manifest.products.map(({ sku }) => sku))

  if (familyIds.size !== manifest.families.length || editionIds.size !== manifest.editions.length) {
    throw new Error('Guardian manifest contains duplicate family or edition IDs')
  }
  if (productSkus.size !== manifest.products.length) {
    throw new Error('Guardian manifest contains duplicate product SKUs')
  }
  if (!Number.isSafeInteger(manifest.guarantee.paidDrawInterval) || manifest.guarantee.paidDrawInterval < 1) {
    throw new Error('Guardian guarantee interval must be positive')
  }
  if (!Number.isSafeInteger(manifest.weightScale) || manifest.weightScale < 1) {
    throw new Error('Guardian manifest weight scale must be a positive integer')
  }

  for (const edition of manifest.editions) {
    const family = manifest.families.find(({ id }) => id === edition.familyId)
    if (!family || family.slot !== edition.slot) {
      throw new Error(`Guardian edition ${edition.id} is not attached to its declared family and slot`)
    }
  }

  const pooledFamilyIds = new Set<string>()
  for (const slot of GUARDIAN_REPORT_SLOTS) {
    const pool = manifest.familyPools[slot]
    if (pool.slot !== slot || pool.candidates.length === 0) {
      throw new Error(`Guardian family pool ${pool.id} is invalid`)
    }
    if (new Set(pool.candidates.map(({ familyId }) => familyId)).size !== pool.candidates.length) {
      throw new Error(`Guardian family pool ${pool.id} contains duplicate candidates`)
    }
    if (pool.selection === 'single' && pool.candidates.length !== 1) {
      throw new Error(`Guardian single family pool ${pool.id} must contain exactly one candidate`)
    }
    if (pool.selection === 'context_scored') {
      if (new Set(pool.candidates.map(({ tieBreakOrder }) => tieBreakOrder)).size !== pool.candidates.length) {
        throw new Error(`Guardian family pool ${pool.id} contains duplicate tie-break positions`)
      }
      for (const candidate of pool.candidates) {
        if (!Number.isSafeInteger(candidate.tieBreakOrder)) {
          throw new Error(`Guardian family candidate ${candidate.familyId} has an invalid tie-break position`)
        }
      }
    }
    for (const candidate of pool.candidates) {
      const family = manifest.families.find(({ id }) => id === candidate.familyId)
      if (!family || family.slot !== slot) {
        throw new Error(`Guardian family candidate ${candidate.familyId} is invalid for ${slot}`)
      }
      pooledFamilyIds.add(candidate.familyId)
    }
  }
  if (pooledFamilyIds.size !== manifest.families.length) {
    throw new Error('Guardian manifest contains families outside the published family pools')
  }

  const editionPoolIds = new Set(manifest.editionPools.map(({ id }) => id))
  const editionPoolFamilies = new Set(manifest.editionPools.map(({ familyId }) => familyId))
  if (
    editionPoolIds.size !== manifest.editionPools.length ||
    editionPoolFamilies.size !== manifest.editionPools.length
  ) {
    throw new Error('Guardian edition pools contain duplicate IDs or families')
  }
  for (const family of manifest.families) {
    if (!editionPoolFamilies.has(family.id)) {
      throw new Error(`Guardian family ${family.id} has no edition pool`)
    }
  }
  const pooledEditionIds = new Set<string>()
  for (const pool of manifest.editionPools) {
    const family = manifest.families.find(({ id }) => id === pool.familyId)
    if (!family || pool.candidates.length === 0) {
      throw new Error(`Guardian edition pool ${pool.id} has an invalid family`)
    }
    if (new Set(pool.candidates.map(({ editionId }) => editionId)).size !== pool.candidates.length) {
      throw new Error(`Guardian edition pool ${pool.id} contains duplicate editions`)
    }
    if (pool.selection === 'single' && pool.candidates.length !== 1) {
      throw new Error(`Guardian single edition pool ${pool.id} must contain exactly one candidate`)
    }
    if (pool.selection === 'context_scored') {
      if (new Set(pool.candidates.map(({ tieBreakOrder }) => tieBreakOrder)).size !== pool.candidates.length) {
        throw new Error(`Guardian edition pool ${pool.id} contains duplicate tie-break positions`)
      }
      for (const candidate of pool.candidates) {
        if (!Number.isSafeInteger(candidate.tieBreakOrder)) {
          throw new Error(`Guardian edition candidate ${candidate.editionId} has an invalid tie-break position`)
        }
      }
    }
    if (pool.selection === 'weighted_random') {
      const totalWeight = pool.candidates.reduce((sum, candidate) => sum + candidate.weight, 0)
      if (totalWeight !== manifest.weightScale) {
        throw new Error(`Guardian weights in ${pool.id} must total ${manifest.weightScale}; received ${totalWeight}`)
      }
      for (const candidate of pool.candidates) {
        if (!Number.isSafeInteger(candidate.weight) || candidate.weight <= 0) {
          throw new Error(`Guardian edition candidate ${candidate.editionId} has an invalid weight`)
        }
      }
    }
    for (const candidate of pool.candidates) {
      const edition = manifest.editions.find(({ id }) => id === candidate.editionId)
      if (!edition || edition.familyId !== pool.familyId || edition.slot !== family.slot) {
        throw new Error(`Guardian edition candidate ${candidate.editionId} is invalid`)
      }
      if (pooledEditionIds.has(candidate.editionId)) {
        throw new Error(`Guardian edition ${candidate.editionId} belongs to multiple pools`)
      }
      pooledEditionIds.add(candidate.editionId)
    }
    if (family.slot === 'love') {
      if (pool.selection !== 'weighted_random') {
        throw new Error(`Guardian love edition pool ${pool.id} must use weighted_random selection`)
      }
      for (const candidate of pool.candidates) {
        if (guardianEdition(candidate.editionId, manifest).rarity === null) {
          throw new Error(`Guardian love edition ${candidate.editionId} must declare a rarity`)
        }
      }
      for (const rarity of GUARDIAN_RARITIES) {
        if (!pool.candidates.some(({ editionId }) => guardianEdition(editionId, manifest).rarity === rarity)) {
          throw new Error(`Guardian love edition pool ${pool.id} has no ${rarity} edition`)
        }
      }
    }
  }
  if (pooledEditionIds.size !== manifest.editions.length) {
    throw new Error('Guardian manifest contains editions outside the published edition pools')
  }

  for (const product of manifest.products) {
    if (product.prices.length === 0) {
      throw new Error(`Guardian product ${product.sku} has no price`)
    }
    if (new Set(product.prices.map(({ market }) => market)).size !== product.prices.length) {
      throw new Error(`Guardian product ${product.sku} has duplicate market prices`)
    }
    for (const price of product.prices) {
      if (
        !price.market ||
        !/^[A-Z]{3}$/.test(price.currency) ||
        !Number.isSafeInteger(price.amountMinor) ||
        price.amountMinor <= 0
      ) {
        throw new Error(`Guardian product ${product.sku} has an invalid ${price.market} price`)
      }
    }
    if (product.kind === 'love_redraw' && (!Number.isSafeInteger(product.redrawCredits) || product.redrawCredits < 1)) {
      throw new Error(`Guardian redraw product ${product.sku} must grant at least one redraw`)
    }
    if (product.kind === 'full_report' && Object.keys(product.questionnaireVersions).length === 0) {
      throw new Error(`Guardian full-report product ${product.sku} has no questionnaire`)
    }
  }
}

for (const manifest of GUARDIAN_PUBLISHED_MANIFESTS) {
  validateGuardianManifest(manifest)
}
