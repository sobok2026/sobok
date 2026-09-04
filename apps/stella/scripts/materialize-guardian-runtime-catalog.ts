import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { z } from 'zod'
import { type ReleaseManifest, readReleaseManifest } from './guardian-card-art'

const SIGNS = [
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
const SLOTS = ['self', 'love', 'work', 'choice'] as const
const RARITIES = ['orbit', 'nebula', 'eclipse', 'stella'] as const
const PREVIEW_TONES = ['comfort', 'honesty', 'action', 'possibility'] as const
const LOVE_THEMES = [
  'first-signal',
  'careful-approach',
  'everyday-care',
  'honest-conversation',
  'shared-play',
  'boundary-and-space',
  'distance-and-return',
  'repair',
  'mutual-growth',
  'future-promise',
] as const
const LOVE_TONE_BY_THEME = {
  'first-signal': 'honesty',
  'careful-approach': 'action',
  'everyday-care': 'comfort',
  'honest-conversation': 'honesty',
  'shared-play': 'action',
  'boundary-and-space': 'honesty',
  'distance-and-return': 'comfort',
  repair: 'comfort',
  'mutual-growth': 'possibility',
  'future-promise': 'possibility',
} as const satisfies Record<(typeof LOVE_THEMES)[number], (typeof PREVIEW_TONES)[number]>
const SOURCE_HASH_KEYS = [
  'families',
  'selfEditions',
  'loveEditions',
  'workEditions',
  'choiceEditions',
  'productionArtBatches',
  'productionArtReviews',
  'assets',
] as const
const COPY_LABEL_BY_SLOT = {
  self: '자기이해',
  love: '사랑',
  work: '일',
  choice: '결정',
} as const
const FOCUS_TOKEN_PATTERN = /\{focus(?::(?:을|가|은))?\}/g
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

type Slot = (typeof SLOTS)[number]

const nonEmptyText = z.string().trim().min(1)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const contentId = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/)

const familySourceSchema = z
  .object({
    status: z.literal('authoring'),
    locale: z.literal('ko'),
    families: z
      .array(
        z
          .object({
            id: contentId,
            sign: z.enum(SIGNS),
            slot: z.enum(SLOTS),
            editionSignalAffinities: z.array(nonEmptyText).length(2),
          })
          .passthrough(),
      )
      .length(48),
  })
  .passthrough()

const editionSchema = z
  .object({
    id: contentId,
    familyId: contentId,
    sign: z.enum(SIGNS),
    slot: z.enum(SLOTS),
    rarity: z.enum(RARITIES).nullable(),
    editorialStatus: z.literal('draft'),
    assetStatus: z.literal('not_started'),
    artworkPath: z.null(),
    title: nonEmptyText,
    guardians: nonEmptyText,
    scene: nonEmptyText,
    artworkAlt: nonEmptyText,
    oneLineTemplate: nonEmptyText,
    reflection: nonEmptyText,
    narrativeContextId: nonEmptyText.optional(),
    narrativeThemeId: z.enum(LOVE_THEMES).optional(),
    previewTone: z.enum(PREVIEW_TONES).optional(),
    tieBreakOrder: z.number().int().nonnegative().optional(),
    selectionSignals: z.array(nonEmptyText).optional(),
    weight: z.number().int().positive().optional(),
  })
  .passthrough()
const editionSourceSchema = z
  .object({
    status: z.literal('editorial_draft'),
    locale: z.literal('ko'),
    slot: z.enum(SLOTS),
    editionCount: z.number().int().positive(),
    editions: z.array(editionSchema),
  })
  .passthrough()

