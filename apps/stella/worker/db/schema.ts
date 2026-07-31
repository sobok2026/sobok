import { LOCALES } from '@sobok/domain/locale'
import { createdAt, timestamps } from '@sobok/edge/db/columns'
import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'
import type { GuardianFamilySelection, GuardianSelectedCard } from '../guardian/draw'
import {
  GUARDIAN_PRODUCT_KINDS,
  GUARDIAN_RARITIES,
  GUARDIAN_REPORT_SLOTS,
  type GuardianFullReportProductSku,
  type GuardianProductSku,
  type GuardianReportInputSnapshot,
} from '../guardian/manifest'
import type {
  GuardianQuestionnaireAnswerSnapshot,
  GuardianQuestionnaireSignalSnapshot,
  GuardianQuestionSignals,
} from '../guardian/questionnaire'
import { DB_SCHEMA } from './schema-name'

// Stella's comment board and paid-card domain live in a DEDICATED schema on the SHARED Supabase Postgres —
// production uses `stella`, staging uses `stella_stg`, and neither uses `public`. This is load-bearing:
//   • drizzle-kit push is explicitly aimed at one schema as the OWNER, so it never sees (or proposes dropping)
//     the other environment or another app's tables.
//   • the runtime `stella_app` role can use both Stella schemas because both Workers share one Hyperdrive
//     connection identity; schema-qualified SQL and a pg_catalog-only search_path prevent cross-environment
//     fallback.
//   • neither Stella schema is added to Supabase's exposed schemas, so PostgREST never surfaces ipHash /
//     edit-token hashes over the anon REST API.
// Plain tables, NOT RLS — access is enforced in the Worker. Comments use Turnstile/rate limits/edit tokens;
// paid-card mutations additionally require fresh payment or collection/account authorization.
export const stella = pgSchema(DB_SCHEMA)

export const localeEnum = stella.enum('locale', [...LOCALES])
export const commentStatusEnum = stella.enum('comment_status', ['visible', 'hidden', 'removed'])
export const reportReasonEnum = stella.enum('report_reason', ['spam', 'abuse', 'sexual', 'privacy', 'other'])
export const guardianReportStatusEnum = stella.enum('guardian_report_status', ['draft', 'fulfilled'])
export const guardianProductKindEnum = stella.enum('guardian_product_kind', [...GUARDIAN_PRODUCT_KINDS])
export const guardianPurchaseStatusEnum = stella.enum('guardian_purchase_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
])
export const guardianSlotEnum = stella.enum('guardian_slot', [...GUARDIAN_REPORT_SLOTS])
export const guardianRarityEnum = stella.enum('guardian_rarity', [...GUARDIAN_RARITIES])
export const guardianAcquisitionSourceEnum = stella.enum('guardian_acquisition_source', [
  'initial_report',
  'paid_redraw',
  'account_save_reward',
])
export const guardianGrantKindEnum = stella.enum('guardian_grant_kind', ['paid', 'account_save_reward'])
export const guardianQuestionPhaseEnum = stella.enum('guardian_question_phase', ['core', 'adaptive'])
export const guardianQuestionKindEnum = stella.enum('guardian_question_kind', ['single_choice', 'free_text'])

// One board per (locale, topicKey). topicKey is the persistent public identifier minted by the client's
// versioned topicKey() (e.g. 'planet-sun-aries', 'aspect-sun-moon-trine') — an opaque string to the server,
// which only validates its shape. Lazily upserted on first comment.
export const commentThreadTable = stella.table(
  'comment_thread',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    locale: localeEnum().notNull(),
    topicKey: varchar('topic_key', { length: 48 }).notNull(),
    // Visible-comment count, maintained transactionally on create/remove/auto-hide.
    commentCount: integer('comment_count').notNull().default(0),
    lastCommentAt: timestamp('last_comment_at', { precision: 3, withTimezone: true }),
    // Board-level moderation kill-switch — blocks new comments without touching existing ones.
    locked: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [uniqueIndex('uq_stella_thread_topic').on(t.locale, t.topicKey)],
)

