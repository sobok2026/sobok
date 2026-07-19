import { bigint, index, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { timestamps } from '../../columns'
import { paymentTable } from './payment'

// Anonymous entitlement record for the 겉속유형(DeepType) one-time purchase — kept out of `paymentTable`
// on purpose: `GET /api/v1/deeptype/purchases/:token` is unauthenticated by design (no accounts), so this
// table scopes what that public lookup can see to entitlement-only fields, not the full payment ledger.
export const deepTypePurchaseTable = pgTable.withRLS(
  'deep_type_purchase',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    paymentId: bigint('payment_id', { mode: 'number' })
      .references(() => paymentTable.id, { onDelete: 'cascade' })
      .notNull(),
    // Client-generated (crypto.getRandomValues, base64url, ~128 bits) — embedded in the confirmation
    // email's "view your result again" link, so it's a public-facing value, unlike paymentTable.paymentId.
    accessToken: varchar('access_token', { length: 64 }).notNull(),
    email: varchar({ length: 320 }).notNull(),
    locale: varchar({ length: 8 }).notNull().default('ko'),
    // Opaque to the server — whatever the client's serializeDeepResult() produces. Never interpreted here;
    // the psychological content dictionaries stay entirely client-side.
    resultCode: varchar('result_code', { length: 512 }),
    confirmationEmailSentAt: timestamp('confirmation_email_sent_at', { precision: 3, withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('uq_deep_type_purchase_payment').on(table.paymentId),
    uniqueIndex('uq_deep_type_purchase_token').on(table.accessToken),
    index('idx_deep_type_purchase_email').on(table.email),
  ],
)
