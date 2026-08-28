import type { Context } from 'hono'
import type { ZodType } from 'zod'
import type { AppEnv } from '../env'

export const NO_STORE_HEADERS = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
} as const

export async function readJson<T>(
  c: Context<AppEnv>,
  schema: ZodType<T>,
  maxBytes: number,
): Promise<{ success: true; data: T } | { success: false; tooLarge: boolean }> {
  const contentLength = Number(c.req.header('content-length'))
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { success: false, tooLarge: true }
  }
  const raw = await c.req.text()
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    return { success: false, tooLarge: true }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { success: false, tooLarge: false }
  }
  const result = schema.safeParse(parsed)
  return result.success ? { success: true, data: result.data } : { success: false, tooLarge: false }
}