const batchPlanSchema = z
  .object({
    status: z.literal('work_order'),
    locale: z.literal('ko'),
    sourceContentHashes: z
      .object({
        self: sha256,
        love: sha256,
        work: sha256,
        choice: sha256,
        assets: sha256,
      })
      .passthrough(),
    productionContract: z
      .object({
        batchCount: z.literal(88),
        plannedEditionCount: z.literal(1056),
        producedEditionCount: z.literal(1056),
        remainingEditionCount: z.literal(0),
        completedBatchCount: z.literal(88),
      })
      .passthrough(),
    batches: z
      .array(
        z
          .object({
            order: z.number().int().min(1).max(88),
            id: contentId,
            slot: z.enum(SLOTS),
            editionIds: z.array(contentId).length(SIGNS.length),
            pilotEditionIds: z.array(contentId).max(1),
            remainingEditionIds: z.array(contentId).length(0),
            plannedEditionCount: z.literal(12),
            remainingEditionCount: z.literal(0),
            productionStatus: z.literal('complete'),
          })
          .passthrough(),
      )
      .length(88),
  })
  .passthrough()

const reviewSchema = z
  .object({
    status: z.literal('visual_review_complete'),
    locale: z.literal('ko'),
    batchId: contentId,
    batchOrder: z.number().int().min(1).max(88),
    editorialApprovedOn: z.string().regex(ISO_DATE_PATTERN),
    generatedOn: z.string().regex(ISO_DATE_PATTERN),
    visualReviewContract: z
      .object({
        approvalAuthority: z.literal('human_editor'),
        approvedOn: z.string().regex(ISO_DATE_PATTERN),
        assetHashAlgorithm: z.literal('sha256'),
        approvedImageStatus: z.literal('approved_local_candidate'),
        productionAssetStatus: z.literal('not_uploaded'),
        runtimeMayPublishLocalCandidate: z.literal(false),
      })
      .passthrough(),
    editions: z
      .array(
        z
          .object({
            order: z.number().int().min(1).max(12),
            editionId: contentId,
            sign: z.enum(SIGNS),
            editorialReviewStatus: z.enum(['approved', 'approved_pilot']),
            editorialApprovedOn: z.string().regex(ISO_DATE_PATTERN).optional(),
            editorialContentHash: sha256,
            imageStatus: z.literal('approved_local_candidate'),
            approvedArtworkSha256: sha256,
          })
          .passthrough(),
      )
      .length(SIGNS.length),
  })
  .passthrough()

const sourceHashesSchema = z
  .object(
    Object.fromEntries(SOURCE_HASH_KEYS.map((key) => [key, sha256])) as Record<
      (typeof SOURCE_HASH_KEYS)[number],
      typeof sha256
    >,
  )
  .strict()
const generatedFamilySchema = z
  .object({
    id: contentId,
    sign: z.enum(SIGNS),
    slot: z.enum(SLOTS),
    signalAffinities: z.array(nonEmptyText).length(2),
    tieBreakOrder: z.number().int().min(0).max(11),
  })
  .strict()
const generatedEditionSchema = z
  .object({
    id: contentId,
    familyId: contentId,
    sign: z.enum(SIGNS),
    slot: z.enum(SLOTS),
    rarity: z.enum(RARITIES).nullable(),
    artworkObjectKey: z.string().regex(/^guardian-cards\/ko\/[a-z0-9]+(?:[.-][a-z0-9]+)+\.webp$/),
    selectionSignals: z.array(nonEmptyText).max(2),
    previewTone: z.enum(PREVIEW_TONES).nullable(),
  })
  .strict()
const familyCandidateSchema = z.object({ familyId: contentId, tieBreakOrder: z.number().int().min(0).max(11) }).strict()
const familyPoolSchema = z
  .object({
    id: nonEmptyText,
    slot: z.enum(SLOTS),
    selection: z.literal('context_scored'),
    candidates: z.array(familyCandidateSchema).length(SIGNS.length),
  })
  .strict()
const contextEditionPoolSchema = z
  .object({
    id: nonEmptyText,
    familyId: contentId,
    selection: z.literal('context_scored'),
    candidates: z
      .array(z.object({ editionId: contentId, tieBreakOrder: z.number().int().min(0).max(15) }).strict())
      .length(16),
  })
  .strict()
const weightedEditionPoolSchema = z
  .object({
    id: nonEmptyText,
    familyId: contentId,
    selection: z.literal('weighted_random'),
    candidates: z.array(z.object({ editionId: contentId, weight: z.number().int().positive() }).strict()).length(40),
  })
  .strict()
