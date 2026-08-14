import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { z } from 'zod'

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
          editionIds: z.array(nonEmptyText),
          pilotEditionIds: z.array(nonEmptyText),
          remainingEditionIds: z.array(nonEmptyText),
          plannedEditionCount: z.number().int().positive(),
          remainingEditionCount: z.number().int().nonnegative(),
          productionStatus: z.enum(['not_started', 'pilot_partial']),
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
const generatedCandidateEditionSchema = reviewEditionBaseSchema
  .extend({
    editorialReviewStatus: z.literal('approved'),
    editorialApprovedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    imageStatus: z.literal('generated_local_candidate'),
    candidateArtworkSha256: sha256,
  })
  .strict()
const approvedPilotEditionSchema = reviewEditionBaseSchema
  .extend({
    editorialReviewStatus: z.literal('approved_pilot'),
    imageStatus: z.literal('approved_local_candidate'),
    approvedArtworkSha256: sha256,
  })
  .strict()
const reviewPlanSchema = z
  .object({
    status: z.literal('visual_review_requested'),
    locale: z.literal('ko'),
    batchId: nonEmptyText,
    batchOrder: z.number().int().positive(),
    editorialApprovedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    generatedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    purpose: z.string().trim().min(40),
    sourceBatchPlan: z.literal('production-art-batches-ko.json'),
    selectionContract: z
      .object({
        plannedEditionCount: z.literal(12),
        approvedPilotEditionCount: z.literal(1),
        newEditionCount: z.literal(11),
        onePerSign: z.literal(true),
        slot: z.literal('self'),
        narrativeAxisId: z.literal('present-weather'),
        visualAxisId: z.literal('close-emotion'),
      })
      .strict(),
    editorialReviewContract: z
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
      .strict(),
    renderContract: z
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
      .strict(),
    editions: z.array(z.union([generatedCandidateEditionSchema, approvedPilotEditionSchema])).length(SIGNS.length),
  })
  .strict()

type Edition = z.infer<typeof editionSchema>
type ReviewPlan = z.infer<typeof reviewPlanSchema>

const { values } = parseArgs({
  options: {
    review: { type: 'string' },
    batches: { type: 'string' },
    pilot: { type: 'string' },
    'self-editions': { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help) {
  console.log(`Usage:
  bun run guardian-cards:validate-art-review
  bun run scripts/validate-guardian-art-batch-review.ts --review <review.json>`)
  process.exit(0)
}

const reviewPath =
  values.review ??
  fileURLToPath(new URL('../content/guardian-cards/production-art-batch-001-review-ko.json', import.meta.url))
const batchesPath =
  values.batches ?? fileURLToPath(new URL('../content/guardian-cards/production-art-batches-ko.json', import.meta.url))
const pilotPath =
  values.pilot ?? fileURLToPath(new URL('../content/guardian-cards/production-art-pilot-plan-ko.json', import.meta.url))
const selfEditionsPath =
  values['self-editions'] ??
  fileURLToPath(new URL('../content/guardian-cards/guardian-self-editions-ko.json', import.meta.url))

try {
  const [reviewJson, batchesJson, pilotJson, selfEditionsJson] = await Promise.all([
    readJson(reviewPath),
    readJson(batchesPath),
    readJson(pilotPath),
    readJson(selfEditionsPath),
  ])
  const review = parse(reviewPlanSchema, reviewJson, 'guardian art batch review')
  const batches = parse(batchPlanSchema, batchesJson, 'guardian art batch plan')
  const pilot = parse(pilotPlanSchema, pilotJson, 'guardian art pilot plan')
  const selfEditions = parse(editionSourceSchema, selfEditionsJson, 'self edition source')

  validate(review, batches, pilot, selfEditions.editions)
  console.log(
    `validated: production-art-batch-001-review-ko (${review.editions.length} editorially approved editions, 1 approved pilot + 11 candidates awaiting human visual approval, sha256 ${contentHash(review)})`,
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Guardian art batch review validation failed')
  process.exitCode = 1
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
    if (batch.plannedEditionCount !== 12 || batch.remainingEditionCount !== 11) {
      errors.push(`${review.batchId}: expected a 12-edition batch with 11 remaining editions`)
    }
    if (batch.productionStatus !== 'pilot_partial' || batch.pilotEditionIds.length !== 1) {
      errors.push(`${review.batchId}: expected exactly one approved pilot edition`)
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
    review.editions.map((edition) =>
      edition.imageStatus === 'approved_local_candidate'
        ? edition.approvedArtworkSha256
        : edition.candidateArtworkSha256,
    ),
    'candidate artwork hash',
    errors,
  )
  if (review.generatedOn < review.editorialApprovedOn) {
    errors.push('candidate generation date cannot precede editorial approval date')
  }

  const sourceById = new Map(editions.map((edition) => [edition.id, edition]))
  const pilotById = new Map(pilotPlan.pilots.map((pilot) => [pilot.editionId, pilot]))
  let approvedPilotCount = 0
  let generatedCandidateCount = 0
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
      generatedCandidateCount += 1
      if (pilot) {
        errors.push(`${edition.editionId}: an approved pilot cannot be recorded as a new approval`)
      }
      if (edition.editorialApprovedOn !== review.editorialApprovedOn) {
        errors.push(`${edition.editionId}: editorial approval date must match the batch approval date`)
      }
    }
  }

  if (approvedPilotCount !== 1 || generatedCandidateCount !== 11) {
    errors.push(
      `expected 1 approved pilot and 11 generated candidates, received ${approvedPilotCount} and ${generatedCandidateCount}`,
    )
  }
  for (const requiredPromptFragment of [
    '55–65%',
    'no readable text',
    'Do not bake actual birth-chart lines',
    "Do not reuse the pilot card's centered stage",
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
