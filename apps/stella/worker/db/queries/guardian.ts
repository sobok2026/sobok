import type { Locale } from '@sobok/domain/locale'
import type { Db } from '@sobok/edge/db/client'
import { and, asc, desc, eq, getColumns, inArray, isNotNull, lt, or, sql } from 'drizzle-orm'
import {
  drawInitialGuardianReport,
  drawLoveRedraw,
  type GuardianSelectedCard,
  guardianCardDrawSnapshot,
} from '../../guardian/draw'
import {
  CURRENT_GUARDIAN_MANIFEST,
  type GuardianFullReportProductSku,
  type GuardianProductManifest,
  type GuardianReportInputSnapshot,
  guardianEdition,
  guardianProduct,
  guardianProductOrderName,
  guardianProductPrice,
  guardianSupportsLocale,
} from '../../guardian/manifest'
import type { GuardianQuestionnaireContent } from '../../guardian/questionnaire'
import {
  type GuardianReportNarrativeSnapshot,
  generateGuardianLoveCardPresentation,
  generateGuardianReportNarrative,
} from '../../guardian/report'
import {
  guardianCardAcquisitionTable,
  guardianCardOwnershipTable,
  guardianCollectionTable,
  guardianGuaranteeProgressTable,
  guardianPurchaseTable,
  guardianRecoveryEmailDeliveryTable,
  guardianRedrawGrantTable,
  guardianReportCardSelectionTable,
  guardianReportTable,
} from '../schema/guardian'
import { recordGuardianAcquisition, selectGuardianReportCard } from './guardian-card'

export interface NewGuestGuardianCheckout {
  collectionPublicId: string
  collectionAccessTokenHash: string
  reportPublicId: string
  paymentId: string
  locale: Locale
  market: string
  recoveryEmail: string
  recoveryEmailNormalized: string
  inputSnapshot: GuardianReportInputSnapshot
}

export interface GuardianGuestCheckoutRef {
  collectionId: number
  collectionPublicId: string
  reportId: number
  reportPublicId: string
  paymentId: string
  sku: GuardianFullReportProductSku
  orderName: string
  amount: number
  market: string
  currency: string
  purchaseStatus: 'pending' | 'paid'
}

/**
 * The paid-report entitlement: a `full_report` purchase for this (collection, report, sku) that was paid and
 * granted. The security/economy rule around paid reports lives here — the questionnaire flow and the
 * fulfillment flow must agree on it.
 */
export async function findPaidFullReportPurchase(
  db: Db,
  input: { collectionId: number; reportId: number; sku: GuardianFullReportProductSku },
): Promise<{ id: number } | null> {
  const [purchase] = await db
    .select({ id: guardianPurchaseTable.id })
    .from(guardianPurchaseTable)
    .where(
      and(
        eq(guardianPurchaseTable.collectionId, input.collectionId),
        eq(guardianPurchaseTable.reportId, input.reportId),
        eq(guardianPurchaseTable.sku, input.sku),
        eq(guardianPurchaseTable.kind, 'full_report'),
        eq(guardianPurchaseTable.status, 'paid'),
        isNotNull(guardianPurchaseTable.entitlementGrantedAt),
      ),
    )
    .limit(1)

  return purchase ?? null
}

/**
 * Row-locked report lookup by the (collectionId, reportId) ownership pair. Every mutation flow that must
 * serialize against the same report (purchase, questionnaire, fulfillment, redraw) goes through this one
 * WHERE — a second, divergent copy would let two flows race on the same report.
 */
export async function lockedReportOf(
  db: Db,
  input: { collectionId: number; reportId: number },
  lock = true,
): Promise<typeof guardianReportTable.$inferSelect | null> {
  const query = db
    .select(getColumns(guardianReportTable))
    .from(guardianReportTable)
    .where(and(eq(guardianReportTable.id, input.reportId), eq(guardianReportTable.collectionId, input.collectionId)))
    .limit(1)

  const rows = lock ? await query.for('update') : await query
  return rows[0] ?? null
}

export async function createGuestGuardianCheckout(
  db: Db,
  input: NewGuestGuardianCheckout,
): Promise<GuardianGuestCheckoutRef> {
  const manifest = CURRENT_GUARDIAN_MANIFEST
  const productSku = 'guardian-report-full-v1'
  const product = guardianProduct(productSku, manifest)
  if (product.kind !== 'full_report') {
    throw new Error(`Guardian checkout product ${productSku} is not a full report`)
  }
  const price = guardianProductPrice(productSku, input.market, manifest)
  const orderName = guardianProductOrderName(productSku, input.locale, manifest)
  if (!guardianSupportsLocale(input.locale, manifest)) {
    throw new Error(`Guardian report locale ${input.locale} is not supported`)
  }

  return db.transaction(async (tx) => {
    const [collection] = await tx
      .insert(guardianCollectionTable)
      .values({
        publicId: input.collectionPublicId,
        accessTokenHash: input.collectionAccessTokenHash,
      })
      .returning({ id: guardianCollectionTable.id })

    if (!collection) {
      throw new Error('Guardian collection insert returned no row')
    }

    const [report] = await tx
      .insert(guardianReportTable)
      .values({
        publicId: input.reportPublicId,
        collectionId: collection.id,
        locale: input.locale,
        productSku,
        inputSnapshot: input.inputSnapshot,
      })
      .returning({ id: guardianReportTable.id })

    if (!report) {
      throw new Error('Guardian report insert returned no row')
    }

    await tx.insert(guardianPurchaseTable).values({
      paymentId: input.paymentId,
      collectionId: collection.id,
      reportId: report.id,
      sku: product.sku,
      kind: product.kind,
      entitlementSnapshot: { kind: 'full_report' },
      orderName,
      amount: price.amountMinor,
      market: price.market,
      currency: price.currency,
      recoveryEmail: input.recoveryEmail,
      recoveryEmailNormalized: input.recoveryEmailNormalized,
    })

    return {
      collectionId: collection.id,
      collectionPublicId: input.collectionPublicId,
      reportId: report.id,
      reportPublicId: input.reportPublicId,
      paymentId: input.paymentId,
      sku: product.sku,
      orderName,
      amount: price.amountMinor,
      market: price.market,
      currency: price.currency,
      purchaseStatus: 'pending',
    }
  })
}