export const commentTable = stella.table(
  'comment',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    // Client-facing opaque ref (random, 12 chars). The sequential id is NEVER exposed — prevents enumeration
    // / id-walking to brigade or scrape the board.
    publicId: varchar('public_id', { length: 24 }).notNull().unique(),
    threadId: bigint('thread_id', { mode: 'number' })
      .notNull()
      .references(() => commentThreadTable.id, { onDelete: 'restrict' }),
    // Optional display name; null renders as the localized "익명".
    nickname: varchar('nickname', { length: 24 }),
    // SHA-256 of the author's editToken — the sole edit/delete capability. Only the hash is stored, so a DB
    // leak cannot forge edits. No password: cross-device edit was dropped (offline-cracking / PII liability).
    editTokenHash: varchar('edit_token_hash', { length: 64 }).notNull(),
    body: text().notNull(),
    status: commentStatusEnum().notNull().default('visible'),
    reportCount: integer('report_count').notNull().default(0),
    // Pseudonymous, network-normalized IP hash for abuse tracing. NULLed by the retention cron after 90 days.
    ipHash: varchar('ip_hash', { length: 64 }),
    ...timestamps,
  },
  (t) => [
    // List query: newest-first within a thread, composite (createdAt, id) tiebreak for stable cursoring.
    index('idx_stella_comment_thread_created').on(t.threadId, t.createdAt, t.id).where(sql`status = 'visible'`),
    // Retention scan for removed/hidden rows past their soft-delete window.
    index('idx_stella_comment_moderated').on(t.updatedAt).where(sql`status in ('removed', 'hidden')`),
  ],
)

// One report per (comment, reporter-ipHash). Threshold crossing auto-hides (reversible) via the API.
export const commentReportTable = stella.table(
  'comment_report',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    commentId: bigint('comment_id', { mode: 'number' })
      .notNull()
      .references(() => commentTable.id, { onDelete: 'cascade' }),
    reason: reportReasonEnum().notNull(),
    ipHash: varchar('ip_hash', { length: 64 }),
    createdAt,
  },
  (t) => [uniqueIndex('uq_stella_report_comment_ip').on(t.commentId, t.ipHash)],
)

// Atomic fixed-window rate limiter. Every write bumps its row via INSERT … ON CONFLICT DO UPDATE hits+1
// RETURNING hits — race-free, unlike a SELECT count(*) + decide. Old windows are dropped by the retention cron.
export const rateLimitTable = stella.table(
  'rate_limit',
  {
    bucket: varchar({ length: 16 }).notNull(),
    ipHash: varchar('ip_hash', { length: 64 }).notNull(),
    windowStart: timestamp('window_start', { precision: 3, withTimezone: true }).notNull(),
    hits: integer().notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.bucket, t.ipHash, t.windowStart] })],
)

// ── Zodiac Guardian paid product ─────────────────────────────────────────────────────────────────────
// Paid prompts, option labels, branches, and signal weights are tracked as server content but never imported
// into Next/static assets. The publisher inserts one validated, immutable version in a single transaction.
// Runtime reads only the version pinned to a paid report and returns one allow-listed question at a time.
export const guardianQuestionnaireVersionTable = stella.table(
  'guardian_questionnaire_version',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    version: varchar({ length: 64 }).notNull().unique(),
    schemaVersion: integer('schema_version').notNull(),
    productSku: varchar('product_sku', { length: 64 }).$type<GuardianFullReportProductSku>().notNull(),
    locale: localeEnum().notNull(),
    entryQuestionId: varchar('entry_question_id', { length: 64 }).notNull(),
    coreQuestionCount: integer('core_question_count').notNull(),
    maximumAdaptiveQuestions: integer('maximum_adaptive_questions').notNull(),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    publishedAt: timestamp('published_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_stella_guardian_questionnaire_product_locale').on(t.productSku, t.locale, t.publishedAt),
    check('ck_stella_guardian_questionnaire_schema_positive', sql`${t.schemaVersion} > 0`),
    check('ck_stella_guardian_questionnaire_core_positive', sql`${t.coreQuestionCount} > 0`),
    check('ck_stella_guardian_questionnaire_adaptive_nonnegative', sql`${t.maximumAdaptiveQuestions} >= 0`),
  ],
)

