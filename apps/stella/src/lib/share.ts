import { isCalendarDate, isStoredBirth, type StoredBirth } from './birth-storage'

const SHARE_VERSION = 3
const SHARE_PREFIX = `${SHARE_VERSION}.`
const SHARE_HASH_PATTERN = /^\d+\./
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/
const MAX_ENCODED_PAYLOAD_LENGTH = 512

export type ShareKind = 'chart' | 'today' | 'tomorrow' | 'love'

/**
 * What a share link carries. One type for both directions: `buildShareURL` writes it and `decodeShareHash`
 * reconstructs it, so a variant that gains a field can never be encoded without being decodable again.
 */
export type SharedPayload =
  | { kind: 'chart'; birth: StoredBirth }
  | { kind: 'today'; birth: StoredBirth; dateKey: string; utcOffsetMinutes: number }
  | { kind: 'tomorrow'; birth: StoredBirth; dateKey: string; utcOffsetMinutes: number }
  | { kind: 'love'; birth: StoredBirth; asOf: Date }

type SerializedPayload = {
  d: string
  t: string
  n: 0 | 1
  p: [
    id: string,
    name: string,
    countryCode: string,
    latitude: number,
    longitude: number,
    timeZone: string,
    precision: 0 | 1 | 2,
  ]
  a?: number
  o?: string
  z?: number
}

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

function encodePayload(input: SharedPayload): string {
  const payload: SerializedPayload = {
    d: input.birth.date,
    t: input.birth.time,
    n: input.birth.timeKnown ? 1 : 0,
    p: [
      input.birth.place.id,
      input.birth.place.name,
      input.birth.place.countryCode,
      input.birth.place.latitude,
      input.birth.place.longitude,
      input.birth.place.timeZone,
      { locality: 0, administrativeSeat: 1, administrativeArea: 2 }[input.birth.place.coordinatePrecision] as 0 | 1 | 2,
    ],
    ...(input.kind === 'love' ? { a: Math.floor(input.asOf.getTime() / 1000) } : {}),
    ...(input.kind === 'today' || input.kind === 'tomorrow' ? { o: input.dateKey, z: input.utcOffsetMinutes } : {}),
  }

  return toBase64Url(JSON.stringify(payload))
}

function fragmentOf(hash: string): string {
  return hash.startsWith('#') ? hash.slice(1) : hash
}

export function isShareHash(hash: string): boolean {
  return SHARE_HASH_PATTERN.test(fragmentOf(hash))
}

export function decodeShareHash(hash: string, kind: ShareKind): SharedPayload | null {
  const fragment = fragmentOf(hash)

  if (!fragment.startsWith(SHARE_PREFIX)) {
    return null
  }

  const encoded = fragment.slice(SHARE_PREFIX.length)

  if (encoded.length === 0 || encoded.length > MAX_ENCODED_PAYLOAD_LENGTH || !BASE64_URL_PATTERN.test(encoded)) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encoded))

    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }

    const payload = parsed as Record<string, unknown>
    const birth = deserializeBirth(payload)

    if (!birth) {
      return null
    }

    if (kind === 'chart') {
      if (payload.a !== undefined || payload.o !== undefined || payload.z !== undefined) {
        return null
      }

      return { kind, birth }
    }

    if (kind === 'today' || kind === 'tomorrow') {
      if (
        payload.a !== undefined ||
        typeof payload.o !== 'string' ||
        !isCalendarDate(payload.o) ||
        !isUtcOffsetMinutes(payload.z)
      ) {
        return null
      }

      return { kind, birth, dateKey: payload.o, utcOffsetMinutes: payload.z }
    }

    if (payload.o !== undefined || payload.z !== undefined) {
      return null
    }

    const asOf = dateFromEpochSeconds(payload.a)

    if (!asOf) {
      return null
    }

    return { kind, birth, asOf }
  } catch {
    return null
  }
}

function deserializeBirth(payload: Record<string, unknown>): StoredBirth | null {
  if (
    typeof payload.d !== 'string' ||
    typeof payload.t !== 'string' ||
    (payload.n !== 0 && payload.n !== 1) ||
    !Array.isArray(payload.p) ||
    payload.p.length !== 7
  ) {
    return null
  }

  const [id, name, countryCode, latitude, longitude, timeZone, coordinatePrecision] = payload.p

  const birth: unknown = {
    date: payload.d,
    time: payload.t,
    timeKnown: payload.n === 1,
    place: {
      id,
      name,
      countryCode,
      latitude,
      longitude,
      timeZone,
      coordinatePrecision:
        coordinatePrecision === 0
          ? 'locality'
          : coordinatePrecision === 1
            ? 'administrativeSeat'
            : coordinatePrecision === 2
              ? 'administrativeArea'
              : coordinatePrecision,
    },
  }

  return isStoredBirth(birth) ? birth : null
}

function dateFromEpochSeconds(value: unknown): Date | null {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    return null
  }

  const date = new Date(value * 1000)
  return Number.isNaN(date.getTime()) ? null : date
}

function isUtcOffsetMinutes(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= -14 * 60 && value <= 14 * 60
}

export function buildShareURL(locale: string, input: SharedPayload): string {
  const url = new URL(resultPath(locale, input.kind), window.location.origin)
  url.hash = `${SHARE_PREFIX}${encodePayload(input)}`
  return url.toString()
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