export type ResumeGuestGuardianCheckoutResult =
  | ({ status: 'ready' } & GuardianGuestCheckoutRef)
  | { status: 'report-not-found' }
  | { status: 'purchase-state-conflict' }

/**
 * Reopens the same report checkout after a browser close or payment-window exit. Pending checkout email may
 * be corrected; a paid purchase is returned unchanged, and a terminal unpaid purchase gets a new pending
 * payment id on the same report rather than minting a second collection.
 */
export async function resumeGuestGuardianCheckout(
  db: Db,
  input: {
    collectionAccessTokenHash: string
    reportPublicId: string
    paymentId: string
    recoveryEmail: string
    recoveryEmailNormalized: string
    market: string
  },
): Promise<ResumeGuestGuardianCheckoutResult> {
  return db.transaction(async (tx) => {
    const access = await resolveGuardianReportAccess(tx, {
      accessTokenHash: input.collectionAccessTokenHash,
      reportPublicId: input.reportPublicId,
    })
    if (!access) {
      return { status: 'report-not-found' as const }
    }

    // Aggregate mutation lock order is collection → report → purchase. Confirmation, checkout resume, and
    // redraw must keep the same order or a payment callback can deadlock against an email correction.
    const [collection] = await tx
      .select({ id: guardianCollectionTable.id, publicId: guardianCollectionTable.publicId })
      .from(guardianCollectionTable)
      .where(
        and(
          eq(guardianCollectionTable.id, access.collectionId),
          eq(guardianCollectionTable.accessTokenHash, input.collectionAccessTokenHash),
        ),
      )
      .limit(1)
      .for('update')
    const report = await lockedReportOf(tx, access)
    if (!collection || !report || report.publicId !== input.reportPublicId) {
      return { status: 'report-not-found' as const }
    }

    const manifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST
    const product = guardianProduct(report.productSku, manifest)
    if (product.kind !== 'full_report') {
      return { status: 'purchase-state-conflict' as const }
    }
    const price = guardianProductPrice(product.sku, input.market, manifest)
    const orderName = guardianProductOrderName(product.sku, report.locale, manifest)

    const [activePurchase] = await tx
      .select({
        paymentId: guardianPurchaseTable.paymentId,
        orderName: guardianPurchaseTable.orderName,
        amount: guardianPurchaseTable.amount,
        market: guardianPurchaseTable.market,
        currency: guardianPurchaseTable.currency,
        status: guardianPurchaseTable.status,
      })
      .from(guardianPurchaseTable)
      .where(
        and(
          eq(guardianPurchaseTable.collectionId, collection.id),
          eq(guardianPurchaseTable.reportId, report.id),
          eq(guardianPurchaseTable.kind, 'full_report'),
          inArray(guardianPurchaseTable.status, ['pending', 'paid', 'review_required']),
        ),
      )
      .limit(1)
      .for('update')

    if (activePurchase && activePurchase.status !== 'pending' && activePurchase.status !== 'paid') {
      return { status: 'purchase-state-conflict' as const }
    }
    if (activePurchase) {
      const purchaseStatus = activePurchase.status === 'paid' ? ('paid' as const) : ('pending' as const)
      if (activePurchase.status === 'pending') {
        await tx
          .update(guardianPurchaseTable)
          .set({
            recoveryEmail: input.recoveryEmail,
            recoveryEmailNormalized: input.recoveryEmailNormalized,
          })
          .where(eq(guardianPurchaseTable.paymentId, activePurchase.paymentId))
      }
      return {
        status: 'ready' as const,
        collectionId: collection.id,
        collectionPublicId: collection.publicId,
        reportId: report.id,
        reportPublicId: report.publicId,
        paymentId: activePurchase.paymentId,
        sku: product.sku,
        orderName: activePurchase.orderName,
        amount: activePurchase.amount,
        market: activePurchase.market,
        currency: activePurchase.currency,
        purchaseStatus,
      }
    }

    if (report.status !== 'draft') {
      return { status: 'purchase-state-conflict' as const }
    }

    await tx.insert(guardianPurchaseTable).values({
      paymentId: input.paymentId,
      collectionId: collection.id,
      reportId: report.id,
      sku: product.sku,
      kind: product.kind,
      entitlementSnapshot: { kind: 'full_report' },
      orderName,
      amount: price.amountMinor,
      market: price.market,
      currency: price.currency,
      recoveryEmail: input.recoveryEmail,
      recoveryEmailNormalized: input.recoveryEmailNormalized,
    })

    return {
      status: 'ready' as const,
      collectionId: collection.id,
      collectionPublicId: collection.publicId,
      reportId: report.id,
      reportPublicId: report.publicId,
      paymentId: input.paymentId,
      sku: product.sku,
      orderName,
      amount: price.amountMinor,
      market: price.market,
      currency: price.currency,
      purchaseStatus: 'pending' as const,
    }
  })
}

