import type { Db } from '@sobok/edge/db/client'
import { and, eq, sql } from 'drizzle-orm'
import type { GuardianCardDrawSnapshot, GuardianSelectedCard } from '../../guardian/draw'
import type { GuardianCardPresentationSnapshot } from '../../guardian/redraw-contract'
import { newGuardianPublicId } from '../../guardian/tokens'
import {
  guardianCardAcquisitionTable,
  guardianCardOwnershipTable,
  guardianReportCardSelectionTable,
} from '../schema/guardian'

export type GuardianAcquisitionSource = 'initial_report' | 'paid_redraw' | 'account_save_reward'

export async function recordGuardianAcquisition(
  db: Db,
  input: {
    collectionId: number
    reportId: number
    drawRequestId: string | null
    grantId: number | null
    card: GuardianSelectedCard
    presentation: GuardianCardPresentationSnapshot
    source: GuardianAcquisitionSource
    guaranteeDue: boolean
    guaranteedUnowned: boolean
    drawSnapshot: GuardianCardDrawSnapshot
  },
): Promise<{ id: number; publicId: string; duplicate: boolean }> {
  const publicId = newGuardianPublicId()
  const acquiredAt = new Date()
  const insertedOwnership = await db
    .insert(guardianCardOwnershipTable)
    .values({
      collectionId: input.collectionId,
      editionId: input.card.editionId,
      familyId: input.card.familyId,
      rarity: input.card.rarity,
      firstAcquiredAt: acquiredAt,
      lastAcquiredAt: acquiredAt,
    })
    .onConflictDoNothing({
      target: [guardianCardOwnershipTable.collectionId, guardianCardOwnershipTable.editionId],
    })
    .returning({ editionId: guardianCardOwnershipTable.editionId })
  const duplicate = insertedOwnership.length === 0
  if (duplicate) {
    await db
      .update(guardianCardOwnershipTable)
      .set({
        acquisitionCount: sql`${guardianCardOwnershipTable.acquisitionCount} + 1`,
        lastAcquiredAt: acquiredAt,
      })
      .where(
        and(
          eq(guardianCardOwnershipTable.collectionId, input.collectionId),
          eq(guardianCardOwnershipTable.editionId, input.card.editionId),
        ),
      )
  }

  const [acquisition] = await db
    .insert(guardianCardAcquisitionTable)
    .values({
      publicId,
      collectionId: input.collectionId,
      reportId: input.reportId,
      drawRequestId: input.drawRequestId,
      grantId: input.grantId,
      slot: input.card.slot,
      familyId: input.card.familyId,
      editionId: input.card.editionId,
      rarity: input.card.rarity,
      source: input.source,
      duplicate,
      guaranteeDue: input.guaranteeDue,
      guaranteedUnowned: input.guaranteedUnowned,
      drawSnapshot: input.drawSnapshot,
      presentationSnapshot: input.presentation,
      createdAt: acquiredAt,
    })
    .returning({ id: guardianCardAcquisitionTable.id })
  if (!acquisition) {
    throw new Error('Guardian acquisition insert returned no row')
  }

  return { id: acquisition.id, publicId, duplicate }
}

export async function selectGuardianReportCard(
  db: Db,
  input: { reportId: number; slot: GuardianSelectedCard['slot']; acquisitionId: number },
): Promise<void> {
  await db
    .insert(guardianReportCardSelectionTable)
    .values(input)
    .onConflictDoUpdate({
      target: [guardianReportCardSelectionTable.reportId, guardianReportCardSelectionTable.slot],
      set: { acquisitionId: input.acquisitionId, updatedAt: new Date() },
    })
}

export async function listGuardianReportCards(
  db: Db,
  input: { collectionId: number; reportId: number },
): Promise<
  {
    acquisitionId: number
    acquisitionPublicId: string
    acquisitionCount: number
    presentation: GuardianCardPresentationSnapshot
  }[]
> {
  return db
    .select({
      acquisitionId: guardianCardAcquisitionTable.id,
      acquisitionPublicId: guardianCardAcquisitionTable.publicId,
      acquisitionCount: guardianCardOwnershipTable.acquisitionCount,
      presentation: guardianCardAcquisitionTable.presentationSnapshot,
    })
    .from(guardianReportCardSelectionTable)
    .innerJoin(
      guardianCardAcquisitionTable,
      eq(guardianCardAcquisitionTable.id, guardianReportCardSelectionTable.acquisitionId),
    )
    .innerJoin(
      guardianCardOwnershipTable,
      and(
        eq(guardianCardOwnershipTable.collectionId, input.collectionId),
        eq(guardianCardOwnershipTable.editionId, guardianCardAcquisitionTable.editionId),
      ),
    )
    .where(
      and(
        eq(guardianReportCardSelectionTable.reportId, input.reportId),
        eq(guardianCardAcquisitionTable.collectionId, input.collectionId),
      ),
    )
}
