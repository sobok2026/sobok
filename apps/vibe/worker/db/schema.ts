import type { AssessmentProfile, ItemAnswer, PersonaSource, WorkAnswer } from '@deep-type/model'
import { sql } from 'drizzle-orm'
import { bigint, index, integer, jsonb, pgSchema, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'

import type { ReportSection } from '../report/section-keys'
import { createdAt, timestamps } from './columns'

// The deeptype payments/report tables live in a DEDICATED `deeptype` schema on the SHARED sobok-prod Supabase
// Postgres (Seoul) — NOT the public schema, where nothing app-owned sits; the stella comment board has its
// own `stella` schema.
export const deeptype = pgSchema('deeptype')

export const localeEnum = deeptype.enum('locale', ['ko', 'en', 'ja', 'zh'])
export const providerEnum = deeptype.enum('provider', ['portone'])
export const skuEnum = deeptype.enum('sku', ['report', 'compat', 'bundle'])
export const purchaseStatusEnum = deeptype.enum('purchase_status', ['pending', 'paid', 'failed', 'refunded'])
export const reportStatusEnum = deeptype.enum('report_status', ['pending', 'generating', 'done', 'failed'])

// The section vocabulary is NOT declared here any more. It moved to worker/report/section-keys.ts so the Next
// client can import it without pulling drizzle and the `pgSchema()` side effect above into the browser bundle.
export type { ReportSection } from '../report/section-keys'

// The paid pass is answered over two sittings, so the in-progress set is parked here between them. It is a
// draft by definition: no length holds until the block is submitted, which is why it can never be fed to the
// scorer without going through the wire schemas first.
export interface RefinementDraft {
  answers: ItemAnswer[]
  workAnswers: WorkAnswer[]
}

// One row per completed free assessment. Codes and profiles are always computed by the Worker from the
// versioned raw answer set; the client never supplies authoritative score data.
export const resultTable = deeptype.table(
  'result',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    resultToken: varchar('result_token', { length: 43 }).notNull().unique(),
    locale: localeEnum().notNull().default('ko'),
    instrumentVersion: varchar('instrument_version', { length: 16 }).notNull(),
    // The four-letter code is offered by the respondent, never measured, so 'I did not answer' is a legitimate
    // state and is written as NULL. Rows created before the declaration replaced the measured persona carry a
    // measured code here; `persona_source` is what tells the two apart.
    personaCode: varchar('persona_code', { length: 4 }),
    // Two values only — 'declared' | 'unknown'. Not 'measured': a default outside the domain would silently
    // make `selfReportGap` generation conditions unreachable on backfilled rows.
    personaSource: varchar('persona_source', { length: 8 }).$type<PersonaSource>().notNull().default('unknown'),
    innerCode: varchar('inner_code', { length: 4 }).notNull(),
    gemCode: varchar('gem_code', { length: 4 }).notNull(),
    baseAnswers: jsonb('base_answers').$type<ItemAnswer[]>().notNull(),
    // The free drain block, kept apart from the paid forced-choice set on purpose. One shared column would take
    // two partial writes at two different times, which defeats the fixed-length wire schemas and erases the
    // difference between 'only took the free pass' and 'paid but never finished'.
    freeWorkAnswers: jsonb('free_work_answers').$type<WorkAnswer[]>(),
    // When the free drain block was answered. The paid block is only summed with it when the two sittings fall
    // inside the same recall window; past the threshold the report is rebuilt from the paid answers alone.
    freeWorkAnswersAt: timestamp('free_work_answers_at', { precision: 3, withTimezone: true }),
    refinementAnswers: jsonb('refinement_answers').$type<ItemAnswer[]>(),
    workAnswers: jsonb('work_answers').$type<WorkAnswer[]>(),
    refinementDraft: jsonb('refinement_draft').$type<RefinementDraft>(),
    refinementDraftAt: timestamp('refinement_draft_at', { precision: 3, withTimezone: true }),
    baseProfile: jsonb('base_profile').$type<AssessmentProfile>().notNull(),
    refinedProfile: jsonb('refined_profile').$type<AssessmentProfile>(),
    ...timestamps,
  },
  (t) => [
    index('idx_deeptype_result_created').on(t.createdAt),
    index('idx_deeptype_result_codes').on(t.personaCode, t.innerCode, t.gemCode),
  ],
)

