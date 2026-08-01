import { Hono } from 'hono'

import type { AppEnv } from '~/env'

import cancelRoute from './cancel/POST'
import checkoutRoute from './checkout/POST'
import configRoute from './config/GET'
import refinementRoutes from './refinement'
import reopenRoutes from './reopen'
import reportRoutes from './report'
import sessionRoute from './session/POST'
import verifyRoute from './verify/POST'

// Mounted at /api/deep-type by the Worker entry. One sub-route per resource; each method lives in its own
// GET.ts / POST.ts (mirrors apps/api). URLs are unchanged from the former single-file router.
export const deepType = new Hono<AppEnv>()

deepType.route('/config', configRoute)
deepType.route('/session', sessionRoute)
deepType.route('/checkout', checkoutRoute)
deepType.route('/verify', verifyRoute)
deepType.route('/cancel', cancelRoute)
deepType.route('/refinement', refinementRoutes)
deepType.route('/report', reportRoutes)
deepType.route('/reopen', reopenRoutes)
