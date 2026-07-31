import type { ReportSection, ReportSectionKey } from '../../_lib/api'
import type { ReportPartId } from '../../_lib/types'

/**
 * How the document is divided, and the only place that decides it.
 *
 * The server owns the ORDER the sections are read in (`REPORT_DISPLAY_ORDER`) and this owns nothing about
 * order — it says which run of that order each section belongs to. `satisfies Record<ReportSectionKey, …>`
 * makes it exhaustive: a thirteenth section key does not compile until someone decides which part it is read
 * in, which is the same rule `section-view.tsx` applies to how a section is drawn.
 *
 * The parts are contiguous in display order today and have to stay that way — a part is a run of sections, not
 * a tag — so `splitIntoParts` below asserts it rather than quietly emitting the same part twice.
 */
const SECTION_PART = {
  openingRead: 'read',
  worldJob: 'read',
  strengthCards: 'read',
  drainSignature: 'read',
  happinessConditions: 'read',
  interestProfile: 'read',
  roleFamilies: 'match',
  contextShift: 'match',
  fitAndFriction: 'match',
  threePaths: 'act',
  weekQuest: 'act',
  reflectionQuestions: 'act',
} as const satisfies Record<ReportSectionKey, ReportPartId>

export interface NumberedSection {
  /** 1-based position in the whole document, not within the part. The reader counts one sequence. */
  number: number
  section: ReportSection
}

export interface ReportPart {
  id: ReportPartId
  /** 1-based part number, counted over the parts that actually have sections. */
  number: number
  sections: readonly NumberedSection[]
}

/** The anchor a section is linked to from the contents list. One id per section key, stable across reports. */
export function sectionAnchorId(key: ReportSectionKey): string {
  return `report-${key}`
}

/**
 * The delivered sections, grouped into the parts they are read in.
 *
 * Empty parts are dropped rather than rendered with a heading over nothing — `contextShift` is absent for a
 * reader who declared no code, and a part can lose its last section that way. Numbering is assigned after the
 * drop, so a report missing a whole part still reads 1부, 2부 with no gap.
 */
export function splitIntoParts(sections: readonly ReportSection[]): readonly ReportPart[] {
  const parts: { id: ReportPartId; number: number; sections: NumberedSection[] }[] = []

  for (const [index, section] of sections.entries()) {
    const id = SECTION_PART[section.key]
    const current = parts.at(-1)
    const entry = { number: index + 1, section }

    if (current?.id === id) {
      current.sections.push(entry)
      continue
    }
    if (parts.some((part) => part.id === id)) {
      throw new Error(`deep-type report part ${id} is not contiguous in display order`)
    }
    parts.push({ id, number: parts.length + 1, sections: [entry] })
  }

  return parts
}
