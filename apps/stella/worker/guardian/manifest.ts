import type { Locale } from '@sobok/domain/locale'
import { z } from 'zod'
import {
  GUARDIAN_CURRENCY,
  GUARDIAN_MARKET,
  GUARDIAN_REPORT_NAME,
  GUARDIAN_REPORT_PRICE,
  GUARDIAN_REPORT_SKU,
} from './offer'
import type { GuardianQuestionnaireAnswerSnapshot, GuardianQuestionnaireSignalSnapshot } from './questionnaire'
import runtimeCatalogSource from './runtime-catalog.generated.json'

export const GUARDIAN_REPORT_SLOTS = ['self', 'love', 'work', 'choice'] as const
export const GUARDIAN_RARITIES = ['orbit', 'nebula', 'eclipse', 'stella'] as const
export const GUARDIAN_PREVIEW_TONES = ['comfort', 'honesty', 'action', 'possibility'] as const
export const GUARDIAN_ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const
export const GUARDIAN_PRODUCT_KINDS = ['full_report', 'love_redraw'] as const
export const GUARDIAN_FULL_REPORT_PRODUCT_SKUS = ['guardian-report-full-v1'] as const
export const GUARDIAN_LOVE_REDRAW_PRODUCT_SKUS = ['guardian-love-redraw-1-v1', 'guardian-love-redraw-5-v1'] as const
export const GUARDIAN_PRODUCT_SKUS = [
  ...GUARDIAN_FULL_REPORT_PRODUCT_SKUS,
  ...GUARDIAN_LOVE_REDRAW_PRODUCT_SKUS,
] as const
export const GUARDIAN_PLANET_IDS = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
  'northNode',
  'southNode',
  'lilith',
  'chiron',
  'fortune',
] as const

export type GuardianReportSlot = (typeof GUARDIAN_REPORT_SLOTS)[number]
export type GuardianRarity = (typeof GUARDIAN_RARITIES)[number]
export type GuardianZodiacSign = (typeof GUARDIAN_ZODIAC_SIGNS)[number]
export type GuardianProductKind = (typeof GUARDIAN_PRODUCT_KINDS)[number]
export type GuardianFullReportProductSku = (typeof GUARDIAN_FULL_REPORT_PRODUCT_SKUS)[number]
export type GuardianLoveRedrawProductSku = (typeof GUARDIAN_LOVE_REDRAW_PRODUCT_SKUS)[number]
export type GuardianProductSku = (typeof GUARDIAN_PRODUCT_SKUS)[number]
export type GuardianPlanetId = (typeof GUARDIAN_PLANET_IDS)[number]

export interface GuardianPlanetPositionSnapshot {
  id: GuardianPlanetId
  lon: number
  retrograde: boolean
}

export interface GuardianChartSnapshot {
  timeKnown: boolean
  planets: readonly GuardianPlanetPositionSnapshot[]
  ascendant: number | null
  midheaven: number | null
  cusps: readonly number[] | null
  moonLongitudeRange: readonly [start: number, end: number] | null
}

export interface GuardianPreviewAnswerSnapshot {
  tone: (typeof GUARDIAN_PREVIEW_TONES)[number]
  movement: 'start' | 'continue' | 'recover' | 'release'
}

export interface GuardianReportInputSnapshot {
  chart: GuardianChartSnapshot
  previewAnswers: GuardianPreviewAnswerSnapshot
}

export interface GuardianSelectionContext extends GuardianReportInputSnapshot {
  paidAnswers: GuardianQuestionnaireAnswerSnapshot
  paidSignals: GuardianQuestionnaireSignalSnapshot
}

export interface GuardianCardFamily {
  id: string
  sign: GuardianZodiacSign
  slot: GuardianReportSlot
  signalAffinities: readonly string[]
}

