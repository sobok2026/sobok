import type { AssessmentProfile, ItemAnswer } from '@deep-type/model'
import { sql } from 'drizzle-orm'
import { bigint, index, integer, jsonb, pgSchema, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'

import { createdAt, timestamps } from './columns'

// The deeptype payments/report tables live in a DEDICATED `deeptype` schema on the SHARED sobok-prod Supabase
// Postgres (Seoul) — NOT the public schema, where nothing app-owned sits; the stella comment board has its
// own `stella` schema.
const deeptype = pgSchema('deeptype')

export const localeEnum = deeptype.enum('locale', ['ko', 'en', 'ja', 'zh'])
export const providerEnum = deeptype.enum('provider', ['portone'])
export const skuEnum = deeptype.enum('sku', ['report', 'compat', 'bundle'])
export const purchaseStatusEnum = deeptype.enum('purchase_status', ['pending', 'paid', 'failed', 'refunded'])
export const reportStatusEnum = deeptype.enum('report_status', ['pending', 'generating', 'done', 'failed'])

export const REPORT_SECTION_KEYS = [
  'summary',
  'contextShift',
  'selfWorth',
  'relationships',
  'emotionRegulation',
  'motivation',
  'workStyle',
  'recovery',
  'strengths',
  'friction',
  'reflectionQuestions',
  'nextSteps',
] as const

export type ReportSectionKey = (typeof REPORT_SECTION_KEYS)[number]

export interface ReportSection {
  key: ReportSectionKey
  title: string
  body: string
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
    personaCode: varchar('persona_code', { length: 4 }).notNull(),
    innerCode: varchar('inner_code', { length: 4 }).notNull(),
    gemCode: varchar('gem_code', { length: 4 }).notNull(),
    baseAnswers: jsonb('base_answers').$type<ItemAnswer[]>().notNull(),
    refinementAnswers: jsonb('refinement_answers').$type<ItemAnswer[]>(),
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

// 1:1 with a purchase. Generated exactly once (CAS lock via lock_token), cache-first on read.
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
