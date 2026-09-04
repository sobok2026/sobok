import type { Locale } from '@sobok/domain/locale'
import type {
  GuardianDailyAccessView,
  GuardianDailyBasis,
  GuardianDailyCardResponse,
  GuardianDailyCardView,
  GuardianDailyRarity,
  GuardianDailySummary,
  GuardianDailyTheme,
  GuardianDailyTone,
  GuardianZodiacSign,
} from '../../worker/guardian/daily-contract'
import {
  type GuardianPayMethod,
  type GuardianSdkPayMethod,
  isGuardianPayMethod,
} from '../../worker/guardian/pay-method'

export { GUARDIAN_PASS_CHECKOUT_ACTION, GUARDIAN_PASS_REOPEN_ACTION } from '../../worker/api/guardian-pass/actions'
export { GUARDIAN_DAILY_THEMES, GUARDIAN_DAILY_TONES } from '../../worker/guardian/daily-contract'
export {
  GUARDIAN_CURRENCY,
  GUARDIAN_MARKET,
  GUARDIAN_PASS_DURATION_DAYS,
  GUARDIAN_PASS_ITEM,
  GUARDIAN_PASS_NAME,
  GUARDIAN_PASS_PRICE,
  GUARDIAN_PASS_SKU,
} from '../../worker/guardian/offer'
export { GUARDIAN_PAY_METHODS } from '../../worker/guardian/pay-method'
export type {
  GuardianDailyAccessView,
  GuardianDailyBasis,
  GuardianDailyCardResponse,
  GuardianDailyCardView,
  GuardianDailyRarity,
  GuardianDailySummary,
  GuardianDailyTheme,
  GuardianDailyTone,
  GuardianPayMethod,
  GuardianZodiacSign,
}

const VIEWER_ID_KEY = 'stella.guardianViewer.v1'
const PASS_SESSION_KEY = 'stella.guardianPass.v1'
const CHECKOUT_REQUEST_KEY = 'stella.guardianPassCheckout.v1'
const TONE_INTENT_PREFIX = 'stella.guardianTone.v1.'
const CARD_CACHE_KEY = 'stella.guardianDailyCards.v1'
export const GUARDIAN_CLAIM_INTENT_KEY = 'stella.guardianClaimIntent.v1'

export type GuardianPassSession = {
  locale: 'ko'
  collectionPublicId: string
  accessToken?: string
  paymentId: string
  payMethod: GuardianPayMethod | null
  accessExpiresAt: string | null
  createdAt: number
  claimed: boolean
}

export type GuardianCheckoutPayment = {
  paymentId: string
  status: 'pending' | 'paid'
  accessExpiresAt: string | null
  sku: string
  storeId: string
  channelKey: string
  payMethod: GuardianSdkPayMethod
  orderName: string
  amount: number
  market: 'KR'
  currency: 'KRW'
}

export type GuardianPassCheckoutResponse = {
  collection: { publicId: string; accessToken?: string }
  payment: GuardianCheckoutPayment
}

export type GuardianPassConfirmation =
  | { status: 'pending' }
  | { status: 'paid'; accessExpiresAt: string; collectionPublicId: string; grant: 'granted' | 'already-granted' }
  | { status: 'failed' | 'cancelled' | 'refunded' }

export type GuardianLibraryItem = GuardianDailyCardView & {
  collectionPublicId: string
  publicId: string
  createdAt: string
}

export type GuardianLibrary = {
  items: GuardianLibraryItem[]
  summary: GuardianDailySummary | null
  access: GuardianDailyAccessView
}

