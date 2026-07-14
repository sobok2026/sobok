import { ORIGIN } from '@/constants'

import { isStoredBirth, type StoredBirth } from './birth-storage'

export type ShareKind = 'chart' | 'today' | 'love'

export type SharedPayload =
  | { kind: 'chart'; birth: StoredBirth }
  | { kind: 'today'; birth: StoredBirth; asOf: Date; dateKey: string }
  | { kind: 'love'; birth: StoredBirth; asOf: Date }

type SerializedPayload = {
  v: 1
  k: ShareKind
  b: StoredBirth
  a?: string
  d?: string
}

type ShareUrlInput =
  | { kind: 'chart'; birth: StoredBirth }
  | { kind: 'today'; birth: StoredBirth; asOf: Date; dateKey: string }
  | { kind: 'love'; birth: StoredBirth; asOf: Date }

export type ShareLinkResult = 'web_share' | 'clipboard' | 'cancelled' | 'failed'

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function fromBase64Url(text: string): string {
  const base64 = text
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(text.length / 4) * 4, '=')
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodePayload(input: ShareUrlInput): string {
  const payload: SerializedPayload = {
    v: 1,
    k: input.kind,
    b: input.birth,
    ...(input.kind === 'chart' ? {} : { a: input.asOf.toISOString() }),
    ...(input.kind === 'today' ? { d: input.dateKey } : {}),
  }

  return toBase64Url(JSON.stringify(payload))
}

export function decodeShareHash(hash: string, kind: ShareKind): SharedPayload | null {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const encoded = params.get('p')

  if (!encoded) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encoded))

    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }

    const payload = parsed as Partial<SerializedPayload>

    if (payload.v !== 1 || payload.k !== kind || !isStoredBirth(payload.b)) {
      return null
    }

    if (kind === 'chart') {
      return { kind, birth: payload.b }
    }

    if (typeof payload.a !== 'string') {
      return null
    }

    const asOf = new Date(payload.a)

    if (Number.isNaN(asOf.getTime())) {
      return null
    }

    if (kind === 'today') {
      if (typeof payload.d !== 'string' || !isCalendarDateKey(payload.d)) {
        return null
      }

      return { kind, birth: payload.b, asOf, dateKey: payload.d }
    }

    return { kind, birth: payload.b, asOf }
  } catch {
    return null
  }
}

function isCalendarDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function buildShareUrl(locale: string, input: ShareUrlInput): string {
  const url = new URL(resultPath(locale, input.kind), ORIGIN)
  url.hash = new URLSearchParams({ p: encodePayload(input) }).toString()
  return url.toString()
}

export function buildPageUrl(locale: string, page: Exclude<ShareKind, 'chart'>): string {
  return new URL(resultPath(locale, page), ORIGIN).toString()
}

function resultPath(locale: string, kind: ShareKind): string {
  return kind === 'chart' ? `/${locale}` : `/${locale}/${kind}`
}

export async function shareLink(data: ShareData): Promise<ShareLinkResult> {
  if (typeof navigator === 'undefined') {
    return 'failed'
  }

  if (navigator.share) {
    try {
      await navigator.share(data)
      return 'web_share'
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return 'cancelled'
      }
    }
  }

  try {
    await navigator.clipboard.writeText(data.url ?? '')
    return 'clipboard'
  } catch {
    return 'failed'
  }
}
