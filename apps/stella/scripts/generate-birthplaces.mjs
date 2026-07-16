import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const APP_DIR = join(SCRIPT_DIR, '..')
const CACHE_DIR = join(SCRIPT_DIR, '.cache')
const BIOME_PATH = join(APP_DIR, '../../node_modules/.bin/biome')
const BIOME_DEFAULT_MAX_FILE_SIZE = 1024 * 1024
const MARKET_PATH = join(APP_DIR, 'src/lib/birthplace-markets.json')
const LOCALES = ['ko', 'en', 'ja', 'zh']
const LOCALIZED_COUNTRIES = ['KR', 'JP', 'CN', 'HK', 'MO']
const LANGUAGE_BY_LOCALE = { ko: 'ko', ja: 'ja', zh: 'zh' }
const EXCLUDED_FEATURE_CODES = new Set(['PPLH', 'PPLQ', 'PPLW', 'PPLX'])
const MINIMUM_COUNTRY_COUNTS = {
  KR: 260,
  JP: 1750,
  CN: 3850,
  HK: 100,
  MO: 5,
  US: 16000,
  GB: 4000,
  CA: 1400,
  AU: 900,
  NZ: 300,
}

const SOURCE_DEFINITIONS = {
  cities1000: {
    url: 'https://download.geonames.org/export/dump/cities1000.zip',
    path: join(CACHE_DIR, 'cities1000.zip'),
    entryName: 'cities1000.txt',
  },
  admin1: {
    url: 'https://download.geonames.org/export/dump/admin1CodesASCII.txt',
    path: join(CACHE_DIR, 'admin1CodesASCII.txt'),
  },
  admin2: {
    url: 'https://download.geonames.org/export/dump/admin2Codes.txt',
    path: join(CACHE_DIR, 'admin2Codes.txt'),
  },
  ...Object.fromEntries(
    LOCALIZED_COUNTRIES.map((countryCode) => [
      `alternateNames-${countryCode}`,
      {
        url: `https://download.geonames.org/export/dump/alternatenames/${countryCode}.zip`,
        path: join(CACHE_DIR, `alternateNames-${countryCode}.zip`),
        entryName: `${countryCode}.txt`,
      },
    ]),
  ),
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

mkdirSync(CACHE_DIR, { recursive: true })

for (const source of Object.values(SOURCE_DEFINITIONS)) {
  await ensureDownloaded(source.url, source.path, refreshSource)
}

const markets = JSON.parse(readFileSync(MARKET_PATH, 'utf8'))
validateMarkets(markets)

const marketByCountry = buildMarketByCountry(markets)
const targetCountries = new Set(Object.keys(MINIMUM_COUNTRY_COUNTS))
const admin1ByCode = parseAdministrativeCodes(readSource(SOURCE_DEFINITIONS.admin1))
const admin2ByCode = parseAdministrativeCodes(readSource(SOURCE_DEFINITIONS.admin2))
const rawPlaces = parseGeoNamesPlaces(readSource(SOURCE_DEFINITIONS.cities1000), targetCountries)

const resolvedPlaces = rawPlaces.flatMap((place) => {
  const marketEntry = marketByCountry.get(place.countryCode)

  if (!marketEntry) {
    throw new Error(`No locale market for ${place.countryCode}`)
  }

  const exactGroup = marketEntry.groupsBySourceCode.get(place.admin1Code)
  const group = exactGroup ?? marketEntry.countryGroup

  if (!group) {
    return []
  }

  return [{ ...place, locale: marketEntry.locale, group }]
})

const localizedNamesByCountry = new Map()

for (const countryCode of LOCALIZED_COUNTRIES) {
  const marketEntry = marketByCountry.get(countryCode)

  if (!marketEntry) {
    continue
  }

  const wantedIds = new Set()

  for (const place of resolvedPlaces.filter((candidate) => candidate.countryCode === countryCode)) {
    wantedIds.add(place.geonameId)

    const admin1 = admin1ByCode.get(`${countryCode}.${place.admin1Code}`)
    const admin2 = admin2ByCode.get(`${countryCode}.${place.admin1Code}.${place.admin2Code}`)

    if (admin1) {
      wantedIds.add(admin1.geonameId)
    }

    if (admin2) {
      wantedIds.add(admin2.geonameId)
    }
  }

  const source = SOURCE_DEFINITIONS[`alternateNames-${countryCode}`]
  localizedNamesByCountry.set(countryCode, parseAlternateNames(readSource(source), wantedIds, marketEntry.locale))
}

const places = assignSuggestionRanks(
  resolvedPlaces.flatMap((place) => {
    const birthplace = createBirthplace(
      place,
      markets[place.locale],
      admin1ByCode,
      admin2ByCode,
      localizedNamesByCountry,
    )

    return birthplace ? [birthplace] : []
  }),
  markets,
)

validatePlaces(places, markets)

const sourceHashes = Object.fromEntries(
  Object.entries(SOURCE_DEFINITIONS).map(([name, source]) => [
    name,
    createHash('sha256').update(readFileSync(source.path)).digest('hex'),
  ]),
)

const outputs = Object.fromEntries(
  LOCALES.map((locale) => {
    const localePlaces = places
      .filter((place) => place.locale === locale)
      .sort(
        (a, b) =>
          a.groupIndex - b.groupIndex ||
          Number(b.suggestionRank !== null) - Number(a.suggestionRank !== null) ||
          b.population - a.population ||
          compareText(a.name, b.name),
      )
    const outputPath = OUTPUT_PATHS[locale]
    const rawOutput = serializeCatalog(locale, markets[locale], localePlaces, sourceHashes)
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

async function ensureDownloaded(url, path, refresh) {
  if (!refresh && existsSync(path)) {
    return
  }

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  }

  const temporaryPath = `${path}.download`
  writeFileSync(temporaryPath, Buffer.from(await response.arrayBuffer()))
  renameSync(temporaryPath, path)
}

function readSource(source) {
  if (!source.entryName) {
    return readFileSync(source.path, 'utf8')
  }

  try {
    return execFileSync('unzip', ['-p', source.path, source.entryName], {
      encoding: 'utf8',
      maxBuffer: 512 * 1024 * 1024,
    })
  } catch (error) {
    throw new Error(`Unable to extract ${source.entryName}; install the \`unzip\` command`, { cause: error })
  }
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

function parseGeoNamesPlaces(source, targetCountries) {
  const places = []

  forEachLine(source, (line) => {
    const fields = line.split('\t')
    const countryCode = fields[8]
    const featureCode = fields[7]

    if (
      !targetCountries.has(countryCode) ||
      fields[6] !== 'P' ||
      EXCLUDED_FEATURE_CODES.has(featureCode) ||
      !fields[1] ||
      !fields[17]
    ) {
      return
    }

    places.push({
      geonameId: Number(fields[0]),
      sourceName: fields[1],
      asciiName: fields[2] || fields[1],
      latitude: Number(fields[4]),
      longitude: Number(fields[5]),
      featureCode,
      countryCode,
      admin1Code: fields[10],
      admin2Code: fields[11],
      population: Number(fields[14]) || 0,
      timeZone: fields[17],
    })
  })

  return places
}

function parseAdministrativeCodes(source) {
  const codes = new Map()

  forEachLine(source, (line) => {
    const fields = line.split('\t')

    if (fields.length >= 4) {
      codes.set(fields[0], {
        name: fields[1],
        asciiName: fields[2] || fields[1],
        geonameId: Number(fields[3]),
      })
    }
  })

  return codes
}

function parseAlternateNames(source, wantedIds, locale) {
  const namesById = new Map()
  const language = LANGUAGE_BY_LOCALE[locale]
  const localScriptPattern = localizedScriptPattern(locale)

  if (!language) {
    return namesById
  }

  forEachLine(source, (line) => {
    const fields = line.split('\t')
    const geonameId = Number(fields[1])
    const languageCode = fields[2]
    const name = fields[3]
    const isLocalizedLanguage = languageCode === language || languageCode.startsWith(`${language}-`)
    const isUnlabeledLocalName = languageCode === '' && localScriptPattern?.test(name)

    if (
      !wantedIds.has(geonameId) ||
      (!isLocalizedLanguage && !isUnlabeledLocalName) ||
      !name ||
      fields[6] === '1' ||
      fields[7] === '1' ||
      fields[9]
    ) {
      return
    }

    const names = namesById.get(geonameId) ?? []
    names.push(name)
    namesById.set(geonameId, names)
  })

  return namesById
}

function createBirthplace(place, market, admin1ByCode, admin2ByCode, localizedNamesByCountry) {
  const localizedNames = localizedNamesByCountry.get(place.countryCode) ?? new Map()
  const groupIndex = market.groups.findIndex((group) => group.id === place.group.id)
  const alternateNames = localizedNames.get(place.geonameId) ?? []
  const localizedName = chooseLocalizedName(alternateNames, place.locale) ?? place.sourceName

  if (!hasLocalizedDisplayName(localizedName, place.locale)) {
    return null
  }

  const name = canonicalizeName(localizedName, place.locale, place.group.label)
  const admin1 = admin1ByCode.get(`${place.countryCode}.${place.admin1Code}`)
  const admin2 = admin2ByCode.get(`${place.countryCode}.${place.admin1Code}.${place.admin2Code}`)
  const admin1Name = localizedAdministrativeName(admin1, localizedNames, place.locale)
  const admin2Name = localizedAdministrativeName(admin2, localizedNames, place.locale)
  const contextName = buildContextName({
    name,
    group: place.group,
    admin1Name,
    admin2Name,
  })
  const searchNames = uniqueSearchNames([...alternateNames, place.sourceName, place.asciiName], name)

  return {
    id: `geonames:${place.geonameId}`,
    geonameId: place.geonameId,
    locale: place.locale,
    countryCode: place.countryCode,
    groupId: place.group.id,
    groupIndex,
    name,
    contextName,
    latitude: roundCoordinate(place.latitude),
    longitude: roundCoordinate(place.longitude),
    timeZone: canonicalTimeZone(place.countryCode, place.timeZone),
    coordinateKind: place.population < 1000 && place.featureCode.startsWith('PPLA') ? 'administrativeSeat' : 'locality',
    population: place.population,
    suggestionRank: null,
    searchNames,
    featureCode: place.featureCode,
  }
}

function assignSuggestionRanks(places, markets) {
  const rankById = new Map()

  for (const locale of LOCALES) {
    const market = markets[locale]
    let nextRank = 0

    for (const countryCode of Object.keys(market.countries)) {
      const quota = market.suggestionCountByCountry[countryCode]
      const candidates = places
        .filter((place) => place.locale === locale && place.countryCode === countryCode)
        .sort(comparePopulation)
      const capitals = candidates.filter((place) => place.featureCode === 'PPLC')

      if (capitals.length === 0) {
        throw new Error(`No GeoNames PPLC capital found for ${locale}.${countryCode}`)
      }

      if (capitals.length > quota) {
        throw new Error(
          `Suggestion quota ${quota} cannot include all ${capitals.length} capitals for ${locale}.${countryCode}`,
        )
      }

      const capitalIds = new Set(capitals.map((place) => place.id))
      const selected = [...capitals, ...candidates.filter((place) => !capitalIds.has(place.id))].slice(0, quota)

      if (selected.length !== quota) {
        throw new Error(`Expected ${quota} suggestions for ${locale}.${countryCode}, found ${selected.length}`)
      }

      for (const place of selected) {
        rankById.set(place.id, nextRank++)
      }
    }
  }

  return places.map((place) => ({ ...place, suggestionRank: rankById.get(place.id) ?? null }))
}

function comparePopulation(a, b) {
  return b.population - a.population || compareText(a.name, b.name) || a.geonameId - b.geonameId
}

function localizedAdministrativeName(administrativeUnit, localizedNames, locale) {
  if (!administrativeUnit) {
    return ''
  }

  return (
    chooseLocalizedName(localizedNames.get(administrativeUnit.geonameId) ?? [], locale) ?? administrativeUnit.asciiName
  )
}

function chooseLocalizedName(names, locale) {
  const scriptPattern = localizedScriptPattern(locale)

  return scriptPattern ? names.find((name) => scriptPattern.test(name)) : names[0]
}

function hasLocalizedDisplayName(name, locale) {
  const scriptPattern = localizedScriptPattern(locale)
  return !scriptPattern || scriptPattern.test(name)
}

function localizedScriptPattern(locale) {
  if (locale === 'ko') {
    return /\p{Script=Hangul}/u
  }

  if (locale === 'ja') {
    return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u
  }

  if (locale === 'zh') {
    return /\p{Script=Han}/u
  }

  return null
}

function canonicalizeName(name, locale, groupLabel) {
  if (locale !== 'ko' || name !== groupLabel) {
    return name
  }

  for (const suffix of ['특별자치시', '특별시', '광역시']) {
    if (name.endsWith(suffix) && name.length > suffix.length) {
      return name.slice(0, -suffix.length)
    }
  }

  return name
}

function buildContextName({ name, group, admin1Name, admin2Name }) {
  const parts = []

  if (admin2Name && normalizeIdentity(admin2Name) !== normalizeIdentity(name)) {
    parts.push(admin2Name)
  }

  const firstLevelName = group.sourceAdmin1Code ? group.label : admin1Name

  if (
    firstLevelName &&
    normalizeIdentity(firstLevelName) !== normalizeIdentity(name) &&
    !parts.some((part) => normalizeIdentity(part) === normalizeIdentity(firstLevelName))
  ) {
    parts.push(firstLevelName)
  }

  return parts.join(', ') || group.label
}

function uniqueSearchNames(candidates, displayName) {
  const displayIdentity = normalizeIdentity(displayName)
  const seen = new Set([displayIdentity])
  const names = []

  for (const candidate of candidates) {
    const identity = normalizeIdentity(candidate)

    if (!candidate || !identity || seen.has(identity)) {
      continue
    }

    seen.add(identity)
    names.push(candidate)

    if (names.length === 10) {
      break
    }
  }

  return names
}

function normalizeIdentity(value) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

function canonicalTimeZone(countryCode, sourceTimeZone) {
  if (countryCode === 'CN') {
    return 'Asia/Shanghai'
  }

  if (countryCode === 'HK') {
    return 'Asia/Hong_Kong'
  }

  if (countryCode === 'MO') {
    return 'Asia/Macau'
  }

  return sourceTimeZone
}

function roundCoordinate(value) {
  return Number(value.toFixed(4))
}

function buildMarketByCountry(markets) {
  const result = new Map()

  for (const [locale, market] of Object.entries(markets)) {
    for (const countryCode of Object.keys(market.countries)) {
      result.set(countryCode, {
        locale,
        groupsBySourceCode: new Map(
          market.groups
            .filter((group) => group.countryCode === countryCode && group.sourceAdmin1Code)
            .map((group) => [group.sourceAdmin1Code, group]),
        ),
        countryGroup: market.groups.find((group) => group.countryCode === countryCode && !group.sourceAdmin1Code),
      })
    }
  }

  return result
}

function validateMarkets(markets) {
  if (Object.keys(markets).sort().join(',') !== [...LOCALES].sort().join(',')) {
    throw new Error(`Birthplace markets must define exactly ${LOCALES.join(', ')}`)
  }

  const assignedCountries = new Set()

  for (const locale of LOCALES) {
    const market = markets[locale]
    const countryCodes = Object.keys(market.countries)

    if (countryCodes.length === 0 || !Array.isArray(market.groups) || market.groups.length === 0) {
      throw new Error(`Incomplete birthplace market: ${locale}`)
    }

    const groupIds = new Set()

    for (const countryCode of countryCodes) {
      if (!/^[A-Z]{2}$/.test(countryCode) || assignedCountries.has(countryCode)) {
        throw new Error(`Invalid or repeated country ${countryCode} in ${locale}`)
      }

      assignedCountries.add(countryCode)
    }

    for (const group of market.groups) {
      if (
        !group.id ||
        !group.label ||
        !countryCodes.includes(group.countryCode) ||
        groupIds.has(group.id) ||
        (group.sourceAdmin1Code !== undefined && !group.sourceAdmin1Code)
      ) {
        throw new Error(`Invalid group in ${locale}: ${JSON.stringify(group)}`)
      }

      groupIds.add(group.id)
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

function validatePlaces(places, markets) {
  const ids = new Set()
  const countByCountry = new Map()

  for (const place of places) {
    if (ids.has(place.id)) {
      throw new Error(`Duplicate birthplace ID: ${place.id}`)
    }

    ids.add(place.id)
    countByCountry.set(place.countryCode, (countByCountry.get(place.countryCode) ?? 0) + 1)

    if (
      !place.name ||
      !hasLocalizedDisplayName(place.name, place.locale) ||
      !place.contextName ||
      place.groupIndex < 0 ||
      !Number.isFinite(place.latitude) ||
      place.latitude < -90 ||
      place.latitude > 90 ||
      !Number.isFinite(place.longitude) ||
      place.longitude < -180 ||
      place.longitude > 180 ||
      !['locality', 'administrativeSeat'].includes(place.coordinateKind)
    ) {
      throw new Error(`Invalid birthplace: ${JSON.stringify(place)}`)
    }

    try {
      new Intl.DateTimeFormat('en', { timeZone: place.timeZone }).format()
    } catch {
      throw new Error(`Invalid IANA time zone for ${place.id}: ${place.timeZone}`)
    }
  }

  for (const [countryCode, minimum] of Object.entries(MINIMUM_COUNTRY_COUNTS)) {
    const actual = countByCountry.get(countryCode) ?? 0

    if (actual < minimum) {
      throw new Error(`Expected at least ${minimum} ${countryCode} places, found ${actual}`)
    }
  }

  for (const [locale, market] of Object.entries(markets)) {
    const localePlaces = places.filter((place) => place.locale === locale)

    for (const group of market.groups) {
      if (!localePlaces.some((place) => place.groupId === group.id)) {
        throw new Error(`Empty birthplace group ${locale}.${group.id}`)
      }
    }

    const suggestionRanks = localePlaces
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
      const countryPlaces = localePlaces.filter((place) => place.countryCode === countryCode)
      const suggestions = countryPlaces.filter((place) => place.suggestionRank !== null)
      const capitals = countryPlaces.filter((place) => place.featureCode === 'PPLC')

      if (
        suggestions.length !== expectedCount ||
        capitals.length === 0 ||
        capitals.some((capital) => capital.suggestionRank === null)
      ) {
        throw new Error(`Invalid suggestions for ${locale}.${countryCode}`)
      }
    }
  }
}

function serializeCatalog(locale, market, places, sourceHashes) {
  const groupRows = market.groups.map(
    (group) =>
      `  [${quote(group.id)}, ${quote(group.label)}, ${quote(group.countryCode)}, ${quote(market.countries[group.countryCode])}],`,
  )
  const placeRows = places.map((place) => {
    const values = [
      quote(place.id),
      quote(place.name),
      place.groupIndex,
      place.latitude,
      place.longitude,
      quote(place.timeZone),
      place.coordinateKind === 'locality' ? 0 : 1,
      place.population,
      place.suggestionRank ?? -1,
      quote(place.contextName),
      ...place.searchNames.map(quote),
    ]

    return `  [${values.join(', ')}],`
  })
  const sourceNames = [
    'cities1000',
    'admin1',
    'admin2',
    ...Object.keys(market.countries)
      .filter((countryCode) => LOCALIZED_COUNTRIES.includes(countryCode))
      .map((countryCode) => `alternateNames-${countryCode}`),
  ]
  const sourceLines = sourceNames.map((name) => `// ${name} SHA-256: ${sourceHashes[name]}`).join('\n')
  const localeMember = { ko: 'KO', en: 'EN', ja: 'JA', zh: 'ZH' }[locale]

  return `// AUTO-GENERATED by apps/stella/scripts/generate-birthplaces.mjs — do not edit.
// GeoNames data is licensed under CC BY 4.0.
${sourceLines}
// ${places.length} selectable places. Regenerate with \`bun run gen:birthplaces\` from apps/stella.

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

function quote(value) {
  return JSON.stringify(value)
}

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

function forEachLine(source, visit) {
  let start = 0

  while (start < source.length) {
    let end = source.indexOf('\n', start)

    if (end === -1) {
      end = source.length
    }

    if (end > start) {
      visit(source.slice(start, end))
    }

    start = end + 1
  }
}

function summarize(places) {
  const localeCounts = Object.fromEntries(
    LOCALES.map((locale) => [locale, places.filter((place) => place.locale === locale).length]),
  )
  const fallbackCount = places.filter((place) => place.coordinateKind === 'administrativeSeat').length
  return `${places.length} birthplaces (${LOCALES.map((locale) => `${locale} ${localeCounts[locale]}`).join(', ')}; ${fallbackCount} administrative-seat fallbacks)`
}
