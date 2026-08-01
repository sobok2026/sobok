import { Hono } from 'hono'

import { session } from '@/middleware/session'

import billingRoutes from './billing'
import chatRoutes from './chat'
import internalRoutes from './internal'
import meRoutes from './me'
import notificationRoutes from './notification'
import pointsRoutes from './points'
import postRoutes from './post'
import searchRoutes from './search'
import userRoutes from './user'

const v1Router = new Hono()

// Central payment callbacks use a service credential, not a browser session. Register before the session
// middleware so an infrastructure event never touches cookie auth.
v1Router.route('/internal', internalRoutes)
v1Router.use('*', session)
v1Router.route('/billing', billingRoutes)
v1Router.route('/chat', chatRoutes)
v1Router.route('/me', meRoutes)
v1Router.route('/notification', notificationRoutes)
v1Router.route('/points', pointsRoutes)
v1Router.route('/post', postRoutes)
v1Router.route('/search', searchRoutes)
v1Router.route('/user', userRoutes)

export default v1Router
