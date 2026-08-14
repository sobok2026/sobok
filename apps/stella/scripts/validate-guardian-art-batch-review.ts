import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { basename } from 'node:path'
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
const ELEMENT_BY_SIGN = {
  aries: 'fire',
  taurus: 'earth',
  gemini: 'air',
  cancer: 'water',
  leo: 'fire',
  virgo: 'earth',
  libra: 'air',
  scorpio: 'water',
  sagittarius: 'fire',
  capricorn: 'earth',
  aquarius: 'air',
  pisces: 'water',
} as const satisfies Record<(typeof SIGNS)[number], 'fire' | 'earth' | 'air' | 'water'>

const nonEmptyText = z.string().trim().min(1)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const editionSchema = z
  .object({
    id: nonEmptyText,
    sign: z.enum(SIGNS),
    title: nonEmptyText,
    guardians: nonEmptyText,
    scene: nonEmptyText,
    artworkAlt: nonEmptyText,
    oneLineTemplate: nonEmptyText,
    reflection: nonEmptyText,
  })
  .passthrough()
const editionSourceSchema = z.object({ editions: z.array(editionSchema) }).passthrough()
const batchPlanSchema = z
  .object({
    batches: z.array(
      z
        .object({
          order: z.number().int().positive(),
          id: nonEmptyText,
          slot: z.enum(SLOTS),
          narrativeAxisId: nonEmptyText,
          visualAxisId: nonEmptyText,
          editionIds: z.array(nonEmptyText),
          pilotEditionIds: z.array(nonEmptyText),
          remainingEditionIds: z.array(nonEmptyText),
          plannedEditionCount: z.number().int().positive(),
          remainingEditionCount: z.number().int().nonnegative(),
          productionStatus: z.enum(['not_started', 'pilot_partial', 'in_progress', 'complete']),
        })
        .passthrough(),
    ),
  })
  .passthrough()
const pilotPlanSchema = z
  .object({
    pilots: z.array(
      z
        .object({
          editionId: nonEmptyText,
          editorialContentHash: sha256,
          approvedArtworkSha256: sha256,
        })
        .passthrough(),
    ),
  })
  .passthrough()

const reviewEditionBaseSchema = z.object({
  order: z.number().int().min(1).max(12),
  editionId: nonEmptyText,
  sign: z.enum(SIGNS),
  element: z.enum(['fire', 'earth', 'air', 'water']),
  editorialContentHash: sha256,
  compositionFamily: z.string().trim().min(8),
  artDirection: z.string().trim().min(80),
  distinctFrom: z.array(z.string().trim().min(10)).min(1).max(3),
  visualReviewFocus: z.array(z.string().trim().min(10)).min(2).max(3),
})
const pendingEditionSchema = reviewEditionBaseSchema
  .extend({
    editorialReviewStatus: z.literal('pending_human_approval'),
    imageStatus: z.literal('not_started'),
  })
  .strict()
const editoriallyApprovedEditionSchema = reviewEditionBaseSchema
  .extend({
    editorialReviewStatus: z.literal('approved'),
    editorialApprovedOn: date,
    imageStatus: z.literal('not_started'),
  })
  .strict()
const generatedCandidateEditionSchema = reviewEditionBaseSchema
  .extend({
    editorialReviewStatus: z.literal('approved'),
    editorialApprovedOn: date,
    imageStatus: z.literal('generated_candidate'),
  })
  .strict()
const visuallyApprovedEditionSchema = reviewEditionBaseSchema
  .extend({
    editorialReviewStatus: z.literal('approved'),
    editorialApprovedOn: date,
    imageStatus: z.literal('approved_local_candidate'),
    approvedArtworkSha256: sha256,
  })
  .strict()
const approvedPilotEditionSchema = reviewEditionBaseSchema
  .extend({
    editorialReviewStatus: z.literal('approved_pilot'),
    imageStatus: z.literal('approved_local_candidate'),
    approvedArtworkSha256: sha256,
  })
  .strict()

const selectionContractSchema = z
  .object({
    plannedEditionCount: z.literal(12),
    approvedPilotEditionCount: z.number().int().min(0).max(1),
    newEditionCount: z.number().int().min(11).max(12),
    onePerSign: z.literal(true),
    slot: z.enum(SLOTS),
    narrativeAxisId: nonEmptyText,
    visualAxisId: nonEmptyText,
  })
  .strict()
