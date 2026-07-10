import { PASSWORD_PATTERN } from '@sobok/domain/auth/policy'
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

export const passwordSchema = z.string().min(8).max(64).regex(new RegExp(PASSWORD_PATTERN))

// --- Anti-abuse tokens --------------------------------------------------------

export const turnstileTokenSchema = z.string().min(1).max(2048)
