import { LOCALES } from '@sobok/domain/locale'
import { MAX_SEARCH_QUERY_LENGTH } from '@sobok/domain/search/policy'
import { z } from 'zod'

// A tuple so `z.enum` reads the same declaration the type comes from. See `@sobok/domain/censorship/model` for
// why this is not an enum.
export const TRENDING_TYPES = ['hourly', 'daily', 'weekly'] as const

export type TrendingType = (typeof TRENDING_TYPES)[number]

export const getV1SearchSuggestionQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
  locale: z.enum(LOCALES),
  query: z.string().trim().min(2).max(200),
})

export type GETV1SearchSuggestionResponse = { label: string; value: string }[]

export const getV1SearchTrendingQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(15).default(15),
  locale: z.enum(LOCALES),
  type: z.enum(TRENDING_TYPES).default('hourly'),
})

export interface GETV1SearchTrendingResponse {
  keywords: { value: string; label: string }[]
  updatedAt: Date
}

export const postV1SearchTrendingViewBodySchema = z.object({
  query: z.string().trim().min(1).max(MAX_SEARCH_QUERY_LENGTH),
})