const editorialReviewContractSchema = z
  .object({
    approvalAuthority: z.literal('human_editor'),
    contentHashAlgorithm: z.literal('sha256-canonical-json'),
    hashFields: z.tuple([
      z.literal('id'),
      z.literal('title'),
      z.literal('guardians'),
      z.literal('scene'),
      z.literal('artworkAlt'),
      z.literal('oneLineTemplate'),
      z.literal('reflection'),
    ]),
    requiredChecks: z.tuple([
      z.literal('character_continuity'),
      z.literal('scene_feasibility'),
      z.literal('visible_alt_text'),
      z.literal('non_deterministic_copy'),
      z.literal('non_personalized_master_art'),
      z.literal('symbol_only_written_marks'),
      z.literal('distinct_composition_within_batch'),
    ]),
    imageGenerationRequires: z.literal('approved_editorial_hash'),
  })
  .strict()
const renderContractSchema = z
  .object({
    aspectRatio: z.literal('3:4'),
    masterSize: z.literal('1080x1440'),
    fullBleed: z.literal(true),
    maximumDisplayedGuardians: z.literal(2),
    bakedText: z.literal(false),
    legibleTextInsideArtwork: z.literal(false),
    writtenMarks: z.literal('symbols_and_shapes_only'),
    characterCoverage: z.literal('55-65%'),
    identityReferences: z
      .object({
        fire: z.literal('apps/stella/design/zodiac-guardians/sheets/fire.png'),
        earth: z.literal('apps/stella/design/zodiac-guardians/sheets/earth.png'),
        air: z.literal('apps/stella/design/zodiac-guardians/sheets/air.png'),
        water: z.literal('apps/stella/design/zodiac-guardians/sheets/water.png'),
      })
      .strict(),
    styleReference: z.literal('apps/stella/private/guardian-art-pilot/contact-sheet-final.png'),
    commonPrompt: z.string().trim().min(300),
  })
  .strict()
const visualReviewContractSchema = z
  .object({
    approvalAuthority: z.literal('human_editor'),
    approvedOn: date,
    assetHashAlgorithm: z.literal('sha256'),
    approvedImageStatus: z.literal('approved_local_candidate'),
    productionAssetStatus: z.literal('not_uploaded'),
    runtimeMayPublishLocalCandidate: z.literal(false),
  })
  .strict()
const reviewPlanBaseSchema = z
  .object({
    locale: z.literal('ko'),
    batchId: nonEmptyText,
    batchOrder: z.number().int().positive(),
    purpose: z.string().trim().min(40),
    sourceBatchPlan: z.literal('production-art-batches-ko.json'),
    selectionContract: selectionContractSchema,
    editorialReviewContract: editorialReviewContractSchema,
    renderContract: renderContractSchema,
  })
  .strict()
const editorialReviewReadySchema = reviewPlanBaseSchema
  .extend({
    status: z.literal('editorial_review_ready'),
    preparedOn: date,
    editions: z.array(z.union([pendingEditionSchema, approvedPilotEditionSchema])).length(SIGNS.length),
  })
  .strict()
const editorialReviewCompleteSchema = reviewPlanBaseSchema
  .extend({
    status: z.literal('editorial_review_complete'),
    editorialApprovedOn: date,
    editions: z.array(z.union([editoriallyApprovedEditionSchema, approvedPilotEditionSchema])).length(SIGNS.length),
  })
  .strict()
const visualReviewReadySchema = reviewPlanBaseSchema
  .extend({
    status: z.literal('visual_review_ready'),
    editorialApprovedOn: date,
    generatedOn: date,
    editions: z.array(z.union([generatedCandidateEditionSchema, approvedPilotEditionSchema])).length(SIGNS.length),
  })
  .strict()
const visualReviewCompleteSchema = reviewPlanBaseSchema
  .extend({
    status: z.literal('visual_review_complete'),
    editorialApprovedOn: date,
    generatedOn: date,
    visualReviewContract: visualReviewContractSchema,
    editions: z.array(z.union([visuallyApprovedEditionSchema, approvedPilotEditionSchema])).length(SIGNS.length),
  })
  .strict()
const reviewPlanSchema = z.discriminatedUnion('status', [
  editorialReviewReadySchema,
  editorialReviewCompleteSchema,
  visualReviewReadySchema,
  visualReviewCompleteSchema,
])

type Edition = z.infer<typeof editionSchema>
type ReviewPlan = z.infer<typeof reviewPlanSchema>

