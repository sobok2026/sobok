import { z } from 'zod'

export const CivilOrganizationRoleSchema = z.enum(['owner', 'administrator', 'viewer'])
export type CivilOrganizationRole = z.infer<typeof CivilOrganizationRoleSchema>

export const CivilProjectRoleSchema = z.enum(['approver', 'reviewer', 'designer', 'contractor', 'viewer'])
export type CivilProjectRole = z.infer<typeof CivilProjectRoleSchema>

export const CivilDesignWorkTypeSchema = z.enum(['original', 'change', 'as_built'])
export type CivilDesignWorkType = z.infer<typeof CivilDesignWorkTypeSchema>

export const CivilDesignRevisionStatusSchema = z.enum([
  'draft',
  'submitted',
  'under_review',
  'changes_requested',
  'awaiting_approval',
  'approved',
  'finalized',
])
export type CivilDesignRevisionStatus = z.infer<typeof CivilDesignRevisionStatusSchema>

export const CivilDesignReviewAreaSchema = z.enum([
  'drawing',
  'quantity',
  'price',
  'unit_cost',
  'cost_calculation',
  'external_agency',
])
export type CivilDesignReviewArea = z.infer<typeof CivilDesignReviewAreaSchema>

export const CivilDesignReviewResultSchema = z.enum(['unreviewed', 'compliant', 'changes_required', 'not_applicable'])
export type CivilDesignReviewResult = z.infer<typeof CivilDesignReviewResultSchema>

export const CivilDesignTransitionSchema = z.enum([
  'submit',
  'start_review',
  'request_changes',
  'request_approval',
  'approve',
  'finalize',
])
export type CivilDesignTransition = z.infer<typeof CivilDesignTransitionSchema>

export const CivilCalculationApprovalActionSchema = z.enum(['submit', 'request_changes', 'approve'])
export type CivilCalculationApprovalAction = z.infer<typeof CivilCalculationApprovalActionSchema>
