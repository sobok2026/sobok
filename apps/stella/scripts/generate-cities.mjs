import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const APP_DIR = join(SCRIPT_DIR, '..')
const CACHE_DIR = join(SCRIPT_DIR, '.cache')
const CURATED_CITIES_PATH = join(SCRIPT_DIR, 'cities.curated.json')
const SELECTED_CITIES_PATH = join(SCRIPT_DIR, 'cities.selected.json')
const KOREA_MUNICIPALITIES_PATH = join(SCRIPT_DIR, 'cities.kr-municipalities.json')
const CHINA_DIVISIONS_PATH = join(SCRIPT_DIR, 'cities.cn-divisions.json')
const CITY_MARKETS_PATH = join(APP_DIR, 'src/lib/city-markets.json')
const OUTPUT_PATHS = Object.fromEntries(
  ['ko', 'en', 'ja', 'zh'].map((locale) => [locale, join(APP_DIR, `src/lib/cities.${locale}.generated.ts`)]),
)

const SOURCE_DEFINITIONS = {
  cities15000: {
    url: 'https://download.geonames.org/export/dump/cities15000.zip',
    zipPath: join(CACHE_DIR, 'cities15000.zip'),
    entryName: 'cities15000.txt',
  },
  KR: {
    url: 'https://download.geonames.org/export/dump/KR.zip',
    zipPath: join(CACHE_DIR, 'KR.zip'),
    entryName: 'KR.txt',
  },
  CN: {
    url: 'https://download.geonames.org/export/dump/CN.zip',
    zipPath: join(CACHE_DIR, 'CN.zip'),
    entryName: 'CN.txt',
  },
}

const TARGET_CITY_COUNT = 646
const EXPECTED_LOCALE_COUNTS = {
  ko: 167,
  en: 90,
  ja: 50,
  zh: 339,
}
const EXPECTED_COUNTRY_COUNTS = {
  KR: 167,
  US: 31,
  GB: 16,
  CA: 13,
  AU: 15,
  NZ: 15,
  JP: 50,
  CN: 337,
  HK: 1,
  MO: 1,
}
const CHINA_DIVISION_COUNTS = {
  province: 6,
  prefecture: 333,
}
const CHINA_PREFECTURE_TYPE_COUNTS = {
  city: 293,
  prefecture: 7,
  autonomousPrefecture: 30,
  league: 3,
}
const KOREA_MUNICIPALITY_COUNTS = {
  city: 75,
  county: 82,
  administrativeCity: 2,
}
const KOREA_REGION_CODE_BY_NAME = {
  서울특별시: 'KR-11',
  부산광역시: 'KR-26',
  대구광역시: 'KR-27',
  인천광역시: 'KR-28',
  광주광역시: 'KR-29',
  대전광역시: 'KR-30',
  울산광역시: 'KR-31',
  세종특별자치시: 'KR-50',
  경기도: 'KR-41',
  강원특별자치도: 'KR-51',
  충청북도: 'KR-43',
  충청남도: 'KR-44',
  전북특별자치도: 'KR-52',
  전라남도: 'KR-46',
  경상북도: 'KR-47',
  경상남도: 'KR-48',
  제주특별자치도: 'KR-49',
}
const KOREA_UPPER_CITY_REGION_CODE_BY_KEY = {
  'kr-seoul': 'KR-11',
  'kr-busan': 'KR-26',
  'kr-daegu': 'KR-27',
  'kr-incheon': 'KR-28',
  'kr-gwangju': 'KR-29',
  'kr-daejeon': 'KR-30',
  'kr-ulsan': 'KR-31',
  'kr-sejong': 'KR-50',
}
const KOREA_UPPER_CITY_KEYS = new Set(Object.keys(KOREA_UPPER_CITY_REGION_CODE_BY_KEY))

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

const curatedCities = JSON.parse(readFileSync(CURATED_CITIES_PATH, 'utf8'))
const selectedCities = JSON.parse(readFileSync(SELECTED_CITIES_PATH, 'utf8'))
const koreaMunicipalities = JSON.parse(readFileSync(KOREA_MUNICIPALITIES_PATH, 'utf8'))
const chinaDivisions = JSON.parse(readFileSync(CHINA_DIVISIONS_PATH, 'utf8'))
const cityMarkets = JSON.parse(readFileSync(CITY_MARKETS_PATH, 'utf8'))

