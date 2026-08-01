import type { Locale } from '@sobok/domain/locale'
import type { Db } from '@sobok/edge/db/client'
import { and, asc, eq, getColumns, inArray, isNotNull, or, sql } from 'drizzle-orm'
import { drawInitialGuardianReport, drawLoveRedraw, type GuardianSelectedCard } from '../../guardian/draw'
import {
  CURRENT_GUARDIAN_MANIFEST,
  type GuardianFullReportProductSku,
  type GuardianLoveRedrawProductSku,
  type GuardianRarity,
  type GuardianReportInputSnapshot,
  guardianManifest,
  guardianProduct,
  guardianProductOrderName,
  guardianProductPrice,
  guardianQuestionnaireVersion,
} from '../../guardian/manifest'
import { newGuardianPublicId } from '../../guardian/tokens'
import {
  guardianCardAcquisitionTable,
  guardianCardOwnershipTable,
  guardianCollectionTable,
  guardianGuaranteeProgressTable,
  guardianPurchaseTable,
  guardianRedrawGrantTable,
  guardianReportTable,
} from '../schema/guardian'

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
): Promise<{ manifestVersion: string } | null> {
  const [purchase] = await db
    .select({ manifestVersion: guardianPurchaseTable.manifestVersion })
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
  const questionnaireVersion = guardianQuestionnaireVersion(productSku, input.locale, manifest)

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
        manifestVersion: manifest.manifestVersion,
        selectionRuleVersion: manifest.selectionRuleVersion,
        oddsVersion: manifest.oddsVersion,
        copyVersion: manifest.copyVersion,
        renderVersion: manifest.renderVersion,
        questionnaireVersion,
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
      orderName,
      amount: price.amountMinor,
      market: price.market,
      currency: price.currency,
      recoveryEmail: input.recoveryEmail,
      recoveryEmailNormalized: input.recoveryEmailNormalized,
      manifestVersion: manifest.manifestVersion,
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

    const manifest = guardianManifest(report.manifestVersion)
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
      orderName,
      amount: price.amountMinor,
      market: price.market,
      currency: price.currency,
      recoveryEmail: input.recoveryEmail,
      recoveryEmailNormalized: input.recoveryEmailNormalized,
      manifestVersion: manifest.manifestVersion,
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
  input: { accessTokenHash: string; reportPublicId: string },
): Promise<{ collectionId: number; reportId: number } | null> {
  const [row] = await db
    .select({ collectionId: guardianCollectionTable.id, reportId: guardianReportTable.id })
    .from(guardianCollectionTable)
    .innerJoin(guardianReportTable, eq(guardianReportTable.collectionId, guardianCollectionTable.id))
    .where(
      and(
        eq(guardianCollectionTable.accessTokenHash, input.accessTokenHash),
        eq(guardianReportTable.publicId, input.reportPublicId),
      ),
    )
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
  input: { accessTokenHash: string; paymentId: string },
): Promise<GuardianPurchaseAccess | null> {
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
    .where(
      and(
        eq(guardianCollectionTable.accessTokenHash, input.accessTokenHash),
        eq(guardianPurchaseTable.paymentId, input.paymentId),
      ),
    )
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

interface NewGuardianPurchaseBase {
  paymentId: string
  collectionId: number
  reportId: number
  market: string
}

export type NewGuardianPurchase = NewGuardianPurchaseBase &
  (
    | {
        sku: GuardianFullReportProductSku
        recoveryEmail: string
        recoveryEmailNormalized: string
      }
    | {
        sku: GuardianLoveRedrawProductSku
        recoveryEmail?: never
        recoveryEmailNormalized?: never
      }
  )

export type CreateGuardianPurchaseResult =
  | {
      status: 'created'
      amount: number
      market: string
      currency: string
      manifestVersion: string
    }
  | { status: 'report-not-found' | 'report-state-conflict' | 'active-purchase-exists' }

/**
 * Persists only a server-priced pending order. Checkout may return these values to PortOne, but it must never
 * accept amount/currency from the browser.
 */
export async function createPendingGuardianPurchase(
  db: Db,
  input: NewGuardianPurchase,
): Promise<CreateGuardianPurchaseResult> {
  return db.transaction(async (tx) => {
    const report = await lockedReportOf(tx, input)

    if (!report) {
      return { status: 'report-not-found' as const }
    }
    const manifest = guardianManifest(report.manifestVersion)
    const product = guardianProduct(input.sku, manifest)
    const price = guardianProductPrice(input.sku, input.market, manifest)
    const orderName = guardianProductOrderName(input.sku, report.locale, manifest)
    if (
      (product.kind === 'full_report' && (report.status !== 'draft' || product.sku !== report.productSku)) ||
      (product.kind === 'love_redraw' && report.status !== 'fulfilled')
    ) {
      return { status: 'report-state-conflict' as const }
    }
    if (product.kind === 'full_report') {
      const [activePurchase] = await tx
        .select({ id: guardianPurchaseTable.id })
        .from(guardianPurchaseTable)
        .where(
          and(
            eq(guardianPurchaseTable.reportId, input.reportId),
            eq(guardianPurchaseTable.kind, 'full_report'),
            inArray(guardianPurchaseTable.status, ['pending', 'paid', 'review_required']),
          ),
        )
        .limit(1)
      if (activePurchase) {
        return { status: 'active-purchase-exists' as const }
      }
    }

    await tx.insert(guardianPurchaseTable).values({
      paymentId: input.paymentId,
      collectionId: input.collectionId,
      reportId: input.reportId,
      sku: product.sku,
      kind: product.kind,
      orderName,
      amount: price.amountMinor,
      market: price.market,
      currency: price.currency,
      recoveryEmail: input.recoveryEmail,
      recoveryEmailNormalized: input.recoveryEmailNormalized,
      manifestVersion: manifest.manifestVersion,
    })

    return {
      status: 'created' as const,
      amount: price.amountMinor,
      market: price.market,
      currency: price.currency,
      manifestVersion: manifest.manifestVersion,
    }
  })
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
      questionnaireVersion: string
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
        amount: guardianPurchaseTable.amount,
        currency: guardianPurchaseTable.currency,
        status: guardianPurchaseTable.status,
        manifestVersion: guardianPurchaseTable.manifestVersion,
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

    const manifest = guardianManifest(purchase.manifestVersion)
    const product = guardianProduct(purchase.sku, manifest)
    if (product.kind !== purchase.kind) {
      return { status: 'purchase-state-conflict' as const }
    }
    if (report.collectionId !== purchase.collectionId || report.id !== purchase.reportId) {
      return { status: 'report-state-conflict' as const }
    }

    if (purchase.entitlementGrantedAt) {
      if (product.kind === 'full_report') {
        return {
          status: 'already-granted' as const,
          kind: 'full_report' as const,
          reportPublicId: report.publicId,
          questionnaireVersion: report.questionnaireVersion,
        }
      }
      return {
        status: 'already-granted' as const,
        kind: 'love_redraw' as const,
        reportPublicId: report.publicId,
        credits: product.redrawCredits,
      }
    }

    if (
      (product.kind === 'full_report' &&
        (report.status !== 'draft' ||
          report.productSku !== product.sku ||
          report.manifestVersion !== purchase.manifestVersion)) ||
      (product.kind === 'love_redraw' && (report.status !== 'fulfilled' || !report.loveFamilyId))
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

    if (product.kind === 'full_report') {
      const grantedAt = new Date()
      await stampGuardianEntitlementGranted(tx, purchase.id, grantedAt)

      return {
        status: 'granted' as const,
        kind: 'full_report' as const,
        reportPublicId: report.publicId,
        questionnaireVersion: report.questionnaireVersion,
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
        totalCredits: product.redrawCredits,
        manifestVersion: manifest.manifestVersion,
      })
      .onConflictDoNothing({ target: guardianRedrawGrantTable.grantKey })

    const grantedAt = new Date()
    await stampGuardianEntitlementGranted(tx, purchase.id, grantedAt)
    return {
      status: 'granted' as const,
      kind: 'love_redraw' as const,
      reportPublicId: report.publicId,
      credits: product.redrawCredits,
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
    }
  | { status: 'report-not-found' | 'payment-required' | 'questionnaire-incomplete' }

/**
 * Standalone entry point for reconciliation. The final-answer path calls the in-transaction variant below so
 * saving the last answer, pinning its snapshots, drawing once, and recording all four acquisitions are atomic.
 */
export async function fulfillGuardianReportAfterQuestionnaire(
  db: Db,
  input: { collectionId: number; reportId: number },
): Promise<FulfillGuardianReportResult> {
  return db.transaction((tx) => fulfillGuardianReportAfterQuestionnaireInTransaction(tx, input))
}

export async function fulfillGuardianReportAfterQuestionnaireInTransaction(
  db: Db,
  input: { collectionId: number; reportId: number },
): Promise<FulfillGuardianReportResult> {
  const report = await lockedReportOf(db, input)

  if (!report) {
    return { status: 'report-not-found' }
  }
  if (report.status === 'fulfilled') {
    if (!report.cardSnapshot) {
      throw new Error('Fulfilled guardian report is missing its immutable card snapshot')
    }
    return {
      status: 'already-fulfilled',
      reportPublicId: report.publicId,
      cards: report.cardSnapshot,
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
  if (!purchase || purchase.manifestVersion !== report.manifestVersion) {
    return { status: 'payment-required' }
  }

  const manifest = guardianManifest(report.manifestVersion)
  const initial = drawInitialGuardianReport(
    {
      ...report.inputSnapshot,
      paidAnswers: report.questionnaireAnswerSnapshot,
      paidSignals: report.questionnaireSignalSnapshot,
    },
    { manifest },
  )

  for (const card of initial.cards) {
    await recordGuardianAcquisition(db, {
      collectionId: input.collectionId,
      reportId: input.reportId,
      grantId: null,
      card,
      source: 'initial_report',
      guaranteeDue: false,
      guaranteedUnowned: false,
      manifestVersion: manifest.manifestVersion,
      oddsVersion: manifest.oddsVersion,
    })
  }

  await db
    .update(guardianReportTable)
    .set({
      status: 'fulfilled',
      familySnapshot: initial.families,
      loveFamilyId: initial.families.love,
      cardSnapshot: initial.cards,
      fulfilledAt: new Date(),
    })
    .where(eq(guardianReportTable.id, input.reportId))

  return {
    status: 'fulfilled',
    reportPublicId: report.publicId,
    cards: initial.cards,
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

    const rows = await tx
      .insert(guardianRedrawGrantTable)
      .values({
        grantKey: `account-save:${input.collectionId}`,
        collectionId: input.collectionId,
        reportId: input.reportId,
        familyId: report.loveFamilyId,
        kind: 'account_save_reward',
        totalCredits: 1,
        manifestVersion: report.manifestVersion,
      })
      .onConflictDoNothing({ target: guardianRedrawGrantTable.grantKey })
      .returning({ id: guardianRedrawGrantTable.id })
    return rows.length === 1 ? 'granted' : 'already-granted'
  })
}

export type ConsumeGuardianRedrawResult =
  | {
      status: 'drawn'
      acquisitionPublicId: string
      card: GuardianSelectedCard
      duplicate: boolean
      guaranteeDue: boolean
      guaranteedUnowned: boolean
      remainingCreditsInGrant: number
      paidDrawsInCycle: number
      paidDrawsUntilGuarantee: number
    }
  | { status: 'report-not-found' | 'no-credit' | 'guarantee-version-conflict' }

export async function consumeGuardianRedraw(
  db: Db,
  input: {
    collectionId: number
    reportId: number
    creditKind: 'paid' | 'account_save_reward'
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
    if (report?.status !== 'fulfilled' || !report.loveFamilyId) {
      return { status: 'report-not-found' as const }
    }

    const [grant] = await tx
      .select({
        id: guardianRedrawGrantTable.id,
        purchaseId: guardianRedrawGrantTable.purchaseId,
        familyId: guardianRedrawGrantTable.familyId,
        kind: guardianRedrawGrantTable.kind,
        totalCredits: guardianRedrawGrantTable.totalCredits,
        consumedCredits: guardianRedrawGrantTable.consumedCredits,
        manifestVersion: guardianRedrawGrantTable.manifestVersion,
      })
      .from(guardianRedrawGrantTable)
      .where(
        and(
          eq(guardianRedrawGrantTable.collectionId, input.collectionId),
          eq(guardianRedrawGrantTable.reportId, input.reportId),
          eq(guardianRedrawGrantTable.familyId, report.loveFamilyId),
          eq(guardianRedrawGrantTable.kind, input.creditKind),
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

    const manifest = guardianManifest(grant.manifestVersion)
    const scopeId = report.loveFamilyId
    await tx
      .insert(guardianGuaranteeProgressTable)
      .values({
        collectionId: input.collectionId,
        scopeId,
        ruleVersion: manifest.guarantee.ruleVersion,
      })
      .onConflictDoNothing({
        target: [guardianGuaranteeProgressTable.collectionId, guardianGuaranteeProgressTable.scopeId],
      })

    const [progress] = await tx
      .select({
        ruleVersion: guardianGuaranteeProgressTable.ruleVersion,
        paidDrawsInCycle: guardianGuaranteeProgressTable.paidDrawsInCycle,
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
    if (progress.ruleVersion !== manifest.guarantee.ruleVersion) {
      return { status: 'guarantee-version-conflict' as const }
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
        paidDrawsInCycle: progress.paidDrawsInCycle,
        creditKind: input.creditKind,
      },
      { manifest },
    )
    const acquisitionPublicId = await recordGuardianAcquisition(tx, {
      collectionId: input.collectionId,
      reportId: input.reportId,
      grantId: grant.id,
      card: decision.card,
      source: input.creditKind === 'paid' ? 'paid_redraw' : 'account_save_reward',
      guaranteeDue: decision.guaranteeDue,
      guaranteedUnowned: decision.guaranteedUnowned,
      manifestVersion: manifest.manifestVersion,
      oddsVersion: manifest.oddsVersion,
    })

    await tx
      .update(guardianRedrawGrantTable)
      .set({ consumedCredits: sql`${guardianRedrawGrantTable.consumedCredits} + 1` })
      .where(eq(guardianRedrawGrantTable.id, grant.id))

    if (input.creditKind === 'paid') {
      await tx
        .update(guardianGuaranteeProgressTable)
        .set({ paidDrawsInCycle: decision.nextPaidDrawsInCycle })
        .where(
          and(
            eq(guardianGuaranteeProgressTable.collectionId, input.collectionId),
            eq(guardianGuaranteeProgressTable.scopeId, scopeId),
          ),
        )
    }

    const interval = manifest.guarantee.paidDrawInterval
    return {
      status: 'drawn' as const,
      acquisitionPublicId,
      card: decision.card,
      duplicate: ownedEditionIds.has(decision.card.editionId),
      guaranteeDue: decision.guaranteeDue,
      guaranteedUnowned: decision.guaranteedUnowned,
      remainingCreditsInGrant: grant.totalCredits - grant.consumedCredits - 1,
      paidDrawsInCycle: decision.nextPaidDrawsInCycle,
      paidDrawsUntilGuarantee: interval - decision.nextPaidDrawsInCycle,
    }
  })
}

export async function listGuardianOwnership(
  db: Db,
  collectionId: number,
): Promise<
  {
    familyId: string
    editionId: string
    rarity: GuardianRarity | null
    acquisitionCount: number
    firstAcquiredAt: Date
    lastAcquiredAt: Date
  }[]
> {
  return db
    .select({
      familyId: guardianCardOwnershipTable.familyId,
      editionId: guardianCardOwnershipTable.editionId,
      rarity: guardianCardOwnershipTable.rarity,
      acquisitionCount: guardianCardOwnershipTable.acquisitionCount,
      firstAcquiredAt: guardianCardOwnershipTable.firstAcquiredAt,
      lastAcquiredAt: guardianCardOwnershipTable.lastAcquiredAt,
    })
    .from(guardianCardOwnershipTable)
    .where(eq(guardianCardOwnershipTable.collectionId, collectionId))
    .orderBy(asc(guardianCardOwnershipTable.firstAcquiredAt), asc(guardianCardOwnershipTable.editionId))
}

type AcquisitionSource = 'initial_report' | 'paid_redraw' | 'account_save_reward'

async function recordGuardianAcquisition(
  db: Db,
  input: {
    collectionId: number
    reportId: number
    grantId: number | null
    card: GuardianSelectedCard
    source: AcquisitionSource
    guaranteeDue: boolean
    guaranteedUnowned: boolean
    manifestVersion: string
    oddsVersion: string
  },
): Promise<string> {
  const [owned] = await db
    .select({ editionId: guardianCardOwnershipTable.editionId })
    .from(guardianCardOwnershipTable)
    .where(
      and(
        eq(guardianCardOwnershipTable.collectionId, input.collectionId),
        eq(guardianCardOwnershipTable.editionId, input.card.editionId),
      ),
    )
    .limit(1)

  const publicId = newGuardianPublicId()
  const acquiredAt = new Date()
  await db.insert(guardianCardAcquisitionTable).values({
    publicId,
    collectionId: input.collectionId,
    reportId: input.reportId,
    grantId: input.grantId,
    slot: input.card.slot,
    familyId: input.card.familyId,
    editionId: input.card.editionId,
    rarity: input.card.rarity,
    source: input.source,
    duplicate: Boolean(owned),
    guaranteeDue: input.guaranteeDue,
    guaranteedUnowned: input.guaranteedUnowned,
    manifestVersion: input.manifestVersion,
    oddsVersion: input.oddsVersion,
    createdAt: acquiredAt,
  })
  await db
    .insert(guardianCardOwnershipTable)
    .values({
      collectionId: input.collectionId,
      editionId: input.card.editionId,
      familyId: input.card.familyId,
      rarity: input.card.rarity,
      firstAcquiredAt: acquiredAt,
      lastAcquiredAt: acquiredAt,
    })
    .onConflictDoUpdate({
      target: [guardianCardOwnershipTable.collectionId, guardianCardOwnershipTable.editionId],
      set: {
        acquisitionCount: sql`${guardianCardOwnershipTable.acquisitionCount} + 1`,
        lastAcquiredAt: acquiredAt,
      },
    })
  return publicId
}

async function stampGuardianEntitlementGranted(db: Db, purchaseId: number, at: Date): Promise<void> {
  await db
    .update(guardianPurchaseTable)
    .set({ entitlementGrantedAt: at })
    .where(eq(guardianPurchaseTable.id, purchaseId))
}
