import type { Locale } from '@sobok/domain/locale'
import type { Db } from '@sobok/edge/db/client'
import { and, asc, desc, eq, gt, inArray, isNotNull, lt, lte, or, sql } from 'drizzle-orm'
import type { GuardianDailyCardSnapshot } from '../../guardian/daily-contract'
import {
  GUARDIAN_CURRENCY,
  GUARDIAN_MARKET,
  GUARDIAN_PASS_DURATION_MS,
  GUARDIAN_PASS_NAME,
  GUARDIAN_PASS_PRICE,
  GUARDIAN_PASS_PRIVACY_VERSION,
  GUARDIAN_PASS_REFUND_VERSION,
  GUARDIAN_PASS_SKU,
  GUARDIAN_PASS_TERMS_VERSION,
} from '../../guardian/offer'
import {
  guardianDailyCardTable,
  guardianDailyCollectionTable,
  guardianPassPurchaseTable,
  guardianPassRecoveryEmailDeliveryTable,
} from '../schema/guardian'

type PurchaseStatus = (typeof guardianPassPurchaseTable.$inferSelect)['status']

export type GuardianCollectionAccess = {
  id: number
  publicId: string
  seedHash: string
  ownerUserId: string | null
}

export type GuardianPassCheckoutRef = {
  collectionId: number
  collectionPublicId: string
  paymentId: string
  sku: typeof GUARDIAN_PASS_SKU
  orderName: string
  amount: number
  market: typeof GUARDIAN_MARKET
  currency: typeof GUARDIAN_CURRENCY
  purchaseStatus: 'pending' | 'paid'
  accessExpiresAt: Date | null
}

export type PrepareGuardianPassCheckoutResult =
  | ({ status: 'ready'; collectionCreated: boolean } & GuardianPassCheckoutRef)
  | { status: 'pass-active'; accessExpiresAt: Date }
  | { status: 'checkout-conflict' }

