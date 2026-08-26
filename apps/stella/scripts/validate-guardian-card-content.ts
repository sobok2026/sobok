import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { z } from 'zod'
import { assetContractSchema, releaseManifestSchema } from './guardian-card-art'

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
const NON_LOVE_SLOTS = ['self', 'work', 'choice'] as const
const RARITIES = ['orbit', 'nebula', 'eclipse', 'stella'] as const
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
const PREVIEW_TONES = ['comfort', 'honesty', 'action', 'possibility'] as const
const FOCUS_TOKEN = '{focus}'
const FOCUS_TOKEN_PATTERN = /\{focus(?::(을|가|은))?\}/g
const LOVE_RARITY_WEIGHTS = {
  orbit: 550,
  nebula: 300,
  eclipse: 120,
  stella: 30,
} as const satisfies Record<(typeof RARITIES)[number], number>
const LOVE_WEIGHT_SCALE = 10_000
const ART_PILOT_SLOT_TARGETS = {
  self: 2,
  love: 4,
  work: 3,
  choice: 3,
} as const satisfies Record<(typeof SLOTS)[number], number>
const FORBIDDEN_PREDICTION_PHRASES = [
  '무조건',
  '틀림없이',
  '운명이야',
  '운명이다',
  '별자리가 정한',
  '반드시 이루어',
  '절대 헤어',
  '절대 실패',
] as const
const FORBIDDEN_MASTER_ART_PERSONALIZATION_PHRASES = [
  '개인 차트',
  '개인 색',
  '출생 차트 선',
  '생년월일',
  '출생 시각',
] as const
const FORBIDDEN_CHARACTER_TRAITS: Readonly<Partial<Record<(typeof SIGNS)[number], readonly string[]>>> = {
  gemini: ['긴 귀'],
}

const NON_LOVE_TREATMENT_RULES = {
  'close-emotion': { previewTone: 'comfort', tieBreakOrder: 0 },
  'action-beat': { previewTone: 'action', tieBreakOrder: 1 },
  'shared-world': { previewTone: 'honesty', tieBreakOrder: 2 },
  'constellation-afterglow': { previewTone: 'possibility', tieBreakOrder: 3 },
} as const satisfies Record<
  (typeof RENDER_TREATMENTS)[number],
  { previewTone: (typeof PREVIEW_TONES)[number]; tieBreakOrder: number }
>

const SAFE_COMPANIONS: Readonly<Record<(typeof SIGNS)[number], readonly (typeof SIGNS)[number][]>> = {
  aries: ['cancer', 'libra'],
  taurus: ['virgo', 'aquarius'],
  gemini: [],
  cancer: ['aries', 'scorpio'],
  leo: ['libra', 'capricorn'],
  virgo: ['taurus'],
  libra: ['aries', 'leo'],
  scorpio: ['cancer'],
  sagittarius: ['capricorn'],
  capricorn: ['leo', 'sagittarius'],
  aquarius: ['taurus'],
  pisces: [],
}

const nonEmptyText = z.string().trim().min(1)
const familySchema = z
  .object({
    id: nonEmptyText,
    sign: z.enum(SIGNS),
    slot: z.enum(SLOTS),
    primaryGuardianId: z.enum(SIGNS),
    companionGuardianIds: z.array(z.enum(SIGNS)).max(2),
    title: nonEmptyText,
    baseScene: z.string().trim().min(30),
    emotion: z.string().trim().min(4),
    baseArtworkAlt: z.string().trim().min(20),
    dialogue: z.string().trim().min(4),
    oneLineTemplate: z.string().trim().min(20),
    reflection: z.string().trim().min(15),
    visualMotifs: z.array(nonEmptyText).length(3),
    editionSignalAffinities: z.array(nonEmptyText).length(2),
  })
  .strict()

const familyContentSchema = z
  .object({
    status: z.literal('authoring'),
    productSku: z.literal('guardian-report-full-v1'),
    locale: z.literal('ko'),
    focusToken: z.literal(FOCUS_TOKEN),
    families: z.array(familySchema).length(SIGNS.length * SLOTS.length),
  })
  .strict()

const selfEditionSchema = z
  .object({
    id: nonEmptyText,
    familyId: nonEmptyText,
    sign: z.enum(SIGNS),
    slot: z.literal('self'),
    narrativeContextId: z.enum(SELF_CONTEXTS),
    renderTreatmentId: z.enum(RENDER_TREATMENTS),
    previewTone: z.enum(PREVIEW_TONES),
    tieBreakOrder: z.number().int().min(0),
    rarity: z.null(),
    editorialStatus: z.literal('draft'),
    assetStatus: z.literal('not_started'),
    artworkPath: z.null(),
    title: z.string().trim().min(8),
    guardians: nonEmptyText,
    scene: z.string().trim().min(60),
    artworkAlt: z.string().trim().min(30),
    oneLineTemplate: z.string().trim().min(50),
    reflection: z.string().trim().min(15),
    selectionSignals: z.array(nonEmptyText).length(2),
  })
  .strict()

const selfEditionContentSchema = z
  .object({
    status: z.literal('editorial_draft'),
    locale: z.literal('ko'),
    slot: z.literal('self'),
    assetPolicy: nonEmptyText,
    editionCount: z.literal(192),
    editions: z.array(selfEditionSchema).length(192),
  })
  .strict()

const workEditionSchema = z
  .object({
    id: nonEmptyText,
    familyId: nonEmptyText,
    sign: z.enum(SIGNS),
    slot: z.literal('work'),
    narrativeContextId: z.enum(WORK_CONTEXTS),
    renderTreatmentId: z.enum(RENDER_TREATMENTS),
    previewTone: z.enum(PREVIEW_TONES),
    tieBreakOrder: z.number().int().min(0),
    rarity: z.null(),
    editorialStatus: z.literal('draft'),
    assetStatus: z.literal('not_started'),
    artworkPath: z.null(),
    title: z.string().trim().min(8),
    guardians: nonEmptyText,
    scene: z.string().trim().min(60),
    artworkAlt: z.string().trim().min(30),
    oneLineTemplate: z.string().trim().min(50),
    reflection: z.string().trim().min(15),
    selectionSignals: z.array(nonEmptyText).length(2),
  })
  .strict()

const workEditionContentSchema = z
  .object({
    status: z.literal('editorial_draft'),
    locale: z.literal('ko'),
    slot: z.literal('work'),
    assetPolicy: nonEmptyText,
    editionCount: z.literal(192),
    editions: z.array(workEditionSchema).length(192),
  })
  .strict()

const choiceEditionSchema = z
  .object({
    id: nonEmptyText,
    familyId: nonEmptyText,
    sign: z.enum(SIGNS),
    slot: z.literal('choice'),
    narrativeContextId: z.enum(CHOICE_CONTEXTS),
    renderTreatmentId: z.enum(RENDER_TREATMENTS),
    previewTone: z.enum(PREVIEW_TONES),
    tieBreakOrder: z.number().int().min(0),
    rarity: z.null(),
    editorialStatus: z.literal('draft'),
    assetStatus: z.literal('not_started'),
    artworkPath: z.null(),
    title: z.string().trim().min(8),
    guardians: nonEmptyText,
    scene: z.string().trim().min(60),
    artworkAlt: z.string().trim().min(30),
    oneLineTemplate: z.string().trim().min(50),
    reflection: z.string().trim().min(15),
    selectionSignals: z.array(nonEmptyText).length(2),
  })
  .strict()

