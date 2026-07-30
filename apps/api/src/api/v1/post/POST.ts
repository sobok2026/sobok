import { type POSTV1PostResponse, postV1PostBodySchema } from '@sobok/contracts'
import { db } from '@sobok/db/app'
import { postTable } from '@sobok/db/app/post'
import { isPostgresError } from '@sobok/db/error'
import { POST_TYPE } from '@sobok/domain/post/model'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('json', postV1PostBodySchema))

route.post('/', ...middlewares, async (c) => {
  const userId = c.get('user')!.id
  const { content, mangaId, parentPostId, referredPostId } = c.req.valid('json')

  if (parentPostId && referredPostId) {
    return problemResponse(c, { status: 400, detail: '답글과 리포스트를 동시에 지정할 수 없어요' })
  }

  const type = parentPostId ? POST_TYPE.REPLY : referredPostId ? POST_TYPE.REPOST : POST_TYPE.TEXT

  try {
    const [createdPost] = await db
      .insert(postTable)
      .values({
        userId,
        content,
        mangaId: mangaId ?? null,
        parentPostId: parentPostId ?? null,
        referredPostId: referredPostId ?? null,
        type,
      })
      .returning({ id: postTable.id })

    if (!createdPost) {
      return problemResponse(c, { status: 500 })
    }

    return c.json({ id: createdPost.id } satisfies POSTV1PostResponse, 201)
  } catch (error) {
    if (isPostgresError(error) && error.cause.code === '23503') {
      return problemResponse(c, { status: 404, detail: '대상 글을 찾을 수 없어요' })
    }

    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
