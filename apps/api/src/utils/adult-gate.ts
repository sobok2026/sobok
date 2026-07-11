import { PROBLEM } from '@sobok/contracts'
import type { Context } from 'hono'

import type { Env } from '@/app'

import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { getCloudflareCountryCode } from '@/utils/request-country'

export function adultVerificationRequiredResponse(c: Context): Response {
  return problemResponse(c, {
    problem: PROBLEM.ADULT_VERIFICATION_REQUIRED,
    headers: { 'Cache-Control': privateCacheControl },
  })
}

export function isAdultVerificationRequiredForRequest(c: Pick<Context, 'req'>): boolean {
  const countryCode = getCloudflareCountryCode(c)
  return countryCode === undefined || countryCode === 'KR'
}

export function shouldBlockAdultGate(c: Context<Env>): boolean {
  const user = c.get('user')

  return isAdultVerificationRequiredForRequest(c) && user != null && !user.isAdult
}