export async function resolveGuardianCollection(
  db: Db,
  accessTokenHash: string,
): Promise<{ id: number; publicId: string } | null> {
  const [row] = await db
    .select({ id: guardianCollectionTable.id, publicId: guardianCollectionTable.publicId })
    .from(guardianCollectionTable)
    .where(eq(guardianCollectionTable.accessTokenHash, accessTokenHash))
    .limit(1)
  return row ?? null
}

export async function resolveGuardianReportAccess(
  db: Db,
  input: { accessTokenHash?: string; ownerUserId?: string; reportPublicId: string },
): Promise<{ collectionId: number; reportId: number } | null> {
  const proofs = [
    ...(input.ownerUserId ? [eq(guardianCollectionTable.ownerUserId, input.ownerUserId)] : []),
    ...(input.accessTokenHash ? [eq(guardianCollectionTable.accessTokenHash, input.accessTokenHash)] : []),
  ]
  const owner = proofs.length === 1 ? proofs[0] : or(...proofs)
  if (!owner) return null
  const [row] = await db
    .select({ collectionId: guardianCollectionTable.id, reportId: guardianReportTable.id })
    .from(guardianCollectionTable)
    .innerJoin(guardianReportTable, eq(guardianReportTable.collectionId, guardianCollectionTable.id))
    .where(and(owner, eq(guardianReportTable.publicId, input.reportPublicId)))
    .limit(1)
  return row ?? null
}

export interface GuardianPurchaseAccess {
  collectionId: number
  reportId: number
  reportPublicId: string
  purchaseStatus: (typeof guardianPurchaseTable.$inferSelect)['status']
}

/** Resolves a payment only through the collection capability that owns it. */
export async function resolveGuardianPurchaseAccess(
  db: Db,
  input: { accessTokenHash?: string; ownerUserId?: string; paymentId: string },
): Promise<GuardianPurchaseAccess | null> {
  const proofs = [
    ...(input.ownerUserId ? [eq(guardianCollectionTable.ownerUserId, input.ownerUserId)] : []),
    ...(input.accessTokenHash ? [eq(guardianCollectionTable.accessTokenHash, input.accessTokenHash)] : []),
  ]
  const owner = proofs.length === 1 ? proofs[0] : or(...proofs)
  if (!owner) return null
  const [row] = await db
    .select({
      collectionId: guardianCollectionTable.id,
      reportId: guardianReportTable.id,
      reportPublicId: guardianReportTable.publicId,
      purchaseStatus: guardianPurchaseTable.status,
    })
    .from(guardianCollectionTable)
    .innerJoin(guardianPurchaseTable, eq(guardianPurchaseTable.collectionId, guardianCollectionTable.id))
    .innerJoin(
      guardianReportTable,
      and(
        eq(guardianReportTable.id, guardianPurchaseTable.reportId),
        eq(guardianReportTable.collectionId, guardianCollectionTable.id),
      ),
    )
    .where(and(owner, eq(guardianPurchaseTable.paymentId, input.paymentId)))
    .limit(1)
  return row ?? null
}

export async function guardianPurchaseExists(db: Db, paymentId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: guardianPurchaseTable.id })
    .from(guardianPurchaseTable)
    .where(eq(guardianPurchaseTable.paymentId, paymentId))
    .limit(1)
  return Boolean(row)
}

/** Oldest reconciliation attempt first, so abandoned checkouts cannot starve newer payments in a bounded batch. */
export async function listStalePendingGuardianPurchases(
  db: Db,
  olderThan: Date,
  limit: number,
): Promise<{ paymentId: string }[]> {
  return db
    .select({ paymentId: guardianPurchaseTable.paymentId })
    .from(guardianPurchaseTable)
    .where(and(eq(guardianPurchaseTable.status, 'pending'), lt(guardianPurchaseTable.updatedAt, olderThan)))
    .orderBy(asc(guardianPurchaseTable.updatedAt))
    .limit(limit)
}

/** Keeps unresolved rows retryable while rotating the next bounded scheduler batch fairly. */
export async function touchPendingGuardianPurchaseAfterReconciliation(
  db: Db,
  paymentId: string,
  checkedAt: Date,
): Promise<void> {
  await db
    .update(guardianPurchaseTable)
    .set({ updatedAt: checkedAt })
    .where(and(eq(guardianPurchaseTable.paymentId, paymentId), eq(guardianPurchaseTable.status, 'pending')))
}

export interface VerifiedGuardianPayment {
  paymentId: string
  amount: number
  currency: string
  providerTxnId: string | null
  method: string | null
  paidAt: Date
}

export type ConfirmGuardianPurchaseResult =
  | {
      status: 'granted' | 'already-granted'
      kind: 'full_report'
      reportPublicId: string
    }
  | {
      status: 'granted' | 'already-granted'
      kind: 'love_redraw'
      reportPublicId: string
      credits: number
    }
  | { status: 'purchase-not-found' | 'payment-mismatch' | 'purchase-state-conflict' | 'report-state-conflict' }

