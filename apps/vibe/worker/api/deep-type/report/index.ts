import type { AppEnv } from '@vibe-worker/env'
import { Hono } from 'hono'

import { requireAccessToken } from '../access'
import getRoute from './GET'
import generateRoute from './generate/POST'

// Both report delivery (GET /report) and generation (POST /report/generate) require a valid access_token;
// the paid-entitlement gate itself lives inside each handler's fresh transaction.
const route = new Hono<AppEnv>()

route.use('*', requireAccessToken)
route.route('/', getRoute)
route.route('/generate', generateRoute)

export default route
