// The birth form's state, mirrored into the URL hash so a chart is refreshable,
// bookmarkable, and shareable. A hash (unlike a query string) never reaches the
// server, Referer headers, or crawlers — the birth details stay client-side
// except for whatever link the visitor deliberately shares. The payload is a
// URL-safe base64 wrapper around the fields: light obfuscation so a shared link
// isn't plainly legible at a glance, not a security boundary (anyone can decode
// it). The birth time is omitted when unknown, which round-trips `timeKnown`
// without a separate flag.

import { isStoredBirth, type StoredBirth } from './birth-storage'

function toBase64Url(text: string): string {
  return btoa(text).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function fromBase64Url(text: string): string {
  return atob(text.replaceAll('-', '+').replaceAll('_', '/'))
}

export function encodeBirthHash(birth: StoredBirth): string {
  const params = new URLSearchParams()
  params.set('d', birth.date)

  if (birth.timeKnown) {
    params.set('t', birth.time)
  }

  params.set('c', birth.cityKey)
  return toBase64Url(params.toString())
}

export function decodeBirthHash(hash: string): StoredBirth | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash

  if (!raw) {
    return null
  }

  let decoded: string

  try {
    decoded = fromBase64Url(raw)
  } catch {
    return null
  }

  const params = new URLSearchParams(decoded)
  const date = params.get('d')
  const time = params.get('t')
  const cityKey = params.get('c')

  if (date === null || cityKey === null) {
    return null
  }

  const candidate: StoredBirth = {
    date,
    time: time ?? '12:00',
    timeKnown: time !== null,
    cityKey,
  }

  return isStoredBirth(candidate) ? candidate : null
}
