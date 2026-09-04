import type { Locale } from '@sobok/domain/locale'
import type { Db } from '@sobok/edge/db/client'
import { and, asc, desc, eq, gt, isNotNull, isNull, lt, lte, or } from 'drizzle-orm'
import {
  guardianDailyCollectionTable,
  guardianPassPurchaseTable,
  guardianPassRecoveryEmailDeliveryTable,
  guardianPassReopenAccessTable,
} from '../schema/guardian'

const REOPEN_REQUEST_COOLDOWN_MS = 5 * 60 * 1000
const RECOVERY_EMAIL_MAX_ATTEMPTS = 5
const ARCHIVE_RETENTION_MS = 365 * 24 * 60 * 60 * 1000

export type ClaimedGuardianRecoveryEmail = {
  amount: number
  attempt: number
  currency: string
  locale: Locale
  timeZone: string
  orderName: string
  paidAt: Date
  accessExpiresAt: Date
  paymentId: string
  purchaseId: number
  recoveryEmail: string
}

export function listDueGuardianRecoveryEmails(db: Db, now: Date, limit: number): Promise<{ paymentId: string }[]> {
  return db
    .select({ paymentId: guardianPassPurchaseTable.paymentId })
    .from(guardianPassRecoveryEmailDeliveryTable)
    .innerJoin(
      guardianPassPurchaseTable,
      eq(guardianPassPurchaseTable.id, guardianPassRecoveryEmailDeliveryTable.purchaseId),
    )
    .where(
      or(
        and(
          eq(guardianPassRecoveryEmailDeliveryTable.status, 'pending'),
          lte(guardianPassRecoveryEmailDeliveryTable.nextAttemptAt, now),
        ),
        and(
          eq(guardianPassRecoveryEmailDeliveryTable.status, 'sending'),
          lt(guardianPassRecoveryEmailDeliveryTable.leaseExpiresAt, now),
        ),
      ),
    )
    .orderBy(asc(guardianPassRecoveryEmailDeliveryTable.nextAttemptAt))
    .limit(limit)
}

