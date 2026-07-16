import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const MAX_SOURCE_SIZE = 512 * 1024 * 1024
const CHINA_SNAPSHOT_COMMIT = 'c6c6e35bea3066d674efe2cded189dc57a86e7d8'

export function createSourceDefinitions(cacheDirectory) {
  return {
    geonamesCities1000: {
      url: 'https://download.geonames.org/export/dump/cities1000.zip',
      path: join(cacheDirectory, 'cities1000.zip'),
      zipEntry: 'cities1000.txt',
    },
    geonamesAdmin1: {
      url: 'https://download.geonames.org/export/dump/admin1CodesASCII.txt',
      path: join(cacheDirectory, 'admin1CodesASCII.txt'),
    },
    geonamesAdmin2: {
      url: 'https://download.geonames.org/export/dump/admin2Codes.txt',
      path: join(cacheDirectory, 'admin2Codes.txt'),
    },
    geonamesKR: countryGeoNamesSource(cacheDirectory, 'KR'),
    geonamesJP: countryGeoNamesSource(cacheDirectory, 'JP'),
    geonamesCN: countryGeoNamesSource(cacheDirectory, 'CN'),
    officialKR: {
      url: 'https://www.code.go.kr/etc/codeFullDown.do',
      path: join(cacheDirectory, 'official-KR.zip'),
      request: {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ codeseId: '법정동코드' }).toString(),
      },
      zipAll: true,
      encoding: 'euc-kr',
      validate: isZip,
    },
    officialJP: {
      url: buildJapanMunicipalityUrl(),
      path: join(cacheDirectory, 'official-JP.csv'),
      validate: (buffer) => decode(buffer).includes('標準地域コード'),
    },
    officialCN: {
      url: `https://raw.githubusercontent.com/xiangyuecn/AreaCity-JsSpider-StatsGov/${CHINA_SNAPSHOT_COMMIT}/src/%E9%87%87%E9%9B%86%E5%88%B0%E7%9A%84%E6%95%B0%E6%8D%AE/ok_data_level3.csv`,
      path: join(cacheDirectory, 'official-CN-2025.csv'),
      validate: (buffer) =>
        decode(buffer)
          .replace(/^\uFEFF/, '')
          .startsWith('id,pid,deep,name,'),
    },
  }
}

function countryGeoNamesSource(cacheDirectory, countryCode) {
  return {
    url: `https://download.geonames.org/export/dump/${countryCode}.zip`,
    path: join(cacheDirectory, `${countryCode}.zip`),
    zipEntry: `${countryCode}.txt`,
  }
}

function buildJapanMunicipalityUrl(date = new Date()) {
  const params = new URLSearchParams({
    date_year: String(date.getUTCFullYear()),
    date_month: String(date.getUTCMonth() + 1),
    date_day: String(date.getUTCDate()),
    prefecture_all: 'on',
    keyword_kd: 'code',
    form_id: 'city_areacode_form',
    source: 'setup',
    page: '',
    file_format: 'csv',
    charset: 'UTF-8',
    bom: '0',
    op: 'download',
  })

  for (let prefecture = 1; prefecture <= 47; prefecture += 1) {
    params.append(`pf[${prefecture}]`, String(prefecture))
  }

  for (const kind of [4, 5, 6, 7]) {
    params.append(`city_kd[${kind}]`, String(kind))
  }

  for (const item of [
    'htCode',
    'todoNm',
    'parentCityNm',
    'parentCityKana',
    'selfCityNm',
    'selfCityKana',
    'htCodeSDate',
    'jiyuId',
  ]) {
    params.append('item[]', item)
  }

  params.append('sort[]', 'htCode-asc')

  for (const item of ['cityType', 'kasoFlg', 'htCodeKokujiDate', 'htCodeKokujiNo', 'htCodeEDate']) {
    params.append('choices_to_show[]', item)
  }

  for (const item of ['kasoFlg', 'htCodeSDate', 'htCodeEDate', 'htCodeKokujiDate', 'htCodeKokujiNo']) {
    params.append('choices_to_sort[]', item)
  }

  for (const item of [
    'htCode-desc',
    'kasoFlg-asc',
    'kasoFlg-desc',
    'htCodeSDate-asc',
    'htCodeSDate-desc',
    'htCodeEDate-asc',
    'htCodeEDate-desc',
    'htCodeKokujiDate-asc',
    'htCodeKokujiDate-desc',
    'htCodeKokujiNo-asc',
    'htCodeKokujiNo-desc',
  ]) {
    params.append('choices_to_sort_value[]', item)
  }

  return `https://www.e-stat.go.jp/municipalities/cities/areacode?${params}`
}

export async function ensureSources(sources, refresh) {
  const firstSource = Object.values(sources)[0]

  if (!firstSource) {
    throw new Error('At least one birthplace source is required')
  }

  mkdirSync(dirname(firstSource.path), { recursive: true })

  for (const source of Object.values(sources)) {
    if (!refresh && existsSync(source.path)) {
      continue
    }

    const response = await fetch(source.url, source.request)

    if (!response.ok) {
      throw new Error(`Failed to download ${source.url}: ${response.status} ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    if (source.validate && !source.validate(buffer)) {
      throw new Error(`Unexpected source format from ${source.url}`)
    }

    const temporaryPath = `${source.path}.download`
    writeFileSync(temporaryPath, buffer)
    renameSync(temporaryPath, source.path)
  }
}

export function readSource(source) {
  if (!source.zipEntry && !source.zipAll) {
    return decode(readFileSync(source.path), source.encoding)
  }

  const args = ['-p', source.path]

  if (source.zipEntry) {
    args.push(source.zipEntry)
  }

  try {
    const buffer = execFileSync('unzip', args, { maxBuffer: MAX_SOURCE_SIZE })
    return decode(buffer, source.encoding)
  } catch (error) {
    throw new Error(`Unable to extract ${source.path}; install the \`unzip\` command`, { cause: error })
  }
}

export function hashSources(sources) {
  return Object.fromEntries(
    Object.entries(sources).map(([name, source]) => [
      name,
      createHash('sha256').update(readFileSync(source.path)).digest('hex'),
    ]),
  )
}

function decode(buffer, encoding = 'utf-8') {
  return new TextDecoder(encoding).decode(buffer)
}

function isZip(buffer) {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04
}