export interface GuardianCardEdition {
  id: string
  familyId: string
  sign: GuardianZodiacSign
  slot: GuardianReportSlot
  rarity: GuardianRarity | null
  artworkObjectKey: string
  selectionSignals: readonly string[]
  previewTone: GuardianPreviewAnswerSnapshot['tone'] | null
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

export interface GuardianCardCopyKo {
  slot: GuardianReportSlot
  label: '자기이해' | '사랑' | '일' | '결정'
  title: string
  guardians: string
  artworkAlt: string
  oneLineTemplate: string
  reflection: string
}

interface GuardianProductDefinitionBase {
  orderNames: Partial<Record<Locale, string>>
  prices: readonly GuardianPriceDefinition[]
}

export interface GuardianFullReportProductDefinition extends GuardianProductDefinitionBase {
  sku: GuardianFullReportProductSku
  kind: 'full_report'
}

export interface GuardianLoveRedrawProductDefinition extends GuardianProductDefinitionBase {
  sku: GuardianLoveRedrawProductSku
  kind: 'love_redraw'
  redrawCredits: number
}

export type GuardianProductDefinition = GuardianFullReportProductDefinition | GuardianLoveRedrawProductDefinition

export type GuardianPurchaseEntitlementSnapshot =
  | { kind: 'full_report' }
  | { kind: 'love_redraw'; redrawCredits: number }

export interface GuardianProductManifest {
  supportedLocales: readonly Locale[]
  weightScale: number
  guarantee: {
    paidDrawInterval: number
    scope: 'card_family'
  }
  families: readonly GuardianCardFamily[]
  editions: readonly GuardianCardEdition[]
  familyPools: Readonly<Record<GuardianReportSlot, GuardianFamilyPool>>
  editionPools: readonly GuardianEditionPool[]
  products: readonly GuardianProductDefinition[]
}

interface GuardianRuntimeCatalogSource {
  schema: 'stella-guardian-runtime-catalog/v1'
  locale: 'ko'
  sourceHashes: Readonly<Record<string, string>>
  families: readonly GuardianCardFamily[]
  editions: readonly GuardianCardEdition[]
  familyPools: Readonly<Record<GuardianReportSlot, GuardianContextScoredFamilyPool>>
  editionPools: readonly (GuardianContextScoredEditionPool | GuardianWeightedEditionPool)[]
  cardCopyKo: Readonly<Record<string, GuardianCardCopyKo>>
}

const runtimeNonEmptyText = z.string().trim().min(1)
const runtimeContentHash = z.string().regex(/^[a-f0-9]{64}$/)
const runtimeFamilyCandidateSchema = z
  .object({
    familyId: runtimeNonEmptyText,
    tieBreakOrder: z.number().int().min(0).max(11),
  })
  .strict()
const runtimeContextEditionCandidateSchema = z
  .object({
    editionId: runtimeNonEmptyText,
    tieBreakOrder: z.number().int().min(0).max(15),
  })
  .strict()
const runtimeWeightedEditionCandidateSchema = z
  .object({
    editionId: runtimeNonEmptyText,
    weight: z.number().int().positive(),
  })
  .strict()
function runtimeFamilyPoolSchema<const Slot extends GuardianReportSlot>(slot: Slot) {
  return z
    .object({
      id: runtimeNonEmptyText,
      slot: z.literal(slot),
      selection: z.literal('context_scored'),
      candidates: z.array(runtimeFamilyCandidateSchema).length(12),
    })
    .strict()
}
const runtimeCatalogSchema = z
  .object({
    schema: z.literal('stella-guardian-runtime-catalog/v1'),
    locale: z.literal('ko'),
    sourceHashes: z
      .object({
        families: runtimeContentHash,
        selfEditions: runtimeContentHash,
        loveEditions: runtimeContentHash,
        workEditions: runtimeContentHash,
        choiceEditions: runtimeContentHash,
        productionArtBatches: runtimeContentHash,
        productionArtReviews: runtimeContentHash,
        assets: runtimeContentHash,
      })
      .strict(),
    families: z
      .array(
        z
          .object({
            id: runtimeNonEmptyText,
            sign: z.enum(GUARDIAN_ZODIAC_SIGNS),
            slot: z.enum(GUARDIAN_REPORT_SLOTS),
            signalAffinities: z.array(runtimeNonEmptyText).length(2),
            tieBreakOrder: z.number().int().min(0).max(11),
          })
          .strict(),
      )
      .length(48),
    editions: z
      .array(
        z
          .object({
            id: runtimeNonEmptyText,
            familyId: runtimeNonEmptyText,
            sign: z.enum(GUARDIAN_ZODIAC_SIGNS),
            slot: z.enum(GUARDIAN_REPORT_SLOTS),
            rarity: z.enum(GUARDIAN_RARITIES).nullable(),
            artworkObjectKey: runtimeNonEmptyText,
            selectionSignals: z.array(runtimeNonEmptyText).max(2),
            previewTone: z.enum(GUARDIAN_PREVIEW_TONES).nullable(),
          })
          .strict(),
      )
      .length(1_056),
    familyPools: z
      .object({
        self: runtimeFamilyPoolSchema('self'),
        love: runtimeFamilyPoolSchema('love'),
        work: runtimeFamilyPoolSchema('work'),
        choice: runtimeFamilyPoolSchema('choice'),
      })
      .strict(),
    editionPools: z
      .array(
        z.discriminatedUnion('selection', [
          z
            .object({
              id: runtimeNonEmptyText,
              familyId: runtimeNonEmptyText,
              selection: z.literal('context_scored'),
              candidates: z.array(runtimeContextEditionCandidateSchema).length(16),
            })
            .strict(),
          z
            .object({
              id: runtimeNonEmptyText,
              familyId: runtimeNonEmptyText,
              selection: z.literal('weighted_random'),
              candidates: z.array(runtimeWeightedEditionCandidateSchema).length(40),
            })
            .strict(),
        ]),
      )
      .length(48),
    cardCopyKo: z.record(
      runtimeNonEmptyText,
      z
        .object({
          slot: z.enum(GUARDIAN_REPORT_SLOTS),
          label: z.enum(['자기이해', '사랑', '일', '결정']),
          title: runtimeNonEmptyText,
          guardians: runtimeNonEmptyText,
          artworkAlt: runtimeNonEmptyText,
          oneLineTemplate: runtimeNonEmptyText,
          reflection: runtimeNonEmptyText,
        })
        .strict(),
    ),
  })
  .strict()

function parseGuardianRuntimeCatalog(source: unknown): GuardianRuntimeCatalogSource {
  const parsed = runtimeCatalogSchema.safeParse(source)
  if (!parsed.success) {
    const details = parsed.error.issues
      .slice(0, 20)
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('\n- ')
    throw new Error(`Guardian production runtime catalog has an invalid shape:\n- ${details}`)
  }
  return parsed.data
}

const GUARDIAN_RUNTIME_CATALOG = parseGuardianRuntimeCatalog(runtimeCatalogSource)
if (
  GUARDIAN_RUNTIME_CATALOG.schema !== 'stella-guardian-runtime-catalog/v1' ||
  GUARDIAN_RUNTIME_CATALOG.locale !== 'ko' ||
  GUARDIAN_RUNTIME_CATALOG.families.length !== 48 ||
  GUARDIAN_RUNTIME_CATALOG.editions.length !== 1_056 ||
  GUARDIAN_RUNTIME_CATALOG.editionPools.length !== 48 ||
  Object.keys(GUARDIAN_RUNTIME_CATALOG.cardCopyKo).length !== 1_056
) {
  throw new Error('Guardian production runtime catalog is incomplete')
}

export const CURRENT_GUARDIAN_CARD_COPY_KO = GUARDIAN_RUNTIME_CATALOG.cardCopyKo

/**
 * The generated production catalog enumerates only reviewed families, editions and immutable R2 object keys.
 * Selection still uses the original shared pool resolver and every fulfilled result remains snapshot-backed.
 */
export const CURRENT_GUARDIAN_MANIFEST = {
  supportedLocales: ['ko'],
  weightScale: 10_000,
  guarantee: {
    paidDrawInterval: 5,
    scope: 'card_family',
  },
  families: GUARDIAN_RUNTIME_CATALOG.families,
  editions: GUARDIAN_RUNTIME_CATALOG.editions,
  familyPools: GUARDIAN_RUNTIME_CATALOG.familyPools,
  editionPools: GUARDIAN_RUNTIME_CATALOG.editionPools,
  products: [
    {
      sku: GUARDIAN_REPORT_SKU,
      kind: 'full_report',
      orderNames: GUARDIAN_REPORT_NAME,
      prices: [{ market: GUARDIAN_MARKET, currency: GUARDIAN_CURRENCY, amountMinor: GUARDIAN_REPORT_PRICE }],
    },
    {
      sku: 'guardian-love-redraw-1-v1',
      kind: 'love_redraw',
      orderNames: { ko: '별자리 수호령 사랑 카드 1회' },
      prices: [{ market: 'KR', currency: 'KRW', amountMinor: 700 }],
      redrawCredits: 1,
    },
    {
      sku: 'guardian-love-redraw-5-v1',
      kind: 'love_redraw',
      orderNames: { ko: '별자리 수호령 사랑 카드 5회' },
      prices: [{ market: 'KR', currency: 'KRW', amountMinor: 2_500 }],
      redrawCredits: 5,
    },
  ],
} as const satisfies GuardianProductManifest

export function guardianSupportsLocale(
  locale: Locale,
  manifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST,
): boolean {
  return manifest.supportedLocales.includes(locale)
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

export function guardianArtworkUrl(edition: GuardianCardEdition, assetOrigin: string): string {
  const normalizedOrigin = assetOrigin.trim()
  if (!normalizedOrigin) {
    throw new Error('Guardian asset origin is empty')
  }
  if (
    edition.artworkObjectKey.startsWith('/') ||
    edition.artworkObjectKey.includes('\\') ||
    edition.artworkObjectKey.split('/').includes('..')
  ) {
    throw new Error(`Guardian edition ${edition.id} has an unsafe artwork object key`)
  }

  let base: URL
  try {
    base = new URL(normalizedOrigin.endsWith('/') ? normalizedOrigin : `${normalizedOrigin}/`)
  } catch {
    throw new Error('Guardian asset origin is not a valid URL')
  }
  if (
    (base.protocol !== 'https:' && base.protocol !== 'http:') ||
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    base.pathname !== '/'
  ) {
    throw new Error('Guardian asset origin must be a root HTTP(S) origin')
  }
  return new URL(edition.artworkObjectKey, base).toString()
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

export function guardianProductOrderName(
  sku: string,
  locale: Locale,
  manifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST,
): string {
  const orderName = guardianProduct(sku, manifest).orderNames[locale]
  if (!orderName) {
    throw new Error(`Guardian product ${sku} has no order name for locale ${locale}`)
  }
  return orderName
}

function validateGuardianManifest(manifest: GuardianProductManifest): void {
  const familyIds = new Set(manifest.families.map(({ id }) => id))
  const editionIds = new Set(manifest.editions.map(({ id }) => id))
  const artworkObjectKeys = new Set(manifest.editions.map(({ artworkObjectKey }) => artworkObjectKey))
  const productSkus = new Set(manifest.products.map(({ sku }) => sku))
  const supportedLocales = new Set(manifest.supportedLocales)

  if (familyIds.size !== manifest.families.length || editionIds.size !== manifest.editions.length) {
    throw new Error('Guardian manifest contains duplicate family or edition IDs')
  }
  if (artworkObjectKeys.size !== manifest.editions.length) {
    throw new Error('Guardian manifest contains duplicate artwork object keys')
  }
  if (productSkus.size !== manifest.products.length) {
    throw new Error('Guardian manifest contains duplicate product SKUs')
  }
  if (supportedLocales.size === 0 || supportedLocales.size !== manifest.supportedLocales.length) {
    throw new Error('Guardian manifest has no valid supported locale')
  }
  if (!Number.isSafeInteger(manifest.guarantee.paidDrawInterval) || manifest.guarantee.paidDrawInterval < 1) {
    throw new Error('Guardian guarantee interval must be positive')
  }
  if (!Number.isSafeInteger(manifest.weightScale) || manifest.weightScale < 1) {
    throw new Error('Guardian manifest weight scale must be a positive integer')
  }

  for (const family of manifest.families) {
    if (family.id !== `${family.sign}.${family.slot}` || family.signalAffinities.length === 0) {
      throw new Error(`Guardian family ${family.id} has invalid production selection metadata`)
    }
    if (new Set(family.signalAffinities).size !== family.signalAffinities.length) {
      throw new Error(`Guardian family ${family.id} contains duplicate signal affinities`)
    }
  }

  for (const edition of manifest.editions) {
    const family = manifest.families.find(({ id }) => id === edition.familyId)
    if (!family || family.slot !== edition.slot || family.sign !== edition.sign) {
      throw new Error(`Guardian edition ${edition.id} is not attached to its declared family and slot`)
    }
    if (
      !edition.artworkObjectKey.startsWith(`guardian-cards/ko/${edition.id}.`) ||
      !edition.artworkObjectKey.endsWith('.webp') ||
      edition.artworkObjectKey.includes('\\') ||
      edition.artworkObjectKey.split('/').includes('..')
    ) {
      throw new Error(`Guardian edition ${edition.id} has an invalid artwork object key`)
    }
    if (edition.slot === 'love') {
      if (edition.rarity === null || edition.selectionSignals.length !== 0 || edition.previewTone !== null) {
        throw new Error(`Guardian love edition ${edition.id} has invalid weighted selection metadata`)
      }
    } else if (
      edition.rarity !== null ||
      edition.selectionSignals.length !== 2 ||
      edition.previewTone === null ||
      !GUARDIAN_PREVIEW_TONES.includes(edition.previewTone)
    ) {
      throw new Error(`Guardian context edition ${edition.id} has invalid selection metadata`)
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
    const orderNames = Object.values(product.orderNames)
    const orderNameLocales = Object.keys(product.orderNames) as Locale[]
    if (orderNames.length === 0 || orderNames.some((orderName) => !orderName || orderName.length > 128)) {
      throw new Error(`Guardian product ${product.sku} has an invalid order name`)
    }
    if (orderNameLocales.some((locale) => !supportedLocales.has(locale))) {
      throw new Error(`Guardian product ${product.sku} has an unsupported order locale`)
    }
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
  }
}

validateGuardianManifest(CURRENT_GUARDIAN_MANIFEST)
