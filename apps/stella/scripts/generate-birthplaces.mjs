import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  createChineseAdministrativeCatalog,
  createJapaneseAdministrativeCatalog,
  createKoreanAdministrativeCatalog,
} from './birthplaces/administrative-catalogs.mjs'
import { createEnglishCatalog, createOfficialPlaces, parseAdministrativeCodes } from './birthplaces/geonames.mjs'
import { createSourceDefinitions, ensureSources, hashSources, readSource } from './birthplaces/source-data.mjs'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const APP_DIR = join(SCRIPT_DIR, '..')
const CACHE_DIR = join(SCRIPT_DIR, '.cache')
const BIOME_PATH = join(APP_DIR, '../../node_modules/.bin/biome')
const BIOME_DEFAULT_MAX_FILE_SIZE = 1024 * 1024
const MARKET_PATH = join(APP_DIR, 'src/lib/birthplace-markets.json')
const LOCALES = ['ko', 'en', 'ja', 'zh']
const CATALOG_BY_LOCALE = {
  ko: 'kr-administrative',
  en: 'geonames-localities',
  ja: 'jp-administrative',
  zh: 'cn-administrative',
}
const MINIMUM_COUNTRY_COUNTS = {
  KR: 220,
  JP: 1700,
  CN: 450,
  HK: 1,
  MO: 1,
  US: 16000,
  GB: 4000,
  CA: 1400,
  AU: 900,
  NZ: 300,
}
// These recently established Chinese units are not yet represented in the current
// GeoNames extract. Keep the fallback allowlist explicit so a source refresh cannot
// silently assign a parent-level coordinate to another unit.
const ALLOWED_GROUP_FALLBACK_IDS = new Set([
  'CN:500157000000', // 重庆市两江新区
  'CN:659007000000', // 双河市
  'CN:659011000000', // 新星市
  'CN:659012000000', // 白杨市
])
const SOURCE_NAMES_BY_LOCALE = {
  ko: ['officialKR', 'geonamesKR'],
  en: ['geonamesCities1000', 'geonamesAdmin1', 'geonamesAdmin2'],
  ja: ['officialJP', 'geonamesJP'],
  zh: ['officialCN', 'geonamesCN', 'geonamesCities1000'],
}
const OUTPUT_PATHS = Object.fromEntries(
  LOCALES.map((locale) => [locale, join(APP_DIR, `src/lib/birthplaces.${locale}.generated.ts`)]),
)

const args = new Set(process.argv.slice(2))
const supportedArgs = new Set(['--check', '--refresh-source'])

for (const arg of args) {
  if (!supportedArgs.has(arg)) {
    throw new Error(`Unknown argument: ${arg}`)
  }
}

const checkOnly = args.has('--check')
const refreshSource = args.has('--refresh-source')
const sources = createSourceDefinitions(CACHE_DIR)

await ensureSources(sources, refreshSource)

const markets = JSON.parse(readFileSync(MARKET_PATH, 'utf8'))
validateMarkets(markets)

const koreanCatalog = createKoreanAdministrativeCatalog(readSource(sources.officialKR), markets.ko.countries.KR)
const japaneseCatalog = createJapaneseAdministrativeCatalog(readSource(sources.officialJP), markets.ja.countries.JP)
const chineseCatalog = createChineseAdministrativeCatalog(readSource(sources.officialCN), markets.zh.countries)
const admin1ByCode = parseAdministrativeCodes(readSource(sources.geonamesAdmin1))
const admin2ByCode = parseAdministrativeCodes(readSource(sources.geonamesAdmin2))
const englishCatalog = createEnglishCatalog(
  readSource(sources.geonamesCities1000),
  markets.en,
  admin1ByCode,
  admin2ByCode,
)

const catalogs = {
  ko: {
    groups: koreanCatalog.groups,
    places: createOfficialPlaces('ko', koreanCatalog, [
      { source: readSource(sources.geonamesKR), countryCodes: ['KR'] },
    ]),
  },
  en: englishCatalog,
  ja: {
    groups: japaneseCatalog.groups,
    places: createOfficialPlaces('ja', japaneseCatalog, [
      { source: readSource(sources.geonamesJP), countryCodes: ['JP'] },
    ]),
  },
  zh: {
    groups: chineseCatalog.groups,
    places: createOfficialPlaces('zh', chineseCatalog, [
      { source: readSource(sources.geonamesCN), countryCodes: ['CN'] },
      { source: readSource(sources.geonamesCities1000), countryCodes: ['HK', 'MO'] },
    ]),
  },
}

const places = assignSuggestionRanks(
  LOCALES.flatMap((locale) => catalogs[locale].places),
  markets,
)

for (const locale of LOCALES) {
  catalogs[locale].places = places.filter((place) => place.locale === locale)
}

validateCatalogs(catalogs, markets)