const cardCopySchema = z
  .object({
    slot: z.enum(SLOTS),
    label: z.enum(['자기이해', '사랑', '일', '결정']),
    title: nonEmptyText,
    guardians: nonEmptyText,
    artworkAlt: nonEmptyText,
    oneLineTemplate: nonEmptyText,
    reflection: nonEmptyText,
  })
  .strict()
const runtimeCopySchema = z
  .object({
    title: nonEmptyText,
    guardians: nonEmptyText,
    artworkAlt: nonEmptyText,
    oneLineTemplate: nonEmptyText,
    reflection: nonEmptyText,
  })
  .strict()
const runtimeFamilySchema = z
  .object({
    id: contentId,
    sign: z.enum(SIGNS),
    theme: z.enum(SLOTS),
  })
  .strict()
const runtimeEditionSchema = z
  .object({
    id: contentId,
    familyId: contentId,
    sign: z.enum(SIGNS),
    theme: z.enum(SLOTS),
    contextId: nonEmptyText,
    tone: z.enum(PREVIEW_TONES),
    rarity: z.enum(RARITIES).nullable(),
    weight: z.number().int().positive(),
    artworkObjectKey: z.string().regex(/^guardian-cards\/ko\/[a-z0-9]+(?:[.-][a-z0-9]+)+\.webp$/),
    copy: runtimeCopySchema,
  })
  .strict()
const generatedCatalogSchema = z
  .object({
    schema: z.literal('stella-guardian-daily-runtime-catalog/v1'),
    locale: z.literal('ko'),
    sourceHashes: sourceHashesSchema,
    families: z.array(runtimeFamilySchema).length(48),
    editions: z.array(runtimeEditionSchema).length(1056),
  })
  .strict()

type Edition = z.infer<typeof editionSchema>
type EditionSources = Record<Slot, z.infer<typeof editionSourceSchema>>
type ReviewSource = { filename: string; value: z.infer<typeof reviewSchema>; raw: unknown }