export async function prepareGuardianPassCheckout(
  db: Db,
  input: {
    accessTokenHash?: string
    ownerUserId?: string
    newCollectionPublicId: string
    newCollectionAccessTokenHash: string
    viewerSeedHash: string
    checkoutRequestId: string
    paymentId: string
    locale: Locale
    timeZone: string
    recoveryEmail: string
    recoveryEmailNormalized: string
    now: Date
  },
): Promise<PrepareGuardianPassCheckoutResult> {
  return db.transaction(async (tx) => {
    let collection = await resolveGuardianCollectionAccess(tx, {
      accessTokenHash: input.accessTokenHash,
      ownerUserId: input.ownerUserId,
    })
    let collectionCreated = false

    if (!collection) {
      const [created] = await tx
        .insert(guardianDailyCollectionTable)
        .values({
          publicId: input.newCollectionPublicId,
          accessTokenHash: input.ownerUserId ? null : input.newCollectionAccessTokenHash,
          ownerUserId: input.ownerUserId,
          seedHash: input.viewerSeedHash,
        })
        .returning({
          id: guardianDailyCollectionTable.id,
          publicId: guardianDailyCollectionTable.publicId,
          seedHash: guardianDailyCollectionTable.seedHash,
          ownerUserId: guardianDailyCollectionTable.ownerUserId,
        })
      if (!created) throw new Error('Guardian daily collection insert returned no row')
      collection = created
      collectionCreated = true
    }

    const [lockedCollection] = await tx
      .select({ id: guardianDailyCollectionTable.id })
      .from(guardianDailyCollectionTable)
      .where(eq(guardianDailyCollectionTable.id, collection.id))
      .limit(1)
      .for('update')
    if (!lockedCollection) return { status: 'checkout-conflict' as const }

    const [existing] = await tx
      .select({
        paymentId: guardianPassPurchaseTable.paymentId,
        sku: guardianPassPurchaseTable.sku,
        orderName: guardianPassPurchaseTable.orderName,
        amount: guardianPassPurchaseTable.amount,
        market: guardianPassPurchaseTable.market,
        currency: guardianPassPurchaseTable.currency,
        status: guardianPassPurchaseTable.status,
        accessExpiresAt: guardianPassPurchaseTable.entitlementExpiresAt,
      })
      .from(guardianPassPurchaseTable)
      .where(
        and(
          eq(guardianPassPurchaseTable.collectionId, collection.id),
          eq(guardianPassPurchaseTable.checkoutRequestId, input.checkoutRequestId),
        ),
      )
      .limit(1)
      .for('update')

    if (existing) {
      if (existing.status !== 'pending' && existing.status !== 'paid') {
        return { status: 'checkout-conflict' as const }
      }
      if (
        existing.sku !== GUARDIAN_PASS_SKU ||
        existing.amount !== GUARDIAN_PASS_PRICE ||
        existing.market !== GUARDIAN_MARKET ||
        existing.currency !== GUARDIAN_CURRENCY
      ) {
        return { status: 'checkout-conflict' as const }
      }
      if (existing.status === 'pending') {
        const [active] = await tx
          .select({ expiresAt: guardianPassPurchaseTable.entitlementExpiresAt })
          .from(guardianPassPurchaseTable)
          .where(
            and(
              eq(guardianPassPurchaseTable.collectionId, collection.id),
              eq(guardianPassPurchaseTable.status, 'paid'),
              gt(guardianPassPurchaseTable.entitlementExpiresAt, input.now),
            ),
          )
          .orderBy(desc(guardianPassPurchaseTable.entitlementExpiresAt))
          .limit(1)
          .for('update')
        if (active?.expiresAt) return { status: 'pass-active' as const, accessExpiresAt: active.expiresAt }

        await tx
          .update(guardianPassPurchaseTable)
          .set({
            recoveryEmail: input.recoveryEmail,
            recoveryEmailNormalized: input.recoveryEmailNormalized,
            termsVersion: GUARDIAN_PASS_TERMS_VERSION,
            privacyVersion: GUARDIAN_PASS_PRIVACY_VERSION,
            refundVersion: GUARDIAN_PASS_REFUND_VERSION,
            consentedAt: input.now,
          })
          .where(eq(guardianPassPurchaseTable.paymentId, existing.paymentId))
      }
      return {
        status: 'ready' as const,
        collectionCreated,
        collectionId: collection.id,
        collectionPublicId: collection.publicId,
        paymentId: existing.paymentId,
        sku: GUARDIAN_PASS_SKU,
        orderName: existing.orderName,
        amount: existing.amount,
        market: GUARDIAN_MARKET,
        currency: GUARDIAN_CURRENCY,
        purchaseStatus: existing.status,
        accessExpiresAt: existing.accessExpiresAt,
      }
    }

    const [active] = await tx
      .select({ expiresAt: guardianPassPurchaseTable.entitlementExpiresAt })
      .from(guardianPassPurchaseTable)
      .where(
        and(
          eq(guardianPassPurchaseTable.collectionId, collection.id),
          eq(guardianPassPurchaseTable.status, 'paid'),
          gt(guardianPassPurchaseTable.entitlementExpiresAt, input.now),
        ),
      )
      .orderBy(desc(guardianPassPurchaseTable.entitlementExpiresAt))
      .limit(1)
      .for('update')
    if (active?.expiresAt) return { status: 'pass-active' as const, accessExpiresAt: active.expiresAt }

    await tx.insert(guardianPassPurchaseTable).values({
      paymentId: input.paymentId,
      checkoutRequestId: input.checkoutRequestId,
      collectionId: collection.id,
      locale: input.locale,
      timeZone: input.timeZone,
      sku: GUARDIAN_PASS_SKU,
      orderName: GUARDIAN_PASS_NAME.ko,
      amount: GUARDIAN_PASS_PRICE,
      market: GUARDIAN_MARKET,
      currency: GUARDIAN_CURRENCY,
      recoveryEmail: input.recoveryEmail,
      recoveryEmailNormalized: input.recoveryEmailNormalized,
      termsVersion: GUARDIAN_PASS_TERMS_VERSION,
      privacyVersion: GUARDIAN_PASS_PRIVACY_VERSION,
      refundVersion: GUARDIAN_PASS_REFUND_VERSION,
      consentedAt: input.now,
    })

    return {
      status: 'ready' as const,
      collectionCreated,
      collectionId: collection.id,
      collectionPublicId: collection.publicId,
      paymentId: input.paymentId,
      sku: GUARDIAN_PASS_SKU,
      orderName: GUARDIAN_PASS_NAME.ko,
      amount: GUARDIAN_PASS_PRICE,
      market: GUARDIAN_MARKET,
      currency: GUARDIAN_CURRENCY,
      purchaseStatus: 'pending' as const,
      accessExpiresAt: null,
    }
  })
}