const sourceHashes = hashSources(sources)
const outputs = Object.fromEntries(
  LOCALES.map((locale) => {
    const catalog = catalogs[locale]
    const sortedPlaces = [...catalog.places].sort(compareCatalogOrder)
    const outputPath = OUTPUT_PATHS[locale]
    const rawOutput = serializeCatalog(locale, catalog.groups, sortedPlaces, sourceHashes)
    const output = formatGeneratedSource(rawOutput, outputPath)
    return [locale, { outputPath, output }]
  }),
)

if (checkOnly) {
  const staleLocales = Object.entries(outputs)
    .filter(([, { outputPath, output }]) => !existsSync(outputPath) || readFileSync(outputPath, 'utf8') !== output)
    .map(([locale]) => locale)

  if (staleLocales.length > 0) {
    throw new Error(
      `Generated birthplace catalogs are stale for ${staleLocales.join(', ')}; run \`bun run gen:birthplaces\``,
    )
  }

  console.log(`Birthplace catalogs are current: ${summarize(places)}`)
} else {
  for (const { outputPath, output } of Object.values(outputs)) {
    const temporaryPath = `${outputPath}.tmp`
    writeFileSync(temporaryPath, output)
    renameSync(temporaryPath, outputPath)
  }

  console.log(`Generated ${summarize(places)}`)
}

function assignSuggestionRanks(allPlaces, marketDefinitions) {
  const rankById = new Map()

  for (const locale of LOCALES) {
    const market = marketDefinitions[locale]
    let nextRank = 0

    for (const countryCode of Object.keys(market.countries)) {
      const quota = market.suggestionCountByCountry[countryCode]
      const candidates = allPlaces
        .filter((place) => place.locale === locale && place.countryCode === countryCode)
        .sort(compareSuggestionCandidate)
      const selected = candidates.slice(0, quota)
      const selectedIds = new Set(selected.map((place) => place.id))
      const excludedPriority = candidates.find((place) => place.suggestionPriority && !selectedIds.has(place.id))

      if (selected.length !== quota) {
        throw new Error(`Expected ${quota} suggestions for ${locale}.${countryCode}, found ${selected.length}`)
      }

      if (excludedPriority) {
        throw new Error(`Priority suggestion ${excludedPriority.id} was excluded for ${locale}.${countryCode}`)
      }

      for (const place of selected) {
        rankById.set(place.id, nextRank)
        nextRank += 1
      }
    }
  }

  return allPlaces.map((place) => ({ ...place, suggestionRank: rankById.get(place.id) ?? null }))
}

function compareSuggestionCandidate(a, b) {
  return (
    Number(b.suggestionPriority) - Number(a.suggestionPriority) ||
    b.population - a.population ||
    compareText(a.name, b.name) ||
    a.sourceOrder - b.sourceOrder
  )
}

function compareCatalogOrder(a, b) {
  return (
    a.groupIndex - b.groupIndex ||
    Number(b.suggestionRank !== null) - Number(a.suggestionRank !== null) ||
    (a.suggestionRank ?? Number.MAX_SAFE_INTEGER) - (b.suggestionRank ?? Number.MAX_SAFE_INTEGER) ||
    b.population - a.population ||
    a.sourceOrder - b.sourceOrder ||
    compareText(a.name, b.name)
  )
}

function validateMarkets(marketDefinitions) {
  if (Object.keys(marketDefinitions).sort().join(',') !== [...LOCALES].sort().join(',')) {
    throw new Error(`Birthplace markets must define exactly ${LOCALES.join(', ')}`)
  }

  const assignedCountries = new Set()

  for (const locale of LOCALES) {
    const market = marketDefinitions[locale]
    const countryCodes = Object.keys(market.countries ?? {})

    if (market.catalog !== CATALOG_BY_LOCALE[locale] || countryCodes.length === 0) {
      throw new Error(`Invalid birthplace catalog policy for ${locale}`)
    }

    for (const countryCode of countryCodes) {
      if (!/^[A-Z]{2}$/.test(countryCode) || assignedCountries.has(countryCode)) {
        throw new Error(`Invalid or repeated country ${countryCode} in ${locale}`)
      }

      if (!market.countries[countryCode]) {
        throw new Error(`Missing country label for ${locale}.${countryCode}`)
      }

      assignedCountries.add(countryCode)
    }

    const suggestionCountries = Object.keys(market.suggestionCountByCountry ?? {})

    if (
      suggestionCountries.sort().join(',') !== [...countryCodes].sort().join(',') ||
      suggestionCountries.some((countryCode) => {
        const count = market.suggestionCountByCountry[countryCode]
        return !Number.isSafeInteger(count) || count <= 0
      })
    ) {
      throw new Error(`Invalid suggestion counts in ${locale}`)
    }
  }

  for (const countryCode of Object.keys(MINIMUM_COUNTRY_COUNTS)) {
    if (!assignedCountries.has(countryCode)) {
      throw new Error(`Target country ${countryCode} is not assigned to a locale`)
    }
  }
}

