import { LOCALES } from '@sobok/domain/locale'
import { POST_FILTER } from '@sobok/domain/post/filter'
import type { PostType } from '@sobok/domain/post/model'
import { MAX_POST_CONTENT_LENGTH, POST_PER_PAGE } from '@sobok/domain/post/policy'
import { z } from 'zod'

import type { ReferredPost } from '../post/referred-post'

export interface Post {
  id: number
  createdAt: Date
  content: string | null
  type: PostType
  author: {
    id: string
    name: string
    username: string | null
    image: string | null
  } | null
  mangaId: number | null
  parentPostId: number | null
  likeCount: number
  commentCount: number
  repostCount: number
  viewCount?: number
  referredPost: ReferredPost | null
  imageURLs?: string[] | null
  bookmarkCount?: number
}

export interface GETV1PostResponse {
  posts: Post[]
  nextCursor: string | null
}

export const postFilterSchema = z.enum(POST_FILTER)

const getV1PostQueryBaseSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(POST_PER_PAGE).default(POST_PER_PAGE),
  locale: z.enum(LOCALES).default('ko'),
  mangaId: z.coerce.number().int().positive().optional(),
})

const getV1UserPostQuerySchema = getV1PostQueryBaseSchema.extend({
  filter: z.enum([POST_FILTER.USER, POST_FILTER.USER_REPLY]),
  username: z.string().min(1).max(32),
})

const getV1TimelinePostQuerySchema = getV1PostQueryBaseSchema.extend({
  filter: z.enum([POST_FILTER.FOLLOWING, POST_FILTER.MANGA, POST_FILTER.RECOMMEND]).optional(),
  username: z.never().optional(),
})

export const getV1PostQuerySchema = z.union([getV1UserPostQuerySchema, getV1TimelinePostQuerySchema])

export const postV1PostBodySchema = z.object({
  content: z.string().min(2).max(MAX_POST_CONTENT_LENGTH),
  mangaId: z.coerce.number().int().positive().nullable().optional(),
  parentPostId: z.coerce.number().int().positive().nullable().optional(),
  referredPostId: z.coerce.number().int().positive().nullable().optional(),
})

export type POSTV1PostBody = z.infer<typeof postV1PostBodySchema>

export interface POSTV1PostResponse {
  id: number
}

export type DELETEV1PostIdLikeResponse = undefined

export type DELETEV1PostIdResponse = undefined

export interface PUTV1PostIdLikeResponse {
  liked: true
}

export interface GETV1PostLikedResponse {
  postIds: number[]
}