/**
 * Paid transition and entitlement grant are one transaction. Confirm-return, webhook, and reconciliation may
 * all call this function; the first wins the row lock and later callers receive `already-granted`.
 */
export async function confirmGuardianPurchase(
  db: Db,
  payment: VerifiedGuardianPayment,
): Promise<ConfirmGuardianPurchaseResult> {
  return db.transaction(async (tx) => {
    const [purchaseRef] = await tx
      .select({
        id: guardianPurchaseTable.id,
        collectionId: guardianPurchaseTable.collectionId,
        reportId: guardianPurchaseTable.reportId,
      })
      .from(guardianPurchaseTable)
      .where(eq(guardianPurchaseTable.paymentId, payment.paymentId))
      .limit(1)

    if (!purchaseRef) {
      return { status: 'purchase-not-found' as const }
    }

    // Keep the same collection → report → purchase lock order as resume checkout and redraw. The initial
    // unlocked lookup discovers the aggregate; every mutable fact is read again after its row lock below.
    const [collection] = await tx
      .select({ id: guardianCollectionTable.id })
      .from(guardianCollectionTable)
      .where(eq(guardianCollectionTable.id, purchaseRef.collectionId))
      .limit(1)
      .for('update')
    if (!collection) {
      return { status: 'report-state-conflict' as const }
    }
    const report = await lockedReportOf(tx, purchaseRef)
    if (!report) {
      return { status: 'report-state-conflict' as const }
    }

    const [purchase] = await tx
      .select({
        id: guardianPurchaseTable.id,
        collectionId: guardianPurchaseTable.collectionId,
        reportId: guardianPurchaseTable.reportId,
        sku: guardianPurchaseTable.sku,
        kind: guardianPurchaseTable.kind,
        entitlementSnapshot: guardianPurchaseTable.entitlementSnapshot,
        amount: guardianPurchaseTable.amount,
        currency: guardianPurchaseTable.currency,
        status: guardianPurchaseTable.status,
        entitlementGrantedAt: guardianPurchaseTable.entitlementGrantedAt,
      })
      .from(guardianPurchaseTable)
      .where(eq(guardianPurchaseTable.id, purchaseRef.id))
      .limit(1)
      .for('update')

    if (!purchase) {
      return { status: 'purchase-not-found' as const }
    }
    if (purchase.status !== 'pending' && purchase.status !== 'paid') {
      return { status: 'purchase-state-conflict' as const }
    }
    if (purchase.amount !== payment.amount || purchase.currency !== payment.currency) {
      if (purchase.status === 'pending') {
        await tx
          .update(guardianPurchaseTable)
          .set({ status: 'review_required', failureCode: 'payment_mismatch' })
          .where(eq(guardianPurchaseTable.id, purchase.id))
      }
      return { status: 'payment-mismatch' as const }
    }

    const entitlement = purchase.entitlementSnapshot
    if (entitlement.kind !== purchase.kind) {
      return { status: 'purchase-state-conflict' as const }
    }
    if (report.collectionId !== purchase.collectionId || report.id !== purchase.reportId) {
      return { status: 'report-state-conflict' as const }
    }

    if (purchase.entitlementGrantedAt) {
      if (entitlement.kind === 'full_report') {
        return {
          status: 'already-granted' as const,
          kind: 'full_report' as const,
          reportPublicId: report.publicId,
        }
      }
      return {
        status: 'already-granted' as const,
        kind: 'love_redraw' as const,
        reportPublicId: report.publicId,
        credits: entitlement.redrawCredits,
      }
    }

    if (
      (entitlement.kind === 'full_report' && (report.status !== 'draft' || report.productSku !== purchase.sku)) ||
      (entitlement.kind === 'love_redraw' && (report.status !== 'fulfilled' || !report.loveFamilyId))
    ) {
      return { status: 'report-state-conflict' as const }
    }

    if (purchase.status === 'pending') {
      await tx
        .update(guardianPurchaseTable)
        .set({
          status: 'paid',
          providerTxnId: payment.providerTxnId,
          method: payment.method,
          paidAt: payment.paidAt,
        })
        .where(eq(guardianPurchaseTable.id, purchase.id))
    }

    if (entitlement.kind === 'full_report') {
      const grantedAt = new Date()
      await stampGuardianEntitlementGranted(tx, purchase.id, grantedAt)
      await tx
        .insert(guardianRecoveryEmailDeliveryTable)
        .values({ purchaseId: purchase.id })
        .onConflictDoNothing({ target: guardianRecoveryEmailDeliveryTable.purchaseId })

      return {
        status: 'granted' as const,
        kind: 'full_report' as const,
        reportPublicId: report.publicId,
      }
    }

    const loveFamilyId = report.loveFamilyId
    if (!loveFamilyId) {
      return { status: 'report-state-conflict' as const }
    }
    await tx
      .insert(guardianRedrawGrantTable)
      .values({
        grantKey: `purchase:${purchase.id}`,
        collectionId: purchase.collectionId,
        reportId: purchase.reportId,
        purchaseId: purchase.id,
        familyId: loveFamilyId,
        kind: 'paid',
        totalCredits: entitlement.redrawCredits,
      })
      .onConflictDoNothing({ target: guardianRedrawGrantTable.grantKey })

    const grantedAt = new Date()
    await stampGuardianEntitlementGranted(tx, purchase.id, grantedAt)
    return {
      status: 'granted' as const,
      kind: 'love_redraw' as const,
      reportPublicId: report.publicId,
      credits: entitlement.redrawCredits,
    }
  })
}

