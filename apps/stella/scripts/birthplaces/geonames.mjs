const EXCLUDED_ENGLISH_FEATURE_CODES = new Set(['PPLH', 'PPLQ', 'PPLW', 'PPLX'])
const ADMINISTRATIVE_SEAT_FEATURE_CODES = new Set(['PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4'])
const DIRECT_MUNICIPALITY_CODES = new Set(['11', '12', '31', '50'])

export function parseAdministrativeCodes(source) {
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

export function createEnglishCatalog(source, market, admin1ByCode, admin2ByCode) {
  const countryCodes = new Set(Object.keys(market.countries))
  const groups = Object.entries(market.countries).map(([countryCode, countryName]) => ({
    id: countryCode,
    label: countryName,
    countryCode,
    countryName,
  }))
  const groupIndexByCountry = new Map(groups.map((group, index) => [group.countryCode, index]))
  const places = []

  forEachLine(source, (line) => {
    const record = parseRecord(line)

    if (
      !record ||
      !countryCodes.has(record.countryCode) ||
      record.featureClass !== 'P' ||
      EXCLUDED_ENGLISH_FEATURE_CODES.has(record.featureCode) ||
      !record.timeZone
    ) {
      return
    }

    const groupIndex = groupIndexByCountry.get(record.countryCode)
    const group = groupIndex === undefined ? undefined : groups[groupIndex]

    if (!group) {
      return
    }

    const admin1 = admin1ByCode.get(`${record.countryCode}.${record.admin1Code}`)
    const admin2 = admin2ByCode.get(`${record.countryCode}.${record.admin1Code}.${record.admin2Code}`)
    const contextName = uniqueDisplayNames([admin2?.asciiName, admin1?.asciiName], record.sourceName).join(', ')

    places.push({
      id: `geonames:${record.geonameId}`,
      locale: 'en',
      countryCode: record.countryCode,
      groupId: group.id,
      groupIndex,
      name: record.sourceName,
      contextName: contextName || group.label,
      latitude: roundCoordinate(record.latitude),
      longitude: roundCoordinate(record.longitude),
      timeZone: record.timeZone,
      coordinatePrecision:
        record.population < 1000 && ADMINISTRATIVE_SEAT_FEATURE_CODES.has(record.featureCode)
          ? 'administrativeSeat'
          : 'locality',
      coordinateResolution: 'direct',
      population: record.population,
      suggestionRank: null,
      suggestionPriority: record.featureCode === 'PPLC',
      searchNames: uniqueSearchNames(record.names, record.sourceName),
      featureCode: record.featureCode,
      sourceOrder: record.geonameId,
    })
  })

  return { groups, places }
}

export function createOfficialPlaces(locale, catalog, sourceTexts) {
  const groupsById = new Map(catalog.groups.map((group) => [group.id, group]))
  const groupIndexById = new Map(catalog.groups.map((group, index) => [group.id, index]))
  const wantedIdentitiesByCountry = new Map()

  for (const unit of catalog.units) {
    const identities = wantedIdentitiesByCountry.get(unit.countryCode) ?? new Set()

    for (const name of [unit.name, ...unit.aliases, ...unit.lookupNames, ...(unit.coordinateLookupNames ?? [])]) {
      const identity = normalizeIdentity(name)

      if (identity) {
        identities.add(identity)
      }
    }

    wantedIdentitiesByCountry.set(unit.countryCode, identities)
  }

  const records = sourceTexts.flatMap(({ source, countryCodes }) =>
    parseOfficialRecords(source, new Set(countryCodes), wantedIdentitiesByCountry),
  )
  const recordsByCountry = new Map()

  for (const record of records) {
    const countryRecords = recordsByCountry.get(record.countryCode) ?? []
    countryRecords.push(record)
    recordsByCountry.set(record.countryCode, countryRecords)
  }

  return catalog.units.map((unit, sourceOrder) => {
    const group = groupsById.get(unit.groupId)
    const groupIndex = groupIndexById.get(unit.groupId)

    if (!group || groupIndex === undefined) {
      throw new Error(`Unknown administrative group for ${unit.id}`)
    }

    const countryRecords = recordsByCountry.get(unit.countryCode) ?? []
    const groupRecords = countryRecords.filter((record) => belongsToGroup(record, group))
    const lookupIdentities = new Set(
      [unit.name, ...unit.aliases, ...unit.lookupNames, ...(unit.coordinateLookupNames ?? [])]
        .map(normalizeIdentity)
        .filter(Boolean),
    )
    const inGroupIdentityMatches = groupRecords.filter((record) => intersects(record.identities, lookupIdentities))
    const outOfGroupIdentityMatches = findUnambiguousOutOfGroupMatches(
      countryRecords,
      inGroupIdentityMatches,
      lookupIdentities,
    )
    const identityMatches = inGroupIdentityMatches.length > 0 ? inGroupIdentityMatches : outOfGroupIdentityMatches
    const identityFeature = identityMatches.sort((a, b) => compareIdentityFeature(a, b, unit))[0]
    const coordinateRecords =
      identityFeature && outOfGroupIdentityMatches.length > 0
        ? countryRecords.filter((record) => record.admin1Code === identityFeature.admin1Code)
        : groupRecords
    const coordinate = identityFeature
      ? resolveIdentityCoordinate(identityFeature, identityMatches, coordinateRecords, lookupIdentities)
      : resolveGroupRepresentative(group, groupRecords)

    if (!coordinate) {
      throw new Error(`No GeoNames representative coordinate for ${unit.id} (${unit.name})`)
    }

    const isRegionWideValue = unit.countryCode === 'HK' || unit.countryCode === 'MO'
    const coordinatePrecision =
      isRegionWideValue || !identityFeature
        ? 'administrativeArea'
        : coordinate.record.featureClass === 'P'
          ? 'administrativeSeat'
          : 'administrativeArea'
    const searchNames = uniqueSearchNames(
      [
        ...unit.aliases,
        ...unit.lookupNames,
        ...(identityFeature?.names ?? []),
        ...(identityFeature ? coordinate.record.names : []),
      ],
      unit.name,
    )

    return {
      id: unit.id,
      locale,
      countryCode: unit.countryCode,
      groupId: unit.groupId,
      groupIndex,
      name: unit.name,
      contextName: group.label,
      latitude: roundCoordinate(coordinate.record.latitude),
      longitude: roundCoordinate(coordinate.record.longitude),
      timeZone: canonicalTimeZone(unit.countryCode, coordinate.record.timeZone),
      coordinatePrecision,
      coordinateResolution: !identityFeature
        ? 'groupFallback'
        : coordinate.record.featureClass === 'P'
          ? 'administrativeSeat'
          : 'administrativeArea',
      population: identityFeature ? Math.max(identityFeature.population, coordinate.record.population) : 0,
      suggestionRank: null,
      suggestionPriority: unit.suggestionPriority,
      searchNames,
      featureCode: coordinate.record.featureCode,
      sourceOrder,
    }
  })
}

function findUnambiguousOutOfGroupMatches(countryRecords, inGroupMatches, lookupIdentities) {
  if (inGroupMatches.length > 0) {
    return []
  }

  const matches = countryRecords.filter((record) => intersects(record.identities, lookupIdentities))
  const admin1Codes = new Set(matches.map((record) => record.admin1Code).filter(Boolean))

  return admin1Codes.size === 1 ? matches : []
}

function parseOfficialRecords(source, countryCodes, wantedIdentitiesByCountry) {
  const records = []

  forEachLine(source, (line) => {
    const record = parseRecord(line)

    if (!record || !countryCodes.has(record.countryCode) || !['A', 'P'].includes(record.featureClass)) {
      return
    }

    const wantedIdentities = wantedIdentitiesByCountry.get(record.countryCode) ?? new Set()
    const isPotentialIdentity = intersects(record.identities, wantedIdentities)
    const isAdministrativeFeature = record.featureClass === 'A'
    const isPotentialSeat =
      record.featureClass === 'P' && (ADMINISTRATIVE_SEAT_FEATURE_CODES.has(record.featureCode) || isPotentialIdentity)

    if (isAdministrativeFeature || isPotentialSeat) {
      records.push(record)
    }
  })

  return records
}

function parseRecord(line) {
  const fields = line.split('\t')
  const latitude = Number(fields[4])
  const longitude = Number(fields[5])

  if (
    fields.length < 19 ||
    !fields[0] ||
    !fields[1] ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null
  }

  const names = uniqueRawNames([fields[1], fields[2], ...(fields[3] ? fields[3].split(',') : [])])

  return {
    geonameId: Number(fields[0]),
    sourceName: fields[1],
    asciiName: fields[2] || fields[1],
    names,
    identities: new Set(names.map(normalizeIdentity).filter(Boolean)),
    latitude,
    longitude,
    featureClass: fields[6],
    featureCode: fields[7],
    countryCode: fields[8],
    admin1Code: fields[10],
    admin2Code: fields[11],
    admin3Code: fields[12],
    population: Number(fields[14]) || 0,
    timeZone: fields[17],
  }
}

function belongsToGroup(record, group) {
  if (record.countryCode !== group.countryCode) {
    return false
  }

  return group.geonamesAdmin1Codes.length === 0 || group.geonamesAdmin1Codes.includes(record.admin1Code)
}

function compareIdentityFeature(a, b, unit) {
  return (
    officialHierarchyScore(a, unit) - officialHierarchyScore(b, unit) ||
    featureIdentityScore(a, unit) - featureIdentityScore(b, unit) ||
    b.population - a.population ||
    a.geonameId - b.geonameId
  )
}

function officialHierarchyScore(record, unit) {
  if (unit.countryCode === 'CN' && !DIRECT_MUNICIPALITY_CODES.has(unit.officialCode.slice(0, 2))) {
    return record.admin2Code === unit.officialCode.slice(0, 4) ? 0 : 1
  }

  if (unit.countryCode === 'JP') {
    return record.admin2Code === unit.officialCode ? 0 : 1
  }

  return 0
}

function featureIdentityScore(record, unit) {
  const expectedAdministrativeCode =
    unit.countryCode === 'CN' && DIRECT_MUNICIPALITY_CODES.has(unit.officialCode.slice(0, 2)) ? 'ADM3' : 'ADM2'

  if (record.featureClass === 'A') {
    return record.featureCode === expectedAdministrativeCode ? 0 : 5
  }

  return ADMINISTRATIVE_SEAT_FEATURE_CODES.has(record.featureCode) ? 10 : 15
}

function resolveIdentityCoordinate(identityFeature, identityMatches, groupRecords, lookupIdentities) {
  if (identityFeature.featureClass === 'P') {
    return { record: identityFeature }
  }

  const relatedPlaces = groupRecords
    .filter((record) => record.featureClass === 'P' && isRelatedPlace(record, identityFeature))
    .map((record) => ({
      record,
      exactName: intersects(record.identities, lookupIdentities),
      expectedSeat: record.featureCode === expectedSeatCode(identityFeature.featureCode),
    }))
    .filter(({ exactName, expectedSeat }) => exactName || expectedSeat)
    .sort(
      (a, b) =>
        Number(b.exactName) - Number(a.exactName) ||
        Number(b.expectedSeat) - Number(a.expectedSeat) ||
        b.record.population - a.record.population ||
        a.record.geonameId - b.record.geonameId,
    )

  const exactMatchedPlace = identityMatches
    .filter((record) => record.featureClass === 'P' && isRelatedPlace(record, identityFeature))
    .sort(
      (a, b) =>
        Number(ADMINISTRATIVE_SEAT_FEATURE_CODES.has(b.featureCode)) -
          Number(ADMINISTRATIVE_SEAT_FEATURE_CODES.has(a.featureCode)) ||
        b.population - a.population ||
        a.geonameId - b.geonameId,
    )[0]

  return { record: exactMatchedPlace ?? relatedPlaces[0]?.record ?? identityFeature }
}

function isRelatedPlace(place, administrativeFeature) {
  if (administrativeFeature.featureCode === 'ADM3' && administrativeFeature.admin3Code) {
    return (
      place.admin1Code === administrativeFeature.admin1Code &&
      place.admin2Code === administrativeFeature.admin2Code &&
      place.admin3Code === administrativeFeature.admin3Code
    )
  }

  if (administrativeFeature.featureCode === 'ADM2' && administrativeFeature.admin2Code) {
    return (
      place.admin1Code === administrativeFeature.admin1Code && place.admin2Code === administrativeFeature.admin2Code
    )
  }

  return place.admin1Code === administrativeFeature.admin1Code
}

function expectedSeatCode(administrativeFeatureCode) {
  return { ADM1: 'PPLA', ADM2: 'PPLA2', ADM3: 'PPLA3', ADM4: 'PPLA4' }[administrativeFeatureCode]
}

function resolveGroupRepresentative(group, groupRecords) {
  const groupIdentities = new Set([group.label, group.countryName].map(normalizeIdentity).filter(Boolean))
  const candidates = groupRecords
    .filter(
      (record) =>
        (record.featureClass === 'P' && ADMINISTRATIVE_SEAT_FEATURE_CODES.has(record.featureCode)) ||
        (record.featureClass === 'A' && record.featureCode === 'ADM1'),
    )
    .sort(
      (a, b) =>
        Number(intersects(b.identities, groupIdentities)) - Number(intersects(a.identities, groupIdentities)) ||
        groupRepresentativeScore(a) - groupRepresentativeScore(b) ||
        b.population - a.population ||
        a.geonameId - b.geonameId,
    )

  return candidates[0] ? { record: candidates[0] } : null
}

function groupRepresentativeScore(record) {
  if (record.featureCode === 'PPLA' || record.featureCode === 'PPLC') {
    return 0
  }

  if (record.featureCode === 'ADM1') {
    return 1
  }

  return 2
}

function canonicalTimeZone(countryCode, sourceTimeZone) {
  const timeZones = {
    KR: 'Asia/Seoul',
    JP: 'Asia/Tokyo',
    CN: 'Asia/Shanghai',
    HK: 'Asia/Hong_Kong',
    MO: 'Asia/Macau',
  }

  return timeZones[countryCode] ?? sourceTimeZone
}

function uniqueRawNames(candidates) {
  const names = []
  const seen = new Set()

  for (const candidate of candidates) {
    const value = candidate?.trim()

    if (!value || seen.has(value)) {
      continue
    }

    seen.add(value)
    names.push(value)
  }

  return names
}

function uniqueDisplayNames(candidates, displayName) {
  const displayIdentity = normalizeIdentity(displayName)
  const seen = new Set([displayIdentity])
  const names = []

  for (const candidate of candidates) {
    const identity = normalizeIdentity(candidate ?? '')

    if (!candidate || !identity || seen.has(identity)) {
      continue
    }

    seen.add(identity)
    names.push(candidate)
  }

  return names
}

export function uniqueSearchNames(candidates, displayName) {
  return uniqueDisplayNames(candidates, displayName).slice(0, 10)
}

export function normalizeIdentity(value) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

function intersects(left, right) {
  for (const value of left) {
    if (right.has(value)) {
      return true
    }
  }

  return false
}

function roundCoordinate(value) {
  return Number(value.toFixed(4))
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
