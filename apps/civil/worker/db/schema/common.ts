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
