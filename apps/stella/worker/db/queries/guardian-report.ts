import type { Db } from '@sobok/edge/db/client'
import type { GuardianReportView } from '../../guardian/report'
import { findPaidFullReportPurchase, lockedReportOf } from './guardian'
import { listGuardianReportCards } from './guardian-card'
import { getGuardianQuestionnaireStep } from './guardian-questionnaire'

export type ReadGuardianReportResult =
  | { status: 'ok'; report: GuardianReportView }
  | { status: 'report-not-found' }
  | { status: 'payment-required' }

/**
 * Capability ownership is resolved by the route; this query additionally enforces the live paid entitlement.
 * The authored report body stays immutable while an explicitly equipped acquisition supplies the visible card
 * presentation for its slot.
 */
export async function readGuardianReport(
  db: Db,
  input: { collectionId: number; reportId: number },
): Promise<ReadGuardianReportResult> {
  const report = await lockedReportOf(db, input, false)
  if (!report) {
    return { status: 'report-not-found' }
  }

  const purchase = await findPaidFullReportPurchase(db, {
    collectionId: input.collectionId,
    reportId: input.reportId,
    sku: report.productSku,
  })
  if (!purchase) {
    return { status: 'payment-required' }
  }

  if (report.status === 'draft') {
    const stepResult = await getGuardianQuestionnaireStep(db, input)
    if (stepResult.status !== 'ok') {
      return stepResult
    }
    return {
      status: 'ok',
      report: {
        reportPublicId: report.publicId,
        status: 'questions',
        locale: report.locale,
        questionnaire: {
          status: stepResult.step.status,
          progress: stepResult.step.progress,
        },
      },
    }
  }

  if (!report.cardSnapshot || !report.narrativeSnapshot || !report.fulfilledAt) {
    throw new Error(`Fulfilled guardian report ${report.id} has no immutable result snapshot`)
  }
  if (report.narrativeSnapshot.locale !== report.locale) {
    throw new Error(`Guardian report ${report.id} narrative locale does not match its report`)
  }
  const selectedCards = await listGuardianReportCards(db, input)
  if (selectedCards.length !== report.narrativeSnapshot.sections.length) {
    throw new Error(`Guardian report ${report.id} does not have exactly one equipped acquisition per slot`)
  }
  const selectedBySlot = new Map(selectedCards.map((selected) => [selected.presentation.slot, selected]))
  const cards = report.narrativeSnapshot.sections.map((section) => {
    const selected = selectedBySlot.get(section.slot)
    if (!selected || selected.presentation.locale !== report.locale) {
      throw new Error(`Guardian report ${report.id} has no locale-matched ${section.slot} acquisition`)
    }
    return {
      ...selected.presentation,
      acquisitionPublicId: selected.acquisitionPublicId,
      acquisitionCount: selected.acquisitionCount,
    }
  })
  const narrative = {
    ...report.narrativeSnapshot,
    sections: report.narrativeSnapshot.sections.map((section) => {
      const presentation = selectedBySlot.get(section.slot)?.presentation
      if (!presentation) {
        throw new Error(`Guardian report ${report.id} has no ${section.slot} presentation`)
      }
      return {
        ...section,
        title: presentation.title,
        guardians: presentation.guardians,
        artworkAlt: presentation.artworkAlt,
        oneLine: presentation.oneLine,
      }
    }),
  }
  return {
    status: 'ok',
    report: {
      reportPublicId: report.publicId,
      status: 'fulfilled',
      locale: report.locale,
      fulfilledAt: report.fulfilledAt.toISOString(),
      cards,
      narrative,
    },
  }
}
