import { Hono } from 'hono'

import type { AppEnv } from '~/env'

import exchangeRoute from './exchange/POST'
import requestRoute from './request/POST'

const route = new Hono<AppEnv>()

route.route('/request', requestRoute)
route.route('/exchange', exchangeRoute)

export default route
