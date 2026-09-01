import { sql } from 'drizzle-orm'
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { civilUser } from './auth'
import {
  auditActorTypeEnum,
  civil,
  designReviewResultEnum,
  designRevisionStatusEnum,
  designWorkTypeEnum,
} from './common'
import { projectPolicies } from './rls'
import { organizationTable, projectTable } from './tenancy'
import { artifactTable, calculationResultTable } from './work'

const createdAt = timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull()
const updatedAt = timestamp('updated_at', { precision: 3, withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date())

export const designRevisionTable = civil.table(
  'design_revision',
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    workType: designWorkTypeEnum('work_type').notNull(),
    revisionNumber: integer('revision_number').notNull(),
    title: text().notNull(),
    status: designRevisionStatusEnum().default('draft').notNull(),
    reason: text(),
    legalBasis: text('legal_basis'),
    documentNumber: text('document_number'),
    scheduleImpactDays: integer('schedule_impact_days'),
    costImpactAmount: bigint('cost_impact_amount', { mode: 'number' }),
    baseDrawingArtifactId: uuid('base_drawing_artifact_id'),
    newDrawingArtifactId: uuid('new_drawing_artifact_id'),
    baseCalculationResultId: uuid('base_calculation_result_id'),
    newCalculationResultId: uuid('new_calculation_result_id'),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    submittedAt: timestamp('submitted_at', { precision: 3, withTimezone: true }),
    approvedAt: timestamp('approved_at', { precision: 3, withTimezone: true }),
    finalizedAt: timestamp('finalized_at', { precision: 3, withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('uq_civil_design_revision_number').on(table.projectId, table.workType, table.revisionNumber),
    uniqueIndex('uq_civil_design_revision_tenant_id').on(table.organizationId, table.projectId, table.id),
    index('idx_civil_design_revision_project_status').on(
      table.organizationId,
      table.projectId,
      table.status,
      table.updatedAt,
    ),
    check('ck_civil_design_revision_number', sql`${table.revisionNumber} > 0`),
    check('ck_civil_design_revision_title', sql`length(${table.title}) between 1 and 160`),
    check(
      'ck_civil_design_revision_schedule_impact',
      sql`${table.scheduleImpactDays} is null or ${table.scheduleImpactDays} between -36500 and 36500`,
    ),
    check(
      'ck_civil_design_revision_cost_impact',
      sql`${table.costImpactAmount} is null or ${table.costImpactAmount} between -9007199254740991 and 9007199254740991`,
    ),
    foreignKey({
      name: 'fk_civil_design_revision_project',
      columns: [table.organizationId, table.projectId],
      foreignColumns: [projectTable.organizationId, projectTable.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fk_civil_design_revision_base_drawing',
      columns: [table.organizationId, table.projectId, table.baseDrawingArtifactId],
      foreignColumns: [artifactTable.organizationId, artifactTable.projectId, artifactTable.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fk_civil_design_revision_new_drawing',
      columns: [table.organizationId, table.projectId, table.newDrawingArtifactId],
      foreignColumns: [artifactTable.organizationId, artifactTable.projectId, artifactTable.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fk_civil_design_revision_base_result',
      columns: [table.organizationId, table.projectId, table.baseCalculationResultId],
      foreignColumns: [
        calculationResultTable.organizationId,
        calculationResultTable.projectId,
        calculationResultTable.id,
      ],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fk_civil_design_revision_new_result',
      columns: [table.organizationId, table.projectId, table.newCalculationResultId],
      foreignColumns: [
        calculationResultTable.organizationId,
        calculationResultTable.projectId,
        calculationResultTable.id,
      ],
    }).onDelete('restrict'),
    ...projectPolicies('design_revision', table.organizationId, table.projectId),
  ],
)

export const designReviewItemTable = civil.table(
  'design_review_item',
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    revisionId: uuid('revision_id').notNull(),
    area: text().notNull(),
    item: text().notNull(),
    result: designReviewResultEnum().default('unreviewed').notNull(),
    comment: text(),
    response: text(),
    reviewedByUserId: text('reviewed_by_user_id').references(() => civilUser.id, { onDelete: 'restrict' }),
    respondedByUserId: text('responded_by_user_id').references(() => civilUser.id, { onDelete: 'restrict' }),
    reviewedAt: timestamp('reviewed_at', { precision: 3, withTimezone: true }),
    respondedAt: timestamp('responded_at', { precision: 3, withTimezone: true }),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index('idx_civil_design_review_revision').on(table.revisionId, table.createdAt),
    check(
      'ck_civil_design_review_area',
      sql`${table.area} in ('drawing', 'quantity', 'price', 'unit_cost', 'cost_calculation', 'external_agency')`,
    ),
    check('ck_civil_design_review_item', sql`length(${table.item}) between 1 and 240`),
    foreignKey({
      name: 'fk_civil_design_review_revision',
      columns: [table.organizationId, table.projectId, table.revisionId],
      foreignColumns: [designRevisionTable.organizationId, designRevisionTable.projectId, designRevisionTable.id],
    }).onDelete('restrict'),
    ...projectPolicies('design_review_item', table.organizationId, table.projectId),
  ],
)

export const designRevisionEventTable = civil.table(
  'design_revision_event',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    revisionId: uuid('revision_id').notNull(),
    fromStatus: designRevisionStatusEnum('from_status'),
    toStatus: designRevisionStatusEnum('to_status').notNull(),
    note: text(),
    actorType: auditActorTypeEnum('actor_type').notNull(),
    actorUserId: text('actor_user_id').references(() => civilUser.id, { onDelete: 'restrict' }),
    createdAt,
  },
  (table) => [
    index('idx_civil_design_revision_event').on(table.revisionId, table.createdAt),
    check(
      'ck_civil_design_revision_event_actor',
      sql`(${table.actorType} = 'user' and ${table.actorUserId} is not null) or (${table.actorType} = 'system' and ${table.actorUserId} is null)`,
    ),
    foreignKey({
      name: 'fk_civil_design_revision_event_revision',
      columns: [table.organizationId, table.projectId, table.revisionId],
      foreignColumns: [designRevisionTable.organizationId, designRevisionTable.projectId, designRevisionTable.id],
    }).onDelete('restrict'),
    ...projectPolicies('design_revision_event', table.organizationId, table.projectId, { appendOnly: true }),
  ],
)

export const designFinalizationTable = civil.table(
  'design_finalization',
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    revisionId: uuid('revision_id').notNull(),
    snapshot: jsonb().$type<Record<string, unknown>>().notNull(),
    snapshotHash: varchar('snapshot_hash', { length: 64 }).notNull(),
    finalizedByUserId: text('finalized_by_user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    createdAt,
  },
  (table) => [
    uniqueIndex('uq_civil_design_finalization_revision').on(table.revisionId),
    check('ck_civil_design_finalization_hash', sql`${table.snapshotHash} ~ '^[0-9a-f]{64}$'`),
    foreignKey({
      name: 'fk_civil_design_finalization_revision',
      columns: [table.organizationId, table.projectId, table.revisionId],
      foreignColumns: [designRevisionTable.organizationId, designRevisionTable.projectId, designRevisionTable.id],
    }).onDelete('restrict'),
    ...projectPolicies('design_finalization', table.organizationId, table.projectId, { appendOnly: true }),
  ],
)
