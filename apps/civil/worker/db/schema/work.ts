import { sql } from 'drizzle-orm'
import {
  bigint,
  check,
  foreignKey,
  index,
  jsonb,
  numeric,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { civilUser } from './auth'
import { approvalStatusEnum, auditActorTypeEnum, calculationStatusEnum, civil } from './common'
import { projectPolicies, tenantAppendOnlyPolicies } from './rls'
import { organizationTable, projectTable } from './tenancy'

const createdAt = timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull()
const updatedAt = timestamp('updated_at', { precision: 3, withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date())

export const calculationJobTable = civil.table(
  'calculation_job',
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    kind: text().notNull(),
    status: calculationStatusEnum().default('queued').notNull(),
    algorithmVersion: text('algorithm_version').notNull(),
    inputSnapshot: jsonb('input_snapshot').$type<unknown>().notNull(),
    inputHash: varchar('input_hash', { length: 64 }).notNull(),
    requestedByUserId: text('requested_by_user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    failureCode: text('failure_code'),
    queuedAt: timestamp('queued_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp('started_at', { precision: 3, withTimezone: true }),
    completedAt: timestamp('completed_at', { precision: 3, withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index('idx_civil_calculation_job_queue').on(table.status, table.queuedAt),
    index('idx_civil_calculation_job_project').on(table.organizationId, table.projectId, table.createdAt),
    check('ck_civil_calculation_job_input_hash', sql`${table.inputHash} ~ '^[0-9a-f]{64}$'`),
    foreignKey({
      name: 'fk_civil_calculation_job_project',
      columns: [table.organizationId, table.projectId],
      foreignColumns: [projectTable.organizationId, projectTable.id],
    }).onDelete('restrict'),
    ...projectPolicies('calculation_job', table.organizationId, table.projectId, { allowCompute: true }),
  ],
)

export const calculationResultTable = civil.table(
  'calculation_result',
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => calculationJobTable.id, { onDelete: 'restrict' }),
    revision: bigint({ mode: 'number' }).notNull(),
    outputSnapshot: jsonb('output_snapshot').$type<unknown>().notNull(),
    outputHash: varchar('output_hash', { length: 64 }).notNull(),
    totalAmount: numeric('total_amount', { precision: 24, scale: 4 }),
    unitSystem: text('unit_system').default('SI').notNull(),
    coordinateReferenceSystem: text('coordinate_reference_system').notNull(),
    createdAt,
  },
  (table) => [
    uniqueIndex('uq_civil_calculation_result_job_revision').on(table.jobId, table.revision),
    check('ck_civil_calculation_result_revision', sql`${table.revision} > 0`),
    check('ck_civil_calculation_result_output_hash', sql`${table.outputHash} ~ '^[0-9a-f]{64}$'`),
    foreignKey({
      name: 'fk_civil_calculation_result_project',
      columns: [table.organizationId, table.projectId],
      foreignColumns: [projectTable.organizationId, projectTable.id],
    }).onDelete('restrict'),
    ...projectPolicies('calculation_result', table.organizationId, table.projectId, {
      allowCompute: true,
      appendOnly: true,
      computeOnlyInsert: true,
    }),
  ],
)

export const approvalTable = civil.table(
  'approval',
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    resultId: uuid('result_id')
      .notNull()
      .references(() => calculationResultTable.id, { onDelete: 'restrict' }),
    status: approvalStatusEnum().default('draft').notNull(),
    note: text(),
    actedByUserId: text('acted_by_user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    actedAt: timestamp('acted_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    createdAt,
  },
  (table) => [
    index('idx_civil_approval_result').on(table.resultId, table.actedAt),
    foreignKey({
      name: 'fk_civil_approval_project',
      columns: [table.organizationId, table.projectId],
      foreignColumns: [projectTable.organizationId, projectTable.id],
    }).onDelete('restrict'),
    ...projectPolicies('approval', table.organizationId, table.projectId, { appendOnly: true }),
  ],
)

export const auditEventTable = civil.table(
  'audit_event',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id'),
    actorType: auditActorTypeEnum('actor_type').notNull(),
    actorUserId: text('actor_user_id').references(() => civilUser.id, { onDelete: 'restrict' }),
    action: text().notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    requestId: text('request_id').notNull(),
    detail: jsonb().$type<Record<string, unknown>>().default({}).notNull(),
    createdAt,
  },
  (table) => [
    index('idx_civil_audit_org_created').on(table.organizationId, table.createdAt),
    check(
      'ck_civil_audit_actor',
      sql`(${table.actorType} = 'user' and ${table.actorUserId} is not null) or (${table.actorType} = 'system' and ${table.actorUserId} is null)`,
    ),
    ...tenantAppendOnlyPolicies('audit_event', table.organizationId, { allowCompute: true }),
  ],
)
