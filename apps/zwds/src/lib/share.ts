import { isStoredBirth, type StoredBirth } from './birth-storage'

// A shared link carries everything needed to reproduce one chart in the URL's
// hash fragment (never sent to a server on a normal request). The payload is
// versioned so older links can be recognized; encoding is not encryption.
const SHARE_VERSION = 1
const SHARE_PREFIX = `${SHARE_VERSION}.`
const SHARE_HASH_PATTERN = /^\d+\./
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/
const MAX_ENCODED_PAYLOAD_LENGTH = 512

export type ShareKind = 'chart'

export type SharedPayload = { kind: 'chart'; birth: StoredBirth }

export type ShareLinkResult = 'web_share' | 'clipboard' | 'cancelled' | 'failed'

type SerializedPayload = {
  d: string
  t: string
  g: 0 | 1
  p: [
    id: string,
    name: string,
    countryCode: string,
    latitude: number,
    longitude: number,
    timeZone: string,
    precision: 0 | 1 | 2,
  ]
}

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

function encodePayload(birth: StoredBirth): string {
  const payload: SerializedPayload = {
    d: birth.date,
    t: birth.time,
    g: birth.gender === 'female' ? 1 : 0,
    p: [
      birth.place.id,
      birth.place.name,
      birth.place.countryCode,
      birth.place.latitude,
      birth.place.longitude,
      birth.place.timeZone,
      { locality: 0, administrativeSeat: 1, administrativeArea: 2 }[birth.place.coordinatePrecision] as 0 | 1 | 2,
    ],
  }

  return toBase64Url(JSON.stringify(payload))
}

function fragmentOf(hash: string): string {
  return hash.startsWith('#') ? hash.slice(1) : hash
}

export function isShareHash(hash: string): boolean {
  return SHARE_HASH_PATTERN.test(fragmentOf(hash))
}

export function decodeShareHash(hash: string): SharedPayload | null {
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

    const birth = deserializeBirth(parsed as Record<string, unknown>)
    return birth ? { kind: 'chart', birth } : null
  } catch {
    return null
  }
}

function deserializeBirth(payload: Record<string, unknown>): StoredBirth | null {
  if (
    typeof payload.d !== 'string' ||
    typeof payload.t !== 'string' ||
    (payload.g !== 0 && payload.g !== 1) ||
    !Array.isArray(payload.p) ||
    payload.p.length !== 7
  ) {
    return null
  }

  const [id, name, countryCode, latitude, longitude, timeZone, coordinatePrecision] = payload.p

  const birth: unknown = {
    date: payload.d,
    time: payload.t,
    gender: payload.g === 1 ? 'female' : 'male',
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

export function buildShareUrl(locale: string, birth: StoredBirth): string {
  const url = new URL(`/${locale}`, window.location.origin)
  url.hash = `${SHARE_PREFIX}${encodePayload(birth)}`
  return url.toString()
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
