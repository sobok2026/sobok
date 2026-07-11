import type { GETV1PostResponse } from '@sobok/contracts'

import { getV1PostQuerySchema } from '@sobok/contracts'
import selectPost from '@sobok/db/app/query/post'
import { decodePostCursor, encodePostCursor } from '@sobok/db/cursor'
import { PostFilter } from '@sobok/domain/post/filter'
import { createCacheControl } from '@sobok/http/cache-control'
import { sec } from '@sobok/std'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { privateCacheControl } from '@/utils/cache-control'
import { authRequiredProblemResponse, problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('query', getV1PostQuerySchema))

route.get('/', ...middlewares, async (c) => {
  const { cursor, limit, mangaId, filter, username } = c.req.valid('query')
  const decodedCursor = cursor ? decodePostCursor(cursor) : null
  const currentUserId = c.get('user')?.id

  if (cursor && !decodedCursor) {
    return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
  }

  if (filter === PostFilter.FOLLOWING && !currentUserId) {
    return authRequiredProblemResponse(c)
  }

  const postRows = await selectPost({
    limit: limit + 1,
    cursorId: decodedCursor?.id,
    cursorCreatedAt: decodedCursor ? new Date(decodedCursor.timestamp) : undefined,
    mangaId,
    filter,
    username,
    currentUserId,
  })

  const hasNextPage = postRows.length > limit
  const posts = hasNextPage ? postRows.slice(0, limit) : postRows
  const lastPost = posts[posts.length - 1]
  const nextCursor = hasNextPage && lastPost ? encodePostCursor(lastPost.createdAt.getTime(), lastPost.id) : null
  const cacheControl = getPostListCacheControl({ cursor, filter })

  const result = {
    posts,
    nextCursor,
  } satisfies GETV1PostResponse

  return c.json(result, { headers: { 'Cache-Control': cacheControl } })
})

export default route

function getPostListCacheControl({ cursor, filter }: { cursor?: string; filter?: PostFilter }) {
  if (filter === PostFilter.FOLLOWING) {
    return privateCacheControl
  }

  if (cursor) {
    return createCacheControl({
      public: true,
      maxAge: sec('5 minutes'),
      sMaxAge: sec('1 day'),
      swr: sec('1 hour'),
    })
  }

  return createCacheControl({
    public: true,
    maxAge: 3,
    sMaxAge: sec('1 minute'),
    swr: sec('1 hour'),
  })
}
