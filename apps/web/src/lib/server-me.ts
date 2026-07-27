import type { GETV1MeResponse } from '@sobok/contracts'
import { env } from '@sobok/env/server.common'
import { headers } from 'next/headers'

import 'server-only'

// Server-side read of the signed-in user, for React Server Components.
//
// apps/web deliberately does NOT import @sobok/auth/server: that would put better-auth's master signing
// secret into this app's build and its running pod, and the frontend has no business holding the key that
// mints session cookies. apps/api owns better-auth, so the session is resolved by asking apps/api.
//
// The call goes to API_INTERNAL_ORIGIN, not the public origin — a render-time request to sobok.cc would
// leave the cluster, traverse the tunnel and the gateway, and come back to a pod sitting next door.
//
// Returns null for a signed-out visitor. Any other failure throws, so the page's ErrorBoundary renders
// rather than the page silently downgrading to its signed-out layout.
export async function getServerMe(): Promise<GETV1MeResponse | null> {
  const cookie = (await headers()).get('cookie')

  if (!cookie) {
    return null
  }

  const response = await fetch(`${env.API_INTERNAL_ORIGIN}/api/v1/me`, {
    cache: 'no-store',
    headers: { cookie },
  })

  if (response.status === 401 || response.status === 403) {
    return null
  }

  if (!response.ok) {
    throw new Error(`GET /api/v1/me failed: ${response.status}`)
  }

  return (await response.json()) as GETV1MeResponse
}
