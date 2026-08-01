import type { Db } from '@sobok/edge/db/client'
import { guardianEdition, guardianManifest } from '../../guardian/manifest'
import type { GuardianReportView } from '../../guardian/report'
import { findPaidFullReportPurchase, lockedReportOf } from './guardian'
import { getGuardianQuestionnaireStep } from './guardian-questionnaire'

export type ReadGuardianReportResult =
  | { status: 'ok'; report: GuardianReportView }
  | { status: 'report-not-found' }
  | { status: 'payment-required' }

/** Capability ownership is resolved by the route; this query additionally enforces the live paid entitlement. */
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
  if (!purchase || purchase.manifestVersion !== report.manifestVersion) {
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
          version: stepResult.step.version,
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
  const manifest = guardianManifest(report.manifestVersion)
  return {
    status: 'ok',
    report: {
      reportPublicId: report.publicId,
      status: 'fulfilled',
      locale: report.locale,
      fulfilledAt: report.fulfilledAt.toISOString(),
      versions: {
        manifest: report.manifestVersion,
        selectionRule: report.selectionRuleVersion,
        odds: report.oddsVersion,
        questionnaire: report.questionnaireVersion,
        copy: report.copyVersion,
        render: report.renderVersion,
      },
      cards: report.cardSnapshot.map((card) => {
        const edition = guardianEdition(card.editionId, manifest)
        if (edition.familyId !== card.familyId || edition.slot !== card.slot || edition.rarity !== card.rarity) {
          throw new Error(`Guardian report ${report.id} card snapshot does not match ${card.editionId}`)
        }
        return {
          cardEditionId: card.editionId,
          familyId: card.familyId,
          slot: card.slot,
          rarity: card.rarity,
          artworkPath: edition.artworkPath,
        }
      }),
      narrative: report.narrativeSnapshot,
    },
  }
}