export type GuardianReopenExchange =
  | { status: 'account'; locale: Locale }
  | {
      status: 'guest'
      accessToken: string
      collectionPublicId: string
      locale: 'ko'
      paymentId: string
      accessExpiresAt: string
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

export class GuardianStorageError extends Error {
  constructor() {
    super('Guardian browser storage is unavailable')
    this.name = 'GuardianStorageError'
  }
}

export function requestGuardianDailyCard(input: {
  surface: 'today' | 'tomorrow'
  dateKey: string
  timeZone: string
  basis: GuardianDailyBasis
  sign: GuardianZodiacSign
  skySign: GuardianZodiacSign
  tone?: GuardianDailyTone
  viewerId: string
  accessToken?: string
}): Promise<GuardianDailyCardResponse> {
  const { accessToken, ...body } = input
  return requestJson('/api/guardian-daily/card', jsonRequest({ ...body, locale: 'ko' }, accessToken))
}

export function createGuardianPassCheckout(input: {
  locale: 'ko'
  timeZone: string
  email: string
  payMethod: GuardianPayMethod
  turnstileToken: string
  viewerId: string
  checkoutRequestId: string
  consents: { age: true; terms: true; privacy: true; withdrawal: true }
  accessToken?: string
}): Promise<GuardianPassCheckoutResponse> {
  const { accessToken, ...body } = input
  return requestJson('/api/guardian-pass/checkouts', jsonRequest(body, accessToken))
}

export function confirmGuardianPass(session: GuardianPassSession): Promise<GuardianPassConfirmation> {
  return requestJson(
    `/api/guardian-pass/purchases/${encodeURIComponent(session.paymentId)}/confirm`,
    jsonRequest({}, session.accessToken),
  )
}

export function listGuardianCards(accessToken?: string): Promise<GuardianLibrary> {
  return requestJson('/api/guardian-pass/library', {
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
  })
}

export function claimGuardianCollection(session: GuardianPassSession): Promise<{
  status: 'claimed' | 'already-claimed'
  guestAccessRevoked: true
}> {
  if (!session.accessToken) throw new GuardianStorageError()
  return requestJson(
    `/api/guardian-pass/collections/${encodeURIComponent(session.collectionPublicId)}/claim`,
    jsonRequest({}, session.accessToken),
  )
}

export function requestGuardianPassReopen(input: {
  locale: 'ko'
  email: string
  turnstileToken: string
}): Promise<{ status: 'accepted' }> {
  return requestJson('/api/guardian-pass/reopen/request', jsonRequest(input))
}

export function exchangeGuardianPassReopen(token: string): Promise<GuardianReopenExchange> {
  return requestJson('/api/guardian-pass/reopen/exchange', jsonRequest({ token }))
}

export function guardianPassPaths(locale: Locale) {
  return {
    checkout: `/${locale}/guardian-pass/checkout`,
    reopen: `/${locale}/guardian-pass/reopen`,
    today: `/${locale}/today`,
    tomorrow: `/${locale}/tomorrow`,
    account: `/${locale}/account`,
  } as const
}

export function readOrCreateGuardianViewerId(): string {
  try {
    const stored = localStorage.getItem(VIEWER_ID_KEY)
    if (stored && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored)) {
      return stored
    }
    const created = crypto.randomUUID()
    localStorage.setItem(VIEWER_ID_KEY, created)
    return created
  } catch {
    throw new GuardianStorageError()
  }
}