const choiceEditionContentSchema = z
  .object({
    status: z.literal('editorial_draft'),
    locale: z.literal('ko'),
    slot: z.literal('choice'),
    assetPolicy: nonEmptyText,
    editionCount: z.literal(192),
    editions: z.array(choiceEditionSchema).length(192),
  })
  .strict()

const loveEditionSchema = z
  .object({
    id: nonEmptyText,
    familyId: nonEmptyText,
    sign: z.enum(SIGNS),
    slot: z.literal('love'),
    narrativeThemeId: z.enum(LOVE_THEMES),
    rarity: z.enum(RARITIES),
    weight: z.number().int().positive(),
    editorialStatus: z.literal('draft'),
    assetStatus: z.literal('not_started'),
    artworkPath: z.null(),
    title: z.string().trim().min(8),
    guardians: nonEmptyText,
    scene: z.string().trim().min(60),
    artworkAlt: z.string().trim().min(30),
    oneLineTemplate: z.string().trim().min(50),
    reflection: z.string().trim().min(15),
    interpretationSignals: z.array(nonEmptyText).length(2),
  })
  .strict()

const loveEditionContentSchema = z
  .object({
    status: z.literal('editorial_draft'),
    locale: z.literal('ko'),
    slot: z.literal('love'),
    oddsPolicy: z.literal('Questionnaire signals guide interpretation only; rarity selection uses fixed weights.'),
    weightScale: z.literal(LOVE_WEIGHT_SCALE),
    assetPolicy: nonEmptyText,
    editionCount: z.literal(480),
    editions: z.array(loveEditionSchema).length(480),
  })
  .strict()

const narrativeContextSchema = z
  .object({
    id: nonEmptyText,
    title: nonEmptyText,
    signalIntent: z.string().trim().min(20),
    copyIntent: z.string().trim().min(20),
  })
  .strict()

const renderTreatmentSchema = z
  .object({
    id: nonEmptyText,
    title: nonEmptyText,
    composition: z.string().trim().min(20),
    variationRequirement: z.string().trim().min(20),
  })
  .strict()

const loveThemeSchema = z
  .object({
    id: nonEmptyText,
    title: nonEmptyText,
    artIntent: z.string().trim().min(20),
    copyIntent: z.string().trim().min(20),
  })
  .strict()

const raritySchema = z
  .object({
    id: z.enum(RARITIES),
    editionCountPerFamily: z.number().int().positive(),
    weightPerEdition: z.number().int().positive(),
    totalWeightPerFamily: z.number().int().positive(),
    artDirection: z.string().trim().min(20),
    copyDirection: z.string().trim().min(20),
  })
  .strict()

const editionPlanSchema = z
  .object({
    status: z.literal('work_order'),
    productSku: z.literal('guardian-report-full-v1'),
    locale: z.literal('ko'),
    productionMinimumEditionCount: z.number().int().positive(),
    plannedEditionCount: z.number().int().positive(),
    editionIdPatterns: z
      .object({
        self: nonEmptyText,
        love: nonEmptyText,
        work: nonEmptyText,
        choice: nonEmptyText,
      })
      .strict(),
    materializationContract: z
      .object({
        runtimeMayExpandMatrix: z.literal(false),
        requiredPerEditionFields: z.array(nonEmptyText).min(8),
        publishOnlyWhen: z.array(nonEmptyText).min(4),
      })
      .strict(),
    nonLove: z
      .object({
        familyCountPerSlot: z.number().int().positive(),
        editionCountPerFamily: z.number().int().positive(),
        selection: z.literal('context_scored'),
        narrativeContextsBySlot: z
          .object({
            self: z.array(narrativeContextSchema),
            work: z.array(narrativeContextSchema),
            choice: z.array(narrativeContextSchema),
          })
          .strict(),
        renderTreatments: z.array(renderTreatmentSchema),
        targets: z
          .object({
            self: z.number().int().positive(),
            work: z.number().int().positive(),
            choice: z.number().int().positive(),
            total: z.number().int().positive(),
          })
          .strict(),
      })
      .strict(),
    love: z
      .object({
        familyCount: z.number().int().positive(),
        editionCountPerFamily: z.number().int().positive(),
        selection: z.literal('weighted_random'),
        weightScale: z.number().int().positive(),
        narrativeThemes: z.array(loveThemeSchema),
        rarities: z.array(raritySchema),
        target: z.number().int().positive(),
      })
      .strict(),
    slotTargets: z
      .object({
        self: z.number().int().positive(),
        love: z.number().int().positive(),
        work: z.number().int().positive(),
        choice: z.number().int().positive(),
        total: z.number().int().positive(),
      })
      .strict(),
  })
  .strict()

const artPilotPlanSchema = z
  .object({
    status: z.literal('visual_review_complete'),
    locale: z.literal('ko'),
    purpose: z.string().trim().min(40),
    selectionContract: z
      .object({
        pilotCount: z.literal(12),
        onePerSign: z.literal(true),
        slotTargets: z
          .object({
            self: z.literal(ART_PILOT_SLOT_TARGETS.self),
            love: z.literal(ART_PILOT_SLOT_TARGETS.love),
            work: z.literal(ART_PILOT_SLOT_TARGETS.work),
            choice: z.literal(ART_PILOT_SLOT_TARGETS.choice),
          })
          .strict(),
        loveRarityCoverage: z.literal('one_each'),
        coverEveryNonLoveTreatment: z.literal(true),
        editorialApprovalRequiredBeforeImageGeneration: z.literal(true),
        runtimeMayPublishPilotPlan: z.literal(false),
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
        assetDestination: z.literal('cloudflare_r2_webp_after_review'),
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
        ]),
        imageGenerationRequires: z.literal('approved_editorial_hash'),
      })
      .strict(),
    visualReviewContract: z
      .object({
        approvalAuthority: z.literal('human_editor'),
        approvedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        assetHashAlgorithm: z.literal('sha256'),
        approvedImageStatus: z.literal('approved_local_candidate'),
        productionAssetStatus: z.literal('not_uploaded'),
        runtimeMayPublishLocalCandidate: z.literal(false),
      })
      .strict(),
    deliveryReviewContract: z
      .object({
        provider: z.literal('cloudflare_r2'),
        format: z.literal('webp'),
        objectKeyTemplate: z.literal('guardian-cards/ko/{editionId}.{deliverySha256_12}.webp'),
        trackedManifest: z.literal('guardian-card-assets-ko.json'),
        candidateStatus: z.literal('webp_prepared_not_uploaded'),
        runtimeMayPublishPreparedCandidate: z.literal(false),
      })
      .strict(),
    pilots: z
      .array(
        z
          .object({
            order: z.number().int().min(1).max(12),
            editionId: nonEmptyText,
            sign: z.enum(SIGNS),
            slot: z.enum(SLOTS),
            selectionReason: z.string().trim().min(25),
            visualReviewFocus: z.array(z.string().trim().min(10)).min(2).max(3),
            editorialReviewStatus: z.literal('approved'),
            editorialContentHash: z.string().regex(/^[a-f0-9]{64}$/),
            editorialReviewNote: z.string().trim().min(20).max(160),
            imageStatus: z.literal('approved_local_candidate'),
            approvedArtworkSha256: z.string().regex(/^[a-f0-9]{64}$/),
            artworkPath: z.null(),
          })
          .strict(),
      )
      .length(SIGNS.length),
  })
  .strict()

