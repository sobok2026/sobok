import { pgSchema } from 'drizzle-orm/pg-core'

export const civil = pgSchema('civil')

export const organizationRoleEnum = civil.enum('organization_role', [
  'owner',
  'administrator',
  'approver',
  'reviewer',
  'designer',
  'contractor',
  'viewer',
])

export const projectStatusEnum = civil.enum('project_status', ['planning', 'design', 'review', 'approved', 'closed'])

export const artifactKindEnum = civil.enum('artifact_kind', [
  'drawing',
  'survey',
  'calculation_input',
  'cost_basis',
  'deliverable',
  'supporting',
])

export const artifactStatusEnum = civil.enum('artifact_status', [
  'uploading',
  'verifying',
  'verification_failed',
  'available',
  'rejected',
  'deleted',
])

export const artifactUploadStatusEnum = civil.enum('artifact_upload_status', [
  'open',
  'completed',
  'aborted',
  'expired',
])

export const artifactVerificationStatusEnum = civil.enum('artifact_verification_status', [
  'queued',
  'running',
  'succeeded',
  'failed',
])

export const deliveryKindEnum = civil.enum('delivery_kind', ['survey', 'design', 'design_change', 'as_built'])

export const deliveryStatusEnum = civil.enum('delivery_status', [
  'assembling',
  'ready',
  'submitted',
  'changes_requested',
  'approved',
  'failed',
  'withdrawn',
])

export const deliveryGenerationStatusEnum = civil.enum('delivery_generation_status', [
  'queued',
  'running',
  'succeeded',
  'failed',
])

export const designWorkTypeEnum = civil.enum('design_work_type', ['original', 'change', 'as_built'])

export const designRevisionStatusEnum = civil.enum('design_revision_status', [
  'draft',
  'submitted',
  'under_review',
  'changes_requested',
  'awaiting_approval',
  'approved',
  'finalized',
])

export const designReviewResultEnum = civil.enum('design_review_result', [
  'unreviewed',
  'compliant',
  'changes_required',
  'not_applicable',
])

export const calculationStatusEnum = civil.enum('calculation_status', [
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
])

export const approvalStatusEnum = civil.enum('approval_status', [
  'draft',
  'submitted',
  'changes_requested',
  'approved',
  'superseded',
])

export const auditActorTypeEnum = civil.enum('audit_actor_type', ['user', 'system'])
