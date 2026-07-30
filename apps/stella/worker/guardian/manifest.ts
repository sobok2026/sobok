export const GUARDIAN_REPORT_SLOTS = ['self', 'love', 'work', 'choice'] as const
export const GUARDIAN_RARITIES = ['orbit', 'nebula', 'eclipse', 'stella'] as const
export const GUARDIAN_PRODUCT_SKUS = [
  'guardian-report-full-v1',
  'guardian-love-redraw-1-v1',
  'guardian-love-redraw-5-v1',
] as const

export type GuardianReportSlot = (typeof GUARDIAN_REPORT_SLOTS)[number]
export type GuardianRarity = (typeof GUARDIAN_RARITIES)[number]
export type GuardianProductSku = (typeof GUARDIAN_PRODUCT_SKUS)[number]

export type GuardianJsonValue =
  | string
  | number
  | boolean
  | null
  | readonly GuardianJsonValue[]
  | { readonly [key: string]: GuardianJsonValue }

export interface GuardianSelectionContext {
  chart: Readonly<Record<string, GuardianJsonValue>>
  answers: Readonly<Record<string, string>>
}

export interface GuardianCardFamily {
  id: string
  slot: GuardianReportSlot
  editionIds: readonly string[]
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
  tieBreakOrder: number
}

export interface GuardianFamilyPool {
  id: string
  slot: GuardianReportSlot
  candidates: readonly GuardianFamilyCandidate[]
}

export interface GuardianWeightedEdition {
  editionId: string
  weight: number
}

export interface GuardianEditionPool {
  id: string
  familyId: string
  candidates: readonly GuardianWeightedEdition[]
}

export interface GuardianPriceDefinition {
  market: string
  currency: string
  amountMinor: number
}

export interface GuardianProductDefinition {
  sku: GuardianProductSku
  kind: 'full_report' | 'love_redraw'
  prices: readonly GuardianPriceDefinition[]
  redrawCredits: number
}

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
  loveEditionPools: readonly GuardianEditionPool[]
  products: readonly GuardianProductDefinition[]
}

/**
 * The paid MVP is data, not a separate runtime path. Each base-card pool happens to contain one candidate
 * today; adding candidates and a scorer later keeps the same selection pipeline and persisted snapshot shape.
 *
 * Edition IDs name real assets. Season/outfit/rarity values must never be combined into an edition that was
 * not explicitly published here.
 */
