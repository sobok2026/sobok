import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
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
const SLOTS = ['self', 'love', 'work', 'choice'] as const
const SELF_CONTEXTS = ['present-weather', 'hidden-need', 'coping-pattern', 'next-self'] as const
const WORK_CONTEXTS = ['motivation', 'strength', 'pressure', 'next-move'] as const
const CHOICE_CONTEXTS = ['desire', 'evidence', 'protected-value', 'reversible-step'] as const
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
const RENDER_TREATMENTS = ['close-emotion', 'action-beat', 'shared-world', 'constellation-afterglow'] as const
const RARITIES = ['orbit', 'nebula', 'eclipse', 'stella'] as const

type Slot = (typeof SLOTS)[number]
type BatchDefinition = {
  slot: Slot
  narrativeAxisId: string
  visualAxisId: string
}

const nonEmptyText = z.string().trim().min(1)
const editionSchema = z
  .object({
    id: nonEmptyText,
    sign: z.enum(SIGNS),
    slot: z.enum(SLOTS),
    narrativeContextId: nonEmptyText.optional(),
    renderTreatmentId: nonEmptyText.optional(),
    narrativeThemeId: nonEmptyText.optional(),
    rarity: nonEmptyText.nullable().optional(),
    title: nonEmptyText,
    guardians: nonEmptyText,
    scene: nonEmptyText,
    artworkAlt: nonEmptyText,
    oneLineTemplate: nonEmptyText,
    reflection: nonEmptyText,
  })
  .passthrough()
const editionSourceSchema = z.object({ editions: z.array(editionSchema) }).passthrough()
const assetManifestSchema = z
  .object({
    assets: z.array(
      z
        .object({
          editionId: nonEmptyText,
          sourceArtworkSha256: z.string().regex(/^[a-f0-9]{64}$/),
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
          editorialContentHash: z.string().regex(/^[a-f0-9]{64}$/),
        })
        .passthrough(),
    ),
  })
  .passthrough()

type Edition = z.infer<typeof editionSchema>

