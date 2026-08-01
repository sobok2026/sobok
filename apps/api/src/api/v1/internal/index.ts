import { Hono } from 'hono'

import type { Env } from '@/app'

import paymentEventsRoute from './payment-events/POST'

const internalRoutes = new Hono<Env>()

internalRoutes.route('/payment-events', paymentEventsRoute)

export default internalRoutes
