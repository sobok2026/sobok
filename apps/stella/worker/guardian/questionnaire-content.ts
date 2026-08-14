import type { Locale } from '@sobok/domain/locale'
import guardianPaidKoSource from '../../content/guardian-questionnaires/guardian-paid-ko.json'
import {
  CURRENT_GUARDIAN_MANIFEST,
  type GuardianFullReportProductSku,
  guardianProduct,
  guardianSupportsLocale,
} from './manifest'
import { type GuardianQuestionnaireContent, parseGuardianQuestionnaireContent } from './questionnaire'
import { validateGuardianReportCopyQuestionnaire } from './report'

const GUARDIAN_QUESTIONNAIRES: readonly GuardianQuestionnaireContent[] = Object.freeze([
  parseGuardianQuestionnaireContent(guardianPaidKoSource),
])

validateGuardianQuestionnaires(GUARDIAN_QUESTIONNAIRES)

/** Returns the server-bundled questionnaire deployed with the current Database Worker. */
export function guardianQuestionnaire(
  productSku: GuardianFullReportProductSku,
  locale: Locale,
): GuardianQuestionnaireContent {
  const questionnaire = GUARDIAN_QUESTIONNAIRES.find(
    (candidate) => candidate.productSku === productSku && candidate.locale === locale,
  )
  if (!questionnaire) {
    throw new Error(`Guardian product ${productSku} has no questionnaire for locale ${locale}`)
  }
  return questionnaire
}

export function guardianQuestionnaireIsAvailable(productSku: GuardianFullReportProductSku, locale: Locale): boolean {
  return GUARDIAN_QUESTIONNAIRES.some((candidate) => candidate.productSku === productSku && candidate.locale === locale)
}

/** Checkout availability is true only when price, localized sales copy, report copy, and questions all exist. */
export function guardianFullReportIsAvailable(locale: Locale, market: string): boolean {
  const productSku = 'guardian-report-full-v1'
  const product = guardianProduct(productSku, CURRENT_GUARDIAN_MANIFEST)
  return (
    product.kind === 'full_report' &&
    Boolean(product.orderNames[locale]) &&
    guardianSupportsLocale(locale) &&
    product.prices.some((price) => price.market === market) &&
    guardianQuestionnaireIsAvailable(productSku, locale)
  )
}

function questionnaireKey(productSku: GuardianFullReportProductSku, locale: Locale): string {
  return `${productSku}\u0000${locale}`
}

function validateGuardianQuestionnaires(questionnaires: readonly GuardianQuestionnaireContent[]): void {
  const questionnaireKeys = new Set<string>()
  for (const questionnaire of questionnaires) {
    const key = questionnaireKey(questionnaire.productSku, questionnaire.locale)
    if (questionnaireKeys.has(key)) {
      throw new Error(`Duplicate guardian questionnaire for ${questionnaire.productSku}/${questionnaire.locale}`)
    }
    questionnaireKeys.add(key)

    const product = guardianProduct(questionnaire.productSku, CURRENT_GUARDIAN_MANIFEST)
    if (product.kind !== 'full_report') {
      throw new Error(`Guardian questionnaire product ${questionnaire.productSku} is not a full report`)
    }
    if (!guardianSupportsLocale(questionnaire.locale)) {
      throw new Error(`Guardian questionnaire locale ${questionnaire.locale} is not supported`)
    }
    validateGuardianReportCopyQuestionnaire(questionnaire)
  }
}
