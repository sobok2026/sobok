const KR_GEONAMES_ADMIN1 = {
  11: ['11'],
  12: ['18', '16'],
  26: ['10'],
  27: ['15'],
  28: ['12'],
  29: ['18'],
  30: ['19'],
  31: ['21'],
  36: ['22'],
  41: ['13'],
  43: ['05'],
  44: ['17'],
  46: ['16'],
  47: ['14'],
  48: ['20'],
  50: ['01'],
  51: ['06'],
  52: ['03'],
}

const JP_GEONAMES_ADMIN1 = {
  '01': ['12'],
  '02': ['03'],
  '03': ['16'],
  '04': ['24'],
  '05': ['02'],
  '06': ['44'],
  '07': ['08'],
  '08': ['14'],
  '09': ['38'],
  10: ['10'],
  11: ['34'],
  12: ['04'],
  13: ['40'],
  14: ['19'],
  15: ['29'],
  16: ['42'],
  17: ['15'],
  18: ['06'],
  19: ['46'],
  20: ['26'],
  21: ['09'],
  22: ['37'],
  23: ['01'],
  24: ['23'],
  25: ['35'],
  26: ['22'],
  27: ['32'],
  28: ['13'],
  29: ['28'],
  30: ['43'],
  31: ['41'],
  32: ['36'],
  33: ['31'],
  34: ['11'],
  35: ['45'],
  36: ['39'],
  37: ['17'],
  38: ['05'],
  39: ['20'],
  40: ['07'],
  41: ['33'],
  42: ['27'],
  43: ['21'],
  44: ['30'],
  45: ['25'],
  46: ['18'],
  47: ['47'],
}

const CN_GEONAMES_ADMIN1 = {
  11: ['22'],
  12: ['28'],
  13: ['10'],
  14: ['24'],
  15: ['20'],
  21: ['19'],
  22: ['05'],
  23: ['08'],
  31: ['23'],
  32: ['04'],
  33: ['02'],
  34: ['01'],
  35: ['07'],
  36: ['03'],
  37: ['25'],
  41: ['09'],
  42: ['12'],
  43: ['11'],
  44: ['30'],
  45: ['16'],
  46: ['31'],
  50: ['33'],
  51: ['32'],
  52: ['18'],
  53: ['29'],
  54: ['14'],
  61: ['26'],
  62: ['15'],
  63: ['06'],
  64: ['21'],
  65: ['13'],
}

const CN_DIRECT_MUNICIPALITIES = new Set(['11', '12', '31', '50'])
const MAINLAND_CHINA_CODES = new Set(Object.keys(CN_GEONAMES_ADMIN1))
// Product semantics, not a name heuristic: these top-level jurisdictions are
// meaningful city choices in their own right. Broad province-like regions remain
// grouping-only even when their legal name happens to end in "특별시".
const KR_ADMIN1_SELF_OPTION_CODES = new Set(['11', '26', '27', '28', '30', '31', '36'])
// e-Stat publishes these claimed Northern Territories codes, but Japan does not
// currently administer them and users cannot meaningfully select them as birthplaces.
const JP_UNADMINISTERED_NORTHERN_TERRITORY_CODES = new Set(['01695', '01696', '01697', '01698', '01699', '01700'])
// Coordinate lookup aliases bridge recent reorganizations that GeoNames still records
// under an earlier unit. They never replace the official display name; GeoNames may
// retain the former name as a useful search alias after the coordinate is matched.
const KR_COORDINATE_LOOKUP_NAMES = {
  2812500000: ['동구'],
  2815500000: ['영종동'],
  2827500000: ['서구'],
  2829000000: ['검단1동'],
}
const CN_COORDINATE_LOOKUP_NAMES = {
  500154000000: ['开县', 'kai xian'],
}

