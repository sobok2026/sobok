import type { Locale } from '@sobok/domain/locale'
import type { GuardianSelectedCard } from './draw'
import type { GuardianReportInputSnapshot, GuardianReportSlot } from './manifest'
import type {
  GuardianQuestionnaireAnswerSnapshot,
  GuardianQuestionnaireClientStep,
  GuardianQuestionnaireContent,
  GuardianQuestionnaireSignalSnapshot,
} from './questionnaire'
import type { GuardianCardPresentationSnapshot } from './redraw-contract'

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
 * selected copy keys that would require an old renderer forever. A later explicit card selection may overlay
 * only that acquisition's card presentation fields; chart clues, details, guidance, reflection and closing
 * remain this immutable snapshot. The API never exposes the full copy/question banks.
 */
export interface GuardianReportNarrativeSnapshot {
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

/** Capability-protected response shared by the Worker and the static browser client. */
export type GuardianReportView =
  | {
      reportPublicId: string
      status: 'questions'
      locale: Locale
      questionnaire: {
        status: GuardianQuestionnaireClientStep['status']
        progress: GuardianQuestionnaireClientStep['progress']
      }
    }
  | {
      reportPublicId: string
      status: 'fulfilled'
      locale: Locale
      fulfilledAt: string
      cards: (GuardianCardPresentationSnapshot & {
        acquisitionPublicId: string
        acquisitionCount: number
      })[]
      narrative: GuardianReportNarrativeSnapshot
    }

export interface GuardianReportNarrativeInput {
  locale: Locale
  questionnaire: GuardianQuestionnaireContent
  inputSnapshot: GuardianReportInputSnapshot
  answerSnapshot: GuardianQuestionnaireAnswerSnapshot
  signalSnapshot: GuardianQuestionnaireSignalSnapshot
  cards: readonly GuardianSelectedCard[]
}