const wantedGeonameIds = {
  cities15000: new Set([
    ...selectedCities.map((selection) => selection.geonameId),
    ...chinaDivisions
      .filter((division) => division.source === 'cities15000')
      .flatMap((division) => [division.geonameId, division.coordinateGeonameId]),
  ]),
  KR: new Set(
    koreaMunicipalities.flatMap((municipality) => [municipality.geonameId, municipality.coordinateGeonameId]),
  ),
  CN: new Set(
    chinaDivisions
      .filter((division) => division.source !== 'cities15000')
      .flatMap((division) => [division.geonameId, division.coordinateGeonameId]),
  ),
}

for (const source of Object.values(SOURCE_DEFINITIONS)) {
  await ensureDownloaded(source.url, source.zipPath, refreshSource)
}

const sourceCityMaps = new Map(
  Object.entries(SOURCE_DEFINITIONS).map(([sourceName, source]) => {
    const cities = parseGeoNamesCities(extractCities(source.zipPath, source.entryName), wantedGeonameIds[sourceName])
    return [sourceName, new Map(cities.map((city) => [city.geonameId, city]))]
  }),
)

const cities = curatedCities.map((city) => ({ ...city }))

for (const selection of selectedCities) {
  const sourceName = selection.source ?? 'cities15000'
  const sourceCity = sourceCityMaps.get(sourceName)?.get(selection.geonameId)

  if (!sourceCity) {
    throw new Error(`GeoNames city ${selection.geonameId} is missing from ${sourceName}`)
  }

  addSelectedCity(cities, selection, sourceCity)
}

addKoreaMunicipalities(cities, koreaMunicipalities, sourceCityMaps.get('KR'))
addChinaDivisions(cities, chinaDivisions, sourceCityMaps)

if (cities.length !== TARGET_CITY_COUNT) {
  throw new Error(`Expected ${TARGET_CITY_COUNT} cities, generated ${cities.length}`)
}

validateCities(cities)
validateCityMarkets(cities, cityMarkets)
validateLocaleCounts(cities, cityMarkets)

const sourceHashes = Object.fromEntries(
  Object.entries(SOURCE_DEFINITIONS).map(([sourceName, source]) => [
    sourceName,
    createHash('sha256').update(readFileSync(source.zipPath)).digest('hex'),
  ]),
)
const localeByCountryCode = getLocaleByCountryCode(cityMarkets)
const outputs = Object.fromEntries(
  Object.entries(OUTPUT_PATHS).map(([locale, outputPath]) => {
    const localeCities = cities.filter((city) => localeByCountryCode.get(city.iso2) === locale)
    return [locale, { outputPath, output: serializeCities(locale, localeCities, sourceHashes) }]
  }),
)