function validateCatalogs(catalogDefinitions, marketDefinitions) {
  const ids = new Set()
  const countByCountry = new Map()

  for (const locale of LOCALES) {
    const catalog = catalogDefinitions[locale]
    const market = marketDefinitions[locale]
    const groupIds = new Set()

    for (const group of catalog.groups) {
      if (
        !group.id ||
        !group.label ||
        !market.countries[group.countryCode] ||
        group.countryName !== market.countries[group.countryCode] ||
        groupIds.has(group.id)
      ) {
        throw new Error(`Invalid birthplace group in ${locale}: ${JSON.stringify(group)}`)
      }

      groupIds.add(group.id)
    }

    for (const place of catalog.places) {
      const indexedGroup = catalog.groups[place.groupIndex]

      if (ids.has(place.id)) {
        throw new Error(`Duplicate birthplace ID: ${place.id}`)
      }

      ids.add(place.id)
      countByCountry.set(place.countryCode, (countByCountry.get(place.countryCode) ?? 0) + 1)

      if (place.coordinateResolution === 'groupFallback' && !ALLOWED_GROUP_FALLBACK_IDS.has(place.id)) {
        throw new Error(`Unreviewed parent-level coordinate fallback for ${place.id} (${place.name})`)
      }

      if (
        place.locale !== locale ||
        !place.name ||
        !hasLocalizedDisplayName(place.name, locale) ||
        !groupIds.has(place.groupId) ||
        indexedGroup?.id !== place.groupId ||
        indexedGroup.countryCode !== place.countryCode ||
        !place.contextName ||
        place.groupIndex < 0 ||
        place.groupIndex >= catalog.groups.length ||
        !Number.isFinite(place.latitude) ||
        place.latitude < -90 ||
        place.latitude > 90 ||
        !Number.isFinite(place.longitude) ||
        place.longitude < -180 ||
        place.longitude > 180 ||
        !['locality', 'administrativeSeat', 'administrativeArea'].includes(place.coordinatePrecision)
      ) {
        throw new Error(`Invalid birthplace: ${JSON.stringify(place)}`)
      }

      try {
        new Intl.DateTimeFormat('en', { timeZone: place.timeZone }).format()
      } catch {
        throw new Error(`Invalid IANA time zone for ${place.id}: ${place.timeZone}`)
      }
    }

    for (const group of catalog.groups) {
      if (!catalog.places.some((place) => place.groupId === group.id)) {
        throw new Error(`Empty birthplace group ${locale}.${group.id}`)
      }
    }

    const suggestionRanks = catalog.places
      .flatMap((place) => (place.suggestionRank === null ? [] : [place.suggestionRank]))
      .sort((a, b) => a - b)
    const expectedSuggestionCount = Object.values(market.suggestionCountByCountry).reduce(
      (total, count) => total + count,
      0,
    )

    if (suggestionRanks.length !== expectedSuggestionCount || suggestionRanks.some((rank, index) => rank !== index)) {
      throw new Error(`Invalid suggestion ranks in ${locale}`)
    }

    for (const [countryCode, expectedCount] of Object.entries(market.suggestionCountByCountry)) {
      const actualCount = catalog.places.filter(
        (place) => place.countryCode === countryCode && place.suggestionRank !== null,
      ).length

      if (actualCount !== expectedCount) {
        throw new Error(`Expected ${expectedCount} suggestions for ${locale}.${countryCode}, found ${actualCount}`)
      }
    }
  }

  for (const [countryCode, minimum] of Object.entries(MINIMUM_COUNTRY_COUNTS)) {
    const actual = countByCountry.get(countryCode) ?? 0

    if (actual < minimum) {
      throw new Error(`Expected at least ${minimum} ${countryCode} places, found ${actual}`)
    }
  }

  assertPresent(ids, 'KR:4129000000', '과천시')
  assertPresent(ids, 'KR:1100000000', '서울 admin1 self value')
  assertPresent(ids, 'KR:3611000000', '세종특별자치시 self value')
  assertAbsent(ids, 'KR:1200000000', 'province-like 전남광주통합특별시 group')
  assertPresent(ids, 'JP:01100', '札幌市')
  assertAbsent(ids, 'JP:01101', 'ordinary ward of a designated city')
  assertAbsent(ids, 'JP:13100', 'Tokyo wards aggregate')
  assertPresent(ids, 'JP:13101', '千代田区')
  assertPresent(ids, 'CN:110101000000', '东城区')
  assertPresent(ids, 'CN:110000000000', '北京 direct-municipality self value')
  assertPresent(ids, 'CN:120000000000', '天津 direct-municipality self value')
  assertPresent(ids, 'CN:310000000000', '上海 direct-municipality self value')
  assertPresent(ids, 'CN:500000000000', '重庆 direct-municipality self value')
  assertAbsent(ids, 'CN:110100000000', 'direct-municipality prefecture aggregate')
  assertPresent(ids, 'HK:810000000000', '香港 single value')
  assertPresent(ids, 'MO:820000000000', '澳门 single value')

  if ((countByCountry.get('HK') ?? 0) !== 1 || (countByCountry.get('MO') ?? 0) !== 1) {
    throw new Error('Hong Kong and Macau must each have exactly one selectable value')
  }
}

