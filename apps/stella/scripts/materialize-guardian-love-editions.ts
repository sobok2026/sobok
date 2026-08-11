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
const THEMES = [
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
const RARITIES = ['orbit', 'nebula', 'eclipse', 'stella'] as const
const RARITY_WEIGHTS = {
  orbit: 550,
  nebula: 300,
  eclipse: 120,
  stella: 30,
} as const satisfies Record<(typeof RARITIES)[number], number>
const FOCUS_TOKEN_PATTERN = /\{focus(?::(?:을|가|은))?\}/g
const NEBULA_BEAT_TOKEN = '{nebulaBeat}'
const NEBULA_ARTWORK_ALT_TOKEN = '{nebulaArtworkAlt}'
const SHARED_BEAT_TOKEN = '{sharedBeat}'
const SHARED_ARTWORK_ALT_TOKEN = '{sharedArtworkAlt}'
const STELLA_BEAT_TOKEN = '{stellaBeat}'
const STELLA_ARTWORK_ALT_TOKEN = '{stellaArtworkAlt}'
const WEIGHT_SCALE = 10_000

const nonEmptyText = z.string().trim().min(1)
const blueprintSchema = z
  .object({
    status: z.literal('authoring'),
    locale: z.literal('ko'),
    slot: z.literal('love'),
    rarities: z
      .array(
        z
          .object({
            id: z.enum(RARITIES),
            titleSuffix: nonEmptyText,
            weight: z.number().int().positive(),
            sceneSuffix: nonEmptyText,
            artworkAltSuffix: nonEmptyText,
            oneLineAction: z.string().trim().min(20),
          })
          .strict(),
      )
      .length(RARITIES.length),
    families: z
      .array(
        z
          .object({
            familyId: nonEmptyText,
            sign: z.enum(SIGNS),
            guardians: nonEmptyText,
            sharedGuardians: nonEmptyText,
            nebulaBeat: z.string().trim().min(20),
            nebulaArtworkAlt: z.string().trim().min(15),
            sharedBeat: z.string().trim().min(20),
            sharedArtworkAlt: z.string().trim().min(15),
            stellaBeat: z.string().trim().min(20),
            stellaArtworkAlt: z.string().trim().min(15),
            themes: z
              .array(
                z
                  .object({
                    id: z.enum(THEMES),
                    titleStem: nonEmptyText,
                    sceneCore: z.string().trim().min(30),
                    artworkAltCore: z.string().trim().min(20),
                    oneLineInsightTemplate: z.string().trim().min(25),
                    reflection: z.string().trim().min(15),
                    interpretationSignals: z.array(nonEmptyText).length(2),
                  })
                  .strict(),
              )
              .length(THEMES.length),
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
  bun run guardian-cards:materialize-love
  bun run scripts/materialize-guardian-love-editions.ts --check`)
  process.exit(0)
}
if (values.write && values.check) {
  throw new Error('--write and --check cannot be used together')
}

const blueprintPath =
  values.blueprint ??
  fileURLToPath(new URL('../content/guardian-cards/guardian-love-edition-blueprints-ko.json', import.meta.url))
const outputPath =
  values.output ?? fileURLToPath(new URL('../content/guardian-cards/guardian-love-editions-ko.json', import.meta.url))

try {
  const blueprint = parseBlueprint(await readFile(blueprintPath, 'utf8'))
  validateBlueprint(blueprint)
  const output = `${formatGeneratedJson(materialize(blueprint))}\n`

  if (values.write) {
    await writeFile(outputPath, output, 'utf8')
    console.log(`materialized: ${outputPath} (480 editorial drafts)`)
  } else {
    const existing = await readFile(outputPath, 'utf8')
    if (existing !== output) {
      throw new Error(
        `Love edition materialization is stale: run bun run guardian-cards:materialize-love and commit ${outputPath}`,
      )
    }
    console.log('checked: guardian-love-editions-ko (480 editorial drafts, materialization current)')
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Love edition materialization failed')
  process.exitCode = 1
}

function parseBlueprint(raw: string): Blueprint {
  let value: unknown
  try {
    value = JSON.parse(raw) as unknown
  } catch {
    throw new Error(`Invalid JSON in love edition blueprint: ${blueprintPath}`)
  }
  const result = blueprintSchema.safeParse(value)
  if (result.success) {
    return result.data
  }
  const issues = result.error.issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
  throw new Error(`Invalid love edition blueprint:\n- ${issues.join('\n- ')}`)
}

function validateBlueprint(blueprint: Blueprint): void {
  const errors: string[] = []
  checkExactIds(
    blueprint.rarities.map((rarity) => rarity.id),
    RARITIES,
    'rarity',
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
    blueprint.families.flatMap((family) => family.themes.map((theme) => theme.titleStem)),
    'title stem',
    errors,
  )

  for (const rarity of blueprint.rarities) {
    if (rarity.weight !== RARITY_WEIGHTS[rarity.id]) {
      errors.push(`${rarity.id}: weight must be ${RARITY_WEIGHTS[rarity.id]}`)
    }
    const expectedSceneToken = {
      orbit: null,
      nebula: NEBULA_BEAT_TOKEN,
      eclipse: SHARED_BEAT_TOKEN,
      stella: STELLA_BEAT_TOKEN,
    }[rarity.id]
    const expectedArtworkAltToken = {
      orbit: null,
      nebula: NEBULA_ARTWORK_ALT_TOKEN,
      eclipse: SHARED_ARTWORK_ALT_TOKEN,
      stella: STELLA_ARTWORK_ALT_TOKEN,
    }[rarity.id]
    validateTokenContract(rarity.sceneSuffix, expectedSceneToken, `${rarity.id}.sceneSuffix`, errors)
    validateTokenContract(rarity.artworkAltSuffix, expectedArtworkAltToken, `${rarity.id}.artworkAltSuffix`, errors)
  }

  for (const family of blueprint.families) {
    if (family.familyId !== `${family.sign}.love`) {
      errors.push(`${family.familyId}: family id must match ${family.sign}.love`)
    }
    checkExactIds(
      family.themes.map((theme) => theme.id),
      THEMES,
      `${family.familyId} theme`,
      errors,
    )
    for (const theme of family.themes) {
      if (countFocusTokens(theme.oneLineInsightTemplate) !== 1) {
        errors.push(`${family.familyId}.${theme.id}: oneLineInsightTemplate must contain one focus token`)
      }
      for (const signal of theme.interpretationSignals) {
        if (!signal.startsWith('love.')) {
          errors.push(`${family.familyId}.${theme.id}: ${signal} is not a love signal`)
        }
      }
    }
  }

  const familyWeight = blueprint.rarities.reduce((sum, rarity) => sum + rarity.weight * THEMES.length, 0)
  if (familyWeight !== WEIGHT_SCALE) {
    errors.push(`love family weights must sum to ${WEIGHT_SCALE}, received ${familyWeight}`)
  }
  if (errors.length > 0) {
    throw new Error(`Love edition blueprint is invalid:\n- ${errors.join('\n- ')}`)
  }
}

function materialize(blueprint: Blueprint) {
  const editions = blueprint.families.flatMap((family) =>
    family.themes.flatMap((theme) =>
      blueprint.rarities.map((rarity) => {
        const sceneSuffix = substituteRarityCopy(rarity.sceneSuffix, family)
        const artworkAltSuffix = substituteRarityCopy(rarity.artworkAltSuffix, family)
        const usesSharedGuardians = rarity.id === 'eclipse' || rarity.id === 'stella'

        return {
          id: `${family.familyId}.${theme.id}.${rarity.id}`,
          familyId: family.familyId,
          sign: family.sign,
          slot: 'love' as const,
          narrativeThemeId: theme.id,
          rarity: rarity.id,
          weight: rarity.weight,
          editorialStatus: 'draft' as const,
          assetStatus: 'not_started' as const,
          artworkPath: null,
          title: `${theme.titleStem} · ${rarity.titleSuffix}`,
          guardians: usesSharedGuardians ? family.sharedGuardians : family.guardians,
          scene: `${theme.sceneCore} ${sceneSuffix}`,
          artworkAlt: `${theme.artworkAltCore}, ${artworkAltSuffix}`,
          oneLineTemplate: `${theme.oneLineInsightTemplate} ${rarity.oneLineAction}`,
          reflection: theme.reflection,
          interpretationSignals: theme.interpretationSignals,
        }
      }),
    ),
  )

  return {
    status: 'editorial_draft',
    locale: blueprint.locale,
    slot: blueprint.slot,
    oddsPolicy: 'Questionnaire signals guide interpretation only; rarity selection uses fixed weights.',
    weightScale: WEIGHT_SCALE,
    assetPolicy: 'Artwork paths stay null until a reviewed 3:4 private-storage object exists.',
    editionCount: editions.length,
    editions,
  }
}

function substituteRarityCopy(value: string, family: Blueprint['families'][number]): string {
  return value
    .replaceAll(NEBULA_BEAT_TOKEN, family.nebulaBeat)
    .replaceAll(NEBULA_ARTWORK_ALT_TOKEN, family.nebulaArtworkAlt)
    .replaceAll(SHARED_BEAT_TOKEN, family.sharedBeat)
    .replaceAll(SHARED_ARTWORK_ALT_TOKEN, family.sharedArtworkAlt)
    .replaceAll(STELLA_BEAT_TOKEN, family.stellaBeat)
    .replaceAll(STELLA_ARTWORK_ALT_TOKEN, family.stellaArtworkAlt)
}

function validateTokenContract(value: string, expected: string | null, label: string, errors: string[]): void {
  if (expected !== null && countOccurrences(value, expected) !== 1) {
    errors.push(`${label} must contain ${expected} exactly once`)
  }
  const copyWithoutExpected = expected === null ? value : value.replace(expected, '')
  if (copyWithoutExpected.includes('{') || copyWithoutExpected.includes('}')) {
    errors.push(`${label} contains an unexpected token`)
  }
}

function formatGeneratedJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(
    /"interpretationSignals": \[\n\s+"([^"]+)",\n\s+"([^"]+)"\n\s+\]/g,
    '"interpretationSignals": ["$1", "$2"]',
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

function countOccurrences(value: string, token: string): number {
  return value.split(token).length - 1
}

function countFocusTokens(value: string): number {
  return value.match(FOCUS_TOKEN_PATTERN)?.length ?? 0
}
