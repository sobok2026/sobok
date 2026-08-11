import type { AppEnv } from '@vibe-worker/env'
import { Hono } from 'hono'

import exchangeRoute from './exchange/POST'
import requestRoute from './request/POST'

const route = new Hono<AppEnv>()

route.route('/request', requestRoute)
route.route('/exchange', exchangeRoute)

export default route