export async function resolveGuardianCollectionAccess(
  db: Db,
  input: { accessTokenHash?: string; ownerUserId?: string },
): Promise<GuardianCollectionAccess | null> {
  const selection = {
    id: guardianDailyCollectionTable.id,
    publicId: guardianDailyCollectionTable.publicId,
    seedHash: guardianDailyCollectionTable.seedHash,
    ownerUserId: guardianDailyCollectionTable.ownerUserId,
  }

  if (input.accessTokenHash) {
    const [capabilityCollection] = await db
      .select(selection)
      .from(guardianDailyCollectionTable)
      .where(eq(guardianDailyCollectionTable.accessTokenHash, input.accessTokenHash))
      .limit(1)
    if (capabilityCollection) return capabilityCollection
  }
  if (!input.ownerUserId) return null

  const [ownedCollection] = await db
    .select(selection)
    .from(guardianDailyCollectionTable)
    .where(eq(guardianDailyCollectionTable.ownerUserId, input.ownerUserId))
    .orderBy(
      desc(sql`(
        select max(${guardianPassPurchaseTable.entitlementExpiresAt})
        from ${guardianPassPurchaseTable}
        where ${guardianPassPurchaseTable.collectionId} = ${guardianDailyCollectionTable.id}
          and ${guardianPassPurchaseTable.status} = 'paid'
      )`),
      desc(guardianDailyCollectionTable.updatedAt),
      desc(guardianDailyCollectionTable.id),
    )
    .limit(1)
  return ownedCollection ?? null
}

export type GuardianPurchaseAccess = {
  collectionId: number
  collectionPublicId: string
  purchaseStatus: PurchaseStatus
  accessExpiresAt: Date | null
}

export async function resolveGuardianPurchaseAccess(
  db: Db,
  input: { accessTokenHash?: string; ownerUserId?: string; paymentId: string },
): Promise<GuardianPurchaseAccess | null> {
  const proofs = [
    ...(input.ownerUserId ? [eq(guardianDailyCollectionTable.ownerUserId, input.ownerUserId)] : []),
    ...(input.accessTokenHash ? [eq(guardianDailyCollectionTable.accessTokenHash, input.accessTokenHash)] : []),
  ]
  const owner = proofs.length === 1 ? proofs[0] : or(...proofs)
  if (!owner) return null

  const [row] = await db
    .select({
      collectionId: guardianDailyCollectionTable.id,
      collectionPublicId: guardianDailyCollectionTable.publicId,
      purchaseStatus: guardianPassPurchaseTable.status,
      accessExpiresAt: guardianPassPurchaseTable.entitlementExpiresAt,
    })
    .from(guardianDailyCollectionTable)
    .innerJoin(guardianPassPurchaseTable, eq(guardianPassPurchaseTable.collectionId, guardianDailyCollectionTable.id))
    .where(and(owner, eq(guardianPassPurchaseTable.paymentId, input.paymentId)))
    .limit(1)
  return row ?? null
}

export async function guardianPurchaseExists(db: Db, paymentId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: guardianPassPurchaseTable.id })
    .from(guardianPassPurchaseTable)
    .where(eq(guardianPassPurchaseTable.paymentId, paymentId))
    .limit(1)
  return Boolean(row)
}

