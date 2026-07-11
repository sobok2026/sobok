import { describe, expect, test } from 'bun:test'
import type { SessionUser } from '@sobok/auth'
import { PROBLEM_CONTENT_TYPE } from '@sobok/http/problem-details'
import { Hono } from 'hono'

import { requireAuth } from '../require-auth'

type TestEnv = {
  Variables: {
    user: SessionUser | null
  }
}

describe('requireAuth', () => {
  test('세션 user가 없으면 401 problem response를 반환한다', async () => {
    const app = createApp(null)

    const response = await app.request('/protected')
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(response.headers.get('Content-Type')).toBe(PROBLEM_CONTENT_TYPE)

    expect(body).toMatchObject({
      status: 401,
      title: '로그인 정보가 없거나 만료됐어요',
    })
  })

  test('세션 user가 있으면 다음 핸들러로 요청을 넘긴다', async () => {
    const app = createApp({ id: 'user-7' } as SessionUser)

    const response = await app.request('/protected')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, userId: 'user-7' })
  })
})

function createApp(user: SessionUser | null) {
  const app = new Hono<TestEnv>()

  app.use('*', async (c, next) => {
    c.set('user', user)
    await next()
  })

  app.use('*', requireAuth)
  app.get('/protected', (c) => c.json({ ok: true, userId: c.get('user')?.id }))

  return app
}
