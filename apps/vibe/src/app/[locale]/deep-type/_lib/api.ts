import type { Locale } from '@sobok/domain/locale'

import type { ItemAnswer } from './types'

// Thin client for the same-origin deeptype Worker API (apps/vibe/worker). The static frontend and the
// Worker share one origin, so these are plain relative fetches — no base URL, no CORS.
const BASE = '/api/deep-type'

export type ReportSectionKey =
  | 'summary'
  | 'gap'
  | 'abyss'
  | 'love'
  | 'work'
  | 'money'
  | 'growthStory'
  | 'energy'
  | 'relationCaution'
  | 'flow'
  | 'match'
  | 'thisWeek'

export type ReportSection = { key: ReportSectionKey; title: string; body: string }

export type SessionInput = {
  locale: Locale
  persona: string
  innerType: string
  gem: string
  selfClaim?: string
  baseAnswers?: unknown[]
  innerAnswers?: unknown[]
  gemAnswers?: unknown[]
}

async function postJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) {
    headers.authorization = `Bearer ${token}`
  }
  const response = await fetch(`${BASE}${path}`, { body: JSON.stringify(body), headers, method: 'POST' })
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

// Persist the free result → a re-viewable token that checkout gates against. baseAnswers/etc. are optional
// (the free tier discards raw answers; the report narrates from codes + the server-scored precision layer).
export function postSession(input: SessionInput): Promise<{ resultToken: string }> {
  return postJson('/session', {
    baseAnswers: [],
    innerAnswers: [],
    gemAnswers: [],
    ...input,
  })
}

export type CheckoutResponse = {
  paymentId: string
  accessToken: string
  storeId: string
  channelKey: string
  orderName: string
  amount: number
  currency: string
}

export type CheckoutInput = {
  resultToken: string
  sku: 'report'
  email: string
  consentWithdrawal: boolean
  consentPrivacy: boolean
  turnstileToken: string
}

export function postCheckout(input: CheckoutInput): Promise<CheckoutResponse> {
  return postJson('/checkout', input)
}

export function postVerify(paymentId: string): Promise<{ status: string }> {
  return postJson('/verify', { paymentId })
}

// Submit the paid 24Q for server-authoritative re-scoring. Best-effort from the client's view: the report
// still generates (from codes only) if this is skipped or fails.
export function postPrecision(accessToken: string, answers: ItemAnswer[]): Promise<{ status: string }> {
  return postJson('/precision', { answers }, accessToken)
}

export function postGenerate(accessToken: string): Promise<{ status: string }> {
  return postJson('/report/generate', {}, accessToken)
}

export type ReportPoll = { done: true; sections: ReportSection[] } | { done: false }

// 200 → done; 202 → still generating (keep polling); anything else is terminal (not-paid/refunded/failed).
export async function getReport(accessToken: string): Promise<ReportPoll> {
  const response = await fetch(`${BASE}/report`, { headers: { authorization: `Bearer ${accessToken}` } })
  if (response.status === 202) {
    return { done: false }
  }
  if (!response.ok) {
    throw new ApiError(response.status)
  }
  const data = (await response.json()) as { sections: ReportSection[] }
  return { done: true, sections: data.sections }
}
