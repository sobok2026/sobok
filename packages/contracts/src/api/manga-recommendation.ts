import { Locale } from '@sobok/domain/locale'
import {
  MANGA_RECOMMENDATION_PER_PAGE,
  MAX_MANGA_RECOMMENDATION_PER_PAGE,
} from '@sobok/domain/manga-recommendation/policy'
import type { MangaRecommendationReason } from '@sobok/domain/manga-recommendation/reason'
import { z } from 'zod'

export const getV1MangaRecommendationQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_MANGA_RECOMMENDATION_PER_PAGE)
    .default(MANGA_RECOMMENDATION_PER_PAGE),
  locale: z.enum(Locale),
})

export interface MangaRecommendation {
  mangaId: number
  rank: number
  score: number
  reasons: MangaRecommendationReason[]
  generatedAt: number
}

export interface GETV1MangaRecommendationResponse {
  items: MangaRecommendation[]
}
