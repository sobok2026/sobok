import { env } from '@sobok/env/server.common'

export const APP_ORIGIN = new URL(env.APP_ORIGIN).origin

// The hostnames a Turnstile solve is accepted from. Cloudflare auto-covers every subdomain of a widget's
// configured domain, so the widget config is only an upper bound — this list is the actual host pin, and it
// is shared by every verifying route so a new endpoint cannot quietly omit it.
export const TURNSTILE_ALLOWED_HOSTNAMES = [new URL(APP_ORIGIN).hostname] as const

export const ALLOW_ANY_REQUEST_ORIGIN = env.ALLOW_ANY_REQUEST_ORIGIN === 'true'

export function isAllowedRequestOrigin(origin?: string) {
  return normalizeOrigin(origin) === APP_ORIGIN || ALLOW_ANY_REQUEST_ORIGIN
}

function normalizeOrigin(origin?: string): string | null {
  if (!origin) {
    return null
  }

  try {
    return new URL(origin).origin
  } catch {
    return null
  }
}