export const guardianQuestionTable = stella.table(
  'guardian_question',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    questionnaireVersionId: bigint('questionnaire_version_id', { mode: 'number' })
      .notNull()
      .references(() => guardianQuestionnaireVersionTable.id, { onDelete: 'cascade' }),
    questionId: varchar('question_id', { length: 64 }).notNull(),
    position: integer().notNull(),
    slot: guardianSlotEnum().notNull(),
    phase: guardianQuestionPhaseEnum().notNull(),
    kind: guardianQuestionKindEnum().notNull(),
    prompt: text().notNull(),
    supportingText: text('supporting_text'),
    optional: boolean().notNull().default(false),
    nextQuestionId: varchar('next_question_id', { length: 64 }),
  },
  (t) => [
    uniqueIndex('uq_stella_guardian_question_version_id').on(t.questionnaireVersionId, t.questionId),
    uniqueIndex('uq_stella_guardian_question_version_position').on(t.questionnaireVersionId, t.position),
    check('ck_stella_guardian_question_position_nonnegative', sql`${t.position} >= 0`),
    check(
      'ck_stella_guardian_question_kind_shape',
      sql`(${t.kind} = 'single_choice' and not ${t.optional} and ${t.nextQuestionId} is null)
        or (${t.kind} = 'free_text' and ${t.optional})`,
    ),
  ],
)

export const guardianQuestionOptionTable = stella.table(
  'guardian_question_option',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    questionId: bigint('question_id', { mode: 'number' })
      .notNull()
      .references(() => guardianQuestionTable.id, { onDelete: 'cascade' }),
    optionId: varchar('option_id', { length: 64 }).notNull(),
    position: integer().notNull(),
    label: text().notNull(),
    nextQuestionId: varchar('next_question_id', { length: 64 }),
    signals: jsonb().$type<GuardianQuestionSignals>().notNull(),
  },
  (t) => [
    uniqueIndex('uq_stella_guardian_option_question_id').on(t.questionId, t.optionId),
    uniqueIndex('uq_stella_guardian_option_question_position').on(t.questionId, t.position),
    check('ck_stella_guardian_option_position_nonnegative', sql`${t.position} >= 0`),
    check('ck_stella_guardian_option_signals_object', sql`jsonb_typeof(${t.signals}) = 'object'`),
  ],
)

// `guardian_collection` is the ownership aggregate before AND after sign-up. Guest checkout creates one;
// the future Stella account layer claims that same row instead of copying cards or resetting pity progress.
export const guardianCollectionTable = stella.table('guardian_collection', {
  id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  publicId: varchar('public_id', { length: 24 }).notNull().unique(),
  // The raw collection capability is returned once and never stored. Future account sessions can authorize
  // the same collection without this token; account claim clears this hash so the guest capability cannot
  // remain as a second, perpetual way into the account-owned collection.
  accessTokenHash: varchar('access_token_hash', { length: 64 }).unique(),
  ...timestamps,
})

