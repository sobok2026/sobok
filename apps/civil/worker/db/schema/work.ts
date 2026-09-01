import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
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
  artifactKindEnum,
  artifactStatusEnum,
  artifactUploadStatusEnum,
  artifactVerificationStatusEnum,
  auditActorTypeEnum,
  calculationStatusEnum,
  civil,
  deliveryGenerationStatusEnum,
  deliveryKindEnum,
  deliveryStatusEnum,
} from './common'
import { projectPolicies, tenantAppendOnlyPolicies } from './rls'
import { organizationTable, projectTable } from './tenancy'

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
    detectedFormat: text('detected_format'),
    byteSize: bigint('byte_size', { mode: 'number' }).notNull(),
    sha256: varchar({ length: 64 }),
    kind: artifactKindEnum().notNull(),
    revision: text().notNull(),
    coordinateReferenceSystem: text('coordinate_reference_system'),
    boundingBox: jsonb('bounding_box').$type<{ minX: number; minY: number; maxX: number; maxY: number } | null>(),
    previousArtifactId: uuid('previous_artifact_id'),
    status: artifactStatusEnum().default('uploading').notNull(),
    rejectionCode: text('rejection_code'),
    verificationFailureCode: text('verification_failure_code'),
    uploadedByUserId: text('uploaded_by_user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    verifiedAt: timestamp('verified_at', { precision: 3, withTimezone: true }),
    availableAt: timestamp('available_at', { precision: 3, withTimezone: true }),
    deletedAt: timestamp('deleted_at', { precision: 3, withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('uq_civil_artifact_object_key').on(table.objectKey),
    uniqueIndex('uq_civil_artifact_tenant_id').on(table.organizationId, table.projectId, table.id),
    index('idx_civil_artifact_project_status').on(table.organizationId, table.projectId, table.status),
    index('idx_civil_artifact_previous').on(table.previousArtifactId),
    check('ck_civil_artifact_byte_size', sql`${table.byteSize} between 1 and 1073741824`),
    check(
      'ck_civil_artifact_file_name',
      sql`length(${table.fileName}) between 1 and 255 and ${table.fileName} !~ '[[:cntrl:]/\\]'`,
    ),
    check('ck_civil_artifact_revision', sql`length(${table.revision}) between 1 and 64`),
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

export const artifactVerificationJobTable = civil.table(
  'artifact_verification_job',
  {
    artifactId: uuid('artifact_id')
      .primaryKey()
      .references(() => artifactTable.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    status: artifactVerificationStatusEnum().default('queued').notNull(),
    attemptCount: integer('attempt_count').default(0).notNull(),
    dispatchAttemptCount: integer('dispatch_attempt_count').default(0).notNull(),
    cleanupRequired: boolean('cleanup_required').default(false).notNull(),
    failureCode: text('failure_code'),
    dispatchedAt: timestamp('dispatched_at', { precision: 3, withTimezone: true }),
    queuedAt: timestamp('queued_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp('started_at', { precision: 3, withTimezone: true }),
    completedAt: timestamp('completed_at', { precision: 3, withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index('idx_civil_artifact_verification_queue').on(table.status, table.queuedAt),
    check('ck_civil_artifact_verification_attempt_count', sql`${table.attemptCount} between 0 and 100`),
    check(
      'ck_civil_artifact_verification_dispatch_attempt_count',
      sql`${table.dispatchAttemptCount} between 0 and 100`,
    ),
    foreignKey({
      name: 'fk_civil_artifact_verification_artifact',
      columns: [table.organizationId, table.projectId, table.artifactId],
      foreignColumns: [artifactTable.organizationId, artifactTable.projectId, artifactTable.id],
    }).onDelete('restrict'),
    ...projectPolicies('artifact_verification_job', table.organizationId, table.projectId, { allowCompute: true }),
  ],
)

export const deliveryPackageTable = civil.table(
  'delivery_package',
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    title: text().notNull(),
    deliveryKind: deliveryKindEnum('delivery_kind').notNull(),
    vendorName: text('vendor_name').notNull(),
    revision: text().notNull(),
    status: deliveryStatusEnum().default('assembling').notNull(),
    objectKey: text('object_key').notNull(),
    manifest: jsonb().$type<Record<string, unknown> | null>(),
    manifestSha256: varchar('manifest_sha256', { length: 64 }),
    byteSize: bigint('byte_size', { mode: 'number' }),
    reservedBytes: bigint('reserved_bytes', { mode: 'number' }).notNull(),
    sha256: varchar({ length: 64 }),
    failureCode: text('failure_code'),
    requestedByUserId: text('requested_by_user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    submittedAt: timestamp('submitted_at', { precision: 3, withTimezone: true }),
    reviewedAt: timestamp('reviewed_at', { precision: 3, withTimezone: true }),
    approvedAt: timestamp('approved_at', { precision: 3, withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('uq_civil_delivery_object_key').on(table.objectKey),
    uniqueIndex('uq_civil_delivery_tenant_id').on(table.organizationId, table.projectId, table.id),
    index('idx_civil_delivery_project_status').on(table.organizationId, table.projectId, table.status, table.createdAt),
    check('ck_civil_delivery_title', sql`length(${table.title}) between 1 and 160`),
    check('ck_civil_delivery_vendor', sql`length(${table.vendorName}) between 1 and 160`),
    check('ck_civil_delivery_revision', sql`length(${table.revision}) between 1 and 64`),
    check('ck_civil_delivery_reserved', sql`${table.reservedBytes} between 0 and 1082130432`),
    check('ck_civil_delivery_byte_size', sql`${table.byteSize} is null or ${table.byteSize} between 1 and 1082130432`),
    check('ck_civil_delivery_sha256', sql`${table.sha256} is null or ${table.sha256} ~ '^[0-9a-f]{64}$'`),
    check(
      'ck_civil_delivery_manifest_sha256',
      sql`${table.manifestSha256} is null or ${table.manifestSha256} ~ '^[0-9a-f]{64}$'`,
    ),
    foreignKey({
      name: 'fk_civil_delivery_project',
      columns: [table.organizationId, table.projectId],
      foreignColumns: [projectTable.organizationId, projectTable.id],
    }).onDelete('restrict'),
    ...projectPolicies('delivery_package', table.organizationId, table.projectId, { allowCompute: true }),
  ],
)

export const deliveryPackageItemTable = civil.table(
  'delivery_package_item',
  {
    packageId: uuid('package_id').notNull(),
    artifactId: uuid('artifact_id').notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    ordinal: integer().notNull(),
    archivePath: text('archive_path').notNull(),
    fileName: text('file_name').notNull(),
    mediaType: text('media_type').notNull(),
    byteSize: bigint('byte_size', { mode: 'number' }).notNull(),
    sha256: varchar({ length: 64 }).notNull(),
    kind: artifactKindEnum().notNull(),
    revision: text().notNull(),
    coordinateReferenceSystem: text('coordinate_reference_system'),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.packageId, table.artifactId], name: 'pk_civil_delivery_package_item' }),
    uniqueIndex('uq_civil_delivery_item_ordinal').on(table.packageId, table.ordinal),
    uniqueIndex('uq_civil_delivery_item_path').on(table.packageId, table.archivePath),
    check('ck_civil_delivery_item_ordinal', sql`${table.ordinal} between 1 and 100`),
    check('ck_civil_delivery_item_sha256', sql`${table.sha256} ~ '^[0-9a-f]{64}$'`),
    foreignKey({
      name: 'fk_civil_delivery_item_package',
      columns: [table.organizationId, table.projectId, table.packageId],
      foreignColumns: [deliveryPackageTable.organizationId, deliveryPackageTable.projectId, deliveryPackageTable.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fk_civil_delivery_item_artifact',
      columns: [table.organizationId, table.projectId, table.artifactId],
      foreignColumns: [artifactTable.organizationId, artifactTable.projectId, artifactTable.id],
    }).onDelete('restrict'),
    ...projectPolicies('delivery_package_item', table.organizationId, table.projectId, { allowCompute: true }),
  ],
)

export const deliveryGenerationJobTable = civil.table(
  'delivery_generation_job',
  {
    packageId: uuid('package_id')
      .primaryKey()
      .references(() => deliveryPackageTable.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    status: deliveryGenerationStatusEnum().default('queued').notNull(),
    attemptCount: integer('attempt_count').default(0).notNull(),
    dispatchAttemptCount: integer('dispatch_attempt_count').default(0).notNull(),
    cleanupRequired: boolean('cleanup_required').default(false).notNull(),
    failureCode: text('failure_code'),
    dispatchedAt: timestamp('dispatched_at', { precision: 3, withTimezone: true }),
    queuedAt: timestamp('queued_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp('started_at', { precision: 3, withTimezone: true }),
    completedAt: timestamp('completed_at', { precision: 3, withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index('idx_civil_delivery_generation_queue').on(table.status, table.queuedAt),
    check('ck_civil_delivery_generation_attempt_count', sql`${table.attemptCount} between 0 and 100`),
    check('ck_civil_delivery_generation_dispatch_attempt_count', sql`${table.dispatchAttemptCount} between 0 and 100`),
    foreignKey({
      name: 'fk_civil_delivery_generation_package',
      columns: [table.organizationId, table.projectId, table.packageId],
      foreignColumns: [deliveryPackageTable.organizationId, deliveryPackageTable.projectId, deliveryPackageTable.id],
    }).onDelete('restrict'),
    ...projectPolicies('delivery_generation_job', table.organizationId, table.projectId, { allowCompute: true }),
  ],
)

export const deliveryEventTable = civil.table(
  'delivery_event',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    packageId: uuid('package_id')
      .notNull()
      .references(() => deliveryPackageTable.id, { onDelete: 'restrict' }),
    fromStatus: deliveryStatusEnum('from_status'),
    toStatus: deliveryStatusEnum('to_status').notNull(),
    note: text(),
    actorType: auditActorTypeEnum('actor_type').notNull(),
    actorUserId: text('actor_user_id').references(() => civilUser.id, { onDelete: 'restrict' }),
    createdAt,
  },
  (table) => [
    index('idx_civil_delivery_event_package').on(table.packageId, table.createdAt),
    check(
      'ck_civil_delivery_event_actor',
      sql`(${table.actorType} = 'user' and ${table.actorUserId} is not null) or (${table.actorType} = 'system' and ${table.actorUserId} is null)`,
    ),
    ...projectPolicies('delivery_event', table.organizationId, table.projectId, {
      allowCompute: true,
      appendOnly: true,
    }),
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
    uniqueIndex('uq_civil_calculation_result_tenant_id').on(table.organizationId, table.projectId, table.id),
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
