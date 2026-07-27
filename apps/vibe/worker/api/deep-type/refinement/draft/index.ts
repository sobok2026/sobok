import { Hono } from 'hono'

import type { AppEnv } from '~/env'

import { requireAccessToken } from '../../access'
import getRoute from './GET'
import putRoute from './PUT'

// Both draft methods are entitlement routes: the buffer belongs to one paid purchase and is reachable only
// with its access_token. The paid gate itself lives in `requirePaidRefinementContext`, inside each handler's
// fresh transaction.
const route = new Hono<AppEnv>()

route.use('*', requireAccessToken)
route.route('/', getRoute)
route.route('/', putRoute)

export default route
