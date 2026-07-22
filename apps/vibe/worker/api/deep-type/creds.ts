import type { Context } from 'hono'

import type { PortOneCreds } from '~/billing/portone'
import type { AppEnv } from '~/env'

// Resolves the PortOne secrets from Secrets Store (async .get()). Fetched per use — the runtime caches
// Secrets Store reads, so this is cheap. Shared by the verify / webhook / cancel handlers.
export async function creds(c: Context<AppEnv>): Promise<PortOneCreds> {
  const [apiSecret, webhookSecret] = await Promise.all([
    c.env.DEEPTYPE_PORTONE_API_SECRET.get(),
    c.env.DEEPTYPE_PORTONE_WEBHOOK_SECRET.get(),
  ])
  return { apiSecret, webhookSecret }
}