export type SettleGuardianPurchaseResult =
  | { status: 'failed' | 'cancelled' | 'refunded'; reportPublicId: string }
  | { status: 'purchase-not-found' | 'purchase-state-conflict' | 'report-state-conflict' }

/**
 * Applies a server-read terminal PortOne state without granting anything. A cancellation seen before local
 * confirmation closes the pending order; one seen after a paid grant revokes the paid entitlement as refunded.
 */
export async function settleGuardianPurchase(
  db: Db,
  input: {
    paymentId: string
    remoteStatus: 'failed' | 'refunded'
    occurredAt: Date
    failureCode?: string | null
    failureMessage?: string | null
  },
): Promise<SettleGuardianPurchaseResult> {
  return db.transaction(async (tx) => {
    const [purchaseRef] = await tx
      .select({
        id: guardianPurchaseTable.id,
        collectionId: guardianPurchaseTable.collectionId,
        reportId: guardianPurchaseTable.reportId,
      })
      .from(guardianPurchaseTable)
      .where(eq(guardianPurchaseTable.paymentId, input.paymentId))
      .limit(1)
    if (!purchaseRef) {
      return { status: 'purchase-not-found' as const }
    }

    const [collection] = await tx
      .select({ id: guardianCollectionTable.id })
      .from(guardianCollectionTable)
      .where(eq(guardianCollectionTable.id, purchaseRef.collectionId))
      .limit(1)
      .for('update')
    if (!collection) {
      return { status: 'report-state-conflict' as const }
    }
    const report = await lockedReportOf(tx, purchaseRef)
    if (!report) {
      return { status: 'report-state-conflict' as const }
    }

    const [purchase] = await tx
      .select({ status: guardianPurchaseTable.status })
      .from(guardianPurchaseTable)
      .where(eq(guardianPurchaseTable.id, purchaseRef.id))
      .limit(1)
      .for('update')
    if (!purchase) {
      return { status: 'purchase-not-found' as const }
    }

    if (input.remoteStatus === 'failed') {
      if (purchase.status === 'failed') {
        return { status: 'failed' as const, reportPublicId: report.publicId }
      }
      if (purchase.status !== 'pending' && purchase.status !== 'review_required') {
        return { status: 'purchase-state-conflict' as const }
      }
      await tx
        .update(guardianPurchaseTable)
        .set({
          status: 'failed',
          failureCode: input.failureCode?.slice(0, 64) || 'payment_failed',
          failureMessage: input.failureMessage?.slice(0, 256) || null,
        })
        .where(eq(guardianPurchaseTable.id, purchaseRef.id))
      return { status: 'failed' as const, reportPublicId: report.publicId }
    }

    if (purchase.status === 'refunded') {
      return { status: 'refunded' as const, reportPublicId: report.publicId }
    }
    if (purchase.status === 'paid') {
      await tx
        .update(guardianPurchaseTable)
        .set({
          status: 'refunded',
          refundedAt: input.occurredAt,
          failureCode: null,
          failureMessage: null,
        })
        .where(eq(guardianPurchaseTable.id, purchaseRef.id))
      return { status: 'refunded' as const, reportPublicId: report.publicId }
    }
    if (!['pending', 'review_required', 'failed', 'cancelled'].includes(purchase.status)) {
      return { status: 'purchase-state-conflict' as const }
    }
    if (purchase.status !== 'cancelled') {
      await tx
        .update(guardianPurchaseTable)
        .set({
          status: 'cancelled',
          failureCode: 'payment_cancelled',
          failureMessage: null,
        })
        .where(eq(guardianPurchaseTable.id, purchaseRef.id))
    }
    return { status: 'cancelled' as const, reportPublicId: report.publicId }
  })
}

export type FulfillGuardianReportResult =
  | {
      status: 'fulfilled' | 'already-fulfilled'
      reportPublicId: string
      cards: GuardianSelectedCard[]
      narrative: GuardianReportNarrativeSnapshot
    }
  | { status: 'report-not-found' | 'payment-required' | 'questionnaire-incomplete' }