// A paid report is append-only at the product level: inputs, selected families, versions, and the initial
// four cards are snapshotted. Redraw acquisitions are separate rows, so old paid output never changes when
// the live manifest, copy, odds, or artwork evolves.
export const guardianReportTable = stella.table(
  'guardian_report',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    publicId: varchar('public_id', { length: 24 }).notNull().unique(),
    collectionId: bigint('collection_id', { mode: 'number' })
      .notNull()
      .references(() => guardianCollectionTable.id, { onDelete: 'restrict' }),
    locale: localeEnum().notNull(),
    status: guardianReportStatusEnum().notNull().default('draft'),
    productSku: varchar('product_sku', { length: 64 }).$type<GuardianFullReportProductSku>().notNull(),
    manifestVersion: varchar('manifest_version', { length: 64 }).notNull(),
    selectionRuleVersion: varchar('selection_rule_version', { length: 64 }).notNull(),
    oddsVersion: varchar('odds_version', { length: 64 }).notNull(),
    copyVersion: varchar('copy_version', { length: 64 }).notNull(),
    renderVersion: varchar('render_version', { length: 64 }).notNull(),
    questionnaireVersion: varchar('questionnaire_version', { length: 64 })
      .notNull()
      .references(() => guardianQuestionnaireVersionTable.version, { onDelete: 'restrict' }),
    inputSnapshot: jsonb('input_snapshot').$type<GuardianReportInputSnapshot>().notNull(),
    questionnaireAnswerSnapshot: jsonb('questionnaire_answer_snapshot').$type<GuardianQuestionnaireAnswerSnapshot>(),
    questionnaireSignalSnapshot: jsonb('questionnaire_signal_snapshot').$type<GuardianQuestionnaireSignalSnapshot>(),
    questionnaireCompletedAt: timestamp('questionnaire_completed_at', { precision: 3, withTimezone: true }),
    familySnapshot: jsonb('family_snapshot').$type<GuardianFamilySelection>(),
    // Denormalized because every redraw must verify its target family without parsing a JSON snapshot.
    loveFamilyId: varchar('love_family_id', { length: 64 }),
    cardSnapshot: jsonb('card_snapshot').$type<GuardianSelectedCard[]>(),
    fulfilledAt: timestamp('fulfilled_at', { precision: 3, withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('idx_stella_guardian_report_collection').on(t.collectionId, t.createdAt),
    index('idx_stella_guardian_report_status').on(t.status, t.createdAt),
    check(
      'ck_stella_guardian_questionnaire_snapshot_complete',
      sql`(${t.questionnaireAnswerSnapshot} is null
          and ${t.questionnaireSignalSnapshot} is null
          and ${t.questionnaireCompletedAt} is null)
        or (${t.questionnaireAnswerSnapshot} is not null
          and ${t.questionnaireSignalSnapshot} is not null
          and ${t.questionnaireCompletedAt} is not null)`,
    ),
    check(
      'ck_stella_guardian_report_fulfillment_shape',
      sql`(${t.status} = 'draft'
          and ${t.familySnapshot} is null
          and ${t.loveFamilyId} is null
          and ${t.cardSnapshot} is null
          and ${t.fulfilledAt} is null)
        or (${t.status} = 'fulfilled'
          and ${t.questionnaireAnswerSnapshot} is not null
          and ${t.questionnaireSignalSnapshot} is not null
          and ${t.questionnaireCompletedAt} is not null
          and ${t.familySnapshot} is not null
          and ${t.loveFamilyId} is not null
          and ${t.cardSnapshot} is not null
          and ${t.fulfilledAt} is not null)`,
    ),
  ],
)

// One row per answered question keeps autosave small and makes the current branch derivable after any
// reconnect. The report receives an immutable ID-based answer/signal snapshot only when the branch completes.
export const guardianQuestionAnswerTable = stella.table(
  'guardian_question_answer',
  {
    reportId: bigint('report_id', { mode: 'number' })
      .notNull()
      .references(() => guardianReportTable.id, { onDelete: 'restrict' }),
    questionId: bigint('question_id', { mode: 'number' })
      .notNull()
      .references(() => guardianQuestionTable.id, { onDelete: 'restrict' }),
    kind: guardianQuestionKindEnum().notNull(),
    optionId: bigint('option_id', { mode: 'number' }).references(() => guardianQuestionOptionTable.id, {
      onDelete: 'restrict',
    }),
    textValue: text('text_value'),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.reportId, t.questionId] }),
    index('idx_stella_guardian_answer_report_created').on(t.reportId, t.createdAt),
    check(
      'ck_stella_guardian_answer_kind_shape',
      sql`(${t.kind} = 'single_choice' and ${t.optionId} is not null and ${t.textValue} is null)
        or (${t.kind} = 'free_text' and ${t.optionId} is null)`,
    ),
  ],
)

