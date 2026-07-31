export const COMMENT_REPORT_REASONS = ['spam', 'abuse', 'sexual', 'privacy', 'other'] as const

export type CommentReportReason = (typeof COMMENT_REPORT_REASONS)[number]

export const MAX_COMMENT_BODY_LENGTH = 500
