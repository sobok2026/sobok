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
const CONTEXTS = ['present-weather', 'hidden-need', 'coping-pattern', 'next-self'] as const
const TREATMENTS = ['close-emotion', 'action-beat', 'shared-world', 'constellation-afterglow'] as const
const PREVIEW_TONES = ['comfort', 'honesty', 'action', 'possibility'] as const
const FOCUS_TOKEN_PATTERN = /\{focus(?::(?:을|가|은))?\}/g
const SHARED_BEAT_TOKEN = '{sharedBeat}'
const SHARED_ARTWORK_ALT_TOKEN = '{sharedArtworkAlt}'

const nonEmptyText = z.string().trim().min(1)
const blueprintSchema = z
  .object({
    status: z.literal('authoring'),
    locale: z.literal('ko'),
    slot: z.literal('self'),
    treatments: z
      .array(
        z
          .object({
            id: z.enum(TREATMENTS),
            titleSuffix: nonEmptyText,
            previewTone: z.enum(PREVIEW_TONES),
            sceneSuffix: nonEmptyText,
            artworkAltSuffix: nonEmptyText,
            oneLineAction: z.string().trim().min(20),
          })
          .strict(),
      )
      .length(TREATMENTS.length),
    families: z
      .array(
        z
          .object({
            familyId: nonEmptyText,
            sign: z.enum(SIGNS),
            guardians: nonEmptyText,
            sharedGuardians: nonEmptyText,
            sharedBeat: z.string().trim().min(20),
            sharedArtworkAlt: z.string().trim().min(15),
            contexts: z
              .array(
                z
                  .object({
                    id: z.enum(CONTEXTS),
                    titleStem: nonEmptyText,
                    sceneCore: z.string().trim().min(30),
                    artworkAltCore: z.string().trim().min(20),
                    oneLineInsightTemplate: z.string().trim().min(25),
                    reflection: z.string().trim().min(15),
                    selectionSignals: z.array(nonEmptyText).length(2),
                  })
                  .strict(),
              )
              .length(CONTEXTS.length),
          })
          .strict(),
      )
      .length(SIGNS.length),
  })
  .strict()

type Blueprint = z.infer<typeof blueprintSchema>

