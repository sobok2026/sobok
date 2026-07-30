import 'server-only'
import { z } from 'zod'

// A tuple so `z.enum` reads the same declaration the type comes from — these are the two URL segments the route
// accepts. See `@sobok/domain/censorship/model` for why this is not an enum.
export const POST_FILTER_PARAMS = ['following', 'recommend'] as const

export type PostFilterParam = (typeof POST_FILTER_PARAMS)[number]

export const postFilterSchema = z.object({
  filter: z.enum(POST_FILTER_PARAMS),
})
