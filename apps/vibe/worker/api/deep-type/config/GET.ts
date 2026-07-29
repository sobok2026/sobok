import { Hono } from 'hono'

import type { AppEnv } from '~/env'

const route = new Hono<AppEnv>()

// Deploy smoke check, not a client dependency: nothing in the browser reads this, and `/checkout` is what
// hands out the key a payment is actually opened with. It exists so a bad deploy — a `vars` block a named
// environment forgot to restate, a channel the catalogue offers but this environment has no key for — is one
// request away from being obvious instead of surfacing as a failed payment.
//
// The map arrives keyed by channel, which is what makes it readable: the question a deploy gets wrong is
// which CONTRACT a key belongs to, and that is legible only against the PG's own name.
//
// Store id and channel keys are the only PortOne values that may leave the Worker; the api secret and the
// webhook secret never do.
route.get('/', (c) =>
  c.json({
    storeId: c.env.DEEPTYPE_PORTONE_STORE_ID,
    channelKeys: c.env.DEEPTYPE_PORTONE_CHANNELS,
  }),
)

export default route
