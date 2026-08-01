import type { Db } from '@sobok/edge/db/client'
import { eq, lt } from 'drizzle-orm'
import { guardianPortOneWebhookEventTable } from '../schema/guardian-webhook'

export async function hasProcessedGuardianWebhook(db: Db, eventId: string): Promise<boolean> {
  const [row] = await db
    .select({ eventId: guardianPortOneWebhookEventTable.eventId })
    .from(guardianPortOneWebhookEventTable)
    .where(eq(guardianPortOneWebhookEventTable.eventId, eventId))
    .limit(1)
  return Boolean(row)
}

// Written only after the payment event has converged locally. Concurrent deliveries may both do an idempotent
// reconciliation, then one wins this insert; a transient failure leaves no row so PortOne can retry it.
export async function recordProcessedGuardianWebhook(
  db: Db,
  input: { eventId: string; eventType: string; paymentId: string },
): Promise<void> {
  await db
    .insert(guardianPortOneWebhookEventTable)
    .values({ eventId: input.eventId, type: input.eventType, paymentId: input.paymentId })
    .onConflictDoNothing({ target: guardianPortOneWebhookEventTable.eventId })
}

export async function purgeProcessedGuardianWebhooks(db: Db, before: Date): Promise<number> {
  const rows = await db
    .delete(guardianPortOneWebhookEventTable)
    .where(lt(guardianPortOneWebhookEventTable.createdAt, before))
    .returning({ eventId: guardianPortOneWebhookEventTable.eventId })
  return rows.length
}
