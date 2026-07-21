import { sql } from 'drizzle-orm'
import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

import { createdAt, timestamps } from './columns'

// Isolated deeptype Postgres (Aiven), reached from the Worker via Hyperdrive. Plain tables — NOT RLS.
// There is no better-auth user context here; access is enforced in the Worker via unguessable per-row
// tokens (result_token / access_token). At the DB boundary, a least-privilege `deeptype_app` role
// (SELECT/INSERT/UPDATE, no DELETE/DDL) is what both Hyperdrive connection strings authenticate as; a
// separate owner role runs `drizzle-kit push`, and a separate DELETE-capable role runs the purge job.

export const localeEnum = pgEnum('dt_locale', ['ko', 'en', 'ja', 'zh'])
export const providerEnum = pgEnum('dt_provider', ['portone'])
export const skuEnum = pgEnum('dt_sku', ['report', 'compat', 'bundle'])
export const purchaseStatusEnum = pgEnum('dt_purchase_status', ['pending', 'paid', 'failed', 'refunded'])
export const reportStatusEnum = pgEnum('dt_report_status', ['pending', 'generating', 'done', 'failed'])

export const REPORT_SECTION_KEYS = [
  'summary',
  'gap',
  'abyss',
  'love',
  'work',
  'money',
  'growthStory',
  'energy',
  'relationCaution',
  'flow',
  'match',
  'thisWeek',
] as const
export type ReportSectionKey = (typeof REPORT_SECTION_KEYS)[number]
export interface ReportSection {
  key: ReportSectionKey
  title: string
  body: string
}

// Raw quiz payloads are the client-posted responses. Their exact serialization is finalized when
// /session (Phase 2) and /precision (Phase 5) are wired; kept as opaque arrays until then. axis_strengths
// and profile are computed server-side (Phase 5) — never trusted from the client.
type RawAnswers = unknown[]
type AxisStrengths = Record<string, number>
type ReportProfile = Record<string, unknown>

// The free-tier record. One row per completed 간이 test; the paid report narrates this.
export const resultTable = pgTable(
  'deeptype_result',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    resultToken: varchar('result_token', { length: 43 }).notNull().unique(),
    locale: localeEnum().notNull().default('ko'),
    selfClaim: varchar('self_claim', { length: 4 }),
    persona: varchar('persona', { length: 4 }),
    innerType: varchar('inner_type', { length: 4 }),
    gem: varchar('gem', { length: 4 }),
    baseAnswers: jsonb('base_answers').$type<RawAnswers>().notNull().default(sql`'[]'::jsonb`),
    innerAnswers: jsonb('inner_answers').$type<RawAnswers>().notNull().default(sql`'[]'::jsonb`),
    gemAnswers: jsonb('gem_answers').$type<RawAnswers>().notNull().default(sql`'[]'::jsonb`),
    precisionAnswers: jsonb('precision_answers').$type<RawAnswers>(),
    axisStrengths: jsonb('axis_strengths').$type<AxisStrengths>(),
    profile: jsonb('profile').$type<ReportProfile>(),
    ...timestamps,
  },
  (t) => [
    index('idx_dt_result_created').on(t.createdAt),
    // Aggregate stats: "자칭 vs 실측" and gem/type distribution.
    index('idx_dt_result_codes').on(t.persona, t.innerType, t.gem),
  ],
)

export const purchaseTable = pgTable(
  'deeptype_purchase',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    // Report-gating handle, minted at checkout, carried across the PortOne redirect.
    accessToken: varchar('access_token', { length: 43 }).notNull().unique(),
    // The order id we send to PortOne (server-minted; the sole join key back from the PG/webhook).
    paymentId: varchar('payment_id', { length: 64 }).notNull().unique(),
    resultId: bigint('result_id', { mode: 'number' })
      .notNull()
      .references(() => resultTable.id, { onDelete: 'restrict' }),
    email: varchar('email', { length: 254 }).notNull(),
    // Lookup/dedup key; never used to reveal the plaintext email.
    emailHash: varchar('email_hash', { length: 64 }).notNull(),
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
    paidAt: timestamp('paid_at', { precision: 3, withTimezone: true }),
    refundedAt: timestamp('refunded_at', { precision: 3, withTimezone: true }),
    // Stamped when the done report is actually delivered to the client — gates the unviewed-refund right.
    viewedAt: timestamp('viewed_at', { precision: 3, withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('idx_dt_purchase_result').on(t.resultId),
    index('idx_dt_purchase_email_hash').on(t.emailHash),
    index('idx_dt_purchase_paid_at').on(t.paidAt),
    index('idx_dt_purchase_pending_created').on(t.createdAt).where(sql`status = 'pending'`),
    // No double-buy of the same product for one result.
    uniqueIndex('uq_dt_purchase_paid_sku').on(t.resultId, t.sku).where(sql`status = 'paid'`),
    uniqueIndex('uq_dt_purchase_provider_txn').on(t.provider, t.providerTxnId),
  ],
)

// 1:1 with a purchase. Generated exactly once (CAS lock via lock_token), cache-first on read.
export const reportTable = pgTable(
  'deeptype_report',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    purchaseId: bigint('purchase_id', { mode: 'number' })
      .notNull()
      .unique()
      .references(() => purchaseTable.id, { onDelete: 'cascade' }),
    model: varchar('model', { length: 64 }).notNull().default('claude-haiku-4-5'),
    status: reportStatusEnum().notNull().default('pending'),
    sections: jsonb('sections').$type<ReportSection[]>(),
    error: text('error'),
    attempts: integer('attempts').notNull().default(0),
    lockToken: varchar('lock_token', { length: 43 }),
    lockedAt: timestamp('locked_at', { precision: 3, withTimezone: true }),
    generatedAt: timestamp('generated_at', { precision: 3, withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('idx_dt_report_status').on(t.status)],
)

// Inbound PortOne webhook idempotency (Standard Webhooks event id).
export const webhookEventTable = pgTable(
  'deeptype_webhook_event',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    provider: providerEnum().notNull().default('portone'),
    eventId: varchar('event_id', { length: 128 }).notNull(),
    type: varchar('type', { length: 64 }).notNull(),
    payload: text('payload').notNull(),
    createdAt,
  },
  (t) => [uniqueIndex('uq_dt_webhook_event').on(t.provider, t.eventId)],
)
