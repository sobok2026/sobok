import type { Locale } from '@sobok/domain/locale'
import type { Db } from '@sobok/edge/db/client'
import { and, asc, desc, eq, gt, isNotNull, isNull, lt, lte, or } from 'drizzle-orm'

import {
  guardianCollectionTable,
  guardianPurchaseTable,
  guardianRecoveryEmailDeliveryTable,
  guardianReopenAccessTable,
  guardianReportTable,
} from '../schema/guardian'

const REOPEN_REQUEST_COOLDOWN_MS = 5 * 60 * 1000
const RECOVERY_EMAIL_MAX_ATTEMPTS = 5

export type ClaimedGuardianRecoveryEmail = {
  amount: number
  attempt: number
  currency: string
  locale: Locale
  orderName: string
  paidAt: Date
  paymentId: string
  purchaseId: number
  recoveryEmail: string
}

/** Oldest due delivery first; an expired lease is a crash-recovery candidate, not a second email intent. */
export function listDueGuardianRecoveryEmails(db: Db, now: Date, limit: number): Promise<{ paymentId: string }[]> {
  return db
    .select({ paymentId: guardianPurchaseTable.paymentId })
    .from(guardianRecoveryEmailDeliveryTable)
    .innerJoin(guardianPurchaseTable, eq(guardianPurchaseTable.id, guardianRecoveryEmailDeliveryTable.purchaseId))
    .where(
      or(
        and(
          eq(guardianRecoveryEmailDeliveryTable.status, 'pending'),
          lte(guardianRecoveryEmailDeliveryTable.nextAttemptAt, now),
        ),
        and(
          eq(guardianRecoveryEmailDeliveryTable.status, 'sending'),
          lt(guardianRecoveryEmailDeliveryTable.leaseExpiresAt, now),
        ),
      ),
    )
    .orderBy(asc(guardianRecoveryEmailDeliveryTable.nextAttemptAt))
    .limit(limit)
}

/**
 * Claims one durable delivery and issues the one-time token it will carry. Lock order stays
 * collection → report → purchase → delivery so payment settlement and email recovery cannot deadlock.
 */
export async function claimGuardianRecoveryEmail(
  db: Db,
  input: {
    paymentId: string
    tokenHash: string
    now: Date
    expiresAt: Date
    leaseExpiresAt: Date
  },
): Promise<ClaimedGuardianRecoveryEmail | null> {
  return db.transaction(async (tx) => {
    const [ref] = await tx
      .select({
        collectionId: guardianPurchaseTable.collectionId,
        purchaseId: guardianPurchaseTable.id,
        reportId: guardianPurchaseTable.reportId,
      })
      .from(guardianPurchaseTable)
      .where(eq(guardianPurchaseTable.paymentId, input.paymentId))
      .limit(1)

    if (!ref) {
      return null
    }

    const [collection] = await tx
      .select({ id: guardianCollectionTable.id })
      .from(guardianCollectionTable)
      .where(eq(guardianCollectionTable.id, ref.collectionId))
      .limit(1)
      .for('update')
    const [report] = await tx
      .select({
        id: guardianReportTable.id,
        locale: guardianReportTable.locale,
      })
      .from(guardianReportTable)
      .where(and(eq(guardianReportTable.id, ref.reportId), eq(guardianReportTable.collectionId, ref.collectionId)))
      .limit(1)
      .for('update')
    const [purchase] = await tx
      .select({
        amount: guardianPurchaseTable.amount,
        currency: guardianPurchaseTable.currency,
        id: guardianPurchaseTable.id,
        kind: guardianPurchaseTable.kind,
        orderName: guardianPurchaseTable.orderName,
        paidAt: guardianPurchaseTable.paidAt,
        paymentId: guardianPurchaseTable.paymentId,
        recoveryEmail: guardianPurchaseTable.recoveryEmail,
        status: guardianPurchaseTable.status,
        entitlementGrantedAt: guardianPurchaseTable.entitlementGrantedAt,
      })
      .from(guardianPurchaseTable)
      .where(eq(guardianPurchaseTable.id, ref.purchaseId))
      .limit(1)
      .for('update')
    const [delivery] = await tx
      .select({
        attempts: guardianRecoveryEmailDeliveryTable.attempts,
        leaseExpiresAt: guardianRecoveryEmailDeliveryTable.leaseExpiresAt,
        nextAttemptAt: guardianRecoveryEmailDeliveryTable.nextAttemptAt,
        status: guardianRecoveryEmailDeliveryTable.status,
      })
      .from(guardianRecoveryEmailDeliveryTable)
      .where(eq(guardianRecoveryEmailDeliveryTable.purchaseId, ref.purchaseId))
      .limit(1)
      .for('update')

    if (
      !collection ||
      !report ||
      !purchase ||
      !delivery ||
      purchase.kind !== 'full_report' ||
      purchase.status !== 'paid' ||
      !purchase.entitlementGrantedAt ||
      !purchase.paidAt ||
      !purchase.recoveryEmail
    ) {
      return null
    }

    const due =
      (delivery.status === 'pending' && delivery.nextAttemptAt <= input.now) ||
      (delivery.status === 'sending' && delivery.leaseExpiresAt !== null && delivery.leaseExpiresAt < input.now)
    if (!due) {
      return null
    }

    const attempt = delivery.attempts + 1
    if (attempt > RECOVERY_EMAIL_MAX_ATTEMPTS) {
      await tx
        .update(guardianRecoveryEmailDeliveryTable)
        .set({ status: 'failed', leaseExpiresAt: null, lastErrorCode: 'attempts_exhausted' })
        .where(eq(guardianRecoveryEmailDeliveryTable.purchaseId, purchase.id))
      return null
    }

    await tx
      .update(guardianRecoveryEmailDeliveryTable)
      .set({
        status: 'sending',
        attempts: attempt,
        leaseExpiresAt: input.leaseExpiresAt,
        lastErrorCode: null,
      })
      .where(eq(guardianRecoveryEmailDeliveryTable.purchaseId, purchase.id))
    await tx.insert(guardianReopenAccessTable).values({
      purchaseId: purchase.id,
      source: 'purchase',
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    })

    return {
      amount: purchase.amount,
      attempt,
      currency: purchase.currency,
      locale: report.locale,
      orderName: purchase.orderName,
      paidAt: purchase.paidAt,
      paymentId: purchase.paymentId,
      purchaseId: purchase.id,
      recoveryEmail: purchase.recoveryEmail,
    }
  })
}

