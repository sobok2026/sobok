export const EARTHWORK_AVERAGE_END_AREA_VERSION = 'earthwork-average-end-area/1.0.0'

export type EarthworkAverageEndAreaInput = {
  coordinateReferenceSystem: string
  sections: Array<{ station: number; cutArea: number; fillArea: number }>
}

export type EarthworkAverageEndAreaOutput = {
  algorithmVersion: typeof EARTHWORK_AVERAGE_END_AREA_VERSION
  coordinateReferenceSystem: string
  unitSystem: 'SI'
  segments: Array<{
    fromStation: number
    toStation: number
    distance: number
    cutVolume: number
    fillVolume: number
  }>
  totals: {
    cutVolume: number
    fillVolume: number
    netVolume: number
  }
}

export type EarthworkCalculationWork = {
  jobId: string
  organizationId: string
  projectId: string
  kind: 'earthwork-average-end-area'
  algorithmVersion: typeof EARTHWORK_AVERAGE_END_AREA_VERSION
  input: EarthworkAverageEndAreaInput
}

function roundVolume(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

function finiteNonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function parseEarthworkCalculationWork(value: unknown): EarthworkCalculationWork | null {
  if (!value || typeof value !== 'object') return null
  const work = value as Record<string, unknown>
  const input = work.input
  if (
    typeof work.jobId !== 'string' ||
    typeof work.organizationId !== 'string' ||
    typeof work.projectId !== 'string' ||
    work.kind !== 'earthwork-average-end-area' ||
    work.algorithmVersion !== EARTHWORK_AVERAGE_END_AREA_VERSION ||
    !input ||
    typeof input !== 'object'
  ) {
    return null
  }
  const rawInput = input as Record<string, unknown>
  if (
    typeof rawInput.coordinateReferenceSystem !== 'string' ||
    rawInput.coordinateReferenceSystem.length === 0 ||
    !Array.isArray(rawInput.sections) ||
    rawInput.sections.length < 2 ||
    rawInput.sections.length > 10_000
  ) {
    return null
  }

  const sections: EarthworkAverageEndAreaInput['sections'] = []
  for (const [index, value] of rawInput.sections.entries()) {
    if (!value || typeof value !== 'object') return null
    const section = value as Record<string, unknown>
    if (
      !finiteNonnegative(section.station) ||
      !finiteNonnegative(section.cutArea) ||
      !finiteNonnegative(section.fillArea)
    ) {
      return null
    }
    if (index > 0 && section.station <= (sections[index - 1]?.station ?? -1)) return null
    sections.push({ station: section.station, cutArea: section.cutArea, fillArea: section.fillArea })
  }

  return {
    jobId: work.jobId,
    organizationId: work.organizationId,
    projectId: work.projectId,
    kind: work.kind,
    algorithmVersion: work.algorithmVersion,
    input: { coordinateReferenceSystem: rawInput.coordinateReferenceSystem, sections },
  }
}

export function calculateEarthworkAverageEndArea(input: EarthworkAverageEndAreaInput): EarthworkAverageEndAreaOutput {
  const segments: EarthworkAverageEndAreaOutput['segments'] = []
  let cutTotal = 0
  let fillTotal = 0

  for (let index = 1; index < input.sections.length; index += 1) {
    const previous = input.sections[index - 1]
    const current = input.sections[index]
    if (!previous || !current) continue
    const distance = current.station - previous.station
    const cutVolume = distance * ((previous.cutArea + current.cutArea) / 2)
    const fillVolume = distance * ((previous.fillArea + current.fillArea) / 2)
    cutTotal += cutVolume
    fillTotal += fillVolume
    segments.push({
      fromStation: previous.station,
      toStation: current.station,
      distance: roundVolume(distance),
      cutVolume: roundVolume(cutVolume),
      fillVolume: roundVolume(fillVolume),
    })
  }

  return {
    algorithmVersion: EARTHWORK_AVERAGE_END_AREA_VERSION,
    coordinateReferenceSystem: input.coordinateReferenceSystem,
    unitSystem: 'SI',
    segments,
    totals: {
      cutVolume: roundVolume(cutTotal),
      fillVolume: roundVolume(fillTotal),
      netVolume: roundVolume(fillTotal - cutTotal),
    },
  }
}
