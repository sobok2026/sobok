import { describe, expect, test } from 'bun:test'
import type { SessionUser } from '@sobok/auth'
import { PROBLEM } from '@sobok/contracts'
import { PROBLEM_CONTENT_TYPE } from '@sobok/http/problem-details'
import { Hono } from 'hono'

import { requireAdult } from '../require-adult'

type TestEnv = {
  Variables: {
    user: SessionUser | null
  }
}

describe('requireAdult', () => {
  test('한국 로그인 사용자이고 성인 플래그가 없으면 403 problem response를 반환한다', async () => {
    const app = createApp({
      headers: { 'CF-IPCountry': 'KR' },
      user: fakeUser({ isAdult: false }),
    })

    const response = await app.request('/adult')
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(response.headers.get('Content-Type')).toBe(PROBLEM_CONTENT_TYPE)

    expect(body).toMatchObject({
      type: `https://localhost/problems/${PROBLEM.ADULT_VERIFICATION_REQUIRED.slug}`,
      title: '성인인증이 필요해요',
      status: 403,
    })
  })

  test('비한국 사용자거나 비로그인 요청이면 다음 핸들러로 요청을 넘긴다', async () => {
    const app = createApp({
      headers: { 'CF-IPCountry': 'US' },
      user: fakeUser({ isAdult: false }),
    })

    const response = await app.request('/adult')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })
})

function fakeUser({ isAdult }: { isAdult: boolean }): SessionUser {
  return { id: 'user-10', isAdult } as SessionUser
}

function createApp({ headers, user = null }: { headers?: HeadersInit; user?: SessionUser | null } = {}) {
  const app = new Hono<TestEnv>()

  app.use('*', async (c, next) => {
    c.set('user', user)
    await next()
  })

  app.use('*', requireAdult)
  app.get('/adult', (c) => c.json({ ok: true }))

  const request = app.request.bind(app)
  app.request = ((input: string | Request | URL, init?: RequestInit) => {
    const requestHeaders = new Headers(init?.headers)

    for (const [name, value] of new Headers(headers)) {
      requestHeaders.set(name, value)
    }

    return request(input, {
      ...init,
      headers: requestHeaders,
    })
  }) as typeof app.request

  return app
}
