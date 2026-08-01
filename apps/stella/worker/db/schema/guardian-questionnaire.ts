import { identityId } from '@sobok/edge/db/columns'
import { sql } from 'drizzle-orm'
import { bigint, check, index, integer, jsonb, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { GUARDIAN_REPORT_SLOTS, type GuardianFullReportProductSku } from '../../guardian/manifest'
import type { GuardianAdaptiveQuestionRole, GuardianQuestionSignals } from '../../guardian/questionnaire'
import { localeEnum, stella } from './common'

export const guardianSlotEnum = stella.enum('guardian_slot', [...GUARDIAN_REPORT_SLOTS])
export const guardianQuestionPhaseEnum = stella.enum('guardian_question_phase', ['core', 'adaptive', 'note'])
export const guardianQuestionKindEnum = stella.enum('guardian_question_kind', ['single_choice', 'free_text'])
export const guardianAdaptiveQuestionRoleEnum = stella.enum('guardian_adaptive_question_role', [
  'required',
  'deepening',
])

// ── Zodiac Guardian paid product ─────────────────────────────────────────────────────────────────────
// Paid prompts, option labels, adaptive selection policies, and signal weights are tracked as server content but never imported
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
    coreQuestionsPerSlot: integer('core_questions_per_slot').notNull(),
    requiredAdaptiveQuestionsPerSlot: integer('required_adaptive_questions_per_slot').notNull(),
    maximumAdaptiveQuestionsPerSlot: integer('maximum_adaptive_questions_per_slot').notNull(),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    publishedAt: timestamp('published_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_stella_guardian_questionnaire_product_locale').on(t.productSku, t.locale, t.publishedAt),
    check('ck_stella_guardian_questionnaire_schema_positive', sql`${t.schemaVersion} > 0`),
    check('ck_stella_guardian_questionnaire_core_positive', sql`${t.coreQuestionsPerSlot} > 0`),
    check(
      'ck_stella_guardian_questionnaire_adaptive_range',
      sql`${t.requiredAdaptiveQuestionsPerSlot} > 0
        and ${t.maximumAdaptiveQuestionsPerSlot} >= ${t.requiredAdaptiveQuestionsPerSlot}`,
    ),
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
    slot: guardianSlotEnum(),
    phase: guardianQuestionPhaseEnum().notNull(),
    kind: guardianQuestionKindEnum().notNull(),
    prompt: text().notNull(),
    supportingText: text('supporting_text'),
    selectionRole: guardianAdaptiveQuestionRoleEnum('selection_role').$type<GuardianAdaptiveQuestionRole>(),
    selectionPriority: integer('selection_priority'),
    selectionMinimumScore: integer('selection_minimum_score'),
    selectionSignalWeights: jsonb('selection_signal_weights').$type<GuardianQuestionSignals>(),
  },
  (t) => [
    uniqueIndex('uq_stella_guardian_question_version_id').on(t.questionnaireVersionId, t.questionId),
    uniqueIndex('uq_stella_guardian_question_version_position').on(t.questionnaireVersionId, t.position),
    check('ck_stella_guardian_question_position_nonnegative', sql`${t.position} >= 0`),
    check(
      'ck_stella_guardian_question_shape',
      sql`(${t.phase} = 'core'
          and ${t.kind} = 'single_choice'
          and ${t.slot} is not null
          and ${t.selectionRole} is null
          and ${t.selectionPriority} is null
          and ${t.selectionMinimumScore} is null
          and ${t.selectionSignalWeights} is null)
        or (${t.phase} = 'adaptive'
          and ${t.kind} = 'single_choice'
          and ${t.slot} is not null
          and ${t.selectionRole} is not null
          and ${t.selectionPriority} >= 0
          and ${t.selectionSignalWeights} is not null
          and ((${t.selectionRole} = 'required' and ${t.selectionMinimumScore} is null)
            or (${t.selectionRole} = 'deepening' and ${t.selectionMinimumScore} > 0)))
        or (${t.phase} = 'note'
          and ${t.kind} = 'free_text'
          and ${t.slot} is null
          and ${t.selectionRole} is null
          and ${t.selectionPriority} is null
          and ${t.selectionMinimumScore} is null
          and ${t.selectionSignalWeights} is null)`,
    ),
    check(
      'ck_stella_guardian_question_selection_signals_object',
      sql`${t.selectionSignalWeights} is null or jsonb_typeof(${t.selectionSignalWeights}) = 'object'`,
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
    signals: jsonb().$type<GuardianQuestionSignals>().notNull(),
  },
  (t) => [
    uniqueIndex('uq_stella_guardian_option_question_id').on(t.questionId, t.optionId),
    uniqueIndex('uq_stella_guardian_option_question_position').on(t.questionId, t.position),
    check('ck_stella_guardian_option_position_nonnegative', sql`${t.position} >= 0`),
    check('ck_stella_guardian_option_signals_object', sql`jsonb_typeof(${t.signals}) = 'object'`),
  ],
)