export async function fulfillGuardianReportAfterQuestionnaireInTransaction(
  db: Db,
  input: { collectionId: number; reportId: number },
  questionnaire: GuardianQuestionnaireContent,
): Promise<FulfillGuardianReportResult> {
  const report = await lockedReportOf(db, input)

  if (!report) {
    return { status: 'report-not-found' }
  }
  if (report.status === 'fulfilled') {
    if (!report.cardSnapshot || !report.narrativeSnapshot) {
      throw new Error('Fulfilled guardian report is missing its immutable result snapshot')
    }
    return {
      status: 'already-fulfilled',
      reportPublicId: report.publicId,
      cards: report.cardSnapshot,
      narrative: report.narrativeSnapshot,
    }
  }
  if (!report.questionnaireAnswerSnapshot || !report.questionnaireSignalSnapshot || !report.questionnaireCompletedAt) {
    return { status: 'questionnaire-incomplete' }
  }

  const purchase = await findPaidFullReportPurchase(db, {
    collectionId: input.collectionId,
    reportId: input.reportId,
    sku: report.productSku,
  })
  if (!purchase) {
    return { status: 'payment-required' }
  }

  const manifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST
  const initial = drawInitialGuardianReport(
    {
      ...report.inputSnapshot,
      paidAnswers: report.questionnaireAnswerSnapshot,
      paidSignals: report.questionnaireSignalSnapshot,
    },
    { manifest },
  )
  const narrative = generateGuardianReportNarrative({
    locale: report.locale,
    questionnaire,
    inputSnapshot: report.inputSnapshot,
    answerSnapshot: report.questionnaireAnswerSnapshot,
    signalSnapshot: report.questionnaireSignalSnapshot,
    cards: initial.cards,
  })

  for (const card of initial.cards) {
    const edition = guardianEdition(card.editionId, manifest)
    const section = narrative.sections.find((candidate) => candidate.slot === card.slot)
    if (!section) {
      throw new Error(`Guardian report narrative is missing its ${card.slot} presentation`)
    }
    const acquisition = await recordGuardianAcquisition(db, {
      collectionId: input.collectionId,
      reportId: input.reportId,
      drawRequestId: null,
      grantId: null,
      card,
      presentation: {
        locale: report.locale,
        cardEditionId: card.editionId,
        familyId: card.familyId,
        slot: card.slot,
        rarity: card.rarity,
        artworkPath: edition.artworkPath,
        title: section.title,
        guardians: section.guardians,
        artworkAlt: section.artworkAlt,
        oneLine: section.oneLine,
      },
      source: 'initial_report',
      guaranteeDue: false,
      guaranteedUnowned: false,
      drawSnapshot: guardianCardDrawSnapshot(card, { manifest }),
    })
    await selectGuardianReportCard(db, { reportId: input.reportId, slot: card.slot, acquisitionId: acquisition.id })
  }

  await db
    .update(guardianReportTable)
    .set({
      status: 'fulfilled',
      familySnapshot: initial.families,
      loveFamilyId: initial.families.love,
      cardSnapshot: initial.cards,
      narrativeSnapshot: narrative,
      fulfilledAt: new Date(),
    })
    .where(eq(guardianReportTable.id, input.reportId))

  return {
    status: 'fulfilled',
    reportPublicId: report.publicId,
    cards: initial.cards,
    narrative,
  }
}

export async function grantGuardianAccountSaveReward(
  db: Db,
  input: { collectionId: number; reportId: number },
): Promise<'granted' | 'already-granted' | 'report-not-found'> {
  return db.transaction(async (tx) => {
    const report = await lockedReportOf(tx, input)
    if (report?.status !== 'fulfilled' || !report.loveFamilyId) {
      return 'report-not-found'
    }
    const rewardManifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST
    const rewardFamily = rewardManifest.families.find(({ id }) => id === report.loveFamilyId)
    if (rewardFamily?.slot !== 'love' || !guardianSupportsLocale(report.locale, rewardManifest)) {
      return 'report-not-found'
    }

    const rows = await tx
      .insert(guardianRedrawGrantTable)
      .values({
        grantKey: `account-save:${input.collectionId}`,
        collectionId: input.collectionId,
        reportId: input.reportId,
        familyId: report.loveFamilyId,
        kind: 'account_save_reward',
        totalCredits: 1,
      })
      .onConflictDoNothing({ target: guardianRedrawGrantTable.grantKey })
      .returning({ id: guardianRedrawGrantTable.id })
    return rows.length === 1 ? 'granted' : 'already-granted'
  })
}

export type ClaimGuardianCollectionResult =
  | { status: 'claimed' | 'already-claimed'; reward: 'granted' | 'already-granted' }
  | { status: 'forbidden' }
  | { status: 'report-not-found' }

/**
 * Converts the guest capability into account ownership without copying the collection or any card rows.
 * The ownership change, capability revocation, and one-shot reward grant commit together.
 */
export async function claimGuardianCollection(
  db: Db,
  input: {
    collectionPublicId: string
    reportPublicId: string
    accessTokenHash: string
    ownerUserId: string
  },
): Promise<ClaimGuardianCollectionResult> {
  return db.transaction(async (tx) => {
    const [collection] = await tx
      .select({
        id: guardianCollectionTable.id,
        accessTokenHash: guardianCollectionTable.accessTokenHash,
        ownerUserId: guardianCollectionTable.ownerUserId,
      })
      .from(guardianCollectionTable)
      .where(eq(guardianCollectionTable.publicId, input.collectionPublicId))
      .limit(1)
      .for('update')
    if (!collection) return { status: 'forbidden' as const }
    if (collection.ownerUserId && collection.ownerUserId !== input.ownerUserId) {
      return { status: 'forbidden' as const }
    }
    if (!collection.ownerUserId && collection.accessTokenHash !== input.accessTokenHash) {
      return { status: 'forbidden' as const }
    }

    const [report] = await tx
      .select({
        id: guardianReportTable.id,
        status: guardianReportTable.status,
        loveFamilyId: guardianReportTable.loveFamilyId,
        locale: guardianReportTable.locale,
      })
      .from(guardianReportTable)
      .where(
        and(
          eq(guardianReportTable.collectionId, collection.id),
          eq(guardianReportTable.publicId, input.reportPublicId),
        ),
      )
      .limit(1)
      .for('update')
    if (report?.status !== 'fulfilled' || !report.loveFamilyId) {
      return { status: 'report-not-found' as const }
    }

    const rewardManifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST
    const rewardFamily = rewardManifest.families.find(({ id }) => id === report.loveFamilyId)
    if (rewardFamily?.slot !== 'love' || !guardianSupportsLocale(report.locale, rewardManifest)) {
      return { status: 'report-not-found' as const }
    }

    const alreadyClaimed = collection.ownerUserId === input.ownerUserId
    if (!alreadyClaimed) {
      await tx
        .update(guardianCollectionTable)
        .set({ ownerUserId: input.ownerUserId, accessTokenHash: null })
        .where(eq(guardianCollectionTable.id, collection.id))
    }

    const grants = await tx
      .insert(guardianRedrawGrantTable)
      .values({
        grantKey: `account-save:${collection.id}`,
        collectionId: collection.id,
        reportId: report.id,
        familyId: report.loveFamilyId,
        kind: 'account_save_reward',
        totalCredits: 1,
      })
      .onConflictDoNothing({ target: guardianRedrawGrantTable.grantKey })
      .returning({ id: guardianRedrawGrantTable.id })

    return {
      status: alreadyClaimed ? ('already-claimed' as const) : ('claimed' as const),
      reward: grants.length === 1 ? ('granted' as const) : ('already-granted' as const),
    }
  })
}