export async function markGuardianRecoveryEmailSent(
  db: Db,
  input: { purchaseId: number; attempt: number; sentAt: Date; providerMessageId: string | null },
): Promise<void> {
  await db
    .update(guardianRecoveryEmailDeliveryTable)
    .set({
      status: 'sent',
      leaseExpiresAt: null,
      sentAt: input.sentAt,
      providerMessageId: input.providerMessageId,
      lastErrorCode: null,
    })
    .where(
      and(
        eq(guardianRecoveryEmailDeliveryTable.purchaseId, input.purchaseId),
        eq(guardianRecoveryEmailDeliveryTable.status, 'sending'),
        eq(guardianRecoveryEmailDeliveryTable.attempts, input.attempt),
      ),
    )
}

export async function rescheduleGuardianRecoveryEmail(
  db: Db,
  input: { purchaseId: number; attempt: number; nextAttemptAt: Date; errorCode: string },
): Promise<void> {
  await db
    .update(guardianRecoveryEmailDeliveryTable)
    .set({
      status: input.attempt >= RECOVERY_EMAIL_MAX_ATTEMPTS ? 'failed' : 'pending',
      leaseExpiresAt: null,
      nextAttemptAt: input.nextAttemptAt,
      lastErrorCode: input.errorCode.slice(0, 64),
    })
    .where(
      and(
        eq(guardianRecoveryEmailDeliveryTable.purchaseId, input.purchaseId),
        eq(guardianRecoveryEmailDeliveryTable.status, 'sending'),
        eq(guardianRecoveryEmailDeliveryTable.attempts, input.attempt),
      ),
    )
}

export type GuardianReopenCandidate = {
  locale: Locale
  paidAt: Date
  purchaseId: number
}

export async function listGuardianReopenCandidates(
  db: Db,
  recoveryEmailNormalized: string,
  now: Date,
): Promise<GuardianReopenCandidate[]> {
  const cooldownCutoff = new Date(now.getTime() - REOPEN_REQUEST_COOLDOWN_MS)
  const [recent] = await db
    .select({ id: guardianReopenAccessTable.id })
    .from(guardianReopenAccessTable)
    .innerJoin(guardianPurchaseTable, eq(guardianPurchaseTable.id, guardianReopenAccessTable.purchaseId))
    .where(
      and(
        eq(guardianPurchaseTable.recoveryEmailNormalized, recoveryEmailNormalized),
        eq(guardianReopenAccessTable.source, 'request'),
        gt(guardianReopenAccessTable.createdAt, cooldownCutoff),
      ),
    )
    .limit(1)

  if (recent) {
    return []
  }

  return db
    .select({
      locale: guardianReportTable.locale,
      paidAt: guardianPurchaseTable.paidAt,
      purchaseId: guardianPurchaseTable.id,
    })
    .from(guardianPurchaseTable)
    .innerJoin(guardianReportTable, eq(guardianReportTable.id, guardianPurchaseTable.reportId))
    .where(
      and(
        eq(guardianPurchaseTable.recoveryEmailNormalized, recoveryEmailNormalized),
        eq(guardianPurchaseTable.kind, 'full_report'),
        eq(guardianPurchaseTable.status, 'paid'),
        isNotNull(guardianPurchaseTable.entitlementGrantedAt),
        isNotNull(guardianPurchaseTable.paidAt),
      ),
    )
    .orderBy(desc(guardianPurchaseTable.paidAt))
    .limit(5) as Promise<GuardianReopenCandidate[]>
}

