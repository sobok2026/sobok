import { identityId } from '@sobok/edge/db/columns'
import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'
import { GUARDIAN_REPORT_SLOTS, type GuardianFullReportProductSku } from '../../guardian/manifest'
import type { GuardianQuestionSignals } from '../../guardian/questionnaire'
import { localeEnum, stella } from './common'

export const guardianSlotEnum = stella.enum('guardian_slot', [...GUARDIAN_REPORT_SLOTS])
export const guardianQuestionPhaseEnum = stella.enum('guardian_question_phase', ['core', 'adaptive'])
export const guardianQuestionKindEnum = stella.enum('guardian_question_kind', ['single_choice', 'free_text'])

// ── Zodiac Guardian paid product ─────────────────────────────────────────────────────────────────────
// Paid prompts, option labels, branches, and signal weights are tracked as server content but never imported
// into Next/static assets. The publisher inserts one validated, immutable version in a single transaction.
// Runtime reads only the version pinned to a paid report and returns one allow-listed question at a time.
export const guardianQuestionnaireVersionTable = stella.table(
  'guardian_questionnaire_version',
  {
    id: identityId,
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
    id: identityId,
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
    id: identityId,
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