export const purchaseTable = deeptype.table(
  'purchase',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    // Report-gating handle, minted at checkout, carried across the PortOne redirect. Cleared when the
    // one-year report-access window ends while the minimal transaction record remains for five years.
    accessToken: varchar('access_token', { length: 43 }).unique(),
    // The order id we send to PortOne (server-minted; the sole join key back from the PG/webhook).
    paymentId: varchar('payment_id', { length: 64 }).notNull().unique(),
    resultId: bigint('result_id', { mode: 'number' }).references(() => resultTable.id, { onDelete: 'set null' }),
    // Plaintext + lookup hash exist only during the one-year re-open window, then both are cleared.
    email: varchar('email', { length: 254 }),
    emailHash: varchar('email_hash', { length: 64 }),
    orderName: varchar('order_name', { length: 128 }).notNull(),
    // Minor units (₩5900 → 5900). Server is the sole price authority.
    amount: bigint({ mode: 'number' }).notNull(),
    currency: varchar({ length: 3 }).notNull().default('KRW'),
    sku: skuEnum().notNull(),
    provider: providerEnum().notNull().default('portone'),
    method: varchar('method', { length: 32 }),
    providerTxnId: varchar('provider_txn_id', { length: 128 }),
    status: purchaseStatusEnum().notNull().default('pending'),
    failureCode: varchar('failure_code', { length: 64 }),
    failureMessage: varchar('failure_message', { length: 256 }),
    // Two separate consents captured at the pre-payment checkbox (청약철회 제한 + 개인정보 수집·이용).
    consentWithdrawalAt: timestamp('consent_withdrawal_at', { precision: 3, withTimezone: true }).notNull(),
    consentPrivacyAt: timestamp('consent_privacy_at', { precision: 3, withTimezone: true }).notNull(),
    // Self-attestation only; no date of birth is collected.
    ageConfirmedAt: timestamp('age_confirmed_at', { precision: 3, withTimezone: true }).notNull(),
    paidAt: timestamp('paid_at', { precision: 3, withTimezone: true }),
    refundedAt: timestamp('refunded_at', { precision: 3, withTimezone: true }),
    // Stamped when the done report is actually delivered to the client — gates the unviewed-refund right.
    viewedAt: timestamp('viewed_at', { precision: 3, withTimezone: true }),
    // One-shot guard for the nudge sent to buyers who paid and then abandoned the paid block. Set before the
    // send, never cleared: a second reminder is worse than a missed one.
    reminderSentAt: timestamp('reminder_sent_at', { precision: 3, withTimezone: true }),
    // GA4 identity snapshotted in the browser at checkout, carried here because the grant that emits the
    // server-side `purchase` may be performed by the webhook or the reconcile cron, with no browser attached.
    // Both are null when `analytics_storage` was denied, and are cleared the moment the event is accepted —
    // they are single-use routing data, not part of the transaction record.
    gaClientId: varchar('ga_client_id', { length: 64 }),
    // The `_ga_<stream>` cookie is stored whole, unparsed (see @sobok/analytics/ga-identity). Its current
    // `GS2.…` form runs to ~95 characters and Google has changed the shape once without notice, so the column
    // is sized for the value plus room to grow rather than for today's exact grammar.
    gaSessionId: varchar('ga_session_id', { length: 128 }),
    ...timestamps,
  },
  (t) => [
    index('idx_deeptype_purchase_result').on(t.resultId),
    index('idx_deeptype_purchase_email_hash').on(t.emailHash),
    index('idx_deeptype_purchase_paid_at').on(t.paidAt),
    index('idx_deeptype_purchase_pending_created').on(t.createdAt).where(sql`status = 'pending'`),
    // No double-buy of the same product for one result.
    uniqueIndex('uq_deeptype_purchase_paid_sku').on(t.resultId, t.sku).where(sql`status = 'paid'`),
    uniqueIndex('uq_deeptype_purchase_provider_txn').on(t.provider, t.providerTxnId),
  ],
)

// One-time, short-lived email magic links. Only the SHA-256 digest is stored; the raw token exists solely
// in the message URL. Rows cascade with the purchase and are also swept after expiry/consumption.
export const reopenAccessTable = deeptype.table(
  'reopen_access',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    purchaseId: bigint('purchase_id', { mode: 'number' })
      .notNull()
      .references(() => purchaseTable.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { precision: 3, withTimezone: true }),
    createdAt,
  },
  (t) => [index('idx_deeptype_reopen_purchase').on(t.purchaseId), index('idx_deeptype_reopen_expires').on(t.expiresAt)],
)

// 1:1 with a purchase. The rule engine writes `sections` under its own CAS lock; the LLM narrative is a second,
// independent pass with its own lock and its own terminal state. The two never share a lock token — a shared
// one lets whichever pass finishes first release a lease the other is still holding.
export const reportTable = deeptype.table(
  'report',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    purchaseId: bigint('purchase_id', { mode: 'number' })
      .notNull()
      .unique()
      .references(() => purchaseTable.id, { onDelete: 'cascade' }),
    model: varchar('model', { length: 64 }).notNull().default('claude-haiku-4-5-20251001'),
    status: reportStatusEnum().notNull().default('pending'),
    sections: jsonb('sections').$type<ReportSection[]>(),
    error: text('error'),
    attempts: integer('attempts').notNull().default(0),
    lockToken: varchar('lock_token', { length: 43 }),
    lockedAt: timestamp('locked_at', { precision: 3, withTimezone: true }),
    generatedAt: timestamp('generated_at', { precision: 3, withTimezone: true }),
    // Narrative pass. `report_status` is reused rather than cloned: the state machine is the same four states
    // and a second enum type with an identical value set would only add a name to keep in sync.
    narrative: jsonb('narrative').$type<ReportSection[]>(),
    narrativeStatus: reportStatusEnum('narrative_status').notNull().default('pending'),
    narrativeModel: varchar('narrative_model', { length: 64 }),
    narrativeError: text('narrative_error'),
    narrativeAttempts: integer('narrative_attempts').notNull().default(0),
    narrativeLockToken: varchar('narrative_lock_token', { length: 43 }),
    narrativeLockedAt: timestamp('narrative_locked_at', { precision: 3, withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('idx_deeptype_report_status').on(t.status)],
)

// Inbound PortOne webhook idempotency (Standard Webhooks event id).
export const webhookEventTable = deeptype.table(
  'webhook_event',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    provider: providerEnum().notNull().default('portone'),
    eventId: varchar('event_id', { length: 128 }).notNull(),
    type: varchar('type', { length: 64 }).notNull(),
    payload: text('payload').notNull(),
    createdAt,
  },
  (t) => [uniqueIndex('uq_deeptype_webhook_event').on(t.provider, t.eventId)],
)
