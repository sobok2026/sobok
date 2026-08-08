import { isLocale, type Locale } from '@sobok/domain/locale'
import type { GuardianChartSnapshot, GuardianPreviewAnswerSnapshot } from '../../worker/guardian/manifest'
import {
  type GuardianPayMethod,
  type GuardianSdkPayMethod,
  isGuardianPayMethod,
} from '../../worker/guardian/pay-method'
import type { GuardianQuestionnaireAnswer, GuardianQuestionnaireClientStep } from '../../worker/guardian/questionnaire'
import type { GuardianLoveRedrawResult, GuardianLoveRedrawState } from '../../worker/guardian/redraw-contract'
import type { GuardianReportView } from '../../worker/guardian/report-contract'

export { GUARDIAN_CHECKOUT_ACTION } from '../../worker/api/guardian-checkouts/actions'
export { GUARDIAN_REDRAW_CHECKOUT_ACTION } from '../../worker/api/guardian-love-redraw/actions'
export { GUARDIAN_REOPEN_ACTION } from '../../worker/api/guardian-reopen/actions'
// The offer as the buyer-facing screens state it. Build-time constants, not a fetch: the price is the single
// most important fact on the landing page, and it used to arrive over the network — invisible to crawlers,
// shifting the layout on arrival, and stuck on "가격 확인 중" for good whenever the request failed.
export {
  GUARDIAN_CURRENCY,
  GUARDIAN_FREE_DELIVERABLES_KO,
  GUARDIAN_MARKET,
  GUARDIAN_REPORT_ITEM,
  GUARDIAN_REPORT_NAME,
  GUARDIAN_REPORT_PRICE,
  GUARDIAN_REPORT_SKU,
} from '../../worker/guardian/offer'
export { GUARDIAN_PAY_METHODS } from '../../worker/guardian/pay-method'
export type {
  GuardianChartSnapshot,
  GuardianLoveRedrawResult,
  GuardianLoveRedrawState,
  GuardianPayMethod,
  GuardianQuestionnaireClientStep,
  GuardianReportView,
}

const CHECKOUT_SESSION_KEY = 'stella.guardianCheckout.v1'
const PREVIEW_SESSION_KEY = 'stella.guardianPreview.v1'
const REDRAW_CHECKOUT_SESSION_KEY = 'stella.guardianRedrawCheckout.v1'
const REDRAW_DRAW_REQUEST_KEY_PREFIX = 'stella.guardianRedrawDraw.v1.'

const PREVIEW_TONES = ['comfort', 'honesty', 'action', 'possibility'] as const
const PREVIEW_MOVEMENTS = ['start', 'continue', 'recover', 'release'] as const

export function guardianReportPaths(locale: Locale) {
  const landing = `/${locale}/guardian-report`
  return {
    landing,
    free: `${landing}/free`,
    freeResult: `${landing}/free/result`,
    questions: `${landing}/questions`,
    reopen: `${landing}/reopen`,
    result: `${landing}/result`,
    loveRedraw: `${landing}/love-redraw`,
  } as const
}

export type GuardianPreviewSession = GuardianPreviewAnswerSnapshot & {
  locale: Locale
  completedAt: number
}

export type GuardianCheckoutSession = {
  locale: Locale
  collectionPublicId: string
  reportPublicId: string
  accessToken: string
  paymentId: string
  email: string
  payMethod: GuardianPayMethod | null
  createdAt: number
}

export type GuardianReportAccess = {
  locale: Locale
  reportPublicId: string
  accessToken?: string
  collectionPublicId?: string
  email?: string
}

export type GuardianOwnedReport = {
  collectionPublicId: string
  reportPublicId: string
  locale: Locale
  createdAt: string
  title: string
  oneLine: string
  artworkPaths: string[]
}

export type GuardianCheckoutPayment = {
  paymentId: string
  status: 'pending' | 'paid'
  sku: string
  storeId: string
  channelKey: string
  payMethod: GuardianSdkPayMethod
  orderName: string
  amount: number
  market: 'KR'
  currency: 'KRW'
}

export type GuardianRedrawCheckoutSession = {
  reportPublicId: string
  requestId: string
  paymentId: string | null
  sku: string
  payMethod: GuardianPayMethod
  credits: number
  amount: number
  currency: string
  createdAt: number
}

