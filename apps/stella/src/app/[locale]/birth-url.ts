// The birth form's state, mirrored into the URL hash so a chart is refreshable,
// bookmarkable, and shareable. A hash (unlike a query string) never reaches the
// server, Referer headers, or crawlers — the birth details stay client-side
// except for whatever link the visitor deliberately shares. The birth time is
// omitted when unknown, which keeps the link tidy and round-trips `timeKnown`
// without a separate flag.

import { isStoredBirth, type StoredBirth } from './birth-storage'

export function encodeBirthHash(birth: StoredBirth): string {
  const params = new URLSearchParams()
  params.set('d', birth.date)

  if (birth.timeKnown) {
    params.set('t', birth.time)
  }

  params.set('c', birth.cityKey)
  return params.toString()
}

export function decodeBirthHash(hash: string): StoredBirth | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash

  if (!raw) {
    return null
  }

  const params = new URLSearchParams(raw)
  const date = params.get('d')
  const time = params.get('t')
  const cityKey = params.get('c')

  if (date === null || cityKey === null) {
    return null
  }

  const candidate: StoredBirth = {
    date,
    // A missing `t` means the time is unknown; the chart then falls back to noon
    // (see `toBirthInput`), so this placeholder round-trips harmlessly.
    time: time ?? '12:00',
    timeKnown: time !== null,
    cityKey,
  }

  return isStoredBirth(candidate) ? candidate : null
}
