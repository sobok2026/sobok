export const NO_STORE_HEADERS = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
} as const

export function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
