import { CURRENT_GUARDIAN_MANIFEST } from './manifest'
import type { GuardianQuestionnaireContent } from './questionnaire'
import type { GuardianReportNarrativeInput, GuardianReportNarrativeSnapshot } from './report-contract'
import {
  buildGuardianReportNarrativeKoV1,
  GUARDIAN_REPORT_COPY_KO_V1,
  validateGuardianReportCardsKoV1,
  validateGuardianReportCopyKoV1,
} from './report-copy-ko-v1'

export * from './report-contract'

if (
  CURRENT_GUARDIAN_MANIFEST.products.some(
    (product) => product.kind === 'full_report' && product.reportCopyVersions.ko === GUARDIAN_REPORT_COPY_KO_V1,
  )
) {
  validateGuardianReportCardsKoV1(CURRENT_GUARDIAN_MANIFEST.editions)
}

export function generateGuardianReportNarrative(input: GuardianReportNarrativeInput): GuardianReportNarrativeSnapshot {
  if (input.copyVersion === GUARDIAN_REPORT_COPY_KO_V1 && input.locale === 'ko') {
    return buildGuardianReportNarrativeKoV1(input)
  }
  throw new Error(`Unknown guardian report copy: ${input.copyVersion}/${input.locale}`)
}

/** Publication-time companion to the runtime generator: every selectable question needs authored report copy. */
export function validateGuardianReportCopyQuestionnaire(
  copyVersion: string,
  questionnaire: GuardianQuestionnaireContent,
): void {
  if (copyVersion === GUARDIAN_REPORT_COPY_KO_V1 && questionnaire.locale === 'ko') {
    validateGuardianReportCopyKoV1(questionnaire)
    return
  }
  throw new Error(`No guardian report copy validator for ${copyVersion}/${questionnaire.locale}`)
}
