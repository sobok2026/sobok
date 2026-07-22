import type { AssessmentProfile, ItemAnswer } from '@deep-type/model'
import type { Locale } from '@sobok/domain/locale'

const BASE = '/api/deep-type'

export type ReportSectionKey =
  | 'summary'
  | 'contextShift'
  | 'selfWorth'
  | 'relationships'
  | 'emotionRegulation'
  | 'motivation'
  | 'workStyle'
  | 'recovery'
  | 'strengths'
  | 'friction'
  | 'reflectionQuestions'
  | 'nextSteps'

export type ReportSection = { body: string; key: ReportSectionKey; title: string }

export type SessionInput = {
  answers: ItemAnswer[]
  locale: Locale
}

async function postJson<T>(path: string, body: unknown, token?: string, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) {
    headers.authorization = `Bearer ${token}`
  }
  const response = await fetch(`${BASE}${path}`, { body: JSON.stringify(body), headers, method: 'POST', signal })
  if (!response.ok) {
    throw new ApiError(response.status)
  }
  return response.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`deeptype api ${status}`)
  }
}

export function postSession(input: SessionInput): Promise<{ profile: AssessmentProfile; resultToken: string }> {
  return postJson('/session', input)
}

export type CheckoutResponse = {
  accessToken: string
  amount: number
  channelKey: string
  currency: string
  orderName: string
  paymentId: string
  storeId: string
}

export type CheckoutInput = {
  ageConfirmed: boolean
  consentPrivacy: boolean
  consentWithdrawal: boolean
  email: string
  resultToken: string
  sku: 'report'
  turnstileToken: string
}

export function postCheckout(input: CheckoutInput): Promise<CheckoutResponse> {
  return postJson('/checkout', input)
}

export function postVerify(paymentId: string): Promise<{ status: string }> {
  return postJson('/verify', { paymentId })
}

export function postRefinement(
  accessToken: string,
  answers: ItemAnswer[],
): Promise<{ profile: AssessmentProfile; status: 'ok' }> {
  return postJson('/refinement', { answers }, accessToken)
}

export function postGenerate(accessToken: string, signal?: AbortSignal): Promise<{ status: string }> {
  return postJson('/report/generate', {}, accessToken, signal)
}

export function postCancel(accessToken: string): Promise<{ status: string }> {
  return postJson('/cancel', {}, accessToken)
}

export type ReopenExchangeResponse = {
  accessExpiresAt: string
  accessToken: string
  locale: Locale
  refinementRequired: boolean
}

export function postReopenRequest(input: {
  ageConfirmed: true
  email: string
  locale: Locale
  turnstileToken: string
}): Promise<{ status: 'accepted' }> {
  return postJson('/reopen/request', input)
}

export function postReopenExchange(token: string): Promise<ReopenExchangeResponse> {
  return postJson('/reopen/exchange', { token })
}

export type ReportPoll = { done: true; profile: AssessmentProfile; sections: ReportSection[] } | { done: false }

export async function getReport(accessToken: string, signal?: AbortSignal): Promise<ReportPoll> {
  const response = await fetch(`${BASE}/report`, { headers: { authorization: `Bearer ${accessToken}` }, signal })
  if (response.status === 202) {
    return { done: false }
  }
  if (!response.ok) {
    throw new ApiError(response.status)
  }
  const data = (await response.json()) as { profile: AssessmentProfile; sections: ReportSection[] }
  return { done: true, profile: data.profile, sections: data.sections }
}