export type GuardianRedrawCheckoutResponse = {
  payment: GuardianCheckoutPayment
}

export type GuardianCheckoutResponse = {
  guest: {
    collectionPublicId: string
    reportPublicId: string
    accessToken?: string
  }
  payment: GuardianCheckoutPayment
}

export type GuardianProductCatalog = {
  products: {
    sku: string
    kind: 'full_report' | 'love_redraw'
    prices: { market: string; currency: string; amountMinor: number }[]
  }[]
  loveDraw: {
    pools: {
      familyId: string
      rarities: {
        rarity: 'orbit' | 'nebula' | 'eclipse' | 'stella'
        weight: number
        weightScale: number
      }[]
    }[]
  }
  guarantee: {
    paidDrawInterval: number
    initialReportCountsTowardProgress: boolean
  }
}

export type GuardianPurchaseConfirmation =
  | { status: 'pending'; reportPublicId: string }
  | {
      status: 'paid'
      reportPublicId: string
      kind: 'full_report' | 'love_redraw'
      credits?: number
    }
  | { status: 'failed' | 'cancelled' | 'refunded'; reportPublicId: string }

export type GuardianReopenExchange =
  | {
      status: 'guest'
      accessToken: string
      collectionPublicId: string
      locale: Locale
      paymentId: string
      recoveryEmail: string
      reportPublicId: string
      reportStatus: 'draft' | 'fulfilled'
    }
  | {
      status: 'account'
      locale: Locale
      reportPublicId: string
    }

export class GuardianApiError extends Error {
  readonly status: number
  readonly slug: string | null

  constructor(status: number, slug: string | null) {
    super(`guardian api ${status}${slug ? ` ${slug}` : ''}`)
    this.name = 'GuardianApiError'
    this.status = status
    this.slug = slug
  }
}

export class GuardianCheckoutStorageError extends Error {
  constructor() {
    super('Guardian checkout session storage is unavailable')
    this.name = 'GuardianCheckoutStorageError'
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      accept: 'application/json',
      ...init?.headers,
    },
  })
  if (!response.ok) {
    let slug: string | null = null
    if (response.headers.get('content-type')?.includes('application/problem+json')) {
      const problem = (await response.json().catch(() => null)) as { title?: unknown } | null
      slug = typeof problem?.title === 'string' ? problem.title : null
    }
    throw new GuardianApiError(response.status, slug)
  }
  return response.json() as Promise<T>
}

function jsonRequest(body: unknown, token?: string): RequestInit {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }
}

export function getGuardianProductCatalog(): Promise<GuardianProductCatalog> {
  return requestJson('/api/guardian-products/current')
}

export function createGuardianCheckout(input: {
  locale: Locale
  email: string
  payMethod: GuardianPayMethod
  turnstileToken: string
  chart: GuardianChartSnapshot
  previewAnswers: GuardianPreviewAnswerSnapshot
}): Promise<GuardianCheckoutResponse> {
  return requestJson('/api/guardian-checkouts', jsonRequest(input))
}

export function resumeGuardianCheckout(
  session: GuardianCheckoutSession,
  input: { email: string; payMethod: GuardianPayMethod; turnstileToken: string },
): Promise<GuardianCheckoutResponse> {
  return requestJson(
    '/api/guardian-checkouts',
    jsonRequest({ ...input, reportPublicId: session.reportPublicId }, session.accessToken),
  )
}

export function confirmGuardianPurchase(session: GuardianCheckoutSession): Promise<GuardianPurchaseConfirmation> {
  return confirmGuardianPayment(session.accessToken, session.paymentId)
}

export function confirmGuardianPayment(
  accessToken: string | undefined,
  paymentId: string,
): Promise<GuardianPurchaseConfirmation> {
  return requestJson(`/api/guardian-purchases/${encodeURIComponent(paymentId)}/confirm`, jsonRequest({}, accessToken))
}

export function getGuardianLoveRedraw(session: GuardianReportAccess): Promise<GuardianLoveRedrawState> {
  return requestJson<{ state: GuardianLoveRedrawState }>(
    `/api/guardian-reports/${encodeURIComponent(session.reportPublicId)}/love-redraw`,
    { headers: authorizationHeaders(session.accessToken) },
  ).then(({ state }) => state)
}