export async function findActiveGuardianPass(
  db: Db,
  collectionId: number,
  now: Date,
): Promise<{ purchaseId: number; expiresAt: Date } | null> {
  const [row] = await db
    .select({ purchaseId: guardianPassPurchaseTable.id, expiresAt: guardianPassPurchaseTable.entitlementExpiresAt })
    .from(guardianPassPurchaseTable)
    .where(
      and(
        eq(guardianPassPurchaseTable.collectionId, collectionId),
        eq(guardianPassPurchaseTable.status, 'paid'),
        lte(guardianPassPurchaseTable.entitlementStartsAt, now),
        gt(guardianPassPurchaseTable.entitlementExpiresAt, now),
      ),
    )
    .orderBy(desc(guardianPassPurchaseTable.entitlementExpiresAt))
    .limit(1)
  if (!row?.expiresAt) return null
  return { purchaseId: row.purchaseId, expiresAt: row.expiresAt }
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
  | { status: 'granted' | 'already-granted'; accessExpiresAt: Date; collectionPublicId: string }
  | { status: 'purchase-not-found' | 'payment-mismatch' | 'purchase-state-conflict' }

export async function confirmGuardianPurchase(
  db: Db,
  payment: VerifiedGuardianPayment,
): Promise<ConfirmGuardianPurchaseResult> {
  return db.transaction(async (tx) => {
    const [ref] = await tx
      .select({ id: guardianPassPurchaseTable.id, collectionId: guardianPassPurchaseTable.collectionId })
      .from(guardianPassPurchaseTable)
      .where(eq(guardianPassPurchaseTable.paymentId, payment.paymentId))
      .limit(1)
    if (!ref) return { status: 'purchase-not-found' as const }

    const [collection] = await tx
      .select({ id: guardianDailyCollectionTable.id, publicId: guardianDailyCollectionTable.publicId })
      .from(guardianDailyCollectionTable)
      .where(eq(guardianDailyCollectionTable.id, ref.collectionId))
      .limit(1)
      .for('update')
    if (!collection) return { status: 'purchase-state-conflict' as const }

    const [purchase] = await tx
      .select({
        id: guardianPassPurchaseTable.id,
        status: guardianPassPurchaseTable.status,
        sku: guardianPassPurchaseTable.sku,
        amount: guardianPassPurchaseTable.amount,
        currency: guardianPassPurchaseTable.currency,
        entitlementExpiresAt: guardianPassPurchaseTable.entitlementExpiresAt,
      })
      .from(guardianPassPurchaseTable)
      .where(eq(guardianPassPurchaseTable.id, ref.id))
      .limit(1)
      .for('update')
    if (!purchase) return { status: 'purchase-not-found' as const }
    if (purchase.status !== 'pending' && purchase.status !== 'paid') {
      return { status: 'purchase-state-conflict' as const }
    }
    if (
      purchase.sku !== GUARDIAN_PASS_SKU ||
      purchase.amount !== payment.amount ||
      purchase.currency !== payment.currency
    ) {
      if (purchase.status === 'pending') {
        await tx
          .update(guardianPassPurchaseTable)
          .set({ status: 'review_required', failureCode: 'payment_mismatch' })
          .where(eq(guardianPassPurchaseTable.id, purchase.id))
      }
      return { status: 'payment-mismatch' as const }
    }

    if (purchase.status === 'paid') {
      if (!purchase.entitlementExpiresAt) return { status: 'purchase-state-conflict' as const }
      return {
        status: 'already-granted' as const,
        accessExpiresAt: purchase.entitlementExpiresAt,
        collectionPublicId: collection.publicId,
      }
    }

    const [previous] = await tx
      .select({ expiresAt: guardianPassPurchaseTable.entitlementExpiresAt })
      .from(guardianPassPurchaseTable)
      .where(
        and(
          eq(guardianPassPurchaseTable.collectionId, collection.id),
          eq(guardianPassPurchaseTable.status, 'paid'),
          isNotNull(guardianPassPurchaseTable.entitlementExpiresAt),
        ),
      )
      .orderBy(desc(guardianPassPurchaseTable.entitlementExpiresAt))
      .limit(1)
      .for('update')
    const startsAt = previous?.expiresAt && previous.expiresAt > payment.paidAt ? previous.expiresAt : payment.paidAt
    const expiresAt = new Date(startsAt.getTime() + GUARDIAN_PASS_DURATION_MS)

    await tx
      .update(guardianPassPurchaseTable)
      .set({
        status: 'paid',
        providerTxnId: payment.providerTxnId,
        method: payment.method,
        paidAt: payment.paidAt,
        entitlementStartsAt: startsAt,
        entitlementExpiresAt: expiresAt,
        failureCode: null,
        failureMessage: null,
      })
      .where(eq(guardianPassPurchaseTable.id, purchase.id))
    await tx
      .insert(guardianPassRecoveryEmailDeliveryTable)
      .values({ purchaseId: purchase.id })
      .onConflictDoNothing({ target: guardianPassRecoveryEmailDeliveryTable.purchaseId })

    return {
      status: 'granted' as const,
      accessExpiresAt: expiresAt,
      collectionPublicId: collection.publicId,
    }
  })
}

export type SettleGuardianPurchaseResult =
  | { status: 'failed' | 'cancelled' | 'refunded'; collectionPublicId: string }
  | { status: 'purchase-not-found' | 'purchase-state-conflict' }

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
    const [ref] = await tx
      .select({
        id: guardianPassPurchaseTable.id,
        collectionId: guardianPassPurchaseTable.collectionId,
      })
      .from(guardianPassPurchaseTable)
      .where(eq(guardianPassPurchaseTable.paymentId, input.paymentId))
      .limit(1)
    if (!ref) return { status: 'purchase-not-found' as const }

    const [collection] = await tx
      .select({ publicId: guardianDailyCollectionTable.publicId })
      .from(guardianDailyCollectionTable)
      .where(eq(guardianDailyCollectionTable.id, ref.collectionId))
      .limit(1)
      .for('update')
    if (!collection) return { status: 'purchase-state-conflict' as const }

    const [purchase] = await tx
      .select({ id: guardianPassPurchaseTable.id, status: guardianPassPurchaseTable.status })
      .from(guardianPassPurchaseTable)
      .where(eq(guardianPassPurchaseTable.id, ref.id))
      .limit(1)
      .for('update')
    if (!purchase) return { status: 'purchase-not-found' as const }

    if (input.remoteStatus === 'failed') {
      if (purchase.status === 'failed') return { status: 'failed' as const, collectionPublicId: collection.publicId }
      if (purchase.status !== 'pending' && purchase.status !== 'review_required') {
        return { status: 'purchase-state-conflict' as const }
      }
      await tx
        .update(guardianPassPurchaseTable)
        .set({
          status: 'failed',
          failureCode: input.failureCode?.slice(0, 64) || 'payment_failed',
          failureMessage: input.failureMessage?.slice(0, 256) || null,
        })
        .where(eq(guardianPassPurchaseTable.id, purchase.id))
      return { status: 'failed' as const, collectionPublicId: collection.publicId }
    }

    if (purchase.status === 'refunded') {
      return { status: 'refunded' as const, collectionPublicId: collection.publicId }
    }
    if (purchase.status === 'paid') {
      await tx
        .update(guardianPassPurchaseTable)
        .set({ status: 'refunded', refundedAt: input.occurredAt, failureCode: null, failureMessage: null })
        .where(eq(guardianPassPurchaseTable.id, purchase.id))
      return { status: 'refunded' as const, collectionPublicId: collection.publicId }
    }
    if (!['pending', 'review_required', 'failed', 'cancelled'].includes(purchase.status)) {
      return { status: 'purchase-state-conflict' as const }
    }
    if (purchase.status !== 'cancelled') {
      await tx
        .update(guardianPassPurchaseTable)
        .set({ status: 'cancelled', failureCode: 'payment_cancelled', failureMessage: null })
        .where(eq(guardianPassPurchaseTable.id, purchase.id))
    }
    return { status: 'cancelled' as const, collectionPublicId: collection.publicId }
  })
}