const { values } = parseArgs({
  options: {
    review: { type: 'string', multiple: true },
    batches: { type: 'string' },
    pilot: { type: 'string' },
    'self-editions': { type: 'string' },
    'love-editions': { type: 'string' },
    'work-editions': { type: 'string' },
    'choice-editions': { type: 'string' },
    'asset-manifest': { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help) {
  console.log(`Usage:
  bun run guardian-cards:validate-art-review
  bun run scripts/validate-guardian-art-batch-review.ts --review <review.json> [--review <review.json>]`)
  process.exit(0)
}

const contentDirectory = fileURLToPath(new URL('../content/guardian-cards', import.meta.url))
const batchesPath = values.batches ?? `${contentDirectory}/production-art-batches-ko.json`
const pilotPath = values.pilot ?? `${contentDirectory}/production-art-pilot-plan-ko.json`
const editionPaths = [
  values['self-editions'] ?? `${contentDirectory}/guardian-self-editions-ko.json`,
  values['love-editions'] ?? `${contentDirectory}/guardian-love-editions-ko.json`,
  values['work-editions'] ?? `${contentDirectory}/guardian-work-editions-ko.json`,
  values['choice-editions'] ?? `${contentDirectory}/guardian-choice-editions-ko.json`,
]
const assetManifestPath = values['asset-manifest'] ?? `${contentDirectory}/guardian-card-assets-ko.json`

try {
  const reviewPaths = values.review ?? (await discoverReviewPaths(contentDirectory))
  if (reviewPaths.length === 0) {
    throw new Error(`No production art batch reviews found in ${contentDirectory}`)
  }
  const [batchesJson, pilotJson, assetManifest, ...editionSourceJsons] = await Promise.all([
    readJson(batchesPath),
    readJson(pilotPath),
    readReleaseManifest(assetManifestPath),
    ...editionPaths.map(readJson),
  ])
  const batches = parse(batchPlanSchema, batchesJson, 'guardian art batch plan')
  const pilot = parse(pilotPlanSchema, pilotJson, 'guardian art pilot plan')
  const editions = editionSourceJsons.flatMap(
    (json, index) => parse(editionSourceSchema, json, `${SLOTS[index]} edition source`).editions,
  )
  const editionIds = new Set(editions.map((edition) => edition.id))
  if (editionIds.size !== editions.length) {
    throw new Error('Guardian edition sources contain duplicate edition IDs')
  }

  for (const reviewPath of reviewPaths) {
    const review = parse(reviewPlanSchema, await readJson(reviewPath), basename(reviewPath))
    validate(review, batches, pilot, editions, assetManifest)
    console.log(
      `validated: ${basename(reviewPath, '.json')} (${review.status}, ${review.editions.length} editions, sha256 ${contentHash(review)})`,
    )
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Guardian art batch review validation failed')
  process.exitCode = 1
}

async function discoverReviewPaths(directory: string): Promise<string[]> {
  const names = await readdir(directory)
  return names
    .filter((name) => /^production-art-batch-\d{3}-review-ko\.json$/.test(name))
    .toSorted()
    .map((name) => `${directory}/${name}`)
}

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown
  } catch {
    throw new Error(`Invalid JSON: ${path}`)
  }
}

function parse<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value)
  if (result.success) {
    return result.data
  }
  const issues = result.error.issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
  throw new Error(`Invalid ${label}:\n- ${issues.join('\n- ')}`)
}

