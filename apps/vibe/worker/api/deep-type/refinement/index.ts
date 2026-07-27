import { Hono } from 'hono'

import type { AppEnv } from '~/env'

import draftRoutes from './draft'
import submitRoute from './POST'

// POST /refinement submits the paid block once; GET/PUT /refinement/draft park and replay the unfinished set
// between sittings. The draft sub-route is registered first so its path wins before the submit app's root.
const route = new Hono<AppEnv>()

route.route('/draft', draftRoutes)
route.route('/', submitRoute)

export default route