export const GUARDIAN_MVP_MANIFEST = {
  manifestVersion: 'guardian-mvp-2026-07-30.1',
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
    { id: 'cancer.self', slot: 'self', editionIds: ['cancer.self.base'] },
    {
      id: 'aries.love',
      slot: 'love',
      editionIds: ['aries.love.orbit', 'aries.love.nebula', 'aries.love.eclipse', 'aries.love.stella'],
    },
    { id: 'taurus.work', slot: 'work', editionIds: ['taurus.work.base'] },
    { id: 'libra.choice', slot: 'choice', editionIds: ['libra.choice.base'] },
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
      candidates: [{ familyId: 'cancer.self', tieBreakOrder: 0 }],
    },
    love: {
      id: 'guardian-mvp-love-v1',
      slot: 'love',
      candidates: [{ familyId: 'aries.love', tieBreakOrder: 0 }],
    },
    work: {
      id: 'guardian-mvp-work-v1',
      slot: 'work',
      candidates: [{ familyId: 'taurus.work', tieBreakOrder: 0 }],
    },
    choice: {
      id: 'guardian-mvp-choice-v1',
      slot: 'choice',
      candidates: [{ familyId: 'libra.choice', tieBreakOrder: 0 }],
    },
  },
  loveEditionPools: [
    {
      id: 'aries-love-rarity-v1',
      familyId: 'aries.love',
      candidates: [
        { editionId: 'aries.love.orbit', weight: 5_500 },
        { editionId: 'aries.love.nebula', weight: 3_000 },
        { editionId: 'aries.love.eclipse', weight: 1_200 },
        { editionId: 'aries.love.stella', weight: 300 },
      ],
    },
  ],
  products: [
    {
      sku: 'guardian-report-full-v1',
      kind: 'full_report',
      prices: [{ market: 'KR', currency: 'KRW', amountMinor: 3_900 }],
      redrawCredits: 0,
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

export type GuardianFamilyId = (typeof GUARDIAN_MVP_MANIFEST.families)[number]['id']
export type GuardianEditionId = (typeof GUARDIAN_MVP_MANIFEST.editions)[number]['id']

// Keep an old manifest registered while any purchase or unused redraw grant references it. Replacing an
// object in place would make a retry produce a different result from the original paid transaction.
const GUARDIAN_PUBLISHED_MANIFESTS: readonly GuardianProductManifest[] = [GUARDIAN_MVP_MANIFEST]
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

export function guardianFamily(
  familyId: string,
  manifest: GuardianProductManifest = GUARDIAN_MVP_MANIFEST,
): GuardianCardFamily {
  const family = manifest.families.find((candidate) => candidate.id === familyId)
  if (!family) {
    throw new Error(`Unknown guardian family: ${familyId}`)
  }
  return family
}

export function guardianEdition(
  editionId: string,
  manifest: GuardianProductManifest = GUARDIAN_MVP_MANIFEST,
): GuardianCardEdition {
  const edition = manifest.editions.find((candidate) => candidate.id === editionId)
  if (!edition) {
    throw new Error(`Unknown guardian edition: ${editionId}`)
  }
  return edition
}

export function guardianProduct(
  sku: string,
  manifest: GuardianProductManifest = GUARDIAN_MVP_MANIFEST,
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
  manifest: GuardianProductManifest = GUARDIAN_MVP_MANIFEST,
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
    if (!family || family.slot !== edition.slot || !family.editionIds.includes(edition.id)) {
      throw new Error(`Guardian edition ${edition.id} is not attached to its declared family and slot`)
    }
  }
  for (const family of manifest.families) {
    if (new Set(family.editionIds).size !== family.editionIds.length || family.editionIds.length === 0) {
      throw new Error(`Guardian family ${family.id} has duplicate or empty edition IDs`)
    }
    for (const editionId of family.editionIds) {
      const edition = manifest.editions.find(({ id }) => id === editionId)
      if (!edition || edition.familyId !== family.id || edition.slot !== family.slot) {
        throw new Error(`Guardian family ${family.id} references invalid edition ${editionId}`)
      }
    }
  }

  for (const slot of GUARDIAN_REPORT_SLOTS) {
    const pool = manifest.familyPools[slot]
    if (pool.slot !== slot || pool.candidates.length === 0) {
      throw new Error(`Guardian family pool ${pool.id} is invalid`)
    }
    if (new Set(pool.candidates.map(({ familyId }) => familyId)).size !== pool.candidates.length) {
      throw new Error(`Guardian family pool ${pool.id} contains duplicate candidates`)
    }
    if (new Set(pool.candidates.map(({ tieBreakOrder }) => tieBreakOrder)).size !== pool.candidates.length) {
      throw new Error(`Guardian family pool ${pool.id} contains duplicate tie-break positions`)
    }
    for (const candidate of pool.candidates) {
      const family = manifest.families.find(({ id }) => id === candidate.familyId)
      if (!family || family.slot !== slot || !Number.isSafeInteger(candidate.tieBreakOrder)) {
        throw new Error(`Guardian family candidate ${candidate.familyId} is invalid for ${slot}`)
      }
    }
  }

  const editionPoolIds = new Set(manifest.loveEditionPools.map(({ id }) => id))
  const editionPoolFamilies = new Set(manifest.loveEditionPools.map(({ familyId }) => familyId))
  if (
    editionPoolIds.size !== manifest.loveEditionPools.length ||
    editionPoolFamilies.size !== manifest.loveEditionPools.length
  ) {
    throw new Error('Guardian love edition pools contain duplicate IDs or families')
  }
  for (const family of manifest.families) {
    if (family.slot === 'love' && !editionPoolFamilies.has(family.id)) {
      throw new Error(`Guardian love family ${family.id} has no edition pool`)
    }
  }
  for (const pool of manifest.loveEditionPools) {
    const family = manifest.families.find(({ id }) => id === pool.familyId)
    if (family?.slot !== 'love' || pool.candidates.length === 0) {
      throw new Error(`Guardian love edition pool ${pool.id} has an invalid family`)
    }
    const loveWeight = pool.candidates.reduce((sum, candidate) => sum + candidate.weight, 0)
    if (loveWeight !== manifest.weightScale) {
      throw new Error(`Guardian love weights in ${pool.id} must total ${manifest.weightScale}; received ${loveWeight}`)
    }
    if (new Set(pool.candidates.map(({ editionId }) => editionId)).size !== pool.candidates.length) {
      throw new Error(`Guardian love edition pool ${pool.id} contains duplicate editions`)
    }
    for (const candidate of pool.candidates) {
      const edition = manifest.editions.find(({ id }) => id === candidate.editionId)
      if (
        edition?.slot !== 'love' ||
        edition.familyId !== pool.familyId ||
        edition.rarity === null ||
        !Number.isSafeInteger(candidate.weight) ||
        candidate.weight <= 0
      ) {
        throw new Error(`Guardian love edition candidate ${candidate.editionId} is invalid`)
      }
    }
    for (const rarity of GUARDIAN_RARITIES) {
      if (!pool.candidates.some(({ editionId }) => guardianEdition(editionId, manifest).rarity === rarity)) {
        throw new Error(`Guardian love edition pool ${pool.id} has no ${rarity} edition`)
      }
    }
  }

  for (const product of manifest.products) {
    if (product.prices.length === 0 || product.redrawCredits < 0) {
      throw new Error(`Guardian product ${product.sku} has an invalid price or credit count`)
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
    if (product.kind === 'full_report' && product.redrawCredits !== 0) {
      throw new Error(`Guardian full-report product ${product.sku} cannot grant redraw credits`)
    }
    if (product.kind === 'love_redraw' && product.redrawCredits < 1) {
      throw new Error(`Guardian redraw product ${product.sku} must grant at least one redraw`)
    }
  }
}

for (const manifest of GUARDIAN_PUBLISHED_MANIFESTS) {
  validateGuardianManifest(manifest)
}