export async function insertGuardianReopenLinks(
  db: Db,
  links: { purchaseId: number; tokenHash: string; expiresAt: Date }[],
): Promise<void> {
  if (links.length === 0) {
    return
  }
  await db.insert(guardianReopenAccessTable).values(links.map((link) => ({ ...link, source: 'request' as const })))
}

export type ExchangedGuardianReopenAccess = {
  collectionPublicId: string
  locale: Locale
  paymentId: string
  recoveryEmail: string
  reportPublicId: string
  reportStatus: 'draft' | 'fulfilled'
}

export async function exchangeGuardianReopenAccess(
  db: Db,
  input: { tokenHash: string; newAccessTokenHash: string; now: Date },
): Promise<ExchangedGuardianReopenAccess | null> {
  return db.transaction(async (tx) => {
    const [ref] = await tx
      .select({
        collectionId: guardianPurchaseTable.collectionId,
        linkId: guardianReopenAccessTable.id,
        purchaseId: guardianPurchaseTable.id,
        reportId: guardianPurchaseTable.reportId,
      })
      .from(guardianReopenAccessTable)
      .innerJoin(guardianPurchaseTable, eq(guardianPurchaseTable.id, guardianReopenAccessTable.purchaseId))
      .where(
        and(
          eq(guardianReopenAccessTable.tokenHash, input.tokenHash),
          isNull(guardianReopenAccessTable.consumedAt),
          gt(guardianReopenAccessTable.expiresAt, input.now),
        ),
      )
      .limit(1)

    if (!ref) {
      return null
    }

    const [collection] = await tx
      .select({
        accessTokenHash: guardianCollectionTable.accessTokenHash,
        id: guardianCollectionTable.id,
        publicId: guardianCollectionTable.publicId,
      })
      .from(guardianCollectionTable)
      .where(eq(guardianCollectionTable.id, ref.collectionId))
      .limit(1)
      .for('update')
    const [report] = await tx
      .select({
        id: guardianReportTable.id,
        locale: guardianReportTable.locale,
        publicId: guardianReportTable.publicId,
        status: guardianReportTable.status,
      })
      .from(guardianReportTable)
      .where(and(eq(guardianReportTable.id, ref.reportId), eq(guardianReportTable.collectionId, ref.collectionId)))
      .limit(1)
      .for('update')
    const [purchase] = await tx
      .select({
        entitlementGrantedAt: guardianPurchaseTable.entitlementGrantedAt,
        id: guardianPurchaseTable.id,
        kind: guardianPurchaseTable.kind,
        paymentId: guardianPurchaseTable.paymentId,
        recoveryEmail: guardianPurchaseTable.recoveryEmail,
        status: guardianPurchaseTable.status,
      })
      .from(guardianPurchaseTable)
      .where(eq(guardianPurchaseTable.id, ref.purchaseId))
      .limit(1)
      .for('update')
    const [link] = await tx
      .select({ id: guardianReopenAccessTable.id })
      .from(guardianReopenAccessTable)
      .where(
        and(
          eq(guardianReopenAccessTable.id, ref.linkId),
          isNull(guardianReopenAccessTable.consumedAt),
          gt(guardianReopenAccessTable.expiresAt, input.now),
        ),
      )
      .limit(1)
      .for('update')

    if (
      !collection?.accessTokenHash ||
      !report ||
      !purchase ||
      !link ||
      purchase.kind !== 'full_report' ||
      purchase.status !== 'paid' ||
      !purchase.entitlementGrantedAt ||
      !purchase.recoveryEmail
    ) {
      return null
    }

    const consumed = await tx
      .update(guardianReopenAccessTable)
      .set({ consumedAt: input.now })
      .where(
        and(
          eq(guardianReopenAccessTable.id, link.id),
          isNull(guardianReopenAccessTable.consumedAt),
          gt(guardianReopenAccessTable.expiresAt, input.now),
        ),
      )
      .returning({ id: guardianReopenAccessTable.id })
    if (consumed.length === 0) {
      return null
    }

    await tx
      .update(guardianCollectionTable)
      .set({ accessTokenHash: input.newAccessTokenHash })
      .where(eq(guardianCollectionTable.id, collection.id))

    return {
      collectionPublicId: collection.publicId,
      locale: report.locale,
      paymentId: purchase.paymentId,
      recoveryEmail: purchase.recoveryEmail,
      reportPublicId: report.publicId,
      reportStatus: report.status,
    }
  })
}

export async function purgeExpiredGuardianReopenLinks(db: Db, now: Date): Promise<number> {
  const rows = await db
    .delete(guardianReopenAccessTable)
    .where(or(lt(guardianReopenAccessTable.expiresAt, now), isNotNull(guardianReopenAccessTable.consumedAt)))
    .returning({ id: guardianReopenAccessTable.id })
  return rows.length
}