// Payment-provider verification will be connected in a later phase. Until then no public route may create
// or transition these rows. The server manifest is the sole SKU/price source and every granted entitlement
// is tied back to one paid purchase or to an explicitly named one-shot reward.
export const guardianPurchaseTable = stella.table(
  'guardian_purchase',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    paymentId: varchar('payment_id', { length: 64 }).notNull().unique(),
    collectionId: bigint('collection_id', { mode: 'number' })
      .notNull()
      .references(() => guardianCollectionTable.id, { onDelete: 'restrict' }),
    reportId: bigint('report_id', { mode: 'number' })
      .notNull()
      .references(() => guardianReportTable.id, { onDelete: 'restrict' }),
    sku: varchar({ length: 64 }).$type<GuardianProductSku>().notNull(),
    kind: guardianProductKindEnum().notNull(),
    amount: bigint({ mode: 'number' }).notNull(),
    market: varchar({ length: 8 }).notNull(),
    currency: varchar({ length: 3 }).notNull(),
    manifestVersion: varchar('manifest_version', { length: 64 }).notNull(),
    provider: varchar({ length: 32 }).notNull().default('portone'),
    method: varchar({ length: 32 }),
    providerTxnId: varchar('provider_txn_id', { length: 128 }),
    status: guardianPurchaseStatusEnum().notNull().default('pending'),
    failureCode: varchar('failure_code', { length: 64 }),
    failureMessage: varchar('failure_message', { length: 256 }),
    paidAt: timestamp('paid_at', { precision: 3, withTimezone: true }),
    refundedAt: timestamp('refunded_at', { precision: 3, withTimezone: true }),
    entitlementGrantedAt: timestamp('entitlement_granted_at', { precision: 3, withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('idx_stella_guardian_purchase_collection').on(t.collectionId, t.createdAt),
    index('idx_stella_guardian_purchase_pending').on(t.createdAt).where(sql`status = 'pending'`),
    uniqueIndex('uq_stella_guardian_purchase_active_full_report')
      .on(t.reportId)
      .where(sql`status in ('pending', 'paid') and kind = 'full_report'`),
    uniqueIndex('uq_stella_guardian_purchase_provider_txn').on(t.provider, t.providerTxnId),
    check('ck_stella_guardian_purchase_amount_positive', sql`${t.amount} > 0`),
  ],
)

// Credits are grants rather than a mutable, source-less balance. `grant_key` makes both a paid entitlement
// and the account-save reward idempotent; total/consumed preserve exactly which grant funded each draw.
export const guardianRedrawGrantTable = stella.table(
  'guardian_redraw_grant',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    grantKey: varchar('grant_key', { length: 96 }).notNull().unique(),
    collectionId: bigint('collection_id', { mode: 'number' })
      .notNull()
      .references(() => guardianCollectionTable.id, { onDelete: 'restrict' }),
    reportId: bigint('report_id', { mode: 'number' })
      .notNull()
      .references(() => guardianReportTable.id, { onDelete: 'restrict' }),
    purchaseId: bigint('purchase_id', { mode: 'number' })
      .unique()
      .references(() => guardianPurchaseTable.id, { onDelete: 'restrict' }),
    familyId: varchar('family_id', { length: 64 }).notNull(),
    kind: guardianGrantKindEnum().notNull(),
    totalCredits: integer('total_credits').notNull(),
    consumedCredits: integer('consumed_credits').notNull().default(0),
    manifestVersion: varchar('manifest_version', { length: 64 }).notNull(),
    ...timestamps,
  },
  (t) => [
    index('idx_stella_guardian_grant_available').on(t.collectionId, t.reportId, t.createdAt),
    check('ck_stella_guardian_grant_total_positive', sql`${t.totalCredits} > 0`),
    check(
      'ck_stella_guardian_grant_consumed_range',
      sql`${t.consumedCredits} >= 0 and ${t.consumedCredits} <= ${t.totalCredits}`,
    ),
    check(
      'ck_stella_guardian_grant_provenance',
      sql`(${t.kind} = 'paid' and ${t.purchaseId} is not null)
        or (${t.kind} = 'account_save_reward' and ${t.purchaseId} is null)`,
    ),
  ],
)

