import type { Locale } from '@sobok/domain/locale'
import type { GuardianSelectedCard } from './draw'
import type { GuardianReportInputSnapshot, GuardianReportSlot } from './manifest'
import type {
  GuardianQuestionnaireAnswerSnapshot,
  GuardianQuestionnaireContent,
  GuardianQuestionnaireSignalSnapshot,
} from './questionnaire'

export const GUARDIAN_REPORT_NARRATIVE_SCHEMA_VERSION = 1 as const

export const GUARDIAN_ZODIAC_SIGNS = [
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

export type GuardianZodiacSign = (typeof GUARDIAN_ZODIAC_SIGNS)[number]

export type GuardianReportPlacementBody =
  | 'sun'
  | 'moon'
  | 'ascendant'
  | 'venus'
  | 'saturn'
  | 'midheaven'
  | 'mercury'
  | 'mars'

export interface GuardianReportPlacement {
  body: GuardianReportPlacementBody
  sign: GuardianZodiacSign
  label: string
}

export interface GuardianReportNarrativeDetail {
  title: string
  body: string
}

export interface GuardianReportNarrativeSection {
  slot: GuardianReportSlot
  label: string
  title: string
  guardians: string
  artworkAlt: string
  oneLine: string
  chart: {
    summary: string
    placements: readonly GuardianReportPlacement[]
  }
  details: readonly GuardianReportNarrativeDetail[]
  guidance: {
    title: string
    body: string
  }
  reflection: string
}

/**
 * Fully rendered, locale-specific paid content. This object is stored once at fulfillment instead of keeping
 * selected copy keys that would require an old renderer forever. The capability-protected report API returns
 * this snapshot verbatim and never exposes the full copy/question banks.
 */
export interface GuardianReportNarrativeSnapshot {
  schemaVersion: typeof GUARDIAN_REPORT_NARRATIVE_SCHEMA_VERSION
  locale: Locale
  hero: {
    eyebrow: string
    title: string
    introduction: string
    oneLine: string
    chartNote: string | null
  }
  sections: readonly GuardianReportNarrativeSection[]
  closing: {
    title: string
    body: readonly string[]
    action: string
    personalNote: {
      label: string
      body: string
    } | null
  }
}

export interface GuardianReportNarrativeInput {
  locale: Locale
  copyVersion: string
  questionnaire: GuardianQuestionnaireContent
  inputSnapshot: GuardianReportInputSnapshot
  answerSnapshot: GuardianQuestionnaireAnswerSnapshot
  signalSnapshot: GuardianQuestionnaireSignalSnapshot
  cards: readonly GuardianSelectedCard[]
}