export async function claimGuardianRecoveryEmail(
  db: Db,
  input: { paymentId: string; tokenHash: string; now: Date; expiresAt: Date; leaseExpiresAt: Date },
): Promise<ClaimedGuardianRecoveryEmail | null> {
  return db.transaction(async (tx) => {
    const [ref] = await tx
      .select({ id: guardianPassPurchaseTable.id, collectionId: guardianPassPurchaseTable.collectionId })
      .from(guardianPassPurchaseTable)
      .where(eq(guardianPassPurchaseTable.paymentId, input.paymentId))
      .limit(1)
    if (!ref) return null

    const [collection] = await tx
      .select({ id: guardianDailyCollectionTable.id })
      .from(guardianDailyCollectionTable)
      .where(eq(guardianDailyCollectionTable.id, ref.collectionId))
      .limit(1)
      .for('update')
    if (!collection) return null

    const [purchase] = await tx
      .select({
        id: guardianPassPurchaseTable.id,
        amount: guardianPassPurchaseTable.amount,
        currency: guardianPassPurchaseTable.currency,
        locale: guardianPassPurchaseTable.locale,
        timeZone: guardianPassPurchaseTable.timeZone,
        orderName: guardianPassPurchaseTable.orderName,
        paidAt: guardianPassPurchaseTable.paidAt,
        accessExpiresAt: guardianPassPurchaseTable.entitlementExpiresAt,
        paymentId: guardianPassPurchaseTable.paymentId,
        recoveryEmail: guardianPassPurchaseTable.recoveryEmail,
        status: guardianPassPurchaseTable.status,
      })
      .from(guardianPassPurchaseTable)
      .where(eq(guardianPassPurchaseTable.id, ref.id))
      .limit(1)
      .for('update')
    if (!purchase) return null

    const [delivery] = await tx
      .select({
        attempts: guardianPassRecoveryEmailDeliveryTable.attempts,
        leaseExpiresAt: guardianPassRecoveryEmailDeliveryTable.leaseExpiresAt,
        nextAttemptAt: guardianPassRecoveryEmailDeliveryTable.nextAttemptAt,
        status: guardianPassRecoveryEmailDeliveryTable.status,
      })
      .from(guardianPassRecoveryEmailDeliveryTable)
      .where(eq(guardianPassRecoveryEmailDeliveryTable.purchaseId, purchase.id))
      .limit(1)
      .for('update')

    if (!delivery || purchase.status !== 'paid' || !purchase.paidAt || !purchase.accessExpiresAt) {
      return null
    }
    const due =
      (delivery.status === 'pending' && delivery.nextAttemptAt <= input.now) ||
      (delivery.status === 'sending' && delivery.leaseExpiresAt !== null && delivery.leaseExpiresAt < input.now)
    if (!due) return null

    const attempt = delivery.attempts + 1
    if (attempt > RECOVERY_EMAIL_MAX_ATTEMPTS) {
      await tx
        .update(guardianPassRecoveryEmailDeliveryTable)
        .set({ status: 'failed', leaseExpiresAt: null, lastErrorCode: 'attempts_exhausted' })
        .where(eq(guardianPassRecoveryEmailDeliveryTable.purchaseId, purchase.id))
      return null
    }

    await tx
      .update(guardianPassRecoveryEmailDeliveryTable)
      .set({ status: 'sending', attempts: attempt, leaseExpiresAt: input.leaseExpiresAt, lastErrorCode: null })
      .where(eq(guardianPassRecoveryEmailDeliveryTable.purchaseId, purchase.id))
    await tx.insert(guardianPassReopenAccessTable).values({
      purchaseId: purchase.id,
      source: 'purchase',
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    })

    return {
      amount: purchase.amount,
      attempt,
      currency: purchase.currency,
      locale: purchase.locale,
      timeZone: purchase.timeZone,
      orderName: purchase.orderName,
      paidAt: purchase.paidAt,
      accessExpiresAt: purchase.accessExpiresAt,
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
    .update(guardianPassRecoveryEmailDeliveryTable)
    .set({
      status: 'sent',
      leaseExpiresAt: null,
      sentAt: input.sentAt,
      providerMessageId: input.providerMessageId,
      lastErrorCode: null,
    })
    .where(
      and(
        eq(guardianPassRecoveryEmailDeliveryTable.purchaseId, input.purchaseId),
        eq(guardianPassRecoveryEmailDeliveryTable.status, 'sending'),
        eq(guardianPassRecoveryEmailDeliveryTable.attempts, input.attempt),
      ),
    )
}

export async function rescheduleGuardianRecoveryEmail(
  db: Db,
  input: { purchaseId: number; attempt: number; nextAttemptAt: Date; errorCode: string },
): Promise<void> {
  await db
    .update(guardianPassRecoveryEmailDeliveryTable)
    .set({
      status: input.attempt >= RECOVERY_EMAIL_MAX_ATTEMPTS ? 'failed' : 'pending',
      leaseExpiresAt: null,
      nextAttemptAt: input.nextAttemptAt,
      lastErrorCode: input.errorCode.slice(0, 64),
    })
    .where(
      and(
        eq(guardianPassRecoveryEmailDeliveryTable.purchaseId, input.purchaseId),
        eq(guardianPassRecoveryEmailDeliveryTable.status, 'sending'),
        eq(guardianPassRecoveryEmailDeliveryTable.attempts, input.attempt),
      ),
    )
}

export type GuardianReopenCandidate = { locale: Locale; paidAt: Date; purchaseId: number; timeZone: string }

export async function listGuardianReopenCandidates(
  db: Db,
  recoveryEmailNormalized: string,
  now: Date,
): Promise<GuardianReopenCandidate[]> {
  const cooldownCutoff = new Date(now.getTime() - REOPEN_REQUEST_COOLDOWN_MS)
  const [recent] = await db
    .select({ id: guardianPassReopenAccessTable.id })
    .from(guardianPassReopenAccessTable)
    .innerJoin(guardianPassPurchaseTable, eq(guardianPassPurchaseTable.id, guardianPassReopenAccessTable.purchaseId))
    .where(
      and(
        eq(guardianPassPurchaseTable.recoveryEmailNormalized, recoveryEmailNormalized),
        eq(guardianPassReopenAccessTable.source, 'request'),
        gt(guardianPassReopenAccessTable.createdAt, cooldownCutoff),
      ),
    )
    .limit(1)
  if (recent) return []

  return db
    .select({
      locale: guardianPassPurchaseTable.locale,
      paidAt: guardianPassPurchaseTable.paidAt,
      purchaseId: guardianPassPurchaseTable.id,
      timeZone: guardianPassPurchaseTable.timeZone,
    })
    .from(guardianPassPurchaseTable)
    .where(
      and(
        eq(guardianPassPurchaseTable.recoveryEmailNormalized, recoveryEmailNormalized),
        eq(guardianPassPurchaseTable.status, 'paid'),
        isNotNull(guardianPassPurchaseTable.paidAt),
        gt(guardianPassPurchaseTable.paidAt, new Date(now.getTime() - ARCHIVE_RETENTION_MS)),
      ),
    )
    .orderBy(desc(guardianPassPurchaseTable.paidAt))
    .limit(5) as Promise<GuardianReopenCandidate[]>
}

export async function insertGuardianReopenLinks(
  db: Db,
  links: { purchaseId: number; tokenHash: string; expiresAt: Date }[],
): Promise<void> {
  if (links.length === 0) return
  await db.insert(guardianPassReopenAccessTable).values(links.map((link) => ({ ...link, source: 'request' as const })))
}

export type ExchangedGuardianReopenAccess =
  | {
      status: 'guest'
      collectionPublicId: string
      locale: Locale
      paymentId: string
      accessExpiresAt: Date
    }
  | { status: 'account'; locale: Locale }

export async function exchangeGuardianReopenAccess(
  db: Db,
  input: { tokenHash: string; newAccessTokenHash: string; now: Date },
): Promise<ExchangedGuardianReopenAccess | null> {
  return db.transaction(async (tx) => {
    const [ref] = await tx
      .select({
        linkId: guardianPassReopenAccessTable.id,
        collectionId: guardianPassPurchaseTable.collectionId,
        purchaseId: guardianPassPurchaseTable.id,
      })
      .from(guardianPassReopenAccessTable)
      .innerJoin(guardianPassPurchaseTable, eq(guardianPassPurchaseTable.id, guardianPassReopenAccessTable.purchaseId))
      .where(
        and(
          eq(guardianPassReopenAccessTable.tokenHash, input.tokenHash),
          isNull(guardianPassReopenAccessTable.consumedAt),
          gt(guardianPassReopenAccessTable.expiresAt, input.now),
        ),
      )
      .limit(1)
    if (!ref) return null

    const [collection] = await tx
      .select({
        id: guardianDailyCollectionTable.id,
        publicId: guardianDailyCollectionTable.publicId,
        accessTokenHash: guardianDailyCollectionTable.accessTokenHash,
        ownerUserId: guardianDailyCollectionTable.ownerUserId,
      })
      .from(guardianDailyCollectionTable)
      .where(eq(guardianDailyCollectionTable.id, ref.collectionId))
      .limit(1)
      .for('update')
    const [purchase] = await tx
      .select({
        id: guardianPassPurchaseTable.id,
        locale: guardianPassPurchaseTable.locale,
        paymentId: guardianPassPurchaseTable.paymentId,
        accessExpiresAt: guardianPassPurchaseTable.entitlementExpiresAt,
        status: guardianPassPurchaseTable.status,
      })
      .from(guardianPassPurchaseTable)
      .where(eq(guardianPassPurchaseTable.id, ref.purchaseId))
      .limit(1)
      .for('update')
    const [link] = await tx
      .select({ id: guardianPassReopenAccessTable.id })
      .from(guardianPassReopenAccessTable)
      .where(
        and(
          eq(guardianPassReopenAccessTable.id, ref.linkId),
          isNull(guardianPassReopenAccessTable.consumedAt),
          gt(guardianPassReopenAccessTable.expiresAt, input.now),
        ),
      )
      .limit(1)
      .for('update')
    if (!collection || !purchase || !link || purchase.status !== 'paid' || !purchase.accessExpiresAt) return null

    const consumed = await tx
      .update(guardianPassReopenAccessTable)
      .set({ consumedAt: input.now })
      .where(
        and(
          eq(guardianPassReopenAccessTable.id, link.id),
          isNull(guardianPassReopenAccessTable.consumedAt),
          gt(guardianPassReopenAccessTable.expiresAt, input.now),
        ),
      )
      .returning({ id: guardianPassReopenAccessTable.id })
    if (consumed.length === 0) return null

    if (collection.ownerUserId) return { status: 'account' as const, locale: purchase.locale }
    if (!collection.accessTokenHash) return null

    await tx
      .update(guardianDailyCollectionTable)
      .set({ accessTokenHash: input.newAccessTokenHash })
      .where(eq(guardianDailyCollectionTable.id, collection.id))

    return {
      status: 'guest' as const,
      collectionPublicId: collection.publicId,
      locale: purchase.locale,
      paymentId: purchase.paymentId,
      accessExpiresAt: purchase.accessExpiresAt,
    }
  })
}

export async function purgeExpiredGuardianReopenLinks(db: Db, now: Date): Promise<number> {
  const rows = await db
    .delete(guardianPassReopenAccessTable)
    .where(or(lt(guardianPassReopenAccessTable.expiresAt, now), isNotNull(guardianPassReopenAccessTable.consumedAt)))
    .returning({ id: guardianPassReopenAccessTable.id })
  return rows.length
}
