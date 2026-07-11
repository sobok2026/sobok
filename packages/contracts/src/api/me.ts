import { isSearchLanguage } from '@sobok/domain/search/language'
import { normalizeValue } from '@sobok/domain/utils/normalize-value'
import { z } from 'zod'

import { INVALID_PARAM } from '../problem'
import { passwordVerificationSchema } from '../shared'

// 프로필 변경(이름·username·이미지), 비밀번호·패스키·2FA·세션 관리는 better-auth(/api/auth/*)가 담당한다.

const searchLanguageSchema = z
  .string()
  .trim()
  .min(1)
  .transform(normalizeValue)
  .refine(isSearchLanguage, { params: { code: INVALID_PARAM.INVALID_SEARCH_LANGUAGE } })

export enum AdultVerificationStatus {
  ADULT = 'adult',
  NOT_ADULT = 'not-adult',
  UNVERIFIED = 'unverified',
}

export interface UserSettings {
  historySyncEnabled: boolean
  adultVerifiedAdVisible: boolean
  defaultCensorshipEnabled: boolean
  searchLanguage: string
  autoDeletionDay: number
}

export interface GETV1MeResponse {
  id: string
  email: string
  name: string
  username: string | null
  displayUsername: string | null
  image: string | null
  adultVerification: {
    required: boolean
    status: AdultVerificationStatus
  }
  settings: UserSettings
}

export const patchV1MeSettingsBodySchema = z
  .object({
    historySyncEnabled: z.boolean().optional(),
    adultVerifiedAdVisible: z.boolean().optional(),
    defaultCensorshipEnabled: z.boolean().optional(),
    searchLanguage: searchLanguageSchema.optional(),
    autoDeletionDay: z.number().int().min(0).max(1500).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined))

export type PATCHV1MeSettingsBody = z.infer<typeof patchV1MeSettingsBodySchema>

export const deleteV1MeAdultVerificationBodySchema = z.object({
  password: passwordVerificationSchema,
})

export type DELETEV1MeAdultVerificationBody = z.infer<typeof deleteV1MeAdultVerificationBodySchema>

export const postV1MeExportBodySchema = z.object({
  password: passwordVerificationSchema,
  includeHistory: z.boolean(),
  includeBookmarks: z.boolean(),
  includeRatings: z.boolean(),
  includeLibraries: z.boolean(),
  includeCensorships: z.boolean(),
})

export type POSTV1MeExportBody = z.infer<typeof postV1MeExportBodySchema>

export type POSTV1MeExportResponse = Record<string, unknown>

const pushSubscriptionSchema = z.object({
  endpoint: z.url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

export const postV1MePushSubscriptionBodySchema = z.object({
  subscription: pushSubscriptionSchema,
  userAgent: z.string().optional(),
})

export type POSTV1MePushSubscriptionBody = z.infer<typeof postV1MePushSubscriptionBodySchema>

export interface POSTV1MePushSubscriptionResponse {
  id: number
}

export const deleteV1MePushSubscriptionBodySchema = z.object({
  endpoint: z.url(),
})

export type DELETEV1MePushSubscriptionBody = z.infer<typeof deleteV1MePushSubscriptionBodySchema>

export interface DELETEV1MePushSubscriptionIdResponse {
  id: number
}

export const postV1MePushTestBodySchema = z.object({
  endpoint: z.url(),
  message: z.string().min(1),
})

export type POSTV1MePushTestBody = z.infer<typeof postV1MePushTestBodySchema>

export const patchV1MePushSettingsBodySchema = z.object({
  quietEnabled: z.boolean(),
  quietStart: z.number().int().min(0).max(23),
  quietEnd: z.number().int().min(0).max(23),
  batchEnabled: z.boolean(),
  maxDaily: z.number().int().min(1).max(999),
})

export type PATCHV1MePushSettingsBody = z.infer<typeof patchV1MePushSettingsBodySchema>

export interface GETV1MeFollowingResponse {
  userIds: string[]
}
