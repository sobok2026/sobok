import { PROBLEM, type ProblemSpec } from '@sobok/contracts'
import { type TurnstileFailureReason, verifyTurnstile } from '@sobok/edge/turnstile'
import { env as authEnv } from '@sobok/env/server.auth'
import { getRequestIP } from '@sobok/http/request'
import type { Context } from 'hono'

import { problemResponse } from './problem'
import { TURNSTILE_ALLOWED_HOSTNAMES } from './request-origin'

// 검증기의 reason → 클라이언트가 볼 수 있는 것. 일부러 거칠게 나눈다: rejected 는 호스트·action 중 무엇이
// 어긋났는지 말하지 않고, misconfigured 는 시크릿이 문제라는 사실을 말하지 않는다. 진단은 아래 로그에만 남는다.
const PROBLEM_BY_REASON: Record<TurnstileFailureReason, ProblemSpec> = {
  expired: PROBLEM.HUMAN_VERIFICATION_EXPIRED,
  misconfigured: PROBLEM.SERVER_ERROR,
  rejected: PROBLEM.HUMAN_VERIFICATION_FAILED,
  unavailable: PROBLEM.SERVICE_UNAVAILABLE,
}

// 통과하면 null, 아니면 그대로 돌려보낼 응답. Turnstile 을 직접 검증하는 라우트는 전부 여기를 지나므로
// 호스트 핀과 분류 규칙이 라우트마다 어긋날 수 없다. (better-auth 가 가로채는 auth 라우트는 captcha 플러그인이
// 같은 일을 하되 자체 응답 형식을 쓴다.)
export async function guardTurnstile(c: Context, expectedAction: string, token: string): Promise<Response | null> {
  // getRequestIP 는 프록시 헤더에 클라이언트 주소가 없으면 문자열 'unknown' 을 돌려준다. 그대로 remoteip 으로
  // 넘기면 Cloudflare 가 존재하지 않는 주소를 채점하므로 생략하는 편이 낫다.
  const requestIP = getRequestIP(c.req.raw.headers)

  const result = await verifyTurnstile(
    authEnv.TURNSTILE_SECRET_KEY,
    token,
    requestIP === 'unknown' ? null : requestIP,
    {
      allowedHostnames: TURNSTILE_ALLOWED_HOSTNAMES,
      expectedAction,
    },
  )

  if (result.ok) {
    return null
  }

  // 네 가지 reason 모두 로그에는 남긴다. 토큰 자체는 자격 증명이므로 절대 로그에 넣지 않는다.
  console.warn(`turnstile ${result.reason} (${expectedAction}): ${result.logDetail}`)

  // 알림은 misconfigured 에만 건다. 클라이언트가 유발할 수 없는 유일한 분기라서 그렇다 — 봇 웨이브 중에
  // rejected 로 알림을 쏘면 그 자체가 자폭이 된다.
  if (result.reason === 'misconfigured') {
    console.error('turnstile.misconfigured — 시크릿·요청 형식을 점검해야 한다. 봇 게이트가 전부 닫힌 상태다')
  }

  return problemResponse(c, {
    problem: PROBLEM_BY_REASON[result.reason],
    ...(result.reason === 'unavailable' && { headers: { 'Retry-After': '5' } }),
  })
}