if (checkOnly) {
  const staleLocales = Object.entries(outputs)
    .filter(([, { outputPath, output }]) => !existsSync(outputPath) || readFileSync(outputPath, 'utf8') !== output)
    .map(([locale]) => locale)

  if (staleLocales.length > 0) {
    throw new Error(`Generated city catalogs are stale for ${staleLocales.join(', ')}; run \`bun run gen:cities\``)
  }

  console.log(`City catalog is current: ${summarize(cities)}`)
} else {
  for (const { outputPath, output } of Object.values(outputs)) {
    const temporaryPath = `${outputPath}.tmp`
    writeFileSync(temporaryPath, output)
    renameSync(temporaryPath, outputPath)
  }

  console.log(`Generated ${summarize(cities)}`)
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

function extractCities(zipPath, entryName) {
  try {
    return execFileSync('unzip', ['-p', zipPath, entryName], {
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    })
  } catch (error) {
    throw new Error(`Unable to extract ${entryName}; install the \`unzip\` command`, {
      cause: error,
    })
  }
}

function parseGeoNamesCities(source, wantedIds) {
  const cities = []
  let start = 0

  while (start < source.length) {
    let end = source.indexOf('\n', start)

    if (end === -1) {
      end = source.length
    }

    const fields = source.slice(start, end).split('\t')
    const geonameId = Number(fields[0])

    if (wantedIds.has(geonameId)) {
      cities.push({
        geonameId,
        name: fields[1],
        asciiName: fields[2] || fields[1],
        alternateNames: fields[3] ? fields[3].split(',') : [],
        latitude: Number(fields[4]),
        longitude: Number(fields[5]),
        featureClass: fields[6],
        featureCode: fields[7],
        iso2: fields[8],
        admin1Code: fields[10],
        admin2Code: fields[11],
        timeZone: fields[17],
      })
    }

    start = end + 1
  }

  return cities
}

function addSelectedCity(cities, selection, sourceCity) {
  if (selection.key.slice(0, 2).toUpperCase() !== sourceCity.iso2) {
    throw new Error(`Country mismatch for ${selection.key}: ${sourceCity.iso2}`)
  }

  if (sourceCity.featureCode === 'PPLX') {
    throw new Error(`City section cannot be selected: ${selection.key}`)
  }

  if (isSamePlaceAlreadyPresent(cities, sourceCity)) {
    throw new Error(`Selected city duplicates an existing place: ${selection.key}`)
  }

  if (cities.some((city) => city.key === selection.key)) {
    throw new Error(`City key collision: ${selection.key}`)
  }

  cities.push({
    key: selection.key,
    name: selection.name,
    country: selection.country,
    iso2: sourceCity.iso2,
    ...(selection.regionCode ? { regionCode: selection.regionCode } : {}),
    latitude: roundCoordinate(sourceCity.latitude),
    longitude: roundCoordinate(sourceCity.longitude),
    timeZone: selection.timeZone ?? sourceCity.timeZone,
  })
}

function addKoreaMunicipalities(cities, municipalities, sourceCities) {
  if (!sourceCities) {
    throw new Error('GeoNames KR source is unavailable')
  }

  const typeCounts = new Map()
  const identityIds = new Set()
  const municipalityKeys = new Set()

  for (const municipality of municipalities) {
    typeCounts.set(municipality.type, (typeCounts.get(municipality.type) ?? 0) + 1)

    if (!municipality.key || !municipality.name || !municipality.province) {
      throw new Error(`Invalid Korean municipality metadata: ${JSON.stringify(municipality)}`)
    }

    if (identityIds.has(municipality.geonameId)) {
      throw new Error(`Duplicate Korean municipality GeoNames ID: ${municipality.geonameId}`)
    }

    if (municipalityKeys.has(municipality.key)) {
      throw new Error(`Duplicate Korean municipality key: ${municipality.key}`)
    }

    identityIds.add(municipality.geonameId)
    municipalityKeys.add(municipality.key)

    const regionCode = KOREA_REGION_CODE_BY_NAME[municipality.province]

    if (!regionCode) {
      throw new Error(`Unknown Korean province for ${municipality.key}: ${municipality.province}`)
    }

    const identity = sourceCities.get(municipality.geonameId)

    if (identity?.iso2 !== 'KR' || identity.featureClass !== 'A' || identity.featureCode !== 'ADM2') {
      throw new Error(`Invalid Korean municipality identity source for ${municipality.key}`)
    }

    const existingCity = cities.find((city) => city.key === municipality.key)

    if (existingCity) {
      if (
        existingCity.name !== municipality.name ||
        existingCity.country !== '대한민국' ||
        existingCity.iso2 !== 'KR' ||
        existingCity.timeZone !== 'Asia/Seoul'
      ) {
        throw new Error(`Existing Korean city conflicts with municipality roster: ${municipality.key}`)
      }

      if (existingCity.regionCode && existingCity.regionCode !== regionCode) {
        throw new Error(`Korean region conflict for ${municipality.key}: ${existingCity.regionCode} / ${regionCode}`)
      }

      existingCity.regionCode = regionCode
      continue
    }

    const coordinateSourceId = municipality.coordinateGeonameId ?? municipality.geonameId
    const coordinateSource = sourceCities.get(coordinateSourceId)

    if (coordinateSource?.iso2 !== 'KR') {
      throw new Error(`Invalid coordinate source for Korean municipality ${municipality.key}`)
    }

    if (
      coordinateSource.featureCode !== 'ADMF' &&
      coordinateSource.featureCode !== 'ADM2' &&
      coordinateSource.featureCode !== 'ADM3' &&
      (coordinateSource.featureClass !== 'P' || coordinateSource.featureCode === 'PPLX')
    ) {
      throw new Error(`Unsupported coordinate source for Korean municipality ${municipality.key}`)
    }

    cities.push({
      key: municipality.key,
      name: municipality.name,
      country: '대한민국',
      iso2: 'KR',
      regionCode,
      latitude: roundCoordinate(coordinateSource.latitude),
      longitude: roundCoordinate(coordinateSource.longitude),
      timeZone: 'Asia/Seoul',
    })
  }

  for (const [type, expectedCount] of Object.entries(KOREA_MUNICIPALITY_COUNTS)) {
    const actualCount = typeCounts.get(type) ?? 0

    if (actualCount !== expectedCount) {
      throw new Error(`Expected ${expectedCount} Korean ${type} entries, found ${actualCount}`)
    }
  }

  if (typeCounts.size !== Object.keys(KOREA_MUNICIPALITY_COUNTS).length) {
    throw new Error('Korean municipality roster contains an unsupported type')
  }

  for (const city of cities.filter((city) => city.iso2 === 'KR')) {
    if (!municipalityKeys.has(city.key) && !KOREA_UPPER_CITY_KEYS.has(city.key)) {
      throw new Error(`Korean city is outside the municipality and upper-city rosters: ${city.key}`)
    }
  }

  for (const [upperCityKey, regionCode] of Object.entries(KOREA_UPPER_CITY_REGION_CODE_BY_KEY)) {
    const city = cities.find((candidate) => candidate.key === upperCityKey)

    if (!city) {
      throw new Error(`Missing Korean upper-level city: ${upperCityKey}`)
    }

    if (city.regionCode && city.regionCode !== regionCode) {
      throw new Error(`Korean region conflict for ${upperCityKey}: ${city.regionCode} / ${regionCode}`)
    }

    city.regionCode = regionCode
  }
}

function addChinaDivisions(cities, divisions, sourceCityMaps) {
  const levelCounts = new Map()
  const prefectureTypeCounts = new Map()
  const administrativeCodes = new Set()
  const directMunicipalityCodes = new Set(['110000', '120000', '310000', '500000'])
  const countryNames = { CN: '中国', HK: '香港', MO: '澳门' }

  for (const division of divisions) {
    levelCounts.set(division.level, (levelCounts.get(division.level) ?? 0) + 1)

    if (
      !/^\d{6}$/.test(division.administrativeCode) ||
      !division.key ||
      !division.name ||
      !division.regionCode ||
      !countryNames[division.iso2]
    ) {
      throw new Error(`Invalid Chinese division metadata: ${JSON.stringify(division)}`)
    }

    if (administrativeCodes.has(division.administrativeCode)) {
      throw new Error(`Duplicate Chinese administrative code: ${division.administrativeCode}`)
    }

    if (cities.some((city) => city.key === division.key)) {
      throw new Error(`Chinese division key collision: ${division.key}`)
    }

    administrativeCodes.add(division.administrativeCode)

    const sourceName = division.source ?? 'CN'
    const sourceCities = sourceCityMaps.get(sourceName)
    const identity = sourceCities?.get(division.geonameId)
    const coordinateSource = sourceCities?.get(division.coordinateGeonameId)

    if (!identity || identity.iso2 !== division.iso2) {
      throw new Error(`Invalid Chinese division identity source for ${division.key}`)
    }

    if (
      !coordinateSource ||
      coordinateSource.iso2 !== division.iso2 ||
      coordinateSource.featureClass !== 'P' ||
      coordinateSource.featureCode === 'PPLX'
    ) {
      throw new Error(`Invalid Chinese coordinate source for ${division.key}`)
    }

    if (division.level === 'prefecture') {
      if (
        division.iso2 !== 'CN' ||
        sourceName !== 'CN' ||
        identity.featureClass !== 'A' ||
        identity.featureCode !== 'ADM2' ||
        identity.admin2Code !== division.administrativeCode.slice(0, 4)
      ) {
        throw new Error(`Invalid Chinese prefecture identity for ${division.key}`)
      }

      const prefectureType = division.name.endsWith('自治州')
        ? 'autonomousPrefecture'
        : division.name.endsWith('地区')
          ? 'prefecture'
          : division.name.endsWith('盟')
            ? 'league'
            : division.name.endsWith('市')
              ? 'city'
              : 'unsupported'

      prefectureTypeCounts.set(prefectureType, (prefectureTypeCounts.get(prefectureType) ?? 0) + 1)
    } else if (division.level === 'province') {
      if (division.iso2 === 'CN') {
        if (
          !directMunicipalityCodes.has(division.administrativeCode) ||
          sourceName !== 'CN' ||
          identity.featureClass !== 'A' ||
          identity.featureCode !== 'ADM1'
        ) {
          throw new Error(`Invalid Chinese direct municipality identity for ${division.key}`)
        }
      } else if (!['HK', 'MO'].includes(division.iso2) || sourceName !== 'cities15000') {
        throw new Error(`Invalid Chinese special administrative region identity for ${division.key}`)
      }
    } else {
      throw new Error(`Unsupported Chinese administrative level for ${division.key}: ${division.level}`)
    }

    cities.push({
      key: division.key,
      name: division.name,
      country: countryNames[division.iso2],
      iso2: division.iso2,
      regionCode: division.regionCode,
      administrativeCode: division.administrativeCode,
      administrativeLevel: division.level,
      latitude: roundCoordinate(coordinateSource.latitude),
      longitude: roundCoordinate(coordinateSource.longitude),
      timeZone: division.iso2 === 'CN' ? 'Asia/Shanghai' : coordinateSource.timeZone,
    })
  }

  for (const [level, expectedCount] of Object.entries(CHINA_DIVISION_COUNTS)) {
    const actualCount = levelCounts.get(level) ?? 0

    if (actualCount !== expectedCount) {
      throw new Error(`Expected ${expectedCount} Chinese ${level} divisions, found ${actualCount}`)
    }
  }

  if (levelCounts.size !== Object.keys(CHINA_DIVISION_COUNTS).length) {
    throw new Error('Chinese division roster contains an unsupported level')
  }

  for (const [type, expectedCount] of Object.entries(CHINA_PREFECTURE_TYPE_COUNTS)) {
    const actualCount = prefectureTypeCounts.get(type) ?? 0

    if (actualCount !== expectedCount) {
      throw new Error(`Expected ${expectedCount} Chinese ${type} divisions, found ${actualCount}`)
    }
  }

  if (prefectureTypeCounts.size !== Object.keys(CHINA_PREFECTURE_TYPE_COUNTS).length) {
    throw new Error('Chinese prefecture roster contains an unsupported type')
  }
}

function isSamePlaceAlreadyPresent(cities, sourceCity) {
  const normalizedSourceName = normalizeName(sourceCity.asciiName)

  return cities.some(
    (city) =>
      city.iso2 === sourceCity.iso2 &&
      (normalizeName(city.name) === normalizedSourceName || distanceInKm(city, sourceCity) <= 10),
  )
}

function normalizeName(value) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function distanceInKm(a, b) {
  const earthRadiusKm = 6371
  const latitude1 = degreesToRadians(a.latitude)
  const latitude2 = degreesToRadians(b.latitude)
  const latitudeDelta = latitude2 - latitude1
  const longitudeDelta = degreesToRadians(b.longitude - a.longitude)
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180
}

function roundCoordinate(value) {
  return Number(value.toFixed(4))
}

function validateCities(cities) {
  const keys = new Set()
  const countryNameByIso2 = new Map()

  for (const city of cities) {
    if (!/^[a-z]{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(city.key)) {
      throw new Error(`Invalid city key: ${city.key}`)
    }

    if (keys.has(city.key)) {
      throw new Error(`Duplicate city key: ${city.key}`)
    }

    keys.add(city.key)

    if (!/^[A-Z]{2}$/.test(city.iso2) || !city.name || !city.country) {
      throw new Error(`Invalid city identity: ${JSON.stringify(city)}`)
    }

    if (city.regionCode !== undefined && !/^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(city.regionCode)) {
      throw new Error(`Invalid ISO 3166-2 region code for ${city.key}: ${city.regionCode}`)
    }

    const isChineseMarket = ['CN', 'HK', 'MO'].includes(city.iso2)

    if (isChineseMarket) {
      if (!/^\d{6}$/.test(city.administrativeCode) || !['province', 'prefecture'].includes(city.administrativeLevel)) {
        throw new Error(`Missing Chinese administrative identity for ${city.key}`)
      }
    } else if (city.administrativeCode !== undefined || city.administrativeLevel !== undefined) {
      throw new Error(`Unexpected Chinese administrative identity on ${city.key}`)
    }

    if (
      !Number.isFinite(city.latitude) ||
      city.latitude < -90 ||
      city.latitude > 90 ||
      !Number.isFinite(city.longitude) ||
      city.longitude < -180 ||
      city.longitude > 180
    ) {
      throw new Error(`Invalid coordinates for ${city.key}`)
    }

    try {
      new Intl.DateTimeFormat('en', { timeZone: city.timeZone }).format()
    } catch {
      throw new Error(`Invalid IANA time zone for ${city.key}: ${city.timeZone}`)
    }

    if (city.iso2 === 'CN' && city.timeZone !== 'Asia/Shanghai') {
      throw new Error(`Mainland China must use standard time for ${city.key}: ${city.timeZone}`)
    }

    if (city.iso2 === 'HK' && city.timeZone !== 'Asia/Hong_Kong') {
      throw new Error(`Hong Kong must use Asia/Hong_Kong for ${city.key}: ${city.timeZone}`)
    }

    if (city.iso2 === 'MO' && city.timeZone !== 'Asia/Macau') {
      throw new Error(`Macao must use Asia/Macau for ${city.key}: ${city.timeZone}`)
    }

    const existingCountryName = countryNameByIso2.get(city.iso2)

    if (existingCountryName && existingCountryName !== city.country) {
      throw new Error(`Inconsistent country label for ${city.iso2}: ${existingCountryName} / ${city.country}`)
    }

    countryNameByIso2.set(city.iso2, city.country)
  }

  for (const defaultKey of ['kr-seoul', 'us-new-york', 'jp-tokyo', 'cn-1100-beijing']) {
    if (!keys.has(defaultKey)) {
      throw new Error(`Missing locale default city: ${defaultKey}`)
    }
  }

  const actualCountryCounts = new Map()

  for (const city of cities) {
    if (!(city.iso2 in EXPECTED_COUNTRY_COUNTS)) {
      throw new Error(`Unsupported city country: ${city.key} (${city.iso2})`)
    }

    actualCountryCounts.set(city.iso2, (actualCountryCounts.get(city.iso2) ?? 0) + 1)
  }

  for (const [iso2, expectedCount] of Object.entries(EXPECTED_COUNTRY_COUNTS)) {
    const actualCount = actualCountryCounts.get(iso2) ?? 0

    if (actualCount !== expectedCount) {
      throw new Error(`Expected ${expectedCount} ${iso2} city choices, found ${actualCount}`)
    }
  }
}

function validateCityMarkets(cities, cityMarkets) {
  const expectedLocales = ['ko', 'en', 'ja', 'zh']
  const locales = Object.keys(cityMarkets).sort()

  if (locales.join(',') !== [...expectedLocales].sort().join(',')) {
    throw new Error(`City markets must define exactly ${expectedLocales.join(', ')}; found ${locales.join(', ')}`)
  }

  const localeByCountryCode = new Map()

  for (const locale of expectedLocales) {
    const market = cityMarkets[locale]

    if (market.groupBy !== 'country' && market.groupBy !== 'region') {
      throw new Error(`Invalid grouping strategy for ${locale}: ${market.groupBy}`)
    }

    if (!Array.isArray(market.countryCodes) || market.countryCodes.length === 0) {
      throw new Error(`City market ${locale} has no country codes`)
    }

    if (!Array.isArray(market.groups) || market.groups.length === 0) {
      throw new Error(`City market ${locale} has no group definitions`)
    }

    const groupKeys = new Set()

    for (const group of market.groups) {
      if (!group.key || !group.label || !/^[A-Z]{2}(?:-[A-Z0-9]{1,3})?$/.test(group.key)) {
        throw new Error(`Invalid city group in ${locale}: ${JSON.stringify(group)}`)
      }

      if (groupKeys.has(group.key)) {
        throw new Error(`Duplicate city group in ${locale}: ${group.key}`)
      }

      groupKeys.add(group.key)
    }

    for (const iso2 of market.countryCodes) {
      if (!/^[A-Z]{2}$/.test(iso2) || !(iso2 in EXPECTED_COUNTRY_COUNTS)) {
        throw new Error(`Invalid country code in ${locale} market: ${iso2}`)
      }

      if (localeByCountryCode.has(iso2)) {
        throw new Error(`Country ${iso2} belongs to multiple city markets`)
      }

      if (market.groupBy === 'country' && !groupKeys.has(iso2)) {
        throw new Error(`Country-grouped market ${locale} is missing group ${iso2}`)
      }

      localeByCountryCode.set(iso2, locale)
    }

    if (market.groupBy === 'country') {
      for (const groupKey of groupKeys) {
        if (!market.countryCodes.includes(groupKey)) {
          throw new Error(`Country-grouped market ${locale} has unexpected group ${groupKey}`)
        }
      }
    }
  }

  for (const iso2 of Object.keys(EXPECTED_COUNTRY_COUNTS)) {
    if (!localeByCountryCode.has(iso2)) {
      throw new Error(`Country ${iso2} is missing from the locale market definitions`)
    }
  }

  for (const city of cities) {
    const locale = localeByCountryCode.get(city.iso2)
    const market = cityMarkets[locale]
    const groupKey = market.groupBy === 'country' ? city.iso2 : city.regionCode

    if (market.groupBy === 'country' && city.regionCode) {
      throw new Error(`Country-grouped city must not define a region: ${city.key}`)
    }

    if (!groupKey || !market.groups.some((group) => group.key === groupKey)) {
      throw new Error(`City ${city.key} has no valid ${locale} group: ${groupKey ?? 'missing'}`)
    }
  }
}

function getLocaleByCountryCode(cityMarkets) {
  const localeByCountryCode = new Map()

  for (const [locale, market] of Object.entries(cityMarkets)) {
    for (const iso2 of market.countryCodes) {
      localeByCountryCode.set(iso2, locale)
    }
  }

  return localeByCountryCode
}

function validateLocaleCounts(cities, cityMarkets) {
  const localeByCountryCode = getLocaleByCountryCode(cityMarkets)
  const localeCounts = new Map()

  for (const city of cities) {
    const locale = localeByCountryCode.get(city.iso2)

    if (!locale) {
      throw new Error(`City ${city.key} is not assigned to a locale catalog`)
    }

    localeCounts.set(locale, (localeCounts.get(locale) ?? 0) + 1)
  }

  for (const [locale, expectedCount] of Object.entries(EXPECTED_LOCALE_COUNTS)) {
    const actualCount = localeCounts.get(locale) ?? 0

    if (actualCount !== expectedCount) {
      throw new Error(`Expected ${expectedCount} ${locale} city choices, found ${actualCount}`)
    }
  }
}

function serializeCities(locale, cities, sourceHashes) {
  const cityBlocks = cities.map(
    (city) => `  {
    key: ${quote(city.key)},
    name: ${quote(city.name)},
    country: ${quote(city.country)},
    iso2: ${quote(city.iso2)},
${city.regionCode ? `    regionCode: ${quote(city.regionCode)},\n` : ''}${
  city.administrativeCode ? `    administrativeCode: ${quote(city.administrativeCode)},\n` : ''
}${city.administrativeLevel ? `    administrativeLevel: ${quote(city.administrativeLevel)},\n` : ''}    latitude: ${city.latitude},
    longitude: ${city.longitude},
    timeZone: ${quote(city.timeZone)},
  },`,
  )
  const sourceNames =
    locale === 'ko' ? ['cities15000', 'KR'] : locale === 'zh' ? ['cities15000', 'CN'] : ['cities15000']
  const sourceLines = sourceNames
    .map((sourceName) => `// ${sourceName}.zip SHA-256: ${sourceHashes[sourceName]}`)
    .join('\n')
  const licenseNotice =
    locale === 'zh'
      ? 'GeoNames data is CC BY 4.0; the Chinese administrative roster is CC0.'
      : 'GeoNames data is CC BY 4.0.'

  return `// AUTO-GENERATED by apps/stella/scripts/generate-cities.mjs — do not edit by hand.
// Locale: ${locale}; ${licenseNotice}
${sourceLines}
// ${cities.length} selectable places. Regenerate with \`bun run gen:cities\` from apps/stella.

import type { City } from './cities'

export const GENERATED_CITIES: readonly City[] = [
${cityBlocks.join('\n')}
]
`
}

function quote(value) {
  if (value.includes("'") && !value.includes('"')) {
    return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
  }

  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

function summarize(cities) {
  const iso2Counts = new Map()

  for (const city of cities) {
    iso2Counts.set(city.iso2, (iso2Counts.get(city.iso2) ?? 0) + 1)
  }

  const englishCount = ['US', 'GB', 'CA', 'AU', 'NZ'].reduce((sum, iso2) => sum + (iso2Counts.get(iso2) ?? 0), 0)
  const chineseCount = ['CN', 'HK', 'MO'].reduce((sum, iso2) => sum + (iso2Counts.get(iso2) ?? 0), 0)

  return `${cities.length} cities (ko ${iso2Counts.get('KR') ?? 0}, en ${englishCount}, ja ${iso2Counts.get('JP') ?? 0}, zh ${chineseCount})`
}
