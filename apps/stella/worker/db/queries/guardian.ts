import type { Locale } from '@sobok/domain/locale'
import type { Db } from '@sobok/edge/db/client'
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm'
import {
  drawInitialGuardianCards,
  drawLoveRedraw,
  type GuardianSelectedCard,
  selectGuardianFamilies,
} from '../../guardian/draw'
import {
  GUARDIAN_MVP_MANIFEST,
  type GuardianProductSku,
  type GuardianRarity,
  type GuardianSelectionContext,
  guardianManifest,
  guardianProduct,
  guardianProductPrice,
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
} from '../schema'

export interface NewGuestGuardianReport {
  collectionPublicId: string
  collectionAccessTokenHash: string
  reportPublicId: string
  locale: Locale
  inputSnapshot: GuardianSelectionContext
}

export interface GuardianDraftRef {
  collectionId: number
  collectionPublicId: string
  reportId: number
  reportPublicId: string
}

export async function createGuestGuardianReportDraft(db: Db, input: NewGuestGuardianReport): Promise<GuardianDraftRef> {
  const manifest = GUARDIAN_MVP_MANIFEST
  const familySnapshot = selectGuardianFamilies(input.inputSnapshot)

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
        manifestVersion: manifest.manifestVersion,
        selectionRuleVersion: manifest.selectionRuleVersion,
        oddsVersion: manifest.oddsVersion,
        copyVersion: manifest.copyVersion,
        renderVersion: manifest.renderVersion,
        inputSnapshot: input.inputSnapshot,
        familySnapshot,
        loveFamilyId: familySnapshot.love,
      })
      .returning({ id: guardianReportTable.id })
    if (!report) {
      throw new Error('Guardian report insert returned no row')
    }

    return {
      collectionId: collection.id,
      collectionPublicId: input.collectionPublicId,
      reportId: report.id,
      reportPublicId: input.reportPublicId,
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

export interface NewGuardianPurchase {
  paymentId: string
  collectionId: number
  reportId: number
  sku: GuardianProductSku
  market: string
}

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
 * Persists only a server-priced pending order. A future checkout route may return these values to PortOne,
 * but it must never accept amount/currency from the browser.
 */
export async function createPendingGuardianPurchase(
  db: Db,
  input: NewGuardianPurchase,
): Promise<CreateGuardianPurchaseResult> {
  const manifest = GUARDIAN_MVP_MANIFEST
  const product = guardianProduct(input.sku, manifest)
  const price = guardianProductPrice(input.sku, input.market, manifest)

  return db.transaction(async (tx) => {
    const [report] = await tx
      .select({ status: guardianReportTable.status })
      .from(guardianReportTable)
      .where(and(eq(guardianReportTable.id, input.reportId), eq(guardianReportTable.collectionId, input.collectionId)))
      .limit(1)
      .for('update')

    if (!report) {
      return { status: 'report-not-found' as const }
    }
    if (
      (product.kind === 'full_report' && report.status !== 'draft') ||
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
            eq(guardianPurchaseTable.sku, product.sku),
            inArray(guardianPurchaseTable.status, ['pending', 'paid']),
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
      amount: price.amountMinor,
      market: price.market,
      currency: price.currency,
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

export type FulfillGuardianPurchaseResult =
  | {
      status: 'granted' | 'already-granted'
      kind: 'full_report'
      reportPublicId: string
      cards: GuardianSelectedCard[]
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
export async function fulfillGuardianPurchase(
  db: Db,
  payment: VerifiedGuardianPayment,
): Promise<FulfillGuardianPurchaseResult> {
  return db.transaction(async (tx) => {
    const [purchase] = await tx
      .select({
        id: guardianPurchaseTable.id,
        collectionId: guardianPurchaseTable.collectionId,
        reportId: guardianPurchaseTable.reportId,
        sku: guardianPurchaseTable.sku,
        amount: guardianPurchaseTable.amount,
        currency: guardianPurchaseTable.currency,
        status: guardianPurchaseTable.status,
        manifestVersion: guardianPurchaseTable.manifestVersion,
        entitlementGrantedAt: guardianPurchaseTable.entitlementGrantedAt,
      })
      .from(guardianPurchaseTable)
      .where(eq(guardianPurchaseTable.paymentId, payment.paymentId))
      .limit(1)
      .for('update')

    if (!purchase) {
      return { status: 'purchase-not-found' as const }
    }
    if (purchase.amount !== payment.amount || purchase.currency !== payment.currency) {
      return { status: 'payment-mismatch' as const }
    }
    if (purchase.status === 'failed' || purchase.status === 'refunded') {
      return { status: 'purchase-state-conflict' as const }
    }

    const manifest = guardianManifest(purchase.manifestVersion)
    const product = guardianProduct(purchase.sku, manifest)
    const [collection] = await tx
      .select({ id: guardianCollectionTable.id })
      .from(guardianCollectionTable)
      .where(eq(guardianCollectionTable.id, purchase.collectionId))
      .limit(1)
      .for('update')
    if (!collection) {
      return { status: 'report-state-conflict' as const }
    }
    const [report] = await tx
      .select({
        publicId: guardianReportTable.publicId,
        collectionId: guardianReportTable.collectionId,
        status: guardianReportTable.status,
        manifestVersion: guardianReportTable.manifestVersion,
        familySnapshot: guardianReportTable.familySnapshot,
        loveFamilyId: guardianReportTable.loveFamilyId,
        cardSnapshot: guardianReportTable.cardSnapshot,
      })
      .from(guardianReportTable)
      .where(eq(guardianReportTable.id, purchase.reportId))
      .limit(1)
      .for('update')

    if (!report || report.collectionId !== purchase.collectionId) {
      return { status: 'report-state-conflict' as const }
    }

    if (purchase.entitlementGrantedAt) {
      if (product.kind === 'full_report') {
        if (!report.cardSnapshot) {
          throw new Error('Fulfilled guardian report is missing its immutable card snapshot')
        }
        return {
          status: 'already-granted' as const,
          kind: 'full_report' as const,
          reportPublicId: report.publicId,
          cards: report.cardSnapshot,
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
        (report.status !== 'draft' || report.manifestVersion !== purchase.manifestVersion)) ||
      (product.kind === 'love_redraw' && report.status !== 'fulfilled')
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
      const cards = drawInitialGuardianCards(report.familySnapshot, undefined, manifest)
      for (const card of cards) {
        await recordGuardianAcquisition(tx, {
          collectionId: purchase.collectionId,
          reportId: purchase.reportId,
          grantId: null,
          card,
          source: 'initial_report',
          guaranteeDue: false,
          guaranteedUnowned: false,
          manifestVersion: manifest.manifestVersion,
          oddsVersion: manifest.oddsVersion,
        })
      }

      const fulfilledAt = new Date()
      await tx
        .update(guardianReportTable)
        .set({ status: 'fulfilled', cardSnapshot: cards, fulfilledAt })
        .where(eq(guardianReportTable.id, purchase.reportId))
      await stampGuardianEntitlementGranted(tx, purchase.id, fulfilledAt)

      return {
        status: 'granted' as const,
        kind: 'full_report' as const,
        reportPublicId: report.publicId,
        cards,
      }
    }

    await tx
      .insert(guardianRedrawGrantTable)
      .values({
        grantKey: `purchase:${purchase.id}`,
        collectionId: purchase.collectionId,
        reportId: purchase.reportId,
        purchaseId: purchase.id,
        familyId: report.loveFamilyId,
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

export async function grantGuardianAccountSaveReward(
  db: Db,
  input: { collectionId: number; reportId: number },
): Promise<'granted' | 'already-granted' | 'report-not-found'> {
  return db.transaction(async (tx) => {
    const [report] = await tx
      .select({
        status: guardianReportTable.status,
        manifestVersion: guardianReportTable.manifestVersion,
        loveFamilyId: guardianReportTable.loveFamilyId,
      })
      .from(guardianReportTable)
      .where(and(eq(guardianReportTable.id, input.reportId), eq(guardianReportTable.collectionId, input.collectionId)))
      .limit(1)
      .for('update')
    if (report?.status !== 'fulfilled') {
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

    const [report] = await tx
      .select({
        status: guardianReportTable.status,
        loveFamilyId: guardianReportTable.loveFamilyId,
      })
      .from(guardianReportTable)
      .where(and(eq(guardianReportTable.id, input.reportId), eq(guardianReportTable.collectionId, input.collectionId)))
      .limit(1)
      .for('update')
    if (report?.status !== 'fulfilled') {
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
          eq(guardianCardOwnershipTable.familyId, report.loveFamilyId),
        ),
      )
    const ownedEditionIds = new Set(ownedRows.map(({ editionId }) => editionId))
    const decision = drawLoveRedraw(
      {
        familyId: report.loveFamilyId,
        ownedEditionIds,
        paidDrawsInCycle: progress.paidDrawsInCycle,
        creditKind: input.creditKind,
      },
      undefined,
      manifest,
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
