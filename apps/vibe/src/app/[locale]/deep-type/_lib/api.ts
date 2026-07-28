import type { AssessmentProfile, ItemAnswer, PersonaCode, WorkAnswer } from '@deep-type/model'
import type { GAIdentity } from '@sobok/analytics/ga-identity'
import type { Locale } from '@sobok/domain/locale'

import type { ReportSection } from '../../../../../worker/report/section-keys'

const BASE = '/api/deep-type'

// The section vocabulary lives in the Worker tree and is imported, not restated. The copy that used to sit here
// drifted from the server's list the moment the career sections landed, and nothing could have caught it: two
// independent unions agree with each other by luck. `worker/report/section-keys.ts` is dependency-free for
// exactly this import, the same arrangement as `worker/api/deep-type/actions.ts`.
export type { ReportSection, ReportSectionKey } from '../../../../../worker/report/section-keys'

export type SessionInput = {
  answers: ItemAnswer[]
  /** Null when the picker was skipped. The server keeps only whether it was given. */
  declaredPersona: PersonaCode | null
  locale: Locale
  workAnswers: WorkAnswer[]
}

async function sendJson<T>(
  method: 'POST' | 'PUT',
  path: string,
  body: unknown,
  token?: string,
  signal?: AbortSignal,
): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) {
    headers.authorization = `Bearer ${token}`
  }
  const response = await fetch(`${BASE}${path}`, { body: JSON.stringify(body), headers, method, signal })
  if (!response.ok) {
    throw await toApiError(response)
  }
  return response.json() as Promise<T>
}

function postJson<T>(path: string, body: unknown, token?: string, signal?: AbortSignal): Promise<T> {
  return sendJson('POST', path, body, token, signal)
}

export class ApiError extends Error {
  // `slug` is the RFC 9457 problem type, and it exists because status alone cannot separate two 410s that
  // mean opposite things to the person reading the screen: a refunded purchase is over, while a retired
  // instrument or a purged answer set means "your report is still yours, the follow-up questions are not".
  // Null whenever the failure did not come back as a problem document — a proxy, an edge error, a 502.
  constructor(
    readonly status: number,
    readonly slug: string | null = null,
  ) {
    super(`deeptype api ${status}${slug ? ` ${slug}` : ''}`)
  }
}

// The Worker sends `application/problem+json` with the slug in `title` for every error it authors. Anything
// else on the wire is someone else's failure, so the body is not read and `slug` stays null.
async function toApiError(response: Response): Promise<ApiError> {
  if (!response.headers.get('content-type')?.includes('application/problem+json')) {
    return new ApiError(response.status)
  }
  const body = (await response.json().catch(() => null)) as { title?: unknown } | null
  return new ApiError(response.status, typeof body?.title === 'string' ? body.title : null)
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
  // GA4 identity snapshot taken on the paywall, so the Worker can attribute the server-side `purchase` to this
  // visitor's session. Null whenever `analytics_storage` is denied — the server then sends nothing.
  analytics: GAIdentity | null
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

// Acknowledgement only. The refined profile is paid content and arrives through `getReport`, which is the one
// path that stamps delivery.
export function postRefinement(
  accessToken: string,
  answers: ItemAnswer[],
  // Whole forced-choice set, free drain block included: the refined tally spans all five dimensions and the
  // free three are not stored server-side.
  workAnswers: WorkAnswer[],
): Promise<{ status: 'ok' }> {
  return postJson('/refinement', { answers, workAnswers }, accessToken)
}

export type RefinementDraft = { answers: ItemAnswer[]; workAnswers: WorkAnswer[] }

/**
 * What resume returns: the parked buffer plus the free drain block the server has held since `POST /session`.
 *
 * The extra field is not a copy of anything the client can be sure it has. `sessionStorage` belongs to one tab
 * and the parked buffer carries the free three only after a paid item was answered, so a buyer who opens the
 * re-open e-mail on another device has neither — and `POST /refinement` refuses a set of fewer than
 * twenty-four. This is the only source that survives a new browser.
 */
export type RefinementResume = RefinementDraft & { freeWorkAnswers: WorkAnswer[] }

// Mid-block save. Replaces the whole buffer every time, so a duplicate send from a flaky connection costs
// nothing and there is no partial state to reconcile.
export function putRefinementDraft(accessToken: string, draft: RefinementDraft): Promise<{ status: 'ok' }> {
  return sendJson('PUT', '/refinement/draft', draft, accessToken)
}

// Resume. Empty `answers`/`workAnswers` mean "nothing parked" — a fresh sitting and a finished one are both
// legitimately empty here, and `refinementRequired` from the re-open exchange is what separates them.
//
// `freeWorkAnswers` is defaulted rather than trusted: a row written before the column existed sends null, and
// the caller's own sitting is the fallback in that case.
export async function getRefinementDraft(accessToken: string, signal?: AbortSignal): Promise<RefinementResume> {
  const response = await fetch(`${BASE}/refinement/draft`, {
    headers: { authorization: `Bearer ${accessToken}` },
    signal,
  })
  if (!response.ok) {
    throw await toApiError(response)
  }
  const data = (await response.json()) as RefinementResume
  return { answers: data.answers, freeWorkAnswers: data.freeWorkAnswers ?? [], workAnswers: data.workAnswers }
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
  email: string
  locale: Locale
  turnstileToken: string
}): Promise<{ status: 'accepted' }> {
  return postJson('/reopen/request', input)
}

export function postReopenExchange(token: string): Promise<ReopenExchangeResponse> {
  return postJson('/reopen/exchange', { token })
}

// The report is delivered in two commits. `sections` is the rule engine's body and is complete on its own —
// it is what the reader paid for, and it is renderable with `narrative` empty. `narrativePending` says the
// LLM pass has not finished; while it is true the server has NOT stamped delivery, so the withdrawal right is
// still open and the caller should keep polling.
export type ReportDelivery = {
  narrative: ReportSection[]
  narrativePending: boolean
  profile: AssessmentProfile
  sections: ReportSection[]
}

export type ReportPoll = { done: false } | ({ done: true } & ReportDelivery)

export async function getReport(accessToken: string, signal?: AbortSignal): Promise<ReportPoll> {
  const response = await fetch(`${BASE}/report`, { headers: { authorization: `Bearer ${accessToken}` }, signal })
  if (response.status === 202) {
    return { done: false }
  }
  if (!response.ok) {
    throw await toApiError(response)
  }
  const data = (await response.json()) as ReportDelivery
  return {
    done: true,
    narrative: data.narrative ?? [],
    narrativePending: data.narrativePending,
    profile: data.profile,
    sections: data.sections,
  }
}
