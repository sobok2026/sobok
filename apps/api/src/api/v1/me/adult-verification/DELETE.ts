import { auth, BBATON_PROVIDER_ID, refreshSessionCookies } from '@sobok/auth/server'
import { deleteV1MeAdultVerificationBodySchema } from '@sobok/contracts'
import { db } from '@sobok/db/app'
import { account } from '@sobok/db/app/auth'
import { bbatonVerificationTable } from '@sobok/db/app/bbaton'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'
import { verifyUserPassword } from '@/utils/verify-user-password'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('json', deleteV1MeAdultVerificationBodySchema))

// BBaton 연동 해제 — better-auth account 연결과 인증 정보를 지우고 isAdult를 되돌린다.
route.delete('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { password } = c.req.valid('json')

  try {
    const isValidPassword = await verifyUserPassword(c.req.raw.headers, password)

    if (!isValidPassword) {
      return problemResponse(c, { status: 400, detail: '입력을 확인해 주세요' })
    }

    await db.transaction(async (tx) => {
      await tx.delete(account).where(and(eq(account.userId, userId), eq(account.providerId, BBATON_PROVIDER_ID)))
      await tx.delete(bbatonVerificationTable).where(eq(bbatonVerificationTable.userId, userId))
    })

    // updateUser가 DB와 secondaryStorage(Redis)에 캐시된 세션 user를 함께 되돌린다.
    const { internalAdapter } = await auth.$context
    await internalAdapter.updateUser(userId, { isAdult: false })

    // 서명 쿠키에 캐시된 세션은 updateUser로 갱신되지 않는다 — 강제 재발급하지 않으면 cookieCache
    // maxAge 동안 클라이언트가 옛 isAdult=true를 들고 있어 성인 콘텐츠 게이트가 즉시 닫히지 않는다.
    const cookies = await refreshSessionCookies(c.req.raw.headers)

    for (const cookie of cookies) {
      c.header('set-cookie', cookie, { append: true })
    }

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