function assertPresent(ids, id, description) {
  if (!ids.has(id)) {
    throw new Error(`Missing required birthplace ${id} (${description})`)
  }
}

function assertAbsent(ids, id, description) {
  if (ids.has(id)) {
    throw new Error(`Unexpected birthplace ${id} (${description})`)
  }
}

function hasLocalizedDisplayName(name, locale) {
  if (locale === 'ko') {
    return /\p{Script=Hangul}/u.test(name)
  }

  if (locale === 'ja') {
    return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(name)
  }

  if (locale === 'zh') {
    return /\p{Script=Han}/u.test(name)
  }

  return true
}

function serializeCatalog(locale, groups, catalogPlaces, sourceHashes) {
  const groupRows = groups.map(
    (group) =>
      `  [${quote(group.id)}, ${quote(group.label)}, ${quote(group.countryCode)}, ${quote(group.countryName)}],`,
  )
  const placeRows = catalogPlaces.map((place) => {
    const precision = { locality: 0, administrativeSeat: 1, administrativeArea: 2 }[place.coordinatePrecision]
    const values = [
      quote(place.id),
      quote(place.name),
      place.groupIndex,
      place.latitude,
      place.longitude,
      quote(place.timeZone),
      precision,
      place.population,
      place.suggestionRank ?? -1,
      quote(place.contextName),
      ...place.searchNames.map(quote),
    ]

    return `  [${values.join(', ')}],`
  })
  const sourceLines = SOURCE_NAMES_BY_LOCALE[locale]
    .map((name) => `// ${name} SHA-256: ${sourceHashes[name]}`)
    .join('\n')
  const localeMember = { ko: 'KO', en: 'EN', ja: 'JA', zh: 'ZH' }[locale]

  return `// AUTO-GENERATED by apps/stella/scripts/generate-birthplaces.mjs — do not edit.
// Source and license details: apps/stella/LICENSES/AdministrativeBirthplaces.txt and GeoNames.txt.
${sourceLines}
// ${catalogPlaces.length} selectable places. Regenerate with \`bun run gen:birthplaces\` from apps/stella.

import { Locale } from '@sobok/domain/locale'
import {
  createBirthplaceCatalog,
  type GeneratedBirthplaceGroupRow,
  type GeneratedBirthplaceRow,
} from './birthplaces'

const GROUPS: readonly GeneratedBirthplaceGroupRow[] = [
${groupRows.join('\n')}
]

const PLACES: readonly GeneratedBirthplaceRow[] = [
${placeRows.join('\n')}
]

export const GENERATED_BIRTHPLACE_CATALOG = createBirthplaceCatalog(Locale.${localeMember}, GROUPS, PLACES)
`
}

function formatGeneratedSource(source, outputPath) {
  if (Buffer.byteLength(source) > BIOME_DEFAULT_MAX_FILE_SIZE) {
    return source
  }

  return execFileSync(BIOME_PATH, ['format', '--stdin-file-path', outputPath], {
    cwd: APP_DIR,
    encoding: 'utf8',
    input: source,
    maxBuffer: 64 * 1024 * 1024,
  })
}

function quote(value) {
  return JSON.stringify(value)
}

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

function summarize(allPlaces) {
  const localeCounts = Object.fromEntries(
    LOCALES.map((locale) => [locale, allPlaces.filter((place) => place.locale === locale).length]),
  )
  const precisionCounts = Object.fromEntries(
    ['locality', 'administrativeSeat', 'administrativeArea'].map((precision) => [
      precision,
      allPlaces.filter((place) => place.coordinatePrecision === precision).length,
    ]),
  )
  const groupFallbackIds = allPlaces
    .filter((place) => place.coordinateResolution === 'groupFallback')
    .map((place) => place.id)

  return `${allPlaces.length} birthplaces (${LOCALES.map((locale) => `${locale} ${localeCounts[locale]}`).join(', ')}; ${Object.entries(
    precisionCounts,
  )
    .map(([precision, count]) => `${precision} ${count}`)
    .join(', ')}; groupFallback ${groupFallbackIds.length}${
    groupFallbackIds.length > 0 ? ` [${groupFallbackIds.join(', ')}]` : ''
  })`
}
