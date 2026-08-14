import type { Db } from '@sobok/edge/db/client'
import { and, asc, desc, eq, or, sql } from 'drizzle-orm'
import {
  CURRENT_GUARDIAN_MANIFEST,
  type GuardianLoveRedrawProductSku,
  type GuardianProductManifest,
  guardianEditionPool,
} from '../../guardian/manifest'
import type { GuardianLoveCardView, GuardianLoveRedrawState } from '../../guardian/redraw-contract'
import {
  guardianCardAcquisitionTable,
  guardianCardOwnershipTable,
  guardianCollectionTable,
  guardianGuaranteeProgressTable,
  guardianPurchaseTable,
  guardianRedrawGrantTable,
} from '../schema/guardian'
import { findPaidFullReportPurchase, lockedReportOf } from './guardian'
import { listGuardianReportCards, selectGuardianReportCard } from './guardian-card'

const RARITY_ORDER = { orbit: 0, nebula: 1, eclipse: 2, stella: 3 } as const

export type CreateGuardianRedrawCheckoutResult =
  | {
      status: 'ready'
      paymentId: string
      purchaseStatus: 'pending' | 'paid'
      sku: GuardianLoveRedrawProductSku
      orderName: string
      amount: number
      market: string
      currency: string
    }
  | { status: 'report-not-found' }
  | { status: 'payment-required' }
  | { status: 'product-unavailable' }
  | { status: 'checkout-conflict' }

/** New redraw sales snapshot their exact localized name, price, currency, and eventual credit count. */
export async function createGuardianRedrawCheckout(
  db: Db,
  input: {
    collectionId: number
    reportId: number
    requestId: string
    paymentId: string
    sku: GuardianLoveRedrawProductSku
    market: string
  },
): Promise<CreateGuardianRedrawCheckoutResult> {
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
    const entitlement = await findPaidFullReportPurchase(tx, {
      collectionId: input.collectionId,
      reportId: input.reportId,
      sku: report.productSku,
    })
    if (!entitlement) {
      return { status: 'payment-required' as const }
    }

    const manifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST
    const family = manifest.families.find(({ id }) => id === report.loveFamilyId)
    const product = manifest.products.find(({ sku }) => sku === input.sku)
    const price = product?.prices.find(({ market }) => market === input.market)
    const orderName = product?.orderNames[report.locale]
    const localeSupported = manifest.supportedLocales.includes(report.locale)
    if (family?.slot !== 'love' || product?.kind !== 'love_redraw' || !price || !orderName || !localeSupported) {
      return { status: 'product-unavailable' as const }
    }

    const [existing] = await tx
      .select({
        paymentId: guardianPurchaseTable.paymentId,
        reportId: guardianPurchaseTable.reportId,
        sku: guardianPurchaseTable.sku,
        status: guardianPurchaseTable.status,
        orderName: guardianPurchaseTable.orderName,
        amount: guardianPurchaseTable.amount,
        market: guardianPurchaseTable.market,
        currency: guardianPurchaseTable.currency,
      })
      .from(guardianPurchaseTable)
      .where(
        and(
          eq(guardianPurchaseTable.collectionId, input.collectionId),
          eq(guardianPurchaseTable.checkoutRequestId, input.requestId),
        ),
      )
      .limit(1)
      .for('update')
    if (existing) {
      if (
        existing.reportId !== input.reportId ||
        existing.sku !== input.sku ||
        (existing.status !== 'pending' && existing.status !== 'paid')
      ) {
        return { status: 'checkout-conflict' as const }
      }
      return {
        status: 'ready' as const,
        paymentId: existing.paymentId,
        purchaseStatus: existing.status,
        sku: input.sku,
        orderName: existing.orderName,
        amount: existing.amount,
        market: existing.market,
        currency: existing.currency,
      }
    }

    await tx.insert(guardianPurchaseTable).values({
      paymentId: input.paymentId,
      collectionId: input.collectionId,
      reportId: input.reportId,
      checkoutRequestId: input.requestId,
      sku: product.sku,
      kind: product.kind,
      entitlementSnapshot: { kind: 'love_redraw', redrawCredits: product.redrawCredits },
      orderName,
      amount: price.amountMinor,
      market: price.market,
      currency: price.currency,
    })

    return {
      status: 'ready' as const,
      paymentId: input.paymentId,
      purchaseStatus: 'pending' as const,
      sku: product.sku,
      orderName,
      amount: price.amountMinor,
      market: price.market,
      currency: price.currency,
    }
  })
}