export async function getGuardianDailyCard(
  db: Db,
  collectionId: number,
  dateKey: string,
): Promise<typeof guardianDailyCardTable.$inferSelect | null> {
  const [row] = await db
    .select()
    .from(guardianDailyCardTable)
    .where(and(eq(guardianDailyCardTable.collectionId, collectionId), eq(guardianDailyCardTable.dateKey, dateKey)))
    .limit(1)
  return row ?? null
}

export type ArchiveGuardianDailyCardResult =
  | { status: 'archived' | 'already-archived'; card: typeof guardianDailyCardTable.$inferSelect; expiresAt: Date }
  | { status: 'pass-required' }

export async function archiveGuardianDailyCard(
  db: Db,
  input: {
    collectionId: number
    dateKey: string
    snapshot: GuardianDailyCardSnapshot
    source: 'today_free' | 'tomorrow_pass'
    publicId: string
    now: Date
  },
): Promise<ArchiveGuardianDailyCardResult> {
  return db.transaction(async (tx) => {
    const [collection] = await tx
      .select({ id: guardianDailyCollectionTable.id })
      .from(guardianDailyCollectionTable)
      .where(eq(guardianDailyCollectionTable.id, input.collectionId))
      .limit(1)
      .for('update')
    if (!collection) return { status: 'pass-required' as const }

    const [existing] = await tx
      .select()
      .from(guardianDailyCardTable)
      .where(
        and(
          eq(guardianDailyCardTable.collectionId, input.collectionId),
          eq(guardianDailyCardTable.dateKey, input.dateKey),
        ),
      )
      .limit(1)
      .for('update')
    const active = await findActiveGuardianPass(tx, input.collectionId, input.now)
    if (existing && active) return { status: 'already-archived' as const, card: existing, expiresAt: active.expiresAt }
    if (!active) return { status: 'pass-required' as const }

    const [created] = await tx
      .insert(guardianDailyCardTable)
      .values({
        publicId: input.publicId,
        collectionId: input.collectionId,
        dateKey: input.dateKey,
        timeZone: input.snapshot.timeZone,
        basis: input.snapshot.basis,
        theme: input.snapshot.theme,
        tone: input.snapshot.tone,
        source: input.source,
        snapshot: input.snapshot,
      })
      .onConflictDoNothing({
        target: [guardianDailyCardTable.collectionId, guardianDailyCardTable.dateKey],
      })
      .returning()
    const card = created ?? (await getGuardianDailyCard(tx, input.collectionId, input.dateKey))
    if (!card) throw new Error('Guardian daily card insert returned no row')

    if (input.source === 'tomorrow_pass') {
      await tx
        .update(guardianPassPurchaseTable)
        .set({ firstUsedAt: sql`coalesce(${guardianPassPurchaseTable.firstUsedAt}, ${input.now})` })
        .where(eq(guardianPassPurchaseTable.id, active.purchaseId))
    }

    return { status: 'archived' as const, card, expiresAt: active.expiresAt }
  })
}