export function createGuardianLoveRedrawCheckout(
  session: GuardianReportAccess,
  input: { requestId: string; sku: string; payMethod: GuardianPayMethod; turnstileToken: string },
): Promise<GuardianRedrawCheckoutResponse> {
  return requestJson(
    `/api/guardian-reports/${encodeURIComponent(session.reportPublicId)}/love-redraw/checkouts`,
    jsonRequest(input, session.accessToken),
  )
}

export function drawGuardianLoveCard(
  session: GuardianReportAccess,
  requestId: string,
): Promise<GuardianLoveRedrawResult> {
  return requestJson<{ result: GuardianLoveRedrawResult }>(
    `/api/guardian-reports/${encodeURIComponent(session.reportPublicId)}/love-redraw/draws`,
    jsonRequest({ requestId }, session.accessToken),
  ).then(({ result }) => result)
}

export function equipGuardianLoveCard(
  session: GuardianReportAccess,
  acquisitionPublicId: string,
): Promise<GuardianLoveRedrawState> {
  return requestJson<{ state: GuardianLoveRedrawState }>(
    `/api/guardian-reports/${encodeURIComponent(session.reportPublicId)}/love-redraw/equipped-card`,
    {
      ...jsonRequest({ acquisitionPublicId }, session.accessToken),
      method: 'PUT',
    },
  ).then(({ state }) => state)
}

export function requestGuardianReopen(input: {
  email: string
  locale: Locale
  turnstileToken: string
}): Promise<{ status: 'accepted' }> {
  return requestJson('/api/guardian-reopen/request', jsonRequest(input))
}

export function exchangeGuardianReopen(token: string): Promise<GuardianReopenExchange> {
  return requestJson('/api/guardian-reopen/exchange', jsonRequest({ token }))
}

export function getGuardianReport(session: GuardianReportAccess): Promise<GuardianReportView> {
  return requestJson<{ report: GuardianReportView }>(
    `/api/guardian-reports/${encodeURIComponent(session.reportPublicId)}`,
    { headers: authorizationHeaders(session.accessToken) },
  ).then(({ report }) => report)
}

export function listOwnedGuardianReports(): Promise<GuardianOwnedReport[]> {
  return requestJson<{ items: GuardianOwnedReport[] }>('/api/guardian-collections').then(({ items }) => items)
}

export function claimGuardianCollection(session: GuardianCheckoutSession): Promise<{
  status: 'claimed' | 'already-claimed'
  reward: 'granted' | 'already-granted'
  guestAccessRevoked: true
}> {
  return requestJson(
    `/api/guardian-collections/${encodeURIComponent(session.collectionPublicId)}/claim`,
    jsonRequest({ reportPublicId: session.reportPublicId }, session.accessToken),
  )
}

export function getGuardianQuestion(session: GuardianCheckoutSession): Promise<GuardianQuestionnaireClientStep> {
  return requestJson<{ step: GuardianQuestionnaireClientStep }>(
    `/api/guardian-reports/${encodeURIComponent(session.reportPublicId)}/question`,
    { headers: { authorization: `Bearer ${session.accessToken}` } },
  ).then(({ step }) => step)
}

export function putGuardianAnswer(
  session: GuardianCheckoutSession,
  questionId: string,
  answer: GuardianQuestionnaireAnswer,
): Promise<GuardianQuestionnaireClientStep> {
  return requestJson<{ step: GuardianQuestionnaireClientStep }>(
    `/api/guardian-reports/${encodeURIComponent(session.reportPublicId)}/answers/${encodeURIComponent(questionId)}`,
    {
      ...jsonRequest({ answer }, session.accessToken),
      method: 'PUT',
    },
  ).then(({ step }) => step)
}

export function acknowledgeGuardianMilestone(
  session: GuardianCheckoutSession,
  milestoneId: string,
): Promise<GuardianQuestionnaireClientStep> {
  return requestJson<{ step: GuardianQuestionnaireClientStep }>(
    `/api/guardian-reports/${encodeURIComponent(session.reportPublicId)}/milestones/${encodeURIComponent(milestoneId)}`,
    {
      ...jsonRequest({}, session.accessToken),
      method: 'PUT',
    },
  ).then(({ step }) => step)
}

function authorizationHeaders(token?: string): HeadersInit {
  return token ? { authorization: `Bearer ${token}` } : {}
}

