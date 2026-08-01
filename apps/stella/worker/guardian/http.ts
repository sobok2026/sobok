import { z } from 'zod'

export const GuardianAccessTokenSchema = z
  .string()
  .length(43)
  .regex(/^[A-Za-z0-9_-]+$/)

export const GuardianReportPublicIdSchema = z
  .string()
  .length(16)
  .regex(/^[A-Za-z0-9_-]+$/)