export type OwnedGuardianDailyCard = {
  collectionPublicId: string
  publicId: string
  snapshot: GuardianDailyCardSnapshot
  source: 'today_free' | 'tomorrow_pass'
  createdAt: Date
}

export async function listOwnedGuardianDailyCards(
  db: Db,
  input: { ownerUserId: string; limit: number },
): Promise<OwnedGuardianDailyCard[]> {
  return db
    .select({
      collectionPublicId: guardianDailyCollectionTable.publicId,
      publicId: guardianDailyCardTable.publicId,
      snapshot: guardianDailyCardTable.snapshot,
      source: guardianDailyCardTable.source,
      createdAt: guardianDailyCardTable.createdAt,
    })
    .from(guardianDailyCollectionTable)
    .innerJoin(guardianDailyCardTable, eq(guardianDailyCardTable.collectionId, guardianDailyCollectionTable.id))
    .where(eq(guardianDailyCollectionTable.ownerUserId, input.ownerUserId))
    .orderBy(desc(guardianDailyCardTable.dateKey), desc(guardianDailyCardTable.id))
    .limit(input.limit)
}

export async function listGuardianDailyCardsForCollection(
  db: Db,
  input: { collectionId: number; limit: number },
): Promise<OwnedGuardianDailyCard[]> {
  return db
    .select({
      collectionPublicId: guardianDailyCollectionTable.publicId,
      publicId: guardianDailyCardTable.publicId,
      snapshot: guardianDailyCardTable.snapshot,
      source: guardianDailyCardTable.source,
      createdAt: guardianDailyCardTable.createdAt,
    })
    .from(guardianDailyCollectionTable)
    .innerJoin(guardianDailyCardTable, eq(guardianDailyCardTable.collectionId, guardianDailyCollectionTable.id))
    .where(eq(guardianDailyCollectionTable.id, input.collectionId))
    .orderBy(desc(guardianDailyCardTable.dateKey), desc(guardianDailyCardTable.id))
    .limit(input.limit)
}

export async function latestGuardianPassExpiryForCollection(db: Db, collectionId: number): Promise<Date | null> {
  const [row] = await db
    .select({ expiresAt: guardianPassPurchaseTable.entitlementExpiresAt })
    .from(guardianPassPurchaseTable)
    .where(
      and(
        eq(guardianPassPurchaseTable.collectionId, collectionId),
        eq(guardianPassPurchaseTable.status, 'paid'),
        isNotNull(guardianPassPurchaseTable.entitlementExpiresAt),
      ),
    )
    .orderBy(desc(guardianPassPurchaseTable.entitlementExpiresAt))
    .limit(1)
  return row?.expiresAt ?? null
}

export async function latestOwnedGuardianPassExpiry(db: Db, ownerUserId: string): Promise<Date | null> {
  const [row] = await db
    .select({ expiresAt: guardianPassPurchaseTable.entitlementExpiresAt })
    .from(guardianDailyCollectionTable)
    .innerJoin(guardianPassPurchaseTable, eq(guardianPassPurchaseTable.collectionId, guardianDailyCollectionTable.id))
    .where(
      and(
        eq(guardianDailyCollectionTable.ownerUserId, ownerUserId),
        eq(guardianPassPurchaseTable.status, 'paid'),
        isNotNull(guardianPassPurchaseTable.entitlementExpiresAt),
      ),
    )
    .orderBy(desc(guardianPassPurchaseTable.entitlementExpiresAt))
    .limit(1)
  return row?.expiresAt ?? null
}