type FamilyContent = z.infer<typeof familyContentSchema>
type SelfEditionContent = z.infer<typeof selfEditionContentSchema>
type WorkEditionContent = z.infer<typeof workEditionContentSchema>
type ChoiceEditionContent = z.infer<typeof choiceEditionContentSchema>
type LoveEditionContent = z.infer<typeof loveEditionContentSchema>
type EditionPlan = z.infer<typeof editionPlanSchema>
type ArtPilotPlan = z.infer<typeof artPilotPlanSchema>
type AnyEdition =
  | SelfEditionContent['editions'][number]
  | LoveEditionContent['editions'][number]
  | WorkEditionContent['editions'][number]
  | ChoiceEditionContent['editions'][number]

const { values } = parseArgs({
  options: {
    'art-pilot': { type: 'string' },
    'asset-contract': { type: 'string' },
    'asset-manifest': { type: 'string' },
    families: { type: 'string' },
    'choice-editions': { type: 'string' },
    'love-editions': { type: 'string' },
    'self-editions': { type: 'string' },
    'work-editions': { type: 'string' },
    plan: { type: 'string' },
    questionnaire: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help) {
  console.log(`Usage:
  bun run guardian-cards:validate
  bun run guardian-cards:validate --families <families.json> --self-editions <self-editions.json> --love-editions <love-editions.json> --work-editions <work-editions.json> --choice-editions <choice-editions.json> --plan <plan.json> --art-pilot <art-pilot.json> --asset-contract <asset-contract.json> --asset-manifest <asset-manifest.json> --questionnaire <questionnaire.json>`)
  process.exit(0)
}

const familiesPath =
  values.families ?? fileURLToPath(new URL('../content/guardian-cards/guardian-card-families-ko.json', import.meta.url))
const selfEditionsPath =
  values['self-editions'] ??
  fileURLToPath(new URL('../content/guardian-cards/guardian-self-editions-ko.json', import.meta.url))
const loveEditionsPath =
  values['love-editions'] ??
  fileURLToPath(new URL('../content/guardian-cards/guardian-love-editions-ko.json', import.meta.url))
const workEditionsPath =
  values['work-editions'] ??
  fileURLToPath(new URL('../content/guardian-cards/guardian-work-editions-ko.json', import.meta.url))
const choiceEditionsPath =
  values['choice-editions'] ??
  fileURLToPath(new URL('../content/guardian-cards/guardian-choice-editions-ko.json', import.meta.url))
const planPath =
  values.plan ?? fileURLToPath(new URL('../content/guardian-cards/production-edition-plan.json', import.meta.url))
const artPilotPath =
  values['art-pilot'] ??
  fileURLToPath(new URL('../content/guardian-cards/production-art-pilot-plan-ko.json', import.meta.url))
const assetContractPath =
  values['asset-contract'] ??
  fileURLToPath(new URL('../content/guardian-cards/guardian-card-asset-contract.json', import.meta.url))
const assetManifestPath =
  values['asset-manifest'] ??
  fileURLToPath(new URL('../content/guardian-cards/guardian-card-assets-ko.json', import.meta.url))
const questionnairePath =
  values.questionnaire ??
  fileURLToPath(new URL('../content/guardian-questionnaires/guardian-paid-ko.json', import.meta.url))

try {
  const [
    familyJson,
    selfEditionJson,
    loveEditionJson,
    workEditionJson,
    choiceEditionJson,
    planJson,
    artPilotJson,
    assetContractJson,
    assetManifestJson,
    questionnaireJson,
  ] = await Promise.all([
    readJson(familiesPath, 'family content'),
    readJson(selfEditionsPath, 'self edition content'),
    readJson(loveEditionsPath, 'love edition content'),
    readJson(workEditionsPath, 'work edition content'),
    readJson(choiceEditionsPath, 'choice edition content'),
    readJson(planPath, 'edition plan'),
    readJson(artPilotPath, 'art pilot plan'),
    readJson(assetContractPath, 'guardian card asset contract'),
    readJson(assetManifestPath, 'guardian card asset manifest'),
    readJson(questionnairePath, 'questionnaire'),
  ])
  const familyContent = parseContent(familyContentSchema, familyJson, 'family content')
  const selfEditionContent = parseContent(selfEditionContentSchema, selfEditionJson, 'self edition content')
  const loveEditionContent = parseContent(loveEditionContentSchema, loveEditionJson, 'love edition content')
  const workEditionContent = parseContent(workEditionContentSchema, workEditionJson, 'work edition content')
  const choiceEditionContent = parseContent(choiceEditionContentSchema, choiceEditionJson, 'choice edition content')
  const editionPlan = parseContent(editionPlanSchema, planJson, 'edition plan')
  const artPilotPlan = parseContent(artPilotPlanSchema, artPilotJson, 'art pilot plan')
  const assetContract = parseContent(assetContractSchema, assetContractJson, 'guardian card asset contract')
  const assetManifest = parseContent(releaseManifestSchema, assetManifestJson, 'guardian card asset manifest')
  const questionnaireSignals = collectQuestionnaireSignals(questionnaireJson)

  validateFamilies(familyContent, questionnaireSignals)
  validateSelfEditions(selfEditionContent, familyContent, editionPlan, questionnaireSignals)
  validateLoveEditions(loveEditionContent, familyContent, editionPlan, questionnaireSignals)
  validateWorkEditions(workEditionContent, familyContent, editionPlan, questionnaireSignals)
  validateChoiceEditions(choiceEditionContent, familyContent, editionPlan, questionnaireSignals)
  validateEditionPlan(editionPlan)
  validateArtPilotPlan(artPilotPlan, selfEditionContent, loveEditionContent, workEditionContent, choiceEditionContent)
  validateAssetManifest(assetContract, assetManifest, artPilotPlan)

  const familyHash = contentHash(familyContent)
  const selfEditionHash = contentHash(selfEditionContent)
  const loveEditionHash = contentHash(loveEditionContent)
  const workEditionHash = contentHash(workEditionContent)
  const choiceEditionHash = contentHash(choiceEditionContent)
  const planHash = contentHash(editionPlan)
  const artPilotHash = contentHash(artPilotPlan)
  const assetManifestHash = contentHash(assetManifest)
  console.log(
    `validated: guardian-card-families-ko (${familyContent.locale}, ${familyContent.families.length} families, 12 per slot, sha256 ${familyHash})`,
  )
  console.log(
    `validated: guardian-self-editions-ko (${selfEditionContent.editions.length} explicit editorial drafts, sha256 ${selfEditionHash})`,
  )
  console.log(
    `validated: guardian-love-editions-ko (${loveEditionContent.editions.length} explicit editorial drafts, fixed rarity weights, sha256 ${loveEditionHash})`,
  )
  console.log(
    `validated: guardian-work-editions-ko (${workEditionContent.editions.length} explicit editorial drafts, sha256 ${workEditionHash})`,
  )
  console.log(
    `validated: guardian-choice-editions-ko (${choiceEditionContent.editions.length} explicit editorial drafts, sha256 ${choiceEditionHash})`,
  )
  console.log(
    `validated: production-edition-plan (${editionPlan.plannedEditionCount} planned editions, 576 context-scored + 480 weighted love, sha256 ${planHash})`,
  )
  console.log(
    `validated: production-art-pilot-plan-ko (${artPilotPlan.pilots.length} one-per-sign candidates, ${artPilotPlan.pilots.filter((pilot) => pilot.editorialReviewStatus === 'approved').length} editorially approved, sha256 ${artPilotHash})`,
  )
  console.log(
    `validated: guardian-card-assets-ko (${assetManifest.assetCount} WebP release candidates, sha256 ${assetManifestHash})`,
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Guardian card content validation failed')
  process.exitCode = 1
}

async function readJson(path: string, label: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${label}: ${path}`)
    }
    throw error
  }
}

function parseContent<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value)
  if (result.success) {
    return result.data
  }
  const issues = result.error.issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
  throw new Error(`Invalid ${label}:\n- ${issues.join('\n- ')}`)
}

function collectQuestionnaireSignals(value: unknown): ReadonlySet<string> {
  const signals = new Set<string>()

  function visit(node: unknown): void {
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (!isRecord(node)) {
      return
    }
    for (const [key, child] of Object.entries(node)) {
      if ((key === 'signals' || key === 'signalWeights') && isRecord(child)) {
        for (const signal of Object.keys(child)) {
          signals.add(signal)
        }
      }
      visit(child)
    }
  }

  visit(value)
  if (signals.size === 0) {
    throw new Error('Questionnaire contains no answer or selection signals')
  }
  return signals
}

function validateFamilies(content: FamilyContent, questionnaireSignals: ReadonlySet<string>): void {
  const errors: string[] = []
  const expectedIds = new Set(SIGNS.flatMap((sign) => SLOTS.map((slot) => `${sign}.${slot}`)))
  const familyIds = content.families.map((family) => family.id)

  checkUnique(familyIds, 'family id', errors)
  checkUnique(
    content.families.map((family) => family.title),
    'family title',
    errors,
  )
  for (const expectedId of expectedIds) {
    if (!familyIds.includes(expectedId)) {
      errors.push(`missing family ${expectedId}`)
    }
  }
  for (const family of content.families) {
    const expectedId = `${family.sign}.${family.slot}`
    if (family.id !== expectedId) {
      errors.push(`${family.id}: id must match sign and slot (${expectedId})`)
    }
    if (family.primaryGuardianId !== family.sign) {
      errors.push(`${family.id}: primaryGuardianId must match sign`)
    }
    if (countFocusTokens(family.oneLineTemplate) !== 1) {
      errors.push(`${family.id}: oneLineTemplate must contain exactly one focus token`)
    }
    if (hasUnsafeFocusParticle(family.oneLineTemplate)) {
      errors.push(`${family.id}: oneLineTemplate must use a josa-aware focus token before a variable particle`)
    }

    checkUnique(family.companionGuardianIds, `${family.id} companion`, errors)
    checkUnique(family.visualMotifs, `${family.id} visual motif`, errors)
    checkUnique(family.editionSignalAffinities, `${family.id} signal affinity`, errors)

    const safeCompanions = SAFE_COMPANIONS[family.sign]
    for (const companion of family.companionGuardianIds) {
      if (!safeCompanions.includes(companion)) {
        errors.push(`${family.id}: ${companion} is not an approved two-character companion`)
      }
    }
    for (const signal of family.editionSignalAffinities) {
      if (!signal.startsWith(`${family.slot}.`)) {
        errors.push(`${family.id}: signal ${signal} must belong to the ${family.slot} slot`)
      }
      if (!questionnaireSignals.has(signal)) {
        errors.push(`${family.id}: signal ${signal} does not exist in the questionnaire source`)
      }
    }
    validateCharacterContinuity(
      family.id,
      family.sign,
      `${family.baseScene} ${family.baseArtworkAlt} ${family.visualMotifs.join(' ')}`,
      errors,
    )
  }

  for (const slot of SLOTS) {
    const count = content.families.filter((family) => family.slot === slot).length
    if (count !== SIGNS.length) {
      errors.push(`${slot}: expected ${SIGNS.length} families, received ${count}`)
    }
  }

  throwValidationErrors('Guardian family content', errors)
}

function validateSelfEditions(
  content: SelfEditionContent,
  familyContent: FamilyContent,
  plan: EditionPlan,
  questionnaireSignals: ReadonlySet<string>,
): void {
  validateNonLoveEditions(content, 'self', SELF_CONTEXTS, familyContent, plan, questionnaireSignals)
}

function validateWorkEditions(
  content: WorkEditionContent,
  familyContent: FamilyContent,
  plan: EditionPlan,
  questionnaireSignals: ReadonlySet<string>,
): void {
  validateNonLoveEditions(content, 'work', WORK_CONTEXTS, familyContent, plan, questionnaireSignals)
}

function validateChoiceEditions(
  content: ChoiceEditionContent,
  familyContent: FamilyContent,
  plan: EditionPlan,
  questionnaireSignals: ReadonlySet<string>,
): void {
  validateNonLoveEditions(content, 'choice', CHOICE_CONTEXTS, familyContent, plan, questionnaireSignals)
}

function validateLoveEditions(
  content: LoveEditionContent,
  familyContent: FamilyContent,
  plan: EditionPlan,
  questionnaireSignals: ReadonlySet<string>,
): void {
  const errors: string[] = []
  const editions = content.editions
  const expectedIds = new Set(
    SIGNS.flatMap((sign) =>
      LOVE_THEMES.flatMap((theme) => RARITIES.map((rarity) => `${sign}.love.${theme}.${rarity}`)),
    ),
  )
  const familyIds = new Set(
    familyContent.families.filter((family) => family.slot === 'love').map((family) => family.id),
  )

  checkUnique(
    editions.map((edition) => edition.id),
    'love edition id',
    errors,
  )
  checkUnique(
    editions.map((edition) => edition.title),
    'love edition title',
    errors,
  )
  checkUnique(
    editions.map((edition) => edition.scene),
    'love edition scene',
    errors,
  )
  checkUnique(
    editions.map((edition) => edition.artworkAlt),
    'love edition artworkAlt',
    errors,
  )
  checkUnique(
    editions.map((edition) => edition.oneLineTemplate),
    'love edition oneLineTemplate',
    errors,
  )

  const actualIds = new Set(editions.map((edition) => edition.id))
  for (const expectedId of expectedIds) {
    if (!actualIds.has(expectedId)) {
      errors.push(`missing love edition ${expectedId}`)
    }
  }
  for (const edition of editions) {
    if (!expectedIds.has(edition.id)) {
      errors.push(`unexpected love edition ${edition.id}`)
    }
    const expectedFamilyId = `${edition.sign}.love`
    const expectedId = `${expectedFamilyId}.${edition.narrativeThemeId}.${edition.rarity}`
    if (edition.familyId !== expectedFamilyId) {
      errors.push(`${edition.id}: familyId must be ${expectedFamilyId}`)
    }
    if (edition.id !== expectedId) {
      errors.push(`${edition.id}: id must be ${expectedId}`)
    }
    if (!familyIds.has(edition.familyId)) {
      errors.push(`${edition.id}: family ${edition.familyId} does not exist in family content`)
    }
    if (edition.weight !== LOVE_RARITY_WEIGHTS[edition.rarity]) {
      errors.push(`${edition.id}: weight must be ${LOVE_RARITY_WEIGHTS[edition.rarity]}`)
    }

    if (countFocusTokens(edition.oneLineTemplate) !== 1) {
      errors.push(`${edition.id}: oneLineTemplate must contain exactly one focus token`)
    }
    const copyWithoutFocus = stripFocusToken(edition.oneLineTemplate)
    if (copyWithoutFocus.includes('{') || copyWithoutFocus.includes('}')) {
      errors.push(`${edition.id}: oneLineTemplate contains an unresolved token`)
    }
    if (edition.scene.includes('{') || edition.scene.includes('}')) {
      errors.push(`${edition.id}: scene contains an unresolved token`)
    }
    if (edition.artworkAlt.includes('{') || edition.artworkAlt.includes('}')) {
      errors.push(`${edition.id}: artworkAlt contains an unresolved token`)
    }
    validateEditorialCopy(edition, errors)
    validateCharacterContinuity(edition.id, edition.sign, `${edition.scene} ${edition.artworkAlt}`, errors)

    const guardianCount = edition.guardians.split(' · ').length
    const expectedGuardianCount =
      edition.sign === 'gemini' ||
      edition.sign === 'pisces' ||
      edition.rarity === 'eclipse' ||
      edition.rarity === 'stella'
        ? 2
        : 1
    if (guardianCount !== expectedGuardianCount) {
      errors.push(`${edition.id}: expected ${expectedGuardianCount} displayed guardians, received ${guardianCount}`)
    }
    for (const signal of edition.interpretationSignals) {
      if (!signal.startsWith('love.')) {
        errors.push(`${edition.id}: signal ${signal} must belong to the love slot`)
      }
      if (!questionnaireSignals.has(signal)) {
        errors.push(`${edition.id}: signal ${signal} does not exist in the questionnaire source`)
      }
    }
  }

  for (const familyId of familyIds) {
    const familyEditions = editions.filter((edition) => edition.familyId === familyId)
    if (familyEditions.length !== plan.love.editionCountPerFamily) {
      errors.push(
        `${familyId}: expected ${plan.love.editionCountPerFamily} editions, received ${familyEditions.length}`,
      )
    }
    const familyWeight = familyEditions.reduce((sum, edition) => sum + edition.weight, 0)
    if (familyWeight !== plan.love.weightScale) {
      errors.push(`${familyId}: rarity weights must sum to ${plan.love.weightScale}, received ${familyWeight}`)
    }
  }
  for (const theme of LOVE_THEMES) {
    const count = editions.filter((edition) => edition.narrativeThemeId === theme).length
    const expectedCount = SIGNS.length * RARITIES.length
    if (count !== expectedCount) {
      errors.push(`${theme}: expected ${expectedCount} love editions, received ${count}`)
    }
  }
  for (const rarity of RARITIES) {
    const count = editions.filter((edition) => edition.rarity === rarity).length
    const expectedCount = SIGNS.length * LOVE_THEMES.length
    if (count !== expectedCount) {
      errors.push(`${rarity}: expected ${expectedCount} love editions, received ${count}`)
    }
  }

  checkExactIds(
    plan.love.narrativeThemes.map((theme) => theme.id),
    LOVE_THEMES,
    'planned love theme',
    errors,
  )
  checkExactIds(
    plan.love.rarities.map((rarity) => rarity.id),
    RARITIES,
    'planned love rarity',
    errors,
  )
  for (const plannedRarity of plan.love.rarities) {
    if (plannedRarity.weightPerEdition !== LOVE_RARITY_WEIGHTS[plannedRarity.id]) {
      errors.push(
        `edition plan love.${plannedRarity.id}.weightPerEdition must be ${LOVE_RARITY_WEIGHTS[plannedRarity.id]}`,
      )
    }
  }
  if (content.weightScale !== plan.love.weightScale) {
    errors.push(`love content weightScale must match plan value ${plan.love.weightScale}`)
  }
  if (editions.length !== plan.love.target) {
    errors.push(`love edition count must match plan target ${plan.love.target}`)
  }

  throwValidationErrors('Guardian love edition content', errors)
}

function validateNonLoveEditions(
  content: SelfEditionContent | WorkEditionContent | ChoiceEditionContent,
  slot: 'self' | 'work' | 'choice',
  contexts: readonly string[],
  familyContent: FamilyContent,
  plan: EditionPlan,
  questionnaireSignals: ReadonlySet<string>,
): void {
  const errors: string[] = []
  const editions = content.editions
  const expectedIds = new Set(
    SIGNS.flatMap((sign) =>
      contexts.flatMap((context) => RENDER_TREATMENTS.map((treatment) => `${sign}.${slot}.${context}.${treatment}`)),
    ),
  )
  const familyIds = new Set(familyContent.families.filter((family) => family.slot === slot).map((family) => family.id))

  checkUnique(
    editions.map((edition) => edition.id),
    `${slot} edition id`,
    errors,
  )
  checkUnique(
    editions.map((edition) => edition.title),
    `${slot} edition title`,
    errors,
  )
  checkUnique(
    editions.map((edition) => edition.scene),
    `${slot} edition scene`,
    errors,
  )
  checkUnique(
    editions.map((edition) => edition.artworkAlt),
    `${slot} edition artworkAlt`,
    errors,
  )
  checkUnique(
    editions.map((edition) => edition.oneLineTemplate),
    `${slot} edition oneLineTemplate`,
    errors,
  )

  const actualIds = new Set(editions.map((edition) => edition.id))
  for (const expectedId of expectedIds) {
    if (!actualIds.has(expectedId)) {
      errors.push(`missing ${slot} edition ${expectedId}`)
    }
  }
  for (const edition of editions) {
    if (!expectedIds.has(edition.id)) {
      errors.push(`unexpected ${slot} edition ${edition.id}`)
    }
    const expectedFamilyId = `${edition.sign}.${slot}`
    const expectedId = `${expectedFamilyId}.${edition.narrativeContextId}.${edition.renderTreatmentId}`
    if (edition.familyId !== expectedFamilyId) {
      errors.push(`${edition.id}: familyId must be ${expectedFamilyId}`)
    }
    if (edition.id !== expectedId) {
      errors.push(`${edition.id}: id must be ${expectedId}`)
    }
    if (!familyIds.has(edition.familyId)) {
      errors.push(`${edition.id}: family ${edition.familyId} does not exist in family content`)
    }

    const treatmentRule = NON_LOVE_TREATMENT_RULES[edition.renderTreatmentId]
    if (edition.previewTone !== treatmentRule.previewTone) {
      errors.push(`${edition.id}: previewTone must be ${treatmentRule.previewTone}`)
    }
    if (edition.tieBreakOrder !== treatmentRule.tieBreakOrder) {
      errors.push(`${edition.id}: tieBreakOrder must be ${treatmentRule.tieBreakOrder}`)
    }
    if (countFocusTokens(edition.oneLineTemplate) !== 1) {
      errors.push(`${edition.id}: oneLineTemplate must contain exactly one focus token`)
    }
    const copyWithoutFocus = stripFocusToken(edition.oneLineTemplate)
    if (copyWithoutFocus.includes('{') || copyWithoutFocus.includes('}')) {
      errors.push(`${edition.id}: oneLineTemplate contains an unresolved token`)
    }
    if (edition.scene.includes('{') || edition.scene.includes('}')) {
      errors.push(`${edition.id}: scene contains an unresolved token`)
    }
    if (edition.artworkAlt.includes('{') || edition.artworkAlt.includes('}')) {
      errors.push(`${edition.id}: artworkAlt contains an unresolved token`)
    }
    validateEditorialCopy(edition, errors)
    validateCharacterContinuity(edition.id, edition.sign, `${edition.scene} ${edition.artworkAlt}`, errors)

    const guardianCount = edition.guardians.split(' · ').length
    const expectedGuardianCount =
      edition.sign === 'gemini' || edition.sign === 'pisces' || edition.renderTreatmentId === 'shared-world' ? 2 : 1
    if (guardianCount !== expectedGuardianCount) {
      errors.push(`${edition.id}: expected ${expectedGuardianCount} displayed guardians, received ${guardianCount}`)
    }
    for (const signal of edition.selectionSignals) {
      if (!signal.startsWith(`${slot}.`)) {
        errors.push(`${edition.id}: signal ${signal} must belong to the ${slot} slot`)
      }
      if (!questionnaireSignals.has(signal)) {
        errors.push(`${edition.id}: signal ${signal} does not exist in the questionnaire source`)
      }
    }
  }

  for (const familyId of familyIds) {
    const count = editions.filter((edition) => edition.familyId === familyId).length
    if (count !== plan.nonLove.editionCountPerFamily) {
      errors.push(`${familyId}: expected ${plan.nonLove.editionCountPerFamily} editions, received ${count}`)
    }
  }
  for (const context of contexts) {
    const count = editions.filter((edition) => edition.narrativeContextId === context).length
    if (count !== SIGNS.length * RENDER_TREATMENTS.length) {
      errors.push(`${context}: expected ${SIGNS.length * RENDER_TREATMENTS.length} editions, received ${count}`)
    }
  }
  for (const treatment of RENDER_TREATMENTS) {
    const count = editions.filter((edition) => edition.renderTreatmentId === treatment).length
    if (count !== SIGNS.length * contexts.length) {
      errors.push(`${treatment}: expected ${SIGNS.length * contexts.length} editions, received ${count}`)
    }
  }

  const plannedContexts = plan.nonLove.narrativeContextsBySlot[slot].map((context) => context.id)
  const plannedTreatments = plan.nonLove.renderTreatments.map((treatment) => treatment.id)
  for (const context of contexts) {
    if (!plannedContexts.includes(context)) {
      errors.push(`edition plan is missing ${slot} context ${context}`)
    }
  }
  for (const treatment of RENDER_TREATMENTS) {
    if (!plannedTreatments.includes(treatment)) {
      errors.push(`edition plan is missing render treatment ${treatment}`)
    }
  }
  if (editions.length !== plan.nonLove.targets[slot]) {
    errors.push(`${slot} edition count must match plan target ${plan.nonLove.targets[slot]}`)
  }

  throwValidationErrors(`Guardian ${slot} edition content`, errors)
}

function validateEditorialCopy(
  edition: {
    id: string
    title: string
    scene: string
    artworkAlt: string
    oneLineTemplate: string
    reflection: string
  },
  errors: string[],
): void {
  const lengthLimits = [
    ['title', edition.title, 30],
    ['scene', edition.scene, 160],
    ['artworkAlt', edition.artworkAlt, 110],
    ['oneLineTemplate', edition.oneLineTemplate, 120],
    ['reflection', edition.reflection, 60],
  ] as const
  for (const [field, value, maximum] of lengthLimits) {
    if (value.length > maximum) {
      errors.push(`${edition.id}: ${field} must be at most ${maximum} characters, received ${value.length}`)
    }
    if (/\r|\n|\t/.test(value)) {
      errors.push(`${edition.id}: ${field} must not contain control whitespace`)
    }
  }

  if (!/^“\{focus(?::(?:을|가|은))?\}”/.test(edition.oneLineTemplate)) {
    errors.push(`${edition.id}: oneLineTemplate must start with a quoted focus token`)
  }
  if (hasUnsafeFocusParticle(edition.oneLineTemplate)) {
    errors.push(`${edition.id}: oneLineTemplate must use a josa-aware focus token before a variable particle`)
  }
  const sentenceTerminatorCount = edition.oneLineTemplate.match(/[.!?]/g)?.length ?? 0
  if (sentenceTerminatorCount !== 2) {
    errors.push(`${edition.id}: oneLineTemplate must contain exactly two short sentences`)
  }
  if (!edition.scene.endsWith('.')) {
    errors.push(`${edition.id}: scene must end with a period`)
  }
  if (!edition.oneLineTemplate.endsWith('.')) {
    errors.push(`${edition.id}: oneLineTemplate must end with a period`)
  }
  if (!edition.reflection.endsWith('.')) {
    errors.push(`${edition.id}: reflection must end with a period`)
  }
  if (edition.artworkAlt.includes('{focus') || edition.artworkAlt.includes('“') || edition.artworkAlt.includes('”')) {
    errors.push(`${edition.id}: artworkAlt must describe only visible information`)
  }

  const adviceCopy = `${edition.oneLineTemplate} ${edition.reflection}`
  for (const phrase of FORBIDDEN_PREDICTION_PHRASES) {
    if (adviceCopy.includes(phrase)) {
      errors.push(`${edition.id}: advice copy contains deterministic phrase ${phrase}`)
    }
  }

  const masterArtworkCopy = `${edition.scene} ${edition.artworkAlt}`
  for (const phrase of FORBIDDEN_MASTER_ART_PERSONALIZATION_PHRASES) {
    if (masterArtworkCopy.includes(phrase)) {
      errors.push(`${edition.id}: master artwork copy contains personalized element ${phrase}`)
    }
  }
}

function validateCharacterContinuity(id: string, sign: (typeof SIGNS)[number], copy: string, errors: string[]): void {
  for (const trait of FORBIDDEN_CHARACTER_TRAITS[sign] ?? []) {
    if (copy.includes(trait)) {
      errors.push(`${id}: ${trait} conflicts with the ${sign} character sheet`)
    }
  }
}

function validateEditionPlan(plan: EditionPlan): void {
  const errors: string[] = []
  const renderTreatmentCount = plan.nonLove.renderTreatments.length

  checkUnique(
    plan.nonLove.renderTreatments.map((treatment) => treatment.id),
    'render treatment id',
    errors,
  )
  if (plan.nonLove.familyCountPerSlot !== SIGNS.length) {
    errors.push(`nonLove.familyCountPerSlot must be ${SIGNS.length}`)
  }
  for (const slot of NON_LOVE_SLOTS) {
    const contexts = plan.nonLove.narrativeContextsBySlot[slot]
    checkUnique(
      contexts.map((context) => context.id),
      `${slot} narrative context id`,
      errors,
    )
    const editionsPerFamily = contexts.length * renderTreatmentCount
    if (editionsPerFamily !== plan.nonLove.editionCountPerFamily) {
      errors.push(
        `${slot}: ${contexts.length} contexts × ${renderTreatmentCount} treatments must equal ${plan.nonLove.editionCountPerFamily} editions per family`,
      )
    }
    const target = plan.nonLove.familyCountPerSlot * editionsPerFamily
    if (plan.nonLove.targets[slot] !== target) {
      errors.push(`${slot}: target must be ${target}`)
    }
    validateEditionIdPattern(plan.editionIdPatterns[slot], slot, false, errors)
  }

  const nonLoveTarget = NON_LOVE_SLOTS.reduce((sum, slot) => sum + plan.nonLove.targets[slot], 0)
  if (plan.nonLove.targets.total !== nonLoveTarget) {
    errors.push(`nonLove.targets.total must be ${nonLoveTarget}`)
  }

  checkUnique(
    plan.love.narrativeThemes.map((theme) => theme.id),
    'love narrative theme id',
    errors,
  )
  checkUnique(
    plan.love.rarities.map((rarity) => rarity.id),
    'love rarity id',
    errors,
  )
  for (const rarity of RARITIES) {
    if (!plan.love.rarities.some((candidate) => candidate.id === rarity)) {
      errors.push(`love: missing rarity ${rarity}`)
    }
  }

  const loveEditionsPerFamily = plan.love.rarities.reduce((sum, rarity) => sum + rarity.editionCountPerFamily, 0)
  if (loveEditionsPerFamily !== plan.love.editionCountPerFamily) {
    errors.push(`love: rarity edition counts must sum to ${plan.love.editionCountPerFamily}`)
  }
  for (const rarity of plan.love.rarities) {
    if (rarity.editionCountPerFamily !== plan.love.narrativeThemes.length) {
      errors.push(
        `love.${rarity.id}: editionCountPerFamily must match ${plan.love.narrativeThemes.length} narrative themes`,
      )
    }
    const expectedTotalWeight = rarity.editionCountPerFamily * rarity.weightPerEdition
    if (rarity.totalWeightPerFamily !== expectedTotalWeight) {
      errors.push(`love.${rarity.id}: totalWeightPerFamily must be ${expectedTotalWeight}`)
    }
  }
  const loveWeight = plan.love.rarities.reduce((sum, rarity) => sum + rarity.totalWeightPerFamily, 0)
  if (loveWeight !== plan.love.weightScale) {
    errors.push(`love rarity weights must sum to ${plan.love.weightScale}, received ${loveWeight}`)
  }
  const stellaPlan = plan.love.rarities.find((rarity) => rarity.id === 'stella')
  if (
    !stellaPlan?.artDirection.includes('비개인화 광륜') ||
    !stellaPlan.artDirection.includes('별도 오버레이') ||
    stellaPlan.artDirection.includes('개인 차트')
  ) {
    errors.push('love.stella: master artwork must use a non-personalized halo and keep birth-chart data in an overlay')
  }
  const loveTarget = plan.love.familyCount * plan.love.editionCountPerFamily
  if (plan.love.target !== loveTarget) {
    errors.push(`love.target must be ${loveTarget}`)
  }
  validateEditionIdPattern(plan.editionIdPatterns.love, 'love', true, errors)

  const computedTargets = {
    self: plan.nonLove.targets.self,
    love: plan.love.target,
    work: plan.nonLove.targets.work,
    choice: plan.nonLove.targets.choice,
  }
  for (const slot of SLOTS) {
    if (plan.slotTargets[slot] !== computedTargets[slot]) {
      errors.push(`slotTargets.${slot} must be ${computedTargets[slot]}`)
    }
  }
  const total = SLOTS.reduce((sum, slot) => sum + computedTargets[slot], 0)
  if (plan.slotTargets.total !== total) {
    errors.push(`slotTargets.total must be ${total}`)
  }
  if (plan.plannedEditionCount !== total) {
    errors.push(`plannedEditionCount must be ${total}`)
  }
  if (total < plan.productionMinimumEditionCount) {
    errors.push(`planned edition count ${total} is below production minimum ${plan.productionMinimumEditionCount}`)
  }

  const requiredFields = ['id', 'familyId', 'slot', 'rarity', 'artworkPath', 'title', 'artworkAlt', 'oneLine']
  for (const field of requiredFields) {
    if (!plan.materializationContract.requiredPerEditionFields.includes(field)) {
      errors.push(`materializationContract is missing required field ${field}`)
    }
  }

  throwValidationErrors('Guardian production edition plan', errors)
}

function validateArtPilotPlan(
  plan: ArtPilotPlan,
  selfContent: SelfEditionContent,
  loveContent: LoveEditionContent,
  workContent: WorkEditionContent,
  choiceContent: ChoiceEditionContent,
): void {
  const errors: string[] = []
  const allEditions: AnyEdition[] = [
    ...selfContent.editions,
    ...loveContent.editions,
    ...workContent.editions,
    ...choiceContent.editions,
  ]
  const editionById = new Map(allEditions.map((edition) => [edition.id, edition]))

  checkExactIds(
    plan.pilots.map((pilot) => String(pilot.order)),
    Array.from({ length: SIGNS.length }, (_, index) => String(index + 1)),
    'art pilot order',
    errors,
  )
  checkUnique(
    plan.pilots.map((pilot) => pilot.editionId),
    'art pilot edition id',
    errors,
  )
  checkExactIds(
    plan.pilots.map((pilot) => pilot.sign),
    SIGNS,
    'art pilot sign',
    errors,
  )
  checkUnique(
    plan.pilots.map((pilot) => pilot.selectionReason),
    'art pilot selection reason',
    errors,
  )

  const loveRarities: string[] = []
  const nonLoveTreatments = new Set<string>()
  for (const pilot of plan.pilots) {
    const edition = editionById.get(pilot.editionId)
    if (!edition) {
      errors.push(`${pilot.editionId}: art pilot edition does not exist`)
      continue
    }
    if (pilot.sign !== edition.sign) {
      errors.push(`${pilot.editionId}: pilot sign must match ${edition.sign}`)
    }
    if (pilot.slot !== edition.slot) {
      errors.push(`${pilot.editionId}: pilot slot must match ${edition.slot}`)
    }
    if (edition.editorialStatus !== 'draft' || edition.assetStatus !== 'not_started' || edition.artworkPath !== null) {
      errors.push(`${pilot.editionId}: pilot source must remain an unproduced editorial draft`)
    }
    const expectedEditorialHash = editorialContentHash(edition)
    if (pilot.editorialContentHash !== expectedEditorialHash) {
      errors.push(
        `${pilot.editionId}: editorialContentHash must match current reviewed copy (${expectedEditorialHash})`,
      )
    }
    const guardianCount = edition.guardians.split(' · ').length
    if (guardianCount > plan.renderContract.maximumDisplayedGuardians) {
      errors.push(
        `${pilot.editionId}: ${guardianCount} guardians exceed pilot maximum ${plan.renderContract.maximumDisplayedGuardians}`,
      )
    }

    if (edition.slot === 'love') {
      loveRarities.push(edition.rarity)
    } else {
      nonLoveTreatments.add(edition.renderTreatmentId)
    }
  }

  for (const slot of SLOTS) {
    const count = plan.pilots.filter((pilot) => pilot.slot === slot).length
    if (count !== ART_PILOT_SLOT_TARGETS[slot]) {
      errors.push(`${slot}: expected ${ART_PILOT_SLOT_TARGETS[slot]} art pilots, received ${count}`)
    }
  }
  checkExactIds(loveRarities, RARITIES, 'art pilot love rarity', errors)
  for (const treatment of RENDER_TREATMENTS) {
    if (!nonLoveTreatments.has(treatment)) {
      errors.push(`art pilot plan is missing non-love treatment ${treatment}`)
    }
  }

  throwValidationErrors('Guardian production art pilot plan', errors)
}

function validateAssetManifest(
  contract: z.infer<typeof assetContractSchema>,
  manifest: z.infer<typeof releaseManifestSchema>,
  pilotPlan: ArtPilotPlan,
): void {
  const errors: string[] = []
  if (contract.plannedAssetCount !== 1056) {
    errors.push('asset contract plannedAssetCount must be 1056')
  }
  if (manifest.assetCount !== manifest.assets.length) {
    errors.push(`asset manifest count ${manifest.assetCount} does not match ${manifest.assets.length} entries`)
  }
  if (manifest.contentType !== contract.deliveryContract.mimeType) {
    errors.push('asset manifest contentType must match the delivery contract')
  }
  if (manifest.cacheControl !== contract.deliveryContract.cacheControl) {
    errors.push('asset manifest cacheControl must match the delivery contract')
  }
  if (
    pilotPlan.deliveryReviewContract.provider !== contract.provider ||
    pilotPlan.deliveryReviewContract.format !== contract.deliveryContract.format ||
    pilotPlan.deliveryReviewContract.objectKeyTemplate !== contract.objectKeyTemplate
  ) {
    errors.push('pilot delivery review contract must match the shared R2 asset contract')
  }

  checkUnique(
    manifest.assets.map((asset) => asset.editionId),
    'guardian asset edition id',
    errors,
  )
  checkUnique(
    manifest.assets.map((asset) => asset.objectKey),
    'guardian asset object key',
    errors,
  )

  const pilotById = new Map(pilotPlan.pilots.map((pilot) => [pilot.editionId, pilot]))
  for (const asset of manifest.assets) {
    const legacyKey = contract.legacyObjectKeyTemplate.replace('{editionId}', asset.editionId)
    const contentAddressedKey = contract.objectKeyTemplate
      .replace('{editionId}', asset.editionId)
      .replace('{deliverySha256_12}', asset.deliveryArtworkSha256.slice(0, 12))
    if (asset.objectKey !== legacyKey && asset.objectKey !== contentAddressedKey) {
      errors.push(`${asset.editionId}: objectKey must be the preserved legacy key or ${contentAddressedKey}`)
    }
    if (
      asset.width !== contract.deliveryContract.width ||
      asset.height !== contract.deliveryContract.height ||
      !asset.objectKey.endsWith('.webp')
    ) {
      errors.push(`${asset.editionId}: delivery must be a 1080x1440 WebP`)
    }

    const pilot = pilotById.get(asset.editionId)
    if (pilot && asset.sourceArtworkSha256 !== pilot.approvedArtworkSha256) {
      errors.push(`${asset.editionId}: release source hash must match the visually approved pilot artwork`)
    }
  }

  if (manifest.assetCount === pilotPlan.pilots.length) {
    checkExactIds(
      manifest.assets.map((asset) => asset.editionId),
      pilotPlan.pilots.map((pilot) => pilot.editionId),
      'pilot release asset',
      errors,
    )
  }

  throwValidationErrors('Guardian card asset manifest', errors)
}

function validateEditionIdPattern(pattern: string, slot: string, isLove: boolean, errors: string[]): void {
  const requiredTokens = isLove
    ? ['{familyId}', '{narrativeThemeId}', '{rarityId}']
    : ['{familyId}', '{narrativeContextId}', '{renderTreatmentId}']
  for (const token of requiredTokens) {
    if (countOccurrences(pattern, token) !== 1) {
      errors.push(`${slot} edition ID pattern must contain ${token} exactly once`)
    }
  }
}

function checkExactIds(actual: readonly string[], expected: readonly string[], label: string, errors: string[]): void {
  checkUnique(actual, label, errors)
  for (const value of expected) {
    if (!actual.includes(value)) {
      errors.push(`missing ${label}: ${value}`)
    }
  }
  for (const value of actual) {
    if (!expected.includes(value)) {
      errors.push(`unexpected ${label}: ${value}`)
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

function countFocusTokens(value: string): number {
  return value.match(FOCUS_TOKEN_PATTERN)?.length ?? 0
}

function stripFocusToken(value: string): string {
  return value.replace(FOCUS_TOKEN_PATTERN, '')
}

function hasUnsafeFocusParticle(value: string): boolean {
  return /\{focus\}”[을이를가은는]/.test(value)
}

function countOccurrences(value: string, token: string): number {
  return value.split(token).length - 1
}

function throwValidationErrors(label: string, errors: readonly string[]): void {
  if (errors.length > 0) {
    throw new Error(`${label} is invalid:\n- ${errors.join('\n- ')}`)
  }
}

function contentHash(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function editorialContentHash(edition: AnyEdition): string {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