const { values } = parseArgs({
  options: {
    families: { type: 'string' },
    'self-editions': { type: 'string' },
    'love-editions': { type: 'string' },
    'work-editions': { type: 'string' },
    'choice-editions': { type: 'string' },
    batches: { type: 'string' },
    reviews: { type: 'string' },
    'asset-manifest': { type: 'string' },
    output: { type: 'string' },
    write: { type: 'boolean', default: false },
    check: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help) {
  console.log(`Usage:
  bun run guardian-cards:materialize-runtime
  bun run scripts/materialize-guardian-runtime-catalog.ts --check`)
  process.exit(0)
}
if (values.write && values.check) {
  throw new Error('--write and --check cannot be used together')
}

const contentDirectory = fileURLToPath(new URL('../content/guardian-cards', import.meta.url))
const sourcePaths = {
  families: values.families ?? `${contentDirectory}/guardian-card-families-ko.json`,
  self: values['self-editions'] ?? `${contentDirectory}/guardian-self-editions-ko.json`,
  love: values['love-editions'] ?? `${contentDirectory}/guardian-love-editions-ko.json`,
  work: values['work-editions'] ?? `${contentDirectory}/guardian-work-editions-ko.json`,
  choice: values['choice-editions'] ?? `${contentDirectory}/guardian-choice-editions-ko.json`,
  batches: values.batches ?? `${contentDirectory}/production-art-batches-ko.json`,
  reviews: values.reviews ?? contentDirectory,
  assets: values['asset-manifest'] ?? `${contentDirectory}/guardian-card-assets-ko.json`,
} as const
const outputPath =
  values.output ?? fileURLToPath(new URL('../worker/guardian/runtime-catalog.generated.json', import.meta.url))

try {
  const [familyInput, selfInput, loveInput, workInput, choiceInput, batchInput, assetManifest, reviews] =
    await Promise.all([
      readAndParse(sourcePaths.families, familySourceSchema, 'guardian family source'),
      readAndParse(sourcePaths.self, editionSourceSchema, 'self edition source'),
      readAndParse(sourcePaths.love, editionSourceSchema, 'love edition source'),
      readAndParse(sourcePaths.work, editionSourceSchema, 'work edition source'),
      readAndParse(sourcePaths.choice, editionSourceSchema, 'choice edition source'),
      readAndParse(sourcePaths.batches, batchPlanSchema, 'production art batch plan'),
      readReleaseManifest(sourcePaths.assets),
      readReviews(sourcePaths.reviews),
    ])
  const editions = {
    self: selfInput.value,
    love: loveInput.value,
    work: workInput.value,
    choice: choiceInput.value,
  } satisfies EditionSources
  const rawEditions = {
    self: selfInput.raw,
    love: loveInput.raw,
    work: workInput.raw,
    choice: choiceInput.raw,
  } as const

  const catalog = materializeRuntimeCatalog({
    familySource: familyInput.value,
    rawFamilySource: familyInput.raw,
    editions,
    rawEditions,
    batchPlan: batchInput.value,
    rawBatchPlan: batchInput.raw,
    reviews,
    assetManifest,
  })
  const output = `${JSON.stringify(catalog, null, 2)}\n`

  if (values.write) {
    await writeFile(outputPath, output, 'utf8')
    console.log(`materialized: ${outputPath} (48 daily families, 1,056 editions)`)
  } else {
    const existing = await readFile(outputPath, 'utf8')
    if (existing !== output) {
      throw new Error(
        `Guardian runtime catalog is stale: run bun run guardian-cards:materialize-runtime and commit ${outputPath}`,
      )
    }
    console.log('checked: runtime-catalog.generated.json (48 daily families, 1,056 editions, materialization current)')
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Guardian runtime catalog materialization failed')
  process.exitCode = 1
}

function materializeRuntimeCatalog(input: {
  familySource: z.infer<typeof familySourceSchema>
  rawFamilySource: unknown
  editions: EditionSources
  rawEditions: Record<Slot, unknown>
  batchPlan: z.infer<typeof batchPlanSchema>
  rawBatchPlan: unknown
  reviews: ReviewSource[]
  assetManifest: ReleaseManifest
}) {
  const errors: string[] = []
  const editionCounts = { self: 192, love: 480, work: 192, choice: 192 } as const
  for (const slot of SLOTS) {
    const source = input.editions[slot]
    if (source.slot !== slot) {
      errors.push(`${slot} source declares slot ${source.slot}`)
    }
    if (source.editionCount !== editionCounts[slot] || source.editions.length !== editionCounts[slot]) {
      errors.push(`${slot} source must contain ${editionCounts[slot]} editions`)
    }
  }

  const familyById = new Map(input.familySource.families.map((family) => [family.id, family]))
  checkUnique(
    input.familySource.families.map((family) => family.id),
    'family id',
    errors,
  )
  for (const slot of SLOTS) {
    for (const [tieBreakOrder, sign] of SIGNS.entries()) {
      const familyId = `${sign}.${slot}`
      const family = familyById.get(familyId)
      if (!family || family.sign !== sign || family.slot !== slot) {
        errors.push(`missing canonical family ${familyId}`)
      }
      if (family && new Set(family.editionSignalAffinities).size !== family.editionSignalAffinities.length) {
        errors.push(`${familyId}: duplicate signal affinity`)
      }
      if (tieBreakOrder > 11) {
        errors.push(`${familyId}: invalid family tie-break position`)
      }
    }
  }

  const sourceEditions = SLOTS.flatMap((slot) => input.editions[slot].editions)
  const editionById = new Map(sourceEditions.map((edition) => [edition.id, edition]))
  checkUnique(
    sourceEditions.map((edition) => edition.id),
    'edition id',
    errors,
  )
  if (sourceEditions.length !== 1056 || editionById.size !== 1056) {
    errors.push(`expected 1,056 unique editions, received ${sourceEditions.length}/${editionById.size}`)
  }
  for (const edition of sourceEditions) {
    const family = familyById.get(edition.familyId)
    if (!family || family.slot !== edition.slot || family.sign !== edition.sign) {
      errors.push(`${edition.id}: family/sign/slot relationship is invalid`)
    }
    if ((edition.oneLineTemplate.match(FOCUS_TOKEN_PATTERN) ?? []).length !== 1) {
      errors.push(`${edition.id}: oneLineTemplate must contain exactly one focus token`)
    }
    if (edition.slot === 'love') {
      if (!edition.rarity || !edition.weight || !edition.narrativeThemeId) {
        errors.push(`${edition.id}: love edition must declare theme, rarity, and weight`)
      }
    } else if (
      edition.rarity !== null ||
      !edition.narrativeContextId ||
      !edition.previewTone ||
      edition.tieBreakOrder === undefined ||
      edition.selectionSignals?.length !== 2
    ) {
      errors.push(`${edition.id}: non-love selection metadata is incomplete`)
    }
  }

  const sourceHashes = {
    families: contentHash(input.rawFamilySource),
    selfEditions: contentHash(input.rawEditions.self),
    loveEditions: contentHash(input.rawEditions.love),
    workEditions: contentHash(input.rawEditions.work),
    choiceEditions: contentHash(input.rawEditions.choice),
    productionArtBatches: contentHash(input.rawBatchPlan),
    productionArtReviews: contentHash(
      Object.fromEntries(input.reviews.map((review) => [review.filename, contentHash(review.raw)])),
    ),
    assets: contentHash(input.assetManifest),
  }
  for (const [slot, sourceHashKey] of [
    ['self', 'selfEditions'],
    ['love', 'loveEditions'],
    ['work', 'workEditions'],
    ['choice', 'choiceEditions'],
  ] as const) {
    if (input.batchPlan.sourceContentHashes[slot] !== sourceHashes[sourceHashKey]) {
      errors.push(`${slot} edition source hash does not match production-art-batches-ko.json`)
    }
  }
  if (input.batchPlan.sourceContentHashes.assets !== sourceHashes.assets) {
    errors.push('asset source hash does not match production-art-batches-ko.json')
  }

  const assetById = new Map(input.assetManifest.assets.map((asset) => [asset.editionId, asset]))
  checkUnique(
    input.assetManifest.assets.map((asset) => asset.editionId),
    'asset edition id',
    errors,
  )
  if (input.assetManifest.assetCount !== 1056 || assetById.size !== 1056) {
    errors.push(`asset manifest must contain 1,056 unique assets`)
  }

  if (input.reviews.length !== 88) {
    errors.push(`expected 88 production review files, received ${input.reviews.length}`)
  }
  const reviewEditionIds = new Set<string>()
  for (const [batchIndex, batch] of input.batchPlan.batches.entries()) {
    const expectedOrder = batchIndex + 1
    if (batch.order !== expectedOrder) {
      errors.push(`batch position ${expectedOrder} declares order ${batch.order}`)
    }
    const review = input.reviews[batchIndex]
    if (!review) {
      errors.push(`missing review for batch ${expectedOrder}`)
      continue
    }
    if (review.value.batchOrder !== batch.order || review.value.batchId !== batch.id) {
      errors.push(`${review.filename}: batch identity does not match production plan order ${batch.order}`)
    }
    checkExactOrder(
      review.value.editions.map((edition) => edition.editionId),
      batch.editionIds,
      `${review.filename} edition`,
      errors,
    )
    for (const [editionIndex, reviewed] of review.value.editions.entries()) {
      if (reviewed.order !== editionIndex + 1) {
        errors.push(`${reviewed.editionId}: review order must be ${editionIndex + 1}`)
      }
      if (reviewEditionIds.has(reviewed.editionId)) {
        errors.push(`${reviewed.editionId}: appears in multiple production reviews`)
      }
      reviewEditionIds.add(reviewed.editionId)
      const source = editionById.get(reviewed.editionId)
      const asset = assetById.get(reviewed.editionId)
      if (!source) {
        errors.push(`${reviewed.editionId}: approved review has no source edition`)
        continue
      }
      if (source.sign !== reviewed.sign) {
        errors.push(`${reviewed.editionId}: source/review sign mismatch`)
      }
      const expectedEditorialHash = editorialContentHash(source)
      if (reviewed.editorialContentHash !== expectedEditorialHash) {
        errors.push(`${reviewed.editionId}: editorial hash must be ${expectedEditorialHash}`)
      }
      if (!asset) {
        errors.push(`${reviewed.editionId}: approved review has no release asset`)
      } else if (asset.sourceArtworkSha256 !== reviewed.approvedArtworkSha256) {
        errors.push(`${reviewed.editionId}: approved artwork hash does not match release source hash`)
      }
      const isPilot = batch.pilotEditionIds.includes(reviewed.editionId)
      if ((reviewed.editorialReviewStatus === 'approved_pilot') !== isPilot) {
        errors.push(`${reviewed.editionId}: pilot approval status does not match the production batch`)
      }
      if (
        reviewed.editorialReviewStatus === 'approved' &&
        reviewed.editorialApprovedOn !== review.value.editorialApprovedOn
      ) {
        errors.push(`${reviewed.editionId}: editorial approval date does not match its review batch`)
      }
      if (reviewed.editorialReviewStatus === 'approved_pilot' && reviewed.editorialApprovedOn !== undefined) {
        errors.push(`${reviewed.editionId}: approved pilot must preserve its prior approval without a new date`)
      }
    }
  }
  checkSetEquality(new Set(editionById.keys()), reviewEditionIds, 'source edition', 'approved review', errors)
  checkSetEquality(new Set(editionById.keys()), new Set(assetById.keys()), 'source edition', 'release asset', errors)

  const families = SLOTS.flatMap((slot) =>
    SIGNS.map((sign, tieBreakOrder) => {
      const family = familyById.get(`${sign}.${slot}`)
      if (!family) {
        throw new Error(`Cannot materialize missing family ${sign}.${slot}`)
      }
      return {
        id: family.id,
        sign: family.sign,
        slot: family.slot,
        signalAffinities: family.editionSignalAffinities,
        tieBreakOrder,
      }
    }),
  )
  const editions = sourceEditions.map((edition) => {
    const asset = assetById.get(edition.id)
    if (!asset) {
      throw new Error(`Cannot materialize missing asset ${edition.id}`)
    }
    return {
      id: edition.id,
      familyId: edition.familyId,
      sign: edition.sign,
      slot: edition.slot,
      rarity: edition.rarity,
      artworkObjectKey: asset.objectKey,
      selectionSignals: edition.slot === 'love' ? [] : (edition.selectionSignals ?? []),
      previewTone: edition.slot === 'love' ? null : (edition.previewTone ?? null),
    }
  })
  const familyPools = Object.fromEntries(
    SLOTS.map((slot) => [
      slot,
      {
        id: `guardian-${slot}-families`,
        slot,
        selection: 'context_scored' as const,
        candidates: families
          .filter((family) => family.slot === slot)
          .map((family) => ({ familyId: family.id, tieBreakOrder: family.tieBreakOrder })),
      },
    ]),
  ) as Record<Slot, z.infer<typeof familyPoolSchema>>
  const editionPools = families.map((family) => {
    const familyEditions = sourceEditions.filter((edition) => edition.familyId === family.id)
    const id = `${family.id.replace('.', '-')}-editions`
    if (family.slot === 'love') {
      const candidates = familyEditions.map((edition) => ({ editionId: edition.id, weight: edition.weight ?? 0 }))
      const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0)
      if (candidates.length !== 40 || totalWeight !== 10_000) {
        errors.push(`${family.id}: love pool must contain 40 editions totaling weight 10000`)
      }
      return { id, familyId: family.id, selection: 'weighted_random' as const, candidates }
    }
    if (familyEditions.length !== 16) {
      errors.push(`${family.id}: context-scored pool must contain 16 editions`)
    }
    const candidates = familyEditions.map((edition, candidateIndex) => {
      const expectedAuthoredTieBreakOrder = candidateIndex % 4
      if (edition.tieBreakOrder !== expectedAuthoredTieBreakOrder) {
        errors.push(
          `${edition.id}: authored tieBreakOrder must be ${expectedAuthoredTieBreakOrder} at family position ${candidateIndex}`,
        )
      }
      return {
        editionId: edition.id,
        tieBreakOrder: Math.floor(candidateIndex / 4) * 4 + (edition.tieBreakOrder ?? expectedAuthoredTieBreakOrder),
      }
    })
    return {
      id,
      familyId: family.id,
      selection: 'context_scored' as const,
      candidates,
    }
  })
  const cardCopyKo = Object.fromEntries(
    sourceEditions.map((edition) => [
      edition.id,
      {
        slot: edition.slot,
        label: COPY_LABEL_BY_SLOT[edition.slot],
        title: edition.title,
        guardians: edition.guardians,
        artworkAlt: edition.artworkAlt,
        oneLineTemplate: edition.oneLineTemplate,
        reflection: edition.reflection,
      },
    ]),
  )

  checkPoolCompleteness(families, editions, familyPools, editionPools, cardCopyKo, errors)
  throwErrors(errors)

  const runtimeFamilies = families.map((family) => ({ id: family.id, sign: family.sign, theme: family.slot }))
  const runtimeEditions = sourceEditions.map((edition) => {
    const asset = assetById.get(edition.id)
    const contextId = edition.slot === 'love' ? edition.narrativeThemeId : edition.narrativeContextId
    const tone =
      edition.slot === 'love' && edition.narrativeThemeId
        ? LOVE_TONE_BY_THEME[edition.narrativeThemeId]
        : edition.previewTone
    if (!asset || !contextId || !tone) {
      throw new Error(`Cannot materialize daily edition ${edition.id}`)
    }
    return {
      id: edition.id,
      familyId: edition.familyId,
      sign: edition.sign,
      theme: edition.slot,
      contextId,
      tone,
      rarity: edition.rarity,
      weight: edition.slot === 'love' ? (edition.weight ?? 0) : 1,
      artworkObjectKey: asset.objectKey,
      copy: {
        title: edition.title,
        guardians: edition.guardians,
        artworkAlt: edition.artworkAlt,
        oneLineTemplate: edition.oneLineTemplate,
        reflection: edition.reflection,
      },
    }
  })
  const parsed = generatedCatalogSchema.safeParse({
    schema: 'stella-guardian-daily-runtime-catalog/v1',
    locale: 'ko',
    sourceHashes,
    families: runtimeFamilies,
    editions: runtimeEditions,
  })
  if (!parsed.success) {
    throw new Error(formatIssues('Generated guardian runtime catalog is invalid', parsed.error))
  }
  return parsed.data
}

function checkPoolCompleteness(
  families: z.infer<typeof generatedFamilySchema>[],
  editions: z.infer<typeof generatedEditionSchema>[],
  familyPools: Record<Slot, z.infer<typeof familyPoolSchema>>,
  editionPools: (z.infer<typeof contextEditionPoolSchema> | z.infer<typeof weightedEditionPoolSchema>)[],
  cardCopyKo: Record<string, z.infer<typeof cardCopySchema>>,
  errors: string[],
): void {
  const pooledFamilyIds = SLOTS.flatMap((slot) => familyPools[slot].candidates.map((candidate) => candidate.familyId))
  checkUnique(pooledFamilyIds, 'pooled family id', errors)
  checkSetEquality(
    new Set(families.map((family) => family.id)),
    new Set(pooledFamilyIds),
    'generated family',
    'family pool',
    errors,
  )
  checkUnique(
    editionPools.map((pool) => pool.id),
    'edition pool id',
    errors,
  )
  checkUnique(
    editionPools.map((pool) => pool.familyId),
    'edition pool family',
    errors,
  )
  const pooledEditionIds = editionPools.flatMap((pool) => pool.candidates.map((candidate) => candidate.editionId))
  checkUnique(pooledEditionIds, 'pooled edition id', errors)
  checkSetEquality(
    new Set(editions.map((edition) => edition.id)),
    new Set(pooledEditionIds),
    'generated edition',
    'edition pool',
    errors,
  )
  checkSetEquality(
    new Set(editions.map((edition) => edition.id)),
    new Set(Object.keys(cardCopyKo)),
    'generated edition',
    'Korean card copy',
    errors,
  )
  for (const pool of editionPools) {
    if (pool.selection === 'context_scored') {
      const actualTieBreakOrder = pool.candidates.map((candidate) => candidate.tieBreakOrder)
      const expectedTieBreakOrder = Array.from({ length: 16 }, (_, index) => index)
      if (actualTieBreakOrder.some((value, index) => value !== expectedTieBreakOrder[index])) {
        errors.push(`${pool.familyId}: runtime edition tie-break positions must be exactly 0..15 in source order`)
      }
    }
  }
}

async function readReviews(directory: string): Promise<ReviewSource[]> {
  const filenames = (await readdir(directory))
    .filter((filename) => /^production-art-batch-\d{3}-review-ko\.json$/.test(filename))
    .sort()
  const expectedFilenames = Array.from(
    { length: 88 },
    (_, index) => `production-art-batch-${String(index + 1).padStart(3, '0')}-review-ko.json`,
  )
  if (filenames.some((filename, index) => filename !== expectedFilenames[index]) || filenames.length !== 88) {
    throw new Error('Production review files must be exactly production-art-batch-001..088-review-ko.json')
  }
  return Promise.all(
    filenames.map(async (filename) => {
      const input = await readAndParse(`${directory}/${filename}`, reviewSchema, filename)
      return { filename, value: input.value, raw: input.raw }
    }),
  )
}

async function readAndParse<T>(path: string, schema: z.ZodType<T>, label: string): Promise<{ raw: unknown; value: T }> {
  const raw = await readJson(path)
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new Error(formatIssues(`Invalid ${label}`, result.error))
  }
  return { raw, value: result.data }
}

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown
  } catch {
    throw new Error(`Invalid JSON: ${path}`)
  }
}

