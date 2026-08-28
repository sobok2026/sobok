import { sql } from 'drizzle-orm'
import {
  bigint,
  check,
  customType,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { civilUser } from './auth'
import {
  approvalStatusEnum,
  artifactInspectionStatusEnum,
  artifactStatusEnum,
  artifactUploadStatusEnum,
  auditActorTypeEnum,
  calculationStatusEnum,
  civil,
} from './common'
import { projectPolicies, tenantAppendOnlyPolicies } from './rls'
import { organizationTable, projectTable } from './tenancy'

const geometry4326 = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'extensions.geometry(Geometry,4326)'
  },
})

const createdAt = timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull()
const updatedAt = timestamp('updated_at', { precision: 3, withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date())

export const artifactTable = civil.table(
  'artifact',
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    objectKey: text('object_key').notNull(),
    fileName: text('file_name').notNull(),
    mediaType: text('media_type').notNull(),
    detectedMediaType: text('detected_media_type'),
    byteSize: bigint('byte_size', { mode: 'number' }).notNull(),
    sha256: varchar({ length: 64 }),
    status: artifactStatusEnum().default('uploading').notNull(),
    rejectionCode: text('rejection_code'),
    spatialFootprint: geometry4326('spatial_footprint'),
    metadata: jsonb().$type<Record<string, string | number | boolean | null>>().default({}).notNull(),
    uploadedByUserId: text('uploaded_by_user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    scannedAt: timestamp('scanned_at', { precision: 3, withTimezone: true }),
    availableAt: timestamp('available_at', { precision: 3, withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('uq_civil_artifact_object_key').on(table.objectKey),
    uniqueIndex('uq_civil_artifact_tenant_id').on(table.organizationId, table.projectId, table.id),
    index('idx_civil_artifact_project_status').on(table.organizationId, table.projectId, table.status),
    index('idx_civil_artifact_footprint').using('gist', table.spatialFootprint),
    check('ck_civil_artifact_byte_size', sql`${table.byteSize} between 1 and 1073741824`),
    check(
      'ck_civil_artifact_file_name',
      sql`length(${table.fileName}) between 1 and 255 and ${table.fileName} !~ '[[:cntrl:]/\\]'`,
    ),
    check('ck_civil_artifact_sha256', sql`${table.sha256} is null or ${table.sha256} ~ '^[0-9a-f]{64}$'`),
    foreignKey({
      name: 'fk_civil_artifact_project',
      columns: [table.organizationId, table.projectId],
      foreignColumns: [projectTable.organizationId, projectTable.id],
    }).onDelete('restrict'),
    ...projectPolicies('artifact', table.organizationId, table.projectId, { allowCompute: true }),
  ],
)

export const artifactUploadTable = civil.table(
  'artifact_upload',
  {
    artifactId: uuid('artifact_id')
      .primaryKey()
      .references(() => artifactTable.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    r2UploadId: text('r2_upload_id').notNull(),
    partSize: integer('part_size').notNull(),
    partCount: integer('part_count').notNull(),
    status: artifactUploadStatusEnum().default('open').notNull(),
    expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { precision: 3, withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('uq_civil_artifact_upload_r2_id').on(table.r2UploadId),
    uniqueIndex('uq_civil_artifact_upload_tenant_artifact').on(table.organizationId, table.projectId, table.artifactId),
    index('idx_civil_artifact_upload_expiry').on(table.status, table.expiresAt),
    check('ck_civil_artifact_upload_part_size', sql`${table.partSize} = 8388608`),
    check('ck_civil_artifact_upload_part_count', sql`${table.partCount} between 1 and 128`),
    foreignKey({
      name: 'fk_civil_artifact_upload_artifact',
      columns: [table.organizationId, table.projectId, table.artifactId],
      foreignColumns: [artifactTable.organizationId, artifactTable.projectId, artifactTable.id],
    }).onDelete('restrict'),
    ...projectPolicies('artifact_upload', table.organizationId, table.projectId, { allowCompute: true }),
  ],
)

export const artifactUploadPartTable = civil.table(
  'artifact_upload_part',
  {
    artifactId: uuid('artifact_id').notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    partNumber: integer('part_number').notNull(),
    etag: text().notNull(),
    byteSize: bigint('byte_size', { mode: 'number' }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    primaryKey({ columns: [table.artifactId, table.partNumber], name: 'pk_civil_artifact_upload_part' }),
    check('ck_civil_artifact_upload_part_number', sql`${table.partNumber} between 1 and 128`),
    check('ck_civil_artifact_upload_part_byte_size', sql`${table.byteSize} between 1 and 8388608`),
    foreignKey({
      name: 'fk_civil_artifact_upload_part_upload',
      columns: [table.organizationId, table.projectId, table.artifactId],
      foreignColumns: [
        artifactUploadTable.organizationId,
        artifactUploadTable.projectId,
        artifactUploadTable.artifactId,
      ],
    }).onDelete('restrict'),
    ...projectPolicies('artifact_upload_part', table.organizationId, table.projectId),
  ],
)

export const artifactInspectionJobTable = civil.table(
  'artifact_inspection_job',
  {
    artifactId: uuid('artifact_id')
      .primaryKey()
      .references(() => artifactTable.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    status: artifactInspectionStatusEnum().default('queued').notNull(),
    attemptCount: integer('attempt_count').default(0).notNull(),
    dispatchAttemptCount: integer('dispatch_attempt_count').default(0).notNull(),
    failureCode: text('failure_code'),
    dispatchedAt: timestamp('dispatched_at', { precision: 3, withTimezone: true }),
    queuedAt: timestamp('queued_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp('started_at', { precision: 3, withTimezone: true }),
    completedAt: timestamp('completed_at', { precision: 3, withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index('idx_civil_artifact_inspection_queue').on(table.status, table.queuedAt),
    check('ck_civil_artifact_inspection_attempt_count', sql`${table.attemptCount} between 0 and 100`),
    check('ck_civil_artifact_inspection_dispatch_attempt_count', sql`${table.dispatchAttemptCount} between 0 and 100`),
    foreignKey({
      name: 'fk_civil_artifact_inspection_artifact',
      columns: [table.organizationId, table.projectId, table.artifactId],
      foreignColumns: [artifactTable.organizationId, artifactTable.projectId, artifactTable.id],
    }).onDelete('restrict'),
    ...projectPolicies('artifact_inspection_job', table.organizationId, table.projectId, { allowCompute: true }),
  ],
)

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
