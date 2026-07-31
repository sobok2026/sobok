import { createdAt, timestamps } from '@sobok/edge/db/columns'
import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'
import type { GuardianFamilySelection, GuardianSelectedCard } from '../../guardian/draw'
import {
  GUARDIAN_PRODUCT_KINDS,
  GUARDIAN_RARITIES,
  type GuardianFullReportProductSku,
  type GuardianProductSku,
  type GuardianReportInputSnapshot,
} from '../../guardian/manifest'
import type {
  GuardianQuestionnaireAnswerSnapshot,
  GuardianQuestionnaireSignalSnapshot,
} from '../../guardian/questionnaire'
import { localeEnum, stella } from './common'
import {
  guardianQuestionKindEnum,
  guardianQuestionnaireVersionTable,
  guardianQuestionOptionTable,
  guardianQuestionTable,
  guardianSlotEnum,
} from './guardian-questionnaire'

export const guardianReportStatusEnum = stella.enum('guardian_report_status', ['draft', 'fulfilled'])
export const guardianProductKindEnum = stella.enum('guardian_product_kind', [...GUARDIAN_PRODUCT_KINDS])
export const guardianRarityEnum = stella.enum('guardian_rarity', [...GUARDIAN_RARITIES])
export const guardianGrantKindEnum = stella.enum('guardian_grant_kind', ['paid', 'account_save_reward'])

export const guardianPurchaseStatusEnum = stella.enum('guardian_purchase_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
])

export const guardianAcquisitionSourceEnum = stella.enum('guardian_acquisition_source', [
  'initial_report',
  'paid_redraw',
  'account_save_reward',
])

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