// MVP uses familyId as scopeId. Keeping the scope opaque lets a later season choose an album-level guarantee
// without changing the counter table or overloading the card-family column.
export const guardianGuaranteeProgressTable = stella.table(
  'guardian_guarantee_progress',
  {
    collectionId: bigint('collection_id', { mode: 'number' })
      .notNull()
      .references(() => guardianCollectionTable.id, { onDelete: 'restrict' }),
    scopeId: varchar('scope_id', { length: 96 }).notNull(),
    ruleVersion: varchar('rule_version', { length: 64 }).notNull(),
    paidDrawsInCycle: integer('paid_draws_in_cycle').notNull().default(0),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.scopeId] }),
    check('ck_stella_guardian_guarantee_nonnegative', sql`${t.paidDrawsInCycle} >= 0`),
  ],
)

// Every reveal is an immutable acquisition event. The initial four cards, duplicates, guaranteed outcomes,
// and reward draws therefore remain auditable without reconstructing history from the ownership aggregate.
export const guardianCardAcquisitionTable = stella.table(
  'guardian_card_acquisition',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    publicId: varchar('public_id', { length: 24 }).notNull().unique(),
    collectionId: bigint('collection_id', { mode: 'number' })
      .notNull()
      .references(() => guardianCollectionTable.id, { onDelete: 'restrict' }),
    reportId: bigint('report_id', { mode: 'number' })
      .notNull()
      .references(() => guardianReportTable.id, { onDelete: 'restrict' }),
    grantId: bigint('grant_id', { mode: 'number' }).references(() => guardianRedrawGrantTable.id, {
      onDelete: 'restrict',
    }),
    slot: guardianSlotEnum().notNull(),
    familyId: varchar('family_id', { length: 64 }).notNull(),
    editionId: varchar('edition_id', { length: 96 }).notNull(),
    rarity: guardianRarityEnum(),
    source: guardianAcquisitionSourceEnum().notNull(),
    duplicate: boolean().notNull(),
    guaranteeDue: boolean('guarantee_due').notNull().default(false),
    guaranteedUnowned: boolean('guaranteed_unowned').notNull().default(false),
    manifestVersion: varchar('manifest_version', { length: 64 }).notNull(),
    oddsVersion: varchar('odds_version', { length: 64 }).notNull(),
    createdAt,
  },
  (t) => [
    index('idx_stella_guardian_acquisition_collection').on(t.collectionId, t.createdAt),
    index('idx_stella_guardian_acquisition_report').on(t.reportId, t.createdAt),
    uniqueIndex('uq_stella_guardian_acquisition_initial_slot')
      .on(t.reportId, t.slot)
      .where(sql`source = 'initial_report'`),
    check(
      'ck_stella_guardian_acquisition_provenance',
      sql`(${t.source} = 'initial_report' and ${t.grantId} is null)
        or (${t.source} <> 'initial_report' and ${t.grantId} is not null)`,
    ),
    check('ck_stella_guardian_guaranteed_requires_due', sql`not ${t.guaranteedUnowned} or ${t.guaranteeDue}`),
  ],
)

// Fast collection reads and duplicate detection. The acquisition ledger above is canonical history; this row
// is the transactionally maintained aggregate used by collection and guarantee queries.
export const guardianCardOwnershipTable = stella.table(
  'guardian_card_ownership',
  {
    collectionId: bigint('collection_id', { mode: 'number' })
      .notNull()
      .references(() => guardianCollectionTable.id, { onDelete: 'restrict' }),
    editionId: varchar('edition_id', { length: 96 }).notNull(),
    familyId: varchar('family_id', { length: 64 }).notNull(),
    rarity: guardianRarityEnum(),
    acquisitionCount: integer('acquisition_count').notNull().default(1),
    firstAcquiredAt: timestamp('first_acquired_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
    lastAcquiredAt: timestamp('last_acquired_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.editionId] }),
    index('idx_stella_guardian_ownership_family').on(t.collectionId, t.familyId),
    check('ck_stella_guardian_ownership_count_positive', sql`${t.acquisitionCount} > 0`),
  ],
)