const { values } = parseArgs({
  options: {
    'self-editions': { type: 'string' },
    'love-editions': { type: 'string' },
    'work-editions': { type: 'string' },
    'choice-editions': { type: 'string' },
    pilot: { type: 'string' },
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
  bun run guardian-cards:materialize-art-batches
  bun run scripts/materialize-guardian-art-batches.ts --check`)
  process.exit(0)
}
if (values.write && values.check) {
  throw new Error('--write and --check cannot be used together')
}

const sourcePaths = {
  self:
    values['self-editions'] ??
    fileURLToPath(new URL('../content/guardian-cards/guardian-self-editions-ko.json', import.meta.url)),
  love:
    values['love-editions'] ??
    fileURLToPath(new URL('../content/guardian-cards/guardian-love-editions-ko.json', import.meta.url)),
  work:
    values['work-editions'] ??
    fileURLToPath(new URL('../content/guardian-cards/guardian-work-editions-ko.json', import.meta.url)),
  choice:
    values['choice-editions'] ??
    fileURLToPath(new URL('../content/guardian-cards/guardian-choice-editions-ko.json', import.meta.url)),
} as const
const pilotPath =
  values.pilot ?? fileURLToPath(new URL('../content/guardian-cards/production-art-pilot-plan-ko.json', import.meta.url))
const assetManifestPath =
  values['asset-manifest'] ??
  fileURLToPath(new URL('../content/guardian-cards/guardian-card-assets-ko.json', import.meta.url))
const outputPath =
  values.output ?? fileURLToPath(new URL('../content/guardian-cards/production-art-batches-ko.json', import.meta.url))

try {
  const sources = {
    self: await readEditionSource(sourcePaths.self, 'self'),
    love: await readEditionSource(sourcePaths.love, 'love'),
    work: await readEditionSource(sourcePaths.work, 'work'),
    choice: await readEditionSource(sourcePaths.choice, 'choice'),
  }
  const pilotPlan = await readPilotPlan(pilotPath)
  const assetManifest = await readAssetManifest(assetManifestPath)
  const plan = materialize(sources, pilotPlan, assetManifest)
  const output = `${formatGeneratedJson(plan)}\n`

  if (values.write) {
    await writeFile(outputPath, output, 'utf8')
    console.log(
      `materialized: ${outputPath} (${plan.productionContract.batchCount} art batches, ${plan.productionContract.remainingEditionCount.toLocaleString()} remaining editions)`,
    )
  } else {
    const existing = await readFile(outputPath, 'utf8')
    if (existing !== output) {
      throw new Error(
        `Guardian art batch plan is stale: run bun run guardian-cards:materialize-art-batches and commit ${outputPath}`,
      )
    }
    console.log(
      `checked: production-art-batches-ko (${plan.productionContract.batchCount} art batches, ${plan.productionContract.remainingEditionCount.toLocaleString()} remaining editions)`,
    )
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Guardian art batch materialization failed')
  process.exitCode = 1
}

async function readEditionSource(path: string, expectedSlot: Slot) {
  const parsed = editionSourceSchema.safeParse(await readJson(path))
  if (!parsed.success) {
    throw new Error(formatIssues(`Invalid ${expectedSlot} edition source`, parsed.error))
  }
  for (const edition of parsed.data.editions) {
    if (edition.slot !== expectedSlot) {
      throw new Error(`${edition.id}: expected slot ${expectedSlot}, received ${edition.slot}`)
    }
  }
  return parsed.data
}

async function readPilotPlan(path: string) {
  const parsed = pilotPlanSchema.safeParse(await readJson(path))
  if (!parsed.success) {
    throw new Error(formatIssues('Invalid guardian art pilot plan', parsed.error))
  }
  return parsed.data
}

async function readAssetManifest(path: string) {
  const parsed = assetManifestSchema.safeParse(await readJson(path))
  if (!parsed.success) {
    throw new Error(formatIssues('Invalid guardian card asset manifest', parsed.error))
  }
  return parsed.data
}

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown
  } catch {
    throw new Error(`Invalid JSON: ${path}`)
  }
}

function materialize(
  sources: Record<Slot, z.infer<typeof editionSourceSchema>>,
  pilotPlan: z.infer<typeof pilotPlanSchema>,
  assetManifest: z.infer<typeof assetManifestSchema>,
) {
  const editions = SLOTS.flatMap((slot) => sources[slot].editions)
  const editionById = new Map(editions.map((edition) => [edition.id, edition]))
  if (editionById.size !== 1_056) {
    throw new Error(`expected 1,056 unique editions, received ${editionById.size}`)
  }

  const pilotIds = new Set(pilotPlan.pilots.map((pilot) => pilot.editionId))
  if (pilotIds.size !== 12) {
    throw new Error(`expected 12 unique pilot editions, received ${pilotIds.size}`)
  }
  for (const pilot of pilotPlan.pilots) {
    const edition = editionById.get(pilot.editionId)
    if (!edition) {
      throw new Error(`${pilot.editionId}: pilot edition does not exist`)
    }
    if (pilot.editorialContentHash !== editorialContentHash(edition)) {
      throw new Error(`${pilot.editionId}: pilot editorial hash is stale`)
    }
  }

  const producedIds = new Set(assetManifest.assets.map((asset) => asset.editionId))
  if (producedIds.size !== assetManifest.assets.length) {
    throw new Error('guardian card asset manifest contains duplicate edition IDs')
  }
  for (const asset of assetManifest.assets) {
    if (!editionById.has(asset.editionId)) {
      throw new Error(`${asset.editionId}: guardian card asset does not exist in the production editions`)
    }
  }
  for (const pilotId of pilotIds) {
    if (!producedIds.has(pilotId)) {
      throw new Error(`${pilotId}: approved pilot is missing from the guardian card asset manifest`)
    }
  }

  const definitions = batchDefinitions()
  const coveredEditionIds = new Set<string>()
  const batches = definitions.map((definition, index) => {
    const batchEditions = editions.filter((edition) => matchesBatch(edition, definition))
    const editionIds = SIGNS.map((sign) => {
      const matches = batchEditions.filter((edition) => edition.sign === sign)
      if (matches.length !== 1) {
        throw new Error(`${batchId(definition)}: expected one ${sign} edition, received ${matches.length}`)
      }
      return matches[0].id
    })
    if (editionIds.length !== 12) {
      throw new Error(`${batchId(definition)}: expected 12 editions, received ${editionIds.length}`)
    }
    for (const editionId of editionIds) {
      if (coveredEditionIds.has(editionId)) {
        throw new Error(`${editionId}: edition appears in more than one art batch`)
      }
      coveredEditionIds.add(editionId)
    }

    const pilotEditionIds = editionIds.filter((editionId) => pilotIds.has(editionId))
    const remainingEditionIds = editionIds.filter((editionId) => !producedIds.has(editionId))
    const producedEditionIds = editionIds.filter((editionId) => producedIds.has(editionId))
    const productionStatus =
      remainingEditionIds.length === 0
        ? 'complete'
        : producedEditionIds.length === 0
          ? 'not_started'
          : producedEditionIds.every((editionId) => pilotIds.has(editionId))
            ? 'pilot_partial'
            : 'in_progress'
    return {
      order: index + 1,
      id: batchId(definition),
      slot: definition.slot,
      narrativeAxisId: definition.narrativeAxisId,
      visualAxisId: definition.visualAxisId,
      editionIds,
      pilotEditionIds,
      remainingEditionIds,
      plannedEditionCount: editionIds.length,
      remainingEditionCount: remainingEditionIds.length,
      productionStatus,
    }
  })

  if (coveredEditionIds.size !== editionById.size) {
    throw new Error(`art batches cover ${coveredEditionIds.size} of ${editionById.size} editions`)
  }
  const pilotPartialBatchCount = batches.filter((batch) => batch.productionStatus === 'pilot_partial').length
  const inProgressBatchCount = batches.filter((batch) => batch.productionStatus === 'in_progress').length
  const completedBatchCount = batches.filter((batch) => batch.productionStatus === 'complete').length
  const fullPendingBatchCount = batches.filter((batch) => batch.productionStatus === 'not_started').length
  const remainingEditionCount = batches.reduce((sum, batch) => sum + batch.remainingEditionCount, 0)
  if (
    remainingEditionCount !== editions.length - producedIds.size ||
    pilotPartialBatchCount + inProgressBatchCount + completedBatchCount + fullPendingBatchCount !== batches.length
  ) {
    throw new Error(
      `art batch progress does not match ${producedIds.size} prepared production assets and ${batches.length} batches`,
    )
  }

  return {
    status: 'work_order',
    locale: 'ko',
    purpose: '승인된 파일럿 12개를 포함한 1,056개 원화를 같은 주제·서사·표현 축의 12별자리 단위로 제작하고 검수한다.',
    sourceContentHashes: {
      self: contentHash(sources.self),
      love: contentHash(sources.love),
      work: contentHash(sources.work),
      choice: contentHash(sources.choice),
      pilot: contentHash(pilotPlan),
      assets: contentHash(assetManifest),
    },
    productionContract: {
      grouping: 'same_slot_narrative_and_visual_axis_across_twelve_signs',
      batchCount: batches.length,
      editionsPerFullBatch: 12,
      plannedEditionCount: editions.length,
      pilotEditionCount: pilotIds.size,
      producedEditionCount: producedIds.size,
      remainingEditionCount,
      pilotPartialBatchCount,
      inProgressBatchCount,
      completedBatchCount,
      fullPendingBatchCount,
      editorialApprovalAuthority: 'human_editor',
      imageGenerationRequires: 'approved_editorial_hash',
      visualApprovalAuthority: 'human_editor',
      deliveryRequires: 'approved_1080x1440_webp_and_immutable_r2_object',
    },
    batches,
  }
}

function batchDefinitions(): BatchDefinition[] {
  const nonLove = (slot: Exclude<Slot, 'love'>, contexts: readonly string[]): BatchDefinition[] =>
    contexts.flatMap((narrativeAxisId) =>
      RENDER_TREATMENTS.map((visualAxisId) => ({ slot, narrativeAxisId, visualAxisId })),
    )
  return [
    ...nonLove('self', SELF_CONTEXTS),
    ...LOVE_THEMES.flatMap((narrativeAxisId) =>
      RARITIES.map((visualAxisId) => ({ slot: 'love' as const, narrativeAxisId, visualAxisId })),
    ),
    ...nonLove('work', WORK_CONTEXTS),
    ...nonLove('choice', CHOICE_CONTEXTS),
  ]
}

function matchesBatch(edition: Edition, definition: BatchDefinition): boolean {
  if (edition.slot !== definition.slot) {
    return false
  }
  if (definition.slot === 'love') {
    return edition.narrativeThemeId === definition.narrativeAxisId && edition.rarity === definition.visualAxisId
  }
  return (
    edition.narrativeContextId === definition.narrativeAxisId && edition.renderTreatmentId === definition.visualAxisId
  )
}

function batchId(definition: BatchDefinition): string {
  return `${definition.slot}.${definition.narrativeAxisId}.${definition.visualAxisId}`
}

function formatGeneratedJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(
    /"pilotEditionIds": \[\n\s+"([^"]+)"\n\s+\]/g,
    '"pilotEditionIds": ["$1"]',
  )
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

function formatIssues(label: string, error: z.ZodError): string {
  const issues = error.issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
  return `${label}:\n- ${issues.join('\n- ')}`
}