export type ReadGuardianLoveRedrawResult =
  | { status: 'ok'; state: GuardianLoveRedrawState }
  | { status: 'report-not-found' }
  | { status: 'payment-required' }

export async function readGuardianLoveRedraw(
  db: Db,
  input: { collectionId: number; reportId: number; market: string },
): Promise<ReadGuardianLoveRedrawResult> {
  const report = await lockedReportOf(db, input, false)
  if (report?.status !== 'fulfilled' || !report.loveFamilyId) {
    return { status: 'report-not-found' }
  }
  const entitlement = await findPaidFullReportPurchase(db, {
    collectionId: input.collectionId,
    reportId: input.reportId,
    sku: report.productSku,
  })
  if (!entitlement) {
    return { status: 'payment-required' }
  }

  const selectedCards = await listGuardianReportCards(db, input)
  const equipped = selectedCards.find(({ presentation }) => presentation.slot === 'love')
  if (!equipped) {
    throw new Error(`Guardian report ${report.id} has no equipped love-card acquisition`)
  }

  const owned = await db
    .selectDistinctOn([guardianCardAcquisitionTable.editionId], {
      acquisitionId: guardianCardAcquisitionTable.id,
      acquisitionPublicId: guardianCardAcquisitionTable.publicId,
      acquisitionCount: guardianCardOwnershipTable.acquisitionCount,
      presentation: guardianCardAcquisitionTable.presentationSnapshot,
    })
    .from(guardianCardAcquisitionTable)
    .innerJoin(
      guardianCardOwnershipTable,
      and(
        eq(guardianCardOwnershipTable.collectionId, guardianCardAcquisitionTable.collectionId),
        eq(guardianCardOwnershipTable.editionId, guardianCardAcquisitionTable.editionId),
      ),
    )
    .where(
      and(
        eq(guardianCardOwnershipTable.collectionId, input.collectionId),
        eq(guardianCardOwnershipTable.familyId, report.loveFamilyId),
        sql`${guardianCardAcquisitionTable.presentationSnapshot}->>'locale' = ${report.locale}`,
      ),
    )
    .orderBy(
      guardianCardAcquisitionTable.editionId,
      desc(guardianCardAcquisitionTable.createdAt),
      desc(guardianCardAcquisitionTable.id),
    )

  const cards: GuardianLoveCardView[] = owned
    .map(({ acquisitionPublicId, acquisitionCount, presentation }) => ({
      ...presentation,
      acquisitionPublicId,
      acquisitionCount,
      equipped: presentation.cardEditionId === equipped.presentation.cardEditionId,
    }))
    .sort((left, right) => {
      const leftOrder = left.rarity ? RARITY_ORDER[left.rarity] : -1
      const rightOrder = right.rarity ? RARITY_ORDER[right.rarity] : -1
      return leftOrder - rightOrder || left.cardEditionId.localeCompare(right.cardEditionId)
    })

  const availableGrants = await db
    .select({
      kind: guardianRedrawGrantTable.kind,
      totalCredits: guardianRedrawGrantTable.totalCredits,
      consumedCredits: guardianRedrawGrantTable.consumedCredits,
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

  const activeManifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST
  const progressRows = await db
    .select({ paidDrawCount: guardianGuaranteeProgressTable.paidDrawCount })
    .from(guardianGuaranteeProgressTable)
    .where(
      and(
        eq(guardianGuaranteeProgressTable.collectionId, input.collectionId),
        eq(guardianGuaranteeProgressTable.scopeId, report.loveFamilyId),
      ),
    )
    .limit(1)
  const interval = activeManifest.guarantee.paidDrawInterval
  const paidDrawsInCycle = (progressRows[0]?.paidDrawCount ?? 0) % interval
  const pool = guardianEditionPool(report.loveFamilyId, activeManifest)
  if (pool.selection !== 'weighted_random') {
    throw new Error(`Guardian love family ${report.loveFamilyId} does not have weighted redraw odds`)
  }

  const salesManifest: GuardianProductManifest = CURRENT_GUARDIAN_MANIFEST
  const products = salesManifest.products.flatMap((product) => {
    if (product.kind !== 'love_redraw') {
      return []
    }
    const price = product.prices.find(({ market }) => market === input.market)
    const orderName = product.orderNames[report.locale]
    const localeSupported = salesManifest.supportedLocales.includes(report.locale)
    return price && orderName && localeSupported
      ? [
          {
            sku: product.sku,
            credits: product.redrawCredits,
            orderName,
            price: { amount: price.amountMinor, market: price.market, currency: price.currency },
          },
        ]
      : []
  })

  return {
    status: 'ok',
    state: {
      reportPublicId: report.publicId,
      locale: report.locale,
      equippedCard: {
        ...equipped.presentation,
        acquisitionPublicId: equipped.acquisitionPublicId,
        acquisitionCount: equipped.acquisitionCount,
        equipped: true,
      },
      cards,
      credits: {
        available: availableGrants.reduce((total, grant) => total + grant.totalCredits - grant.consumedCredits, 0),
      },
      guarantee: {
        interval,
        paidDrawsInCycle,
        paidDrawsUntilGuarantee: interval - paidDrawsInCycle,
      },
      odds: pool.candidates.map((candidate) => {
        const edition = activeManifest.editions.find(({ id }) => id === candidate.editionId)
        if (!edition?.rarity) {
          throw new Error(`Guardian redraw edition ${candidate.editionId} has no rarity`)
        }
        return { rarity: edition.rarity, weight: candidate.weight, weightScale: activeManifest.weightScale }
      }),
      products,
    },
  }
}

export async function equipGuardianLoveCard(
  db: Db,
  input: { collectionId: number; reportId: number; acquisitionPublicId: string },
): Promise<'selected' | 'already-selected' | 'report-not-found' | 'card-not-found' | 'payment-required'> {
  return db.transaction(async (tx) => {
    const [collection] = await tx
      .select({ id: guardianCollectionTable.id })
      .from(guardianCollectionTable)
      .where(eq(guardianCollectionTable.id, input.collectionId))
      .limit(1)
      .for('update')
    const report = await lockedReportOf(tx, input)
    if (!collection || report?.status !== 'fulfilled' || !report.loveFamilyId) {
      return 'report-not-found'
    }
    const entitlement = await findPaidFullReportPurchase(tx, {
      collectionId: input.collectionId,
      reportId: input.reportId,
      sku: report.productSku,
    })
    if (!entitlement) {
      return 'payment-required'
    }

    const [acquisition] = await tx
      .select({ id: guardianCardAcquisitionTable.id })
      .from(guardianCardAcquisitionTable)
      .where(
        and(
          eq(guardianCardAcquisitionTable.collectionId, input.collectionId),
          eq(guardianCardAcquisitionTable.publicId, input.acquisitionPublicId),
          eq(guardianCardAcquisitionTable.familyId, report.loveFamilyId),
          eq(guardianCardAcquisitionTable.slot, 'love'),
          sql`${guardianCardAcquisitionTable.presentationSnapshot}->>'locale' = ${report.locale}`,
        ),
      )
      .limit(1)
    if (!acquisition) {
      return 'card-not-found'
    }

    const selected = (await listGuardianReportCards(tx, input)).find(({ presentation }) => presentation.slot === 'love')
    if (selected?.acquisitionId === acquisition.id) {
      return 'already-selected'
    }
    await selectGuardianReportCard(tx, { reportId: input.reportId, slot: 'love', acquisitionId: acquisition.id })
    return 'selected'
  })
}