export function readGuardianCheckoutSession(): GuardianCheckoutSession | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_SESSION_KEY)
    if (!raw) {
      return null
    }
    const value = JSON.parse(raw) as Partial<GuardianCheckoutSession>
    return typeof value.locale === 'string' &&
      isLocale(value.locale) &&
      typeof value.collectionPublicId === 'string' &&
      typeof value.reportPublicId === 'string' &&
      typeof value.accessToken === 'string' &&
      typeof value.paymentId === 'string' &&
      typeof value.email === 'string' &&
      (value.payMethod === null || isGuardianPayMethod(value.payMethod)) &&
      typeof value.createdAt === 'number'
      ? (value as GuardianCheckoutSession)
      : null
  } catch {
    return null
  }
}

export function storeGuardianCheckoutSession(session: GuardianCheckoutSession): void {
  try {
    sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(session))
  } catch {
    throw new GuardianCheckoutStorageError()
  }
}

export function clearGuardianCheckoutSession(): void {
  try {
    sessionStorage.removeItem(CHECKOUT_SESSION_KEY)
  } catch {
    // A blocked storage API already behaves as though there were no resumable checkout.
  }
}

export function readGuardianRedrawCheckoutSession(reportPublicId: string): GuardianRedrawCheckoutSession | null {
  try {
    const raw = sessionStorage.getItem(REDRAW_CHECKOUT_SESSION_KEY)
    if (!raw) {
      return null
    }
    const value = JSON.parse(raw) as Partial<GuardianRedrawCheckoutSession>
    return value.reportPublicId === reportPublicId &&
      typeof value.requestId === 'string' &&
      (typeof value.paymentId === 'string' || value.paymentId === null) &&
      typeof value.sku === 'string' &&
      isGuardianPayMethod(value.payMethod) &&
      typeof value.credits === 'number' &&
      typeof value.amount === 'number' &&
      typeof value.currency === 'string' &&
      typeof value.createdAt === 'number'
      ? (value as GuardianRedrawCheckoutSession)
      : null
  } catch {
    return null
  }
}

export function storeGuardianRedrawCheckoutSession(session: GuardianRedrawCheckoutSession): void {
  try {
    sessionStorage.setItem(REDRAW_CHECKOUT_SESSION_KEY, JSON.stringify(session))
  } catch {
    throw new GuardianCheckoutStorageError()
  }
}

export function clearGuardianRedrawCheckoutSession(): void {
  try {
    sessionStorage.removeItem(REDRAW_CHECKOUT_SESSION_KEY)
  } catch {
    // A blocked storage API already behaves as though there were no resumable redraw checkout.
  }
}

export function readOrCreateGuardianDrawRequest(reportPublicId: string): string {
  const key = `${REDRAW_DRAW_REQUEST_KEY_PREFIX}${reportPublicId}`
  try {
    const existing = sessionStorage.getItem(key)
    if (existing) {
      return existing
    }
    const requestId = crypto.randomUUID()
    sessionStorage.setItem(key, requestId)
    return requestId
  } catch {
    throw new GuardianCheckoutStorageError()
  }
}

export function clearGuardianDrawRequest(reportPublicId: string): void {
  try {
    sessionStorage.removeItem(`${REDRAW_DRAW_REQUEST_KEY_PREFIX}${reportPublicId}`)
  } catch {
    // A blocked storage API cannot retain a stale request id.
  }
}

export function readGuardianPreviewSession(locale: Locale): GuardianPreviewSession | null {
  try {
    const raw = sessionStorage.getItem(PREVIEW_SESSION_KEY)
    if (!raw) {
      return null
    }
    const value = JSON.parse(raw) as Partial<GuardianPreviewSession>
    return value.locale === locale &&
      PREVIEW_TONES.some((tone) => tone === value.tone) &&
      PREVIEW_MOVEMENTS.some((movement) => movement === value.movement) &&
      typeof value.completedAt === 'number'
      ? (value as GuardianPreviewSession)
      : null
  } catch {
    return null
  }
}

export function storeGuardianPreviewSession(session: GuardianPreviewSession): void {
  try {
    sessionStorage.setItem(PREVIEW_SESSION_KEY, JSON.stringify(session))
  } catch {
    throw new GuardianCheckoutStorageError()
  }
}