export function readGuardianPassSession(): GuardianPassSession | null {
  try {
    const raw = localStorage.getItem(PASS_SESSION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<GuardianPassSession>
    if (
      value.locale === 'ko' &&
      typeof value.collectionPublicId === 'string' &&
      (typeof value.accessToken === 'string' || value.accessToken === undefined) &&
      typeof value.paymentId === 'string' &&
      (value.payMethod === null || isGuardianPayMethod(value.payMethod)) &&
      (typeof value.accessExpiresAt === 'string' || value.accessExpiresAt === null) &&
      typeof value.createdAt === 'number' &&
      typeof value.claimed === 'boolean'
    ) {
      return {
        locale: 'ko',
        collectionPublicId: value.collectionPublicId,
        ...(value.accessToken ? { accessToken: value.accessToken } : {}),
        paymentId: value.paymentId,
        payMethod: value.payMethod,
        accessExpiresAt: value.accessExpiresAt,
        createdAt: value.createdAt,
        claimed: value.claimed,
      }
    }
    return null
  } catch {
    return null
  }
}

export function storeGuardianPassSession(session: GuardianPassSession): void {
  try {
    localStorage.setItem(PASS_SESSION_KEY, JSON.stringify(session))
  } catch {
    throw new GuardianStorageError()
  }
}

export function clearGuardianPassSession(): void {
  try {
    localStorage.removeItem(PASS_SESSION_KEY)
  } catch {
    // A blocked storage API already behaves as though there were no resumable pass.
  }
}

export function readOrCreateGuardianCheckoutRequestId(): string {
  try {
    const raw = localStorage.getItem(CHECKOUT_REQUEST_KEY)
    if (raw) {
      const value = JSON.parse(raw) as { id?: unknown; createdAt?: unknown }
      if (
        typeof value.id === 'string' &&
        typeof value.createdAt === 'number' &&
        Date.now() - value.createdAt < 24 * 60 * 60 * 1000
      ) {
        return value.id
      }
    }
    const id = crypto.randomUUID()
    localStorage.setItem(CHECKOUT_REQUEST_KEY, JSON.stringify({ id, createdAt: Date.now() }))
    return id
  } catch {
    throw new GuardianStorageError()
  }
}

export function clearGuardianCheckoutRequestId(): void {
  try {
    localStorage.removeItem(CHECKOUT_REQUEST_KEY)
  } catch {
    // A blocked storage API cannot retain a stale checkout id.
  }
}

export function storeGuardianToneIntent(dateKey: string, tone: GuardianDailyTone): void {
  try {
    localStorage.setItem(`${TONE_INTENT_PREFIX}${dateKey}`, tone)
  } catch {
    // The choice still applies to the current render when optional preference storage is blocked.
  }
}

export function readGuardianToneIntent(dateKey: string): GuardianDailyTone | null {
  try {
    const tone = localStorage.getItem(`${TONE_INTENT_PREFIX}${dateKey}`)
    return tone === 'comfort' || tone === 'honesty' || tone === 'action' || tone === 'possibility' ? tone : null
  } catch {
    return null
  }
}

export type GuardianCardCacheScope = `collection:${string}` | `viewer:${string}`

type CachedCard = {
  scope: GuardianCardCacheScope
  card: GuardianDailyCardView
  archived: boolean
  cachedAt: number
}

export function guardianCollectionCacheScope(collectionPublicId: string): GuardianCardCacheScope {
  return `collection:${collectionPublicId}`
}

export function guardianViewerCacheScope(viewerId: string): GuardianCardCacheScope {
  return `viewer:${viewerId}`
}

export function cacheGuardianDailyCard(
  scope: GuardianCardCacheScope,
  card: GuardianDailyCardView,
  archived: boolean,
): void {
  try {
    const cards = readCachedGuardianCards().filter(
      (entry) => entry.scope !== scope || entry.card.dateKey !== card.dateKey,
    )
    cards.unshift({ scope, card, archived, cachedAt: Date.now() })
    localStorage.setItem(CARD_CACHE_KEY, JSON.stringify(cards.slice(0, 28)))
  } catch {
    // Card display must not fail because optional local history is unavailable.
  }
}

export function readCachedGuardianCard(scope: GuardianCardCacheScope, dateKey: string): GuardianDailyCardView | null {
  return (
    readCachedGuardianCards().find((entry) => entry.scope === scope && entry.card.dateKey === dateKey)?.card ?? null
  )
}

export function readArchivedGuardianCards(scope: GuardianCardCacheScope): GuardianDailyCardView[] {
  return readCachedGuardianCards()
    .filter((entry) => entry.scope === scope && entry.archived)
    .map(({ card }) => card)
}

function readCachedGuardianCards(): CachedCard[] {
  try {
    const raw = localStorage.getItem(CARD_CACHE_KEY)
    if (!raw) return []
    const value = JSON.parse(raw) as unknown
    if (!Array.isArray(value)) return []
    return value.filter(
      (entry): entry is CachedCard =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as CachedCard).scope === 'string' &&
        ((entry as CachedCard).scope.startsWith('collection:') || (entry as CachedCard).scope.startsWith('viewer:')) &&
        typeof (entry as CachedCard).card?.dateKey === 'string' &&
        typeof (entry as CachedCard).archived === 'boolean' &&
        typeof (entry as CachedCard).cachedAt === 'number',
    )
  } catch {
    return []
  }
}

export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { accept: 'application/json', ...init?.headers },
  })
  if (!response.ok) {
    let slug: string | null = null
    if (response.headers.get('content-type')?.includes('application/problem+json')) {
      const body = (await response.json().catch(() => null)) as { title?: unknown } | null
      slug = typeof body?.title === 'string' ? body.title : null
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