export type OwnedGuardianReportListItem = {
  collectionPublicId: string
  reportPublicId: string
  locale: Locale
  createdAt: Date
  title: string
  oneLine: string
  artworkPaths: string[]
}

/**
 * Account library projection. It deliberately returns immutable report presentation only — chart inputs,
 * questionnaire answers, payment email, capability hashes, and internal numeric IDs never leave this query.
 */
export async function listOwnedGuardianReports(
  db: Db,
  input: { ownerUserId: string; limit: number },
): Promise<OwnedGuardianReportListItem[]> {
  const rows = await db
    .select({
      collectionPublicId: guardianCollectionTable.publicId,
      reportPublicId: guardianReportTable.publicId,
      locale: guardianReportTable.locale,
      createdAt: guardianReportTable.createdAt,
      narrative: guardianReportTable.narrativeSnapshot,
      reportId: guardianReportTable.id,
    })
    .from(guardianCollectionTable)
    .innerJoin(guardianReportTable, eq(guardianReportTable.collectionId, guardianCollectionTable.id))
    .where(and(eq(guardianCollectionTable.ownerUserId, input.ownerUserId), eq(guardianReportTable.status, 'fulfilled')))
    .orderBy(desc(guardianReportTable.createdAt), desc(guardianReportTable.publicId))
    .limit(input.limit)

  if (rows.length === 0) return []
  const presentations = await db
    .select({
      reportId: guardianReportCardSelectionTable.reportId,
      presentation: guardianCardAcquisitionTable.presentationSnapshot,
    })
    .from(guardianReportCardSelectionTable)
    .innerJoin(
      guardianCardAcquisitionTable,
      eq(guardianCardAcquisitionTable.id, guardianReportCardSelectionTable.acquisitionId),
    )
    .where(
      inArray(
        guardianReportCardSelectionTable.reportId,
        rows.map(({ reportId }) => reportId),
      ),
    )
  const artworkByReport = new Map<number, string[]>()
  for (const row of presentations) {
    const paths = artworkByReport.get(row.reportId) ?? []
    paths.push(row.presentation.artworkPath)
    artworkByReport.set(row.reportId, paths)
  }

  return rows.flatMap((row) => {
    if (!row.narrative) return []
    return [
      {
        collectionPublicId: row.collectionPublicId,
        reportPublicId: row.reportPublicId,
        locale: row.locale,
        createdAt: row.createdAt,
        title: row.narrative.hero.title,
        oneLine: row.narrative.hero.oneLine,
        artworkPaths: artworkByReport.get(row.reportId) ?? [],
      },
    ]
  })
}

export type ConsumeGuardianRedrawResult =
  | {
      status: 'drawn'
      acquisitionPublicId: string
      presentation: (typeof guardianCardAcquisitionTable.$inferSelect)['presentationSnapshot']
      duplicate: boolean
      guaranteeDue: boolean
      guaranteedUnowned: boolean
      created: boolean
    }
  | { status: 'report-not-found' }
  | { status: 'no-credit' }