const { values } = parseArgs({
  options: {
    blueprint: { type: 'string' },
    output: { type: 'string' },
    write: { type: 'boolean', default: false },
    check: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help) {
  console.log(`Usage:
  bun run guardian-cards:materialize-self
  bun run scripts/materialize-guardian-self-editions.ts --check`)
  process.exit(0)
}
if (values.write && values.check) {
  throw new Error('--write and --check cannot be used together')
}

const blueprintPath =
  values.blueprint ??
  fileURLToPath(new URL('../content/guardian-cards/guardian-self-edition-blueprints-ko.json', import.meta.url))
const outputPath =
  values.output ?? fileURLToPath(new URL('../content/guardian-cards/guardian-self-editions-ko.json', import.meta.url))

try {
  const blueprint = parseBlueprint(await readFile(blueprintPath, 'utf8'))
  validateBlueprint(blueprint)
  const output = `${formatGeneratedJson(materialize(blueprint))}\n`

  if (values.write) {
    await writeFile(outputPath, output, 'utf8')
    console.log(`materialized: ${outputPath} (192 editorial drafts)`)
  } else {
    const existing = await readFile(outputPath, 'utf8')
    if (existing !== output) {
      throw new Error(
        `Self edition materialization is stale: run bun run guardian-cards:materialize-self and commit ${outputPath}`,
      )
    }
    console.log('checked: guardian-self-editions-ko (192 editorial drafts, materialization current)')
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Self edition materialization failed')
  process.exitCode = 1
}

function parseBlueprint(raw: string): Blueprint {
  let value: unknown
  try {
    value = JSON.parse(raw) as unknown
  } catch {
    throw new Error(`Invalid JSON in self edition blueprint: ${blueprintPath}`)
  }
  const result = blueprintSchema.safeParse(value)
  if (result.success) {
    return result.data
  }
  const issues = result.error.issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
  throw new Error(`Invalid self edition blueprint:\n- ${issues.join('\n- ')}`)
}

function validateBlueprint(blueprint: Blueprint): void {
  const errors: string[] = []
  checkExactIds(
    blueprint.treatments.map((treatment) => treatment.id),
    TREATMENTS,
    'treatment',
    errors,
  )
  checkUnique(
    blueprint.treatments.map((treatment) => treatment.previewTone),
    'preview tone',
    errors,
  )
  checkExactIds(
    blueprint.families.map((family) => family.sign),
    SIGNS,
    'sign',
    errors,
  )
  checkUnique(
    blueprint.families.map((family) => family.familyId),
    'family id',
    errors,
  )
  checkUnique(
    blueprint.families.flatMap((family) => family.contexts.map((context) => context.titleStem)),
    'title stem',
    errors,
  )

  for (const treatment of blueprint.treatments) {
    const expectsSharedTokens = treatment.id === 'shared-world'
    if (treatment.sceneSuffix.includes(SHARED_BEAT_TOKEN) !== expectsSharedTokens) {
      errors.push(`${treatment.id}: sceneSuffix shared token contract is invalid`)
    }
    if (treatment.artworkAltSuffix.includes(SHARED_ARTWORK_ALT_TOKEN) !== expectsSharedTokens) {
      errors.push(`${treatment.id}: artworkAltSuffix shared token contract is invalid`)
    }
  }

  for (const family of blueprint.families) {
    if (family.familyId !== `${family.sign}.self`) {
      errors.push(`${family.familyId}: family id must match ${family.sign}.self`)
    }
    checkExactIds(
      family.contexts.map((context) => context.id),
      CONTEXTS,
      `${family.familyId} context`,
      errors,
    )
    for (const context of family.contexts) {
      if (countFocusTokens(context.oneLineInsightTemplate) !== 1) {
        errors.push(`${family.familyId}.${context.id}: oneLineInsightTemplate must contain one focus token`)
      }
      for (const signal of context.selectionSignals) {
        if (!signal.startsWith('self.')) {
          errors.push(`${family.familyId}.${context.id}: ${signal} is not a self signal`)
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Self edition blueprint is invalid:\n- ${errors.join('\n- ')}`)
  }
}

function materialize(blueprint: Blueprint) {
  const editions = blueprint.families.flatMap((family) =>
    family.contexts.flatMap((context) =>
      blueprint.treatments.map((treatment, treatmentIndex) => {
        const sceneSuffix = treatment.sceneSuffix.replaceAll(SHARED_BEAT_TOKEN, family.sharedBeat)
        const artworkAltSuffix = treatment.artworkAltSuffix.replaceAll(
          SHARED_ARTWORK_ALT_TOKEN,
          family.sharedArtworkAlt,
        )
        const isShared = treatment.id === 'shared-world'
        return {
          id: `${family.familyId}.${context.id}.${treatment.id}`,
          familyId: family.familyId,
          sign: family.sign,
          slot: 'self' as const,
          narrativeContextId: context.id,
          renderTreatmentId: treatment.id,
          previewTone: treatment.previewTone,
          tieBreakOrder: treatmentIndex,
          rarity: null,
          editorialStatus: 'draft' as const,
          assetStatus: 'not_started' as const,
          artworkPath: null,
          title: `${context.titleStem} · ${treatment.titleSuffix}`,
          guardians: isShared ? family.sharedGuardians : family.guardians,
          scene: `${context.sceneCore} ${sceneSuffix}`,
          artworkAlt: `${context.artworkAltCore}, ${artworkAltSuffix}`,
          oneLineTemplate: `${context.oneLineInsightTemplate} ${treatment.oneLineAction}`,
          reflection: context.reflection,
          selectionSignals: context.selectionSignals,
        }
      }),
    ),
  )

  return {
    status: 'editorial_draft',
    locale: blueprint.locale,
    slot: blueprint.slot,
    assetPolicy: 'Artwork paths stay null until a reviewed 3:4 private-storage object exists.',
    editionCount: editions.length,
    editions,
  }
}

function formatGeneratedJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(
    /"selectionSignals": \[\n\s+"([^"]+)",\n\s+"([^"]+)"\n\s+\]/g,
    '"selectionSignals": ["$1", "$2"]',
  )
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