export function createKoreanAdministrativeCatalog(source, countryName) {
  const rows = source
    .split(/\r?\n/)
    .slice(1)
    .flatMap((line) => {
      const [code, fullName, status] = line.split('\t')
      return code && fullName && status?.trim() === '존재' ? [{ code, fullName }] : []
    })
  const topLevelRows = rows.filter(({ fullName }) => fullName.trim().split(/\s+/).length === 1)
  const groups = topLevelRows.map(({ code, fullName }) =>
    group({
      id: `KR-${code.slice(0, 2)}`,
      label: fullName,
      countryCode: 'KR',
      countryName,
      officialCode: code,
      geonamesAdmin1Codes: KR_GEONAMES_ADMIN1[code.slice(0, 2)] ?? [],
    }),
  )
  validateAdmin1SelfOptionPolicy('KR', groups, KR_ADMIN1_SELF_OPTION_CODES)
  const units = groups.flatMap((parent) => {
    const officialPrefix = parent.officialCode.slice(0, 2)
    const children = rows.filter(({ code, fullName }) => {
      return (
        code !== parent.officialCode &&
        code.startsWith(officialPrefix) &&
        /^\d{5}0{5}$/.test(code) &&
        fullName.split(/\s+/).length === 2
      )
    })

    const selfUnits = KR_ADMIN1_SELF_OPTION_CODES.has(officialPrefix)
      ? [
          admin1SelfUnit({
            id: `KR:${parent.officialCode}`,
            officialCode: parent.officialCode,
            name: shortenKoreanTopLevelName(parent.label),
            countryCode: 'KR',
            groupId: parent.id,
            aliases: [parent.label],
            lookupNames: [parent.label, shortenKoreanTopLevelName(parent.label)],
            suggestionPriority: parent.officialCode === '1100000000' ? 2 : 1,
          }),
        ]
      : []
    const childUnits = children.map(({ code, fullName }) => {
      const name = fullName.split(/\s+/).at(-1)
      return unit({
        id: `KR:${code}`,
        officialCode: code,
        name,
        countryCode: 'KR',
        groupId: parent.id,
        aliases: [fullName],
        lookupNames: [name, stripKoreanUnitSuffix(name)],
        coordinateLookupNames: KR_COORDINATE_LOOKUP_NAMES[code] ?? [],
        suggestionPriority: code === '1111000000',
      })
    })

    return [...selfUnits, ...childUnits]
  })

  return { groups, units }
}

export function createJapaneseAdministrativeCatalog(source, countryName) {
  const rows = parseCsv(source)
  const records = rows.slice(1).flatMap((fields) => {
    const [code, prefecture, parentName, parentKana, selfName, selfKana] = fields

    if (!/^\d{5}$/.test(code) || !prefecture) {
      return []
    }

    const isDesignatedCityWard = parentName.endsWith('市') && selfName.endsWith('区')
    const isTokyoWardsAggregate = code === '13100'
    const isUnadministeredNorthernTerritory = JP_UNADMINISTERED_NORTHERN_TERRITORY_CODES.has(code)
    const name = selfName || parentName
    const kana = selfName ? selfKana : parentKana

    return !name || isDesignatedCityWard || isTokyoWardsAggregate || isUnadministeredNorthernTerritory
      ? []
      : [{ code, prefecture, name, kana }]
  })
  const prefectures = new Map()

  for (const record of records) {
    prefectures.set(record.code.slice(0, 2), record.prefecture)
  }

  const groups = [...prefectures]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, label]) =>
      group({
        id: `JP-${code}`,
        label,
        countryCode: 'JP',
        countryName,
        officialCode: code,
        geonamesAdmin1Codes: JP_GEONAMES_ADMIN1[code] ?? [],
      }),
    )
  const units = records.map(({ code, name, kana }) =>
    unit({
      id: `JP:${code}`,
      officialCode: code,
      name,
      countryCode: 'JP',
      groupId: `JP-${code.slice(0, 2)}`,
      aliases: [kana],
      lookupNames: [name, stripJapaneseUnitSuffix(name)],
      suggestionPriority: code === '13101',
    }),
  )

  return { groups, units }
}

