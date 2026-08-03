import { z } from 'zod'

export const GuardianAccessTokenSchema = z
  .string()
  .length(43)
  .regex(/^[A-Za-z0-9_-]+$/)

export const GuardianReopenTokenSchema = z
  .string()
  .length(43)
  .regex(/^[A-Za-z0-9_-]+$/)

export const GuardianReportPublicIdSchema = z
  .string()
  .length(16)
  .regex(/^[A-Za-z0-9_-]+$/)

export const GuardianPaymentIdSchema = z
  .string()
  .length(39)
  .regex(/^st_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