function validate(
  review: ReviewPlan,
  batchPlan: z.infer<typeof batchPlanSchema>,
  pilotPlan: z.infer<typeof pilotPlanSchema>,
  editions: Edition[],
  assetManifest: ReleaseManifest,
): void {
  const errors: string[] = []
  const batch = batchPlan.batches.find((candidate) => candidate.id === review.batchId)
  if (!batch) {
    errors.push(`${review.batchId}: batch does not exist`)
  } else {
    if (batch.order !== review.batchOrder) {
      errors.push(`${review.batchId}: batch order must be ${batch.order}`)
    }
    checkExactOrder(
      review.editions.map((edition) => edition.editionId),
      batch.editionIds,
      'review edition',
      errors,
    )
    if (
      review.selectionContract.slot !== batch.slot ||
      review.selectionContract.narrativeAxisId !== batch.narrativeAxisId ||
      review.selectionContract.visualAxisId !== batch.visualAxisId
    ) {
      errors.push(`${review.batchId}: selection contract must match the batch axes`)
    }
    if (
      review.selectionContract.approvedPilotEditionCount !== batch.pilotEditionIds.length ||
      review.selectionContract.newEditionCount !== batch.editionIds.length - batch.pilotEditionIds.length
    ) {
      errors.push(`${review.batchId}: selection counts must match the batch pilot coverage`)
    }
    if (review.status === 'visual_review_complete') {
      if (batch.remainingEditionCount !== 0 || batch.productionStatus !== 'complete') {
        errors.push(`${review.batchId}: a visually complete review requires a complete produced batch`)
      }
    } else if (batch.productionStatus === 'complete') {
      errors.push(`${review.batchId}: a produced batch cannot have an incomplete review`)
    }
  }

  checkExactOrder(
    review.editions.map((edition) => edition.sign),
    SIGNS,
    'review sign',
    errors,
  )
  checkExactOrder(
    review.editions.map((edition) => String(edition.order)),
    SIGNS.map((_, index) => String(index + 1)),
    'review order',
    errors,
  )
  checkUnique(
    review.editions.map((edition) => edition.compositionFamily),
    'composition family',
    errors,
  )
  checkUnique(
    review.editions.flatMap((edition) => ('approvedArtworkSha256' in edition ? [edition.approvedArtworkSha256] : [])),
    'approved artwork hash',
    errors,
  )

  if ('generatedOn' in review && review.generatedOn < review.editorialApprovedOn) {
    errors.push('candidate generation date cannot precede editorial approval date')
  }
  if (review.status === 'visual_review_complete' && review.visualReviewContract.approvedOn < review.generatedOn) {
    errors.push('visual approval date cannot precede candidate generation date')
  }

  const sourceById = new Map(editions.map((edition) => [edition.id, edition]))
  const pilotById = new Map(pilotPlan.pilots.map((pilot) => [pilot.editionId, pilot]))
  const assetById = new Map(assetManifest.assets.map((asset) => [asset.editionId, asset]))
  let approvedPilotCount = 0
  let newEditionCount = 0
  for (const edition of review.editions) {
    const source = sourceById.get(edition.editionId)
    if (!source) {
      errors.push(`${edition.editionId}: source edition does not exist`)
      continue
    }
    if (source.sign !== edition.sign) {
      errors.push(`${edition.editionId}: sign must match ${source.sign}`)
    }
    if (edition.element !== ELEMENT_BY_SIGN[edition.sign]) {
      errors.push(`${edition.editionId}: element must be ${ELEMENT_BY_SIGN[edition.sign]}`)
    }
    if (source.guardians.split(' · ').length > review.renderContract.maximumDisplayedGuardians) {
      errors.push(`${edition.editionId}: source exceeds the maximum displayed guardian count`)
    }
    const expectedHash = editorialContentHash(source)
    if (edition.editorialContentHash !== expectedHash) {
      errors.push(`${edition.editionId}: editorial hash must match current copy (${expectedHash})`)
    }

    const pilot = pilotById.get(edition.editionId)
    if (edition.editorialReviewStatus === 'approved_pilot') {
      approvedPilotCount += 1
      if (!pilot) {
        errors.push(`${edition.editionId}: approved pilot is missing from the pilot plan`)
      } else {
        if (pilot.editorialContentHash !== edition.editorialContentHash) {
          errors.push(`${edition.editionId}: pilot editorial hash does not match`)
        }
        if (pilot.approvedArtworkSha256 !== edition.approvedArtworkSha256) {
          errors.push(`${edition.editionId}: approved pilot artwork hash does not match`)
        }
      }
    } else {
      newEditionCount += 1
      if (pilot) {
        errors.push(`${edition.editionId}: an approved pilot cannot be recorded as a new edition`)
      }
      if (
        review.status !== 'editorial_review_ready' &&
        (!('editorialApprovedOn' in edition) || edition.editorialApprovedOn !== review.editorialApprovedOn)
      ) {
        errors.push(`${edition.editionId}: editorial approval date must match the batch approval date`)
      }
    }

    if (review.status === 'visual_review_complete') {
      const asset = assetById.get(edition.editionId)
      if (!asset) {
        errors.push(`${edition.editionId}: visually approved artwork is missing from the cumulative WebP release`)
      } else if (!('approvedArtworkSha256' in edition) || asset.sourceArtworkSha256 !== edition.approvedArtworkSha256) {
        errors.push(`${edition.editionId}: WebP release source hash must match the visually approved PNG`)
      }
    }
  }

  if (
    approvedPilotCount !== review.selectionContract.approvedPilotEditionCount ||
    newEditionCount !== review.selectionContract.newEditionCount
  ) {
    errors.push(
      `review records ${approvedPilotCount} pilots and ${newEditionCount} new editions; selection contract expects ${review.selectionContract.approvedPilotEditionCount} and ${review.selectionContract.newEditionCount}`,
    )
  }
  for (const requiredPromptFragment of [
    '55–65%',
    'no readable text',
    'Do not bake actual birth-chart lines',
    'composition',
  ]) {
    if (!review.renderContract.commonPrompt.includes(requiredPromptFragment)) {
      errors.push(`commonPrompt must include: ${requiredPromptFragment}`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Guardian art batch review is invalid:\n- ${errors.join('\n- ')}`)
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
