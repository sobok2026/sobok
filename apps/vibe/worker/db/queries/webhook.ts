import type { Db } from '../client'
import { webhookEventTable } from '../schema'

// Record an inbound webhook by its Standard-Webhooks event id. Returns true iff this was the FIRST time we
// saw it (unique(provider, event_id) + onConflictDoNothing) — the dedupe gate for at-least-once delivery.
export async function recordWebhookEvent(
  db: Db,
  input: { eventId: string; type: string; payload: string },
): Promise<boolean> {
  const rows = await db
    .insert(webhookEventTable)
    .values({ eventId: input.eventId, type: input.type, payload: input.payload })
    .onConflictDoNothing()
    .returning({ id: webhookEventTable.id })
  return rows.length > 0
}
