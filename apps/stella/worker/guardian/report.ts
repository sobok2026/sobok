import type { GuardianSelectedCard } from './draw'
import { CURRENT_GUARDIAN_MANIFEST } from './manifest'
import type { GuardianQuestionnaireContent, GuardianQuestionnaireSignalSnapshot } from './questionnaire'
import type { GuardianCardPresentationSnapshot } from './redraw-contract'
import type { GuardianReportNarrativeInput, GuardianReportNarrativeSnapshot } from './report-contract'
import {
  buildGuardianLoveCardPresentationKo,
  buildGuardianReportNarrativeKo,
  validateGuardianReportCardsKo,
  validateGuardianReportCopyKo,
} from './report-copy-ko'

export * from './report-contract'

if (CURRENT_GUARDIAN_MANIFEST.supportedLocales.includes('ko')) {
  validateGuardianReportCardsKo(CURRENT_GUARDIAN_MANIFEST.editions)
}

export function generateGuardianReportNarrative(input: GuardianReportNarrativeInput): GuardianReportNarrativeSnapshot {
  if (input.locale === 'ko') {
    return buildGuardianReportNarrativeKo(input)
  }
  throw new Error(`Unsupported guardian report locale: ${input.locale}`)
}

export function generateGuardianLoveCardPresentation(input: {
  locale: GuardianReportNarrativeInput['locale']
  card: GuardianSelectedCard
  artworkPath: string
  signalSnapshot: GuardianQuestionnaireSignalSnapshot
}): GuardianCardPresentationSnapshot {
  if (input.locale === 'ko') {
    return buildGuardianLoveCardPresentationKo(input)
  }
  throw new Error(`Unsupported guardian love-card locale: ${input.locale}`)
}

/** Startup validation companion to the runtime generator: every selectable question needs authored report copy. */
export function validateGuardianReportCopyQuestionnaire(questionnaire: GuardianQuestionnaireContent): void {
  if (questionnaire.locale === 'ko') {
    validateGuardianReportCopyKo(questionnaire)
    return
  }
  throw new Error(`No guardian report copy validator for ${questionnaire.locale}`)
}
