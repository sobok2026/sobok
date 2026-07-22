import { Hono } from 'hono'

import type { AppEnv } from '~/env'

const route = new Hono<AppEnv>()

// The only PortOne values that may reach the browser (needed by @portone/browser-sdk requestPayment). The
// api secret + webhook secret never leave the Worker.
route.get('/', (c) =>
  c.json({
    storeId: c.env.DEEPTYPE_PORTONE_STORE_ID,
    channelKey: c.env.DEEPTYPE_PORTONE_CHANNEL_KEY,
  }),
)

export default route