export function createChineseAdministrativeCatalog(source, countries) {
  const rows = parseCsv(source)
  const records = rows.slice(1).flatMap((fields) => {
    const [id, parentId, depth, shortName, , pinyin, officialCode, fullName] = fields
    return id && parentId && officialCode && fullName
      ? [{ id, parentId, depth: Number(depth), shortName, pinyin, officialCode, fullName }]
      : []
  })
  const mainlandRoots = records
    .filter((record) => record.depth === 0 && MAINLAND_CHINA_CODES.has(record.officialCode.slice(0, 2)))
    .sort((a, b) => a.officialCode.localeCompare(b.officialCode))
  const rootByOfficialCode = new Map(mainlandRoots.map((record) => [record.officialCode, record]))
  const mainlandGroups = mainlandRoots.map((record) => {
    const code = record.officialCode.slice(0, 2)
    return group({
      id: `CN-${code}`,
      label: record.fullName,
      countryCode: 'CN',
      countryName: countries.CN,
      officialCode: record.officialCode,
      geonamesAdmin1Codes: CN_GEONAMES_ADMIN1[code] ?? [],
    })
  })
  validateAdmin1SelfOptionPolicy('CN', mainlandGroups, CN_DIRECT_MUNICIPALITIES)
  const units = mainlandGroups.flatMap((parent) => {
    const provinceCode = parent.officialCode.slice(0, 2)
    const expectedDepth = CN_DIRECT_MUNICIPALITIES.has(provinceCode) ? 2 : 1
    const parentRecord = rootByOfficialCode.get(parent.officialCode)

    if (!parentRecord) {
      throw new Error(`Missing mainland China root record ${parent.officialCode}`)
    }

    const selfUnits = CN_DIRECT_MUNICIPALITIES.has(provinceCode)
      ? [
          admin1SelfUnit({
            id: `CN:${parent.officialCode}`,
            officialCode: parent.officialCode,
            name: parentRecord.shortName,
            countryCode: 'CN',
            groupId: parent.id,
            aliases: [parentRecord.fullName, parentRecord.pinyin],
            lookupNames: [parentRecord.fullName, parentRecord.shortName],
            suggestionPriority: provinceCode === '11' ? 2 : 1,
          }),
        ]
      : []
    const childUnits = records
      .filter((record) => record.depth === expectedDepth && record.officialCode.startsWith(provinceCode))
      .map((record) =>
        unit({
          id: `CN:${record.officialCode}`,
          officialCode: record.officialCode,
          name: record.fullName,
          countryCode: 'CN',
          groupId: parent.id,
          aliases: [record.shortName, record.pinyin],
          lookupNames: [record.fullName, record.shortName],
          coordinateLookupNames: CN_COORDINATE_LOOKUP_NAMES[record.officialCode] ?? [],
          suggestionPriority: record.officialCode === '110101000000',
        }),
      )

    return [...selfUnits, ...childUnits]
  })

  const specialRegions = [
    {
      group: group({
        id: 'HK',
        label: '香港特别行政区',
        countryCode: 'HK',
        countryName: countries.HK,
        officialCode: '810000000000',
        geonamesAdmin1Codes: [],
      }),
      unit: admin1SelfUnit({
        id: 'HK:810000000000',
        officialCode: '810000000000',
        name: '香港',
        countryCode: 'HK',
        groupId: 'HK',
        aliases: ['Hong Kong'],
        lookupNames: ['香港', 'Hong Kong'],
      }),
    },
    {
      group: group({
        id: 'MO',
        label: '澳门特别行政区',
        countryCode: 'MO',
        countryName: countries.MO,
        officialCode: '820000000000',
        geonamesAdmin1Codes: [],
      }),
      unit: admin1SelfUnit({
        id: 'MO:820000000000',
        officialCode: '820000000000',
        name: '澳门',
        countryCode: 'MO',
        groupId: 'MO',
        aliases: ['Macao', 'Macau'],
        lookupNames: ['澳门', 'Macao', 'Macau'],
      }),
    },
  ]

  return {
    groups: [...mainlandGroups, ...specialRegions.map((entry) => entry.group)],
    units: [...units, ...specialRegions.map((entry) => entry.unit)],
  }
}

function group(value) {
  return value
}

function unit(value) {
  return value
}

function admin1SelfUnit(value) {
  return unit({
    ...value,
    coordinatePrecision: 'administrativeArea',
    suggestionPriority: value.suggestionPriority ?? 1,
  })
}

function validateAdmin1SelfOptionPolicy(countryCode, groups, configuredCodes) {
  const availableCodes = new Set(groups.map((entry) => entry.officialCode.slice(0, 2)))

  for (const code of configuredCodes) {
    if (!availableCodes.has(code)) {
      throw new Error(`Configured ${countryCode} admin1 self-option code ${code} is absent from the official source`)
    }
  }
}

function shortenKoreanTopLevelName(name) {
  for (const suffix of ['특별자치시', '특별시', '광역시']) {
    if (name.endsWith(suffix) && name.length > suffix.length) {
      return name.slice(0, -suffix.length)
    }
  }

  return name
}

function stripKoreanUnitSuffix(name) {
  for (const suffix of ['특별자치시', '시', '군', '구']) {
    if (name.endsWith(suffix) && [...name.slice(0, -suffix.length)].length >= 2) {
      return name.slice(0, -suffix.length)
    }
  }

  return name
}

function stripJapaneseUnitSuffix(name) {
  for (const suffix of ['市', '区', '町', '村']) {
    if (name.endsWith(suffix) && name.length > suffix.length) {
      return name.slice(0, -suffix.length)
    }
  }

  return name
}

export function parseCsv(source) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]

    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
    } else if (character === '"') {
      quoted = true
    } else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''))
      rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (field || row.length > 0) {
    row.push(field.replace(/\r$/, ''))
    rows.push(row)
  }

  if (rows[0]?.[0]) {
    rows[0][0] = rows[0][0].replace(/^\uFEFF/, '')
  }

  return rows
}