export type ClaimGuardianCollectionResult = 'claimed' | 'already-claimed' | 'forbidden'

export async function claimGuardianCollection(
  db: Db,
  input: { collectionPublicId: string; accessTokenHash: string; ownerUserId: string },
): Promise<ClaimGuardianCollectionResult> {
  return db.transaction(async (tx) => {
    const [collection] = await tx
      .select({
        id: guardianDailyCollectionTable.id,
        accessTokenHash: guardianDailyCollectionTable.accessTokenHash,
        ownerUserId: guardianDailyCollectionTable.ownerUserId,
      })
      .from(guardianDailyCollectionTable)
      .where(eq(guardianDailyCollectionTable.publicId, input.collectionPublicId))
      .limit(1)
      .for('update')
    if (!collection || (collection.ownerUserId && collection.ownerUserId !== input.ownerUserId)) return 'forbidden'
    if (!collection.ownerUserId && collection.accessTokenHash !== input.accessTokenHash) return 'forbidden'
    if (collection.ownerUserId === input.ownerUserId) return 'already-claimed'

    await tx
      .update(guardianDailyCollectionTable)
      .set({ ownerUserId: input.ownerUserId, accessTokenHash: null })
      .where(eq(guardianDailyCollectionTable.id, collection.id))
    return 'claimed'
  })
}

export async function listStalePendingGuardianPurchases(
  db: Db,
  olderThan: Date,
  limit: number,
): Promise<{ paymentId: string }[]> {
  return db
    .select({ paymentId: guardianPassPurchaseTable.paymentId })
    .from(guardianPassPurchaseTable)
    .where(and(eq(guardianPassPurchaseTable.status, 'pending'), lt(guardianPassPurchaseTable.updatedAt, olderThan)))
    .orderBy(asc(guardianPassPurchaseTable.updatedAt))
    .limit(limit)
}

export async function touchPendingGuardianPurchaseAfterReconciliation(
  db: Db,
  paymentId: string,
  checkedAt: Date,
): Promise<void> {
  await db
    .update(guardianPassPurchaseTable)
    .set({ updatedAt: checkedAt })
    .where(and(eq(guardianPassPurchaseTable.paymentId, paymentId), eq(guardianPassPurchaseTable.status, 'pending')))
}

export async function purgeAbandonedGuardianPassPurchases(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .delete(guardianPassPurchaseTable)
    .where(
      and(
        inArray(guardianPassPurchaseTable.status, ['pending', 'failed', 'cancelled']),
        lt(guardianPassPurchaseTable.updatedAt, cutoff),
      ),
    )
    .returning({ id: guardianPassPurchaseTable.id })
  return rows.length
}

export async function purgeOrphanedGuardianCollections(db: Db): Promise<number> {
  const rows = await db
    .delete(guardianDailyCollectionTable)
    .where(
      sql`not exists (select 1 from ${guardianPassPurchaseTable} where ${guardianPassPurchaseTable.collectionId} = ${guardianDailyCollectionTable.id})
          and not exists (select 1 from ${guardianDailyCardTable} where ${guardianDailyCardTable.collectionId} = ${guardianDailyCollectionTable.id})`,
    )
    .returning({ id: guardianDailyCollectionTable.id })
  return rows.length
}

export async function purgeExpiredGuestGuardianCards(db: Db, cutoff: Date): Promise<number> {
  const rows = await db
    .delete(guardianDailyCardTable)
    .where(
      and(
        sql`exists (
          select 1 from ${guardianDailyCollectionTable}
          where ${guardianDailyCollectionTable.id} = ${guardianDailyCardTable.collectionId}
            and ${guardianDailyCollectionTable.ownerUserId} is null
        )`,
        sql`not exists (
          select 1 from ${guardianPassPurchaseTable}
          where ${guardianPassPurchaseTable.collectionId} = ${guardianDailyCardTable.collectionId}
            and ${guardianPassPurchaseTable.status} = 'paid'
            and ${guardianPassPurchaseTable.paidAt} >= ${cutoff}
        )`,
      ),
    )
    .returning({ id: guardianDailyCardTable.id })
  return rows.length
}
