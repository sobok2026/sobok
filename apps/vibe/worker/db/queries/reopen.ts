import type { Locale } from '@sobok/domain/locale'
import type { Db } from '@sobok/edge/db/client'
import { and, desc, eq, gt, isNotNull, isNull } from 'drizzle-orm'
import { dateIsWithinYears, REOPEN_REQUEST_COOLDOWN_MS, yearsAfter } from '../../lib/retention'
import { purchaseTable, reopenAccessTable, resultTable } from '../schema'

export type ReopenCandidate = {
  purchaseId: number
  locale: Locale
  paidAt: Date
}

export async function listReopenCandidates(db: Db, emailHash: string, now: Date): Promise<ReopenCandidate[]> {
  const cooldownCutoff = new Date(now.getTime() - REOPEN_REQUEST_COOLDOWN_MS)
  const [recent] = await db
    .select({ id: reopenAccessTable.id })
    .from(reopenAccessTable)
    .innerJoin(purchaseTable, eq(reopenAccessTable.purchaseId, purchaseTable.id))
    .where(and(eq(purchaseTable.emailHash, emailHash), gt(reopenAccessTable.createdAt, cooldownCutoff)))
    .limit(1)

  if (recent) {
    return []
  }

  return db
    .select({
      purchaseId: purchaseTable.id,
      locale: resultTable.locale,
      paidAt: purchaseTable.paidAt,
    })
    .from(purchaseTable)
    .innerJoin(resultTable, eq(purchaseTable.resultId, resultTable.id))
    .where(
      and(
        eq(purchaseTable.emailHash, emailHash),
        eq(purchaseTable.status, 'paid'),
        isNotNull(purchaseTable.accessToken),
        isNotNull(purchaseTable.paidAt),
        dateIsWithinYears(purchaseTable.paidAt, now, 1),
      ),
    )
    .orderBy(desc(purchaseTable.paidAt))
    .limit(5) as Promise<ReopenCandidate[]>
}

export async function insertReopenLinks(
  db: Db,
  links: { purchaseId: number; tokenHash: string; expiresAt: Date }[],
): Promise<void> {
  if (links.length === 0) {
    return
  }
  await db.insert(reopenAccessTable).values(links)
}

export type ReopenedPurchase = {
  accessToken: string
  accessExpiresAt: Date
  locale: Locale
  /** The order number the report prints. A buyer writing to support has nothing else to quote. */
  paymentId: string
  refinementRequired: boolean
}

export async function consumeReopenLink(db: Db, tokenHash: string, now: Date): Promise<ReopenedPurchase | null> {
  const [row] = await db
    .select({
      linkId: reopenAccessTable.id,
      accessToken: purchaseTable.accessToken,
      paidAt: purchaseTable.paidAt,
      paymentId: purchaseTable.paymentId,
      locale: resultTable.locale,
      refinedProfile: resultTable.refinedProfile,
    })
    .from(reopenAccessTable)
    .innerJoin(purchaseTable, eq(reopenAccessTable.purchaseId, purchaseTable.id))
    .innerJoin(resultTable, eq(purchaseTable.resultId, resultTable.id))
    .where(
      and(
        eq(reopenAccessTable.tokenHash, tokenHash),
        isNull(reopenAccessTable.consumedAt),
        gt(reopenAccessTable.expiresAt, now),
        eq(purchaseTable.status, 'paid'),
        isNotNull(purchaseTable.accessToken),
        isNotNull(purchaseTable.paidAt),
        dateIsWithinYears(purchaseTable.paidAt, now, 1),
      ),
    )
    .limit(1)

  if (!row?.accessToken || !row.paidAt) {
    return null
  }

  const consumed = await db
    .update(reopenAccessTable)
    .set({ consumedAt: now })
    .where(
      and(
        eq(reopenAccessTable.id, row.linkId),
        isNull(reopenAccessTable.consumedAt),
        gt(reopenAccessTable.expiresAt, now),
      ),
    )
    .returning({ id: reopenAccessTable.id })

  if (consumed.length === 0) {
    return null
  }

  const accessExpiresAt = yearsAfter(row.paidAt, 1)

  return {
    accessToken: row.accessToken,
    accessExpiresAt,
    locale: row.locale,
    paymentId: row.paymentId,
    refinementRequired: row.refinedProfile === null,
  }
}
