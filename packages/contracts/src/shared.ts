import { MAX_MANGA_ID } from '@sobok/domain/manga/policy'
import { z } from 'zod'

// --- Path params --------------------------------------------------------------

/** A numeric resource id path param (`/resource/:id`). */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

/** A user id path param — better-auth 텍스트 id (`/user/:id`). */
export const userIdParamSchema = z.object({
  id: z.string().min(1).max(64),
})

export const mangaIdSchema = z.coerce.number().int().positive().max(MAX_MANGA_ID)

/** A manga id path param (`/manga/:id`, `/bookmark/:id`). */
export const mangaIdParamSchema = z.object({
  id: mangaIdSchema,
})

// --- Auth field validators ----------------------------------------------------

/** 기존 비밀번호 확인(sudo 재인증)용 — 생성 정책은 better-auth가 담당하므로 형식을 검사하지 않는다. */
export const passwordVerificationSchema = z.string().min(1).max(256)

// --- Anti-abuse tokens --------------------------------------------------------

export const turnstileTokenSchema = z.string().min(1).max(2048)
