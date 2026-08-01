import { createdAt } from '@sobok/edge/db/columns'
import { index, varchar } from 'drizzle-orm/pg-core'
import { stella } from './common'

// Completed inbound events only. The raw payload is verified before this row is written and is deliberately
// not retained; payment state is re-read from PortOne, so the Standard Webhooks event id is the sole dedupe key.
export const guardianPortOneWebhookEventTable = stella.table(
  'guardian_portone_webhook_event',
  {
    eventId: varchar('event_id', { length: 128 }).primaryKey(),
    type: varchar({ length: 64 }).notNull(),
    paymentId: varchar('payment_id', { length: 64 }).notNull(),
    createdAt,
  },
  (t) => [index('idx_stella_guardian_webhook_payment').on(t.paymentId, t.createdAt)],
)