export async function consumeGuardianRedraw(
  db: Db,
  input: {
    collectionId: number
    reportId: number
    requestId: string
  },
): Promise<ConsumeGuardianRedrawResult> {
  return db.transaction(async (tx) => {
    const [collection] = await tx
      .select({ id: guardianCollectionTable.id })
      .from(guardianCollectionTable)
      .where(eq(guardianCollectionTable.id, input.collectionId))
      .limit(1)
      .for('update')
    if (!collection) {
      return { status: 'report-not-found' as const }
    }

    const report = await lockedReportOf(tx, input)
    if (
      report?.status !== 'fulfilled' ||
      !report.loveFamilyId ||
      !report.questionnaireSignalSnapshot ||
      !report.fulfilledAt
    ) {
      return { status: 'report-not-found' as const }
    }

    const [existing] = await tx
      .select({
        publicId: guardianCardAcquisitionTable.publicId,
        presentation: guardianCardAcquisitionTable.presentationSnapshot,
        duplicate: guardianCardAcquisitionTable.duplicate,
        guaranteeDue: guardianCardAcquisitionTable.guaranteeDue,
        guaranteedUnowned: guardianCardAcquisitionTable.guaranteedUnowned,
      })
      .from(guardianCardAcquisitionTable)
      .where(
        and(
          eq(guardianCardAcquisitionTable.collectionId, input.collectionId),
          eq(guardianCardAcquisitionTable.reportId, input.reportId),
          eq(guardianCardAcquisitionTable.drawRequestId, input.requestId),
        ),
      )
      .limit(1)
    if (existing) {
      return {
        status: 'drawn' as const,
        acquisitionPublicId: existing.publicId,
        presentation: existing.presentation,
        duplicate: existing.duplicate,
        guaranteeDue: existing.guaranteeDue,
        guaranteedUnowned: existing.guaranteedUnowned,
        created: false,
      }
    }

    const [grant] = await tx
      .select({
        id: guardianRedrawGrantTable.id,
        kind: guardianRedrawGrantTable.kind,
      })
      .from(guardianRedrawGrantTable)
      .where(
        and(
          eq(guardianRedrawGrantTable.collectionId, input.collectionId),
          eq(guardianRedrawGrantTable.reportId, input.reportId),
          eq(guardianRedrawGrantTable.familyId, report.loveFamilyId),
          sql`${guardianRedrawGrantTable.consumedCredits} < ${guardianRedrawGrantTable.totalCredits}`,
          or(
            eq(guardianRedrawGrantTable.kind, 'account_save_reward'),
            sql`exists (
              select 1
              from ${guardianPurchaseTable}
              where ${guardianPurchaseTable.id} = ${guardianRedrawGrantTable.purchaseId}
                and ${guardianPurchaseTable.status} = 'paid'
            )`,
          ),
        ),
      )
      .orderBy(asc(guardianRedrawGrantTable.createdAt), asc(guardianRedrawGrantTable.id))
      .limit(1)
      .for('update')
    if (!grant) {
      return { status: 'no-credit' as const }
    }

    const manifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST
    const scopeId = report.loveFamilyId
    await tx
      .insert(guardianGuaranteeProgressTable)
      .values({
        collectionId: input.collectionId,
        scopeId,
      })
      .onConflictDoNothing({
        target: [guardianGuaranteeProgressTable.collectionId, guardianGuaranteeProgressTable.scopeId],
      })

    const [progress] = await tx
      .select({
        paidDrawCount: guardianGuaranteeProgressTable.paidDrawCount,
      })
      .from(guardianGuaranteeProgressTable)
      .where(
        and(
          eq(guardianGuaranteeProgressTable.collectionId, input.collectionId),
          eq(guardianGuaranteeProgressTable.scopeId, scopeId),
        ),
      )
      .limit(1)
      .for('update')
    if (!progress) {
      throw new Error('Guardian guarantee progress insert returned no row')
    }
    const ownedRows = await tx
      .select({ editionId: guardianCardOwnershipTable.editionId })
      .from(guardianCardOwnershipTable)
      .where(
        and(
          eq(guardianCardOwnershipTable.collectionId, input.collectionId),
          eq(guardianCardOwnershipTable.familyId, scopeId),
        ),
      )
    const ownedEditionIds = new Set(ownedRows.map(({ editionId }) => editionId))
    const decision = drawLoveRedraw(
      {
        familyId: scopeId,
        ownedEditionIds,
        paidDrawsInCycle: progress.paidDrawCount % manifest.guarantee.paidDrawInterval,
        creditKind: grant.kind,
      },
      { manifest },
    )
    const edition = guardianEdition(decision.card.editionId, manifest)
    const presentation = generateGuardianLoveCardPresentation({
      locale: report.locale,
      card: decision.card,
      artworkPath: edition.artworkPath,
      signalSnapshot: report.questionnaireSignalSnapshot,
    })
    const acquisition = await recordGuardianAcquisition(tx, {
      collectionId: input.collectionId,
      reportId: input.reportId,
      drawRequestId: input.requestId,
      grantId: grant.id,
      card: decision.card,
      presentation,
      source: grant.kind === 'paid' ? 'paid_redraw' : 'account_save_reward',
      guaranteeDue: decision.guaranteeDue,
      guaranteedUnowned: decision.guaranteedUnowned,
      drawSnapshot: guardianCardDrawSnapshot(decision.card, {
        manifest,
        eligibleEditionIds: decision.eligibleEditionIds,
        familySelection: 'retained_report_family',
        guarantee: decision,
      }),
    })

    await tx
      .update(guardianRedrawGrantTable)
      .set({ consumedCredits: sql`${guardianRedrawGrantTable.consumedCredits} + 1` })
      .where(eq(guardianRedrawGrantTable.id, grant.id))

    if (grant.kind === 'paid') {
      await tx
        .update(guardianGuaranteeProgressTable)
        .set({ paidDrawCount: sql`${guardianGuaranteeProgressTable.paidDrawCount} + 1` })
        .where(
          and(
            eq(guardianGuaranteeProgressTable.collectionId, input.collectionId),
            eq(guardianGuaranteeProgressTable.scopeId, scopeId),
          ),
        )
    }

    return {
      status: 'drawn' as const,
      acquisitionPublicId: acquisition.publicId,
      presentation,
      duplicate: acquisition.duplicate,
      guaranteeDue: decision.guaranteeDue,
      guaranteedUnowned: decision.guaranteedUnowned,
      created: true,
    }
  })
}

async function stampGuardianEntitlementGranted(db: Db, purchaseId: number, at: Date): Promise<void> {
  await db
    .update(guardianPurchaseTable)
    .set({ entitlementGrantedAt: at })
    .where(eq(guardianPurchaseTable.id, purchaseId))
}
