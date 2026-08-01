import { isLocale, type Locale } from '@sobok/domain/locale'
import type { GuardianChartSnapshot, GuardianPreviewAnswerSnapshot } from '../../worker/guardian/manifest'
import type { GuardianQuestionnaireAnswer, GuardianQuestionnaireClientStep } from '../../worker/guardian/questionnaire'
import type { GuardianReportView } from '../../worker/guardian/report-contract'

export { GUARDIAN_CHECKOUT_ACTION } from '../../worker/api/guardian-checkouts/actions'
export type { GuardianChartSnapshot, GuardianQuestionnaireClientStep, GuardianReportView }

const CHECKOUT_SESSION_KEY = 'stella.guardianCheckout.v1'

export type GuardianCheckoutSession = {
  locale: Locale
  collectionPublicId: string
  reportPublicId: string
  accessToken: string
  paymentId: string
  email: string
  createdAt: number
}

export type GuardianCheckoutPayment = {
  paymentId: string
  status: 'pending' | 'paid'
  sku: string
  storeId: string
  channelKey: string
  payMethod: 'EASY_PAY'
  orderName: string
  amount: number
  market: 'KR'
  currency: 'KRW'
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
  | { status: 'paid'; reportPublicId: string }
  | { status: 'failed' | 'cancelled' | 'refunded'; reportPublicId: string }

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
  turnstileToken: string
  chart: GuardianChartSnapshot
  previewAnswers: GuardianPreviewAnswerSnapshot
}): Promise<GuardianCheckoutResponse> {
  return requestJson('/api/guardian-checkouts', jsonRequest(input))
}

export function resumeGuardianCheckout(
  session: GuardianCheckoutSession,
  input: { email: string; turnstileToken: string },
): Promise<GuardianCheckoutResponse> {
  return requestJson(
    '/api/guardian-checkouts',
    jsonRequest({ ...input, reportPublicId: session.reportPublicId }, session.accessToken),
  )
}

export function confirmGuardianPurchase(session: GuardianCheckoutSession): Promise<GuardianPurchaseConfirmation> {
  return requestJson(
    `/api/guardian-purchases/${encodeURIComponent(session.paymentId)}/confirm`,
    jsonRequest({}, session.accessToken),
  )
}

export function getGuardianReport(session: GuardianCheckoutSession): Promise<GuardianReportView> {
  return requestJson<{ report: GuardianReportView }>(
    `/api/guardian-reports/${encodeURIComponent(session.reportPublicId)}`,
    { headers: { authorization: `Bearer ${session.accessToken}` } },
  ).then(({ report }) => report)
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