function editorialContentHash(edition: Edition): string {
  return contentHash({
    id: edition.id,
    title: edition.title,
    guardians: edition.guardians,
    scene: edition.scene,
    artworkAlt: edition.artworkAlt,
    oneLineTemplate: edition.oneLineTemplate,
    reflection: edition.reflection,
  })
}

function contentHash(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`
  }
  const object = value as Record<string, unknown>
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(',')}}`
}

function checkExactOrder(
  actual: readonly string[],
  expected: readonly string[],
  label: string,
  errors: string[],
): void {
  if (actual.length !== expected.length) {
    errors.push(`${label}: expected ${expected.length} entries, received ${actual.length}`)
    return
  }
  for (const [index, expectedValue] of expected.entries()) {
    if (actual[index] !== expectedValue) {
      errors.push(`${label}: position ${index + 1} must be ${expectedValue}, received ${actual[index]}`)
    }
  }
}

function checkUnique(values: readonly string[], label: string, errors: string[]): void {
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) {
      errors.push(`duplicate ${label}: ${value}`)
    }
    seen.add(value)
  }
}

function checkSetEquality(
  expected: ReadonlySet<string>,
  actual: ReadonlySet<string>,
  expectedLabel: string,
  actualLabel: string,
  errors: string[],
): void {
  for (const value of expected) {
    if (!actual.has(value)) {
      errors.push(`${actualLabel} is missing ${expectedLabel} ${value}`)
    }
  }
  for (const value of actual) {
    if (!expected.has(value)) {
      errors.push(`${actualLabel} contains unknown ${value}`)
    }
  }
}

function throwErrors(errors: readonly string[]): void {
  if (errors.length > 0) {
    throw new Error(`Guardian runtime catalog is invalid:\n- ${errors.join('\n- ')}`)
  }
}

function formatIssues(label: string, error: z.ZodError): string {
  return `${label}:\n- ${error.issues
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('\n- ')}`
}
