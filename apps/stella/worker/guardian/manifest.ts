import type { Locale } from '@sobok/domain/locale'
import { z } from 'zod'
import {
  GUARDIAN_DAILY_RARITIES,
  GUARDIAN_DAILY_THEMES,
  GUARDIAN_DAILY_TONES,
  GUARDIAN_ZODIAC_SIGNS,
  type GuardianDailyRarity,
  type GuardianDailyTheme,
  type GuardianDailyTone,
  type GuardianZodiacSign,
} from './daily-contract'
import runtimeCatalogSource from './runtime-catalog.generated.json'

const nonEmptyText = z.string().trim().min(1)
const copySchema = z
  .object({
    title: nonEmptyText,
    guardians: nonEmptyText,
    artworkAlt: nonEmptyText,
    oneLineTemplate: nonEmptyText,
    reflection: nonEmptyText,
  })
  .strict()
const source = z
  .object({
    schema: z.literal('stella-guardian-daily-runtime-catalog/v1'),
    locale: z.literal('ko'),
    families: z.array(
      z
        .object({
          id: nonEmptyText,
          sign: z.enum(GUARDIAN_ZODIAC_SIGNS),
          theme: z.enum(GUARDIAN_DAILY_THEMES),
        })
        .strict(),
    ),
    editions: z.array(
      z
        .object({
          id: nonEmptyText,
          familyId: nonEmptyText,
          sign: z.enum(GUARDIAN_ZODIAC_SIGNS),
          theme: z.enum(GUARDIAN_DAILY_THEMES),
          contextId: nonEmptyText,
          tone: z.enum(GUARDIAN_DAILY_TONES),
          rarity: z.enum(GUARDIAN_DAILY_RARITIES).nullable(),
          weight: z.number().int().positive(),
          artworkObjectKey: nonEmptyText,
          copy: copySchema,
        })
        .strict(),
    ),
  })
  .passthrough()
  .parse(runtimeCatalogSource)

export type GuardianDailyFamily = {
  id: string
  sign: GuardianZodiacSign
  theme: GuardianDailyTheme
}

export type GuardianDailyEdition = {
  id: string
  familyId: string
  sign: GuardianZodiacSign
  theme: GuardianDailyTheme
  contextId: string
  tone: GuardianDailyTone
  rarity: GuardianDailyRarity | null
  weight: number
  artworkObjectKey: string
  copy: {
    title: string
    guardians: string
    artworkAlt: string
    oneLineTemplate: string
    reflection: string
  }
}

const families = source.families satisfies GuardianDailyFamily[]
const editions = source.editions satisfies GuardianDailyEdition[]
const familyById = new Map(families.map((family) => [family.id, family]))
const editionsByFamily = new Map<string, GuardianDailyEdition[]>()

for (const edition of editions) {
  const family = familyById.get(edition.familyId)
  if (!family || family.sign !== edition.sign || family.theme !== edition.theme) {
    throw new Error(`Guardian daily edition has an invalid family: ${edition.id}`)
  }
  const pool = editionsByFamily.get(edition.familyId) ?? []
  pool.push(edition)
  editionsByFamily.set(edition.familyId, pool)
}

if (families.length !== 48 || editions.length !== 1_056) {
  throw new Error('Guardian daily catalog must contain 48 families and 1,056 editions')
}

const expectedToneCounts: Record<GuardianDailyTheme, Record<GuardianDailyTone, number>> = {
  self: { comfort: 4, honesty: 4, action: 4, possibility: 4 },
  work: { comfort: 4, honesty: 4, action: 4, possibility: 4 },
  choice: { comfort: 4, honesty: 4, action: 4, possibility: 4 },
  love: { comfort: 12, honesty: 12, action: 8, possibility: 8 },
}

for (const sign of GUARDIAN_ZODIAC_SIGNS) {
  for (const theme of GUARDIAN_DAILY_THEMES) {
    const familyId = `${sign}.${theme}`
    const family = familyById.get(familyId)
    const pool = editionsByFamily.get(familyId) ?? []
    const expectedSize = theme === 'love' ? 40 : 16
    if (!family || pool.length !== expectedSize) {
      throw new Error(`Guardian daily catalog is missing ${familyId}`)
    }
    for (const tone of GUARDIAN_DAILY_TONES) {
      const count = pool.filter((edition) => edition.tone === tone).length
      if (count !== expectedToneCounts[theme][tone]) {
        throw new Error(`Guardian daily catalog ${familyId} has ${count} ${tone} editions`)
      }
    }
    for (const edition of pool) {
      if (theme === 'love') {
        if (!edition.rarity || edition.weight !== rarityWeight(edition.rarity)) {
          throw new Error(`Guardian love edition has invalid rarity weight: ${edition.id}`)
        }
      } else if (edition.rarity !== null || edition.weight !== 1) {
        throw new Error(`Guardian daily edition has unexpected rarity metadata: ${edition.id}`)
      }
    }
  }
}

export const CURRENT_GUARDIAN_DAILY_CATALOG = {
  supportedLocales: ['ko'] as const satisfies readonly Locale[],
  families,
  editions,
}

export function guardianDailyPool(familyId: string): readonly GuardianDailyEdition[] {
  const pool = editionsByFamily.get(familyId)
  if (!pool) throw new Error(`Unknown guardian daily family: ${familyId}`)
  return pool
}

export function guardianArtworkUrl(artworkObjectKey: string, assetOrigin: string): string {
  if (
    artworkObjectKey.startsWith('/') ||
    artworkObjectKey.includes('\\') ||
    artworkObjectKey.split('/').includes('..')
  ) {
    throw new Error('Guardian artwork object key is unsafe')
  }
  const normalizedOrigin = assetOrigin.trim()
  if (!normalizedOrigin) throw new Error('Guardian asset origin is empty')
  const base = new URL(normalizedOrigin.endsWith('/') ? normalizedOrigin : `${normalizedOrigin}/`)
  if (base.protocol !== 'https:' && base.hostname !== 'localhost') {
    throw new Error('Guardian asset origin must use HTTPS')
  }
  return new URL(artworkObjectKey, base).toString()
}

function rarityWeight(rarity: GuardianDailyRarity): number {
  return { orbit: 550, nebula: 300, eclipse: 120, stella: 30 }[rarity]
}
