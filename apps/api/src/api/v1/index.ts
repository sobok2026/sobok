import { Hono } from 'hono'

import type { Env } from '@/app'

import authRoutes from './auth'
import bbatonRoutes from './bbaton'
import billingRoutes from './billing'
import chatRoutes from './chat'
import meRoutes from './me'
import notificationRoutes from './notification'
import pointsRoutes from './points'
import postRoutes from './post'
import searchRoutes from './search'
import turnstileRoutes from './turnstile'
import userRoutes from './user'

const v1Routes = new Hono<Env>()

v1Routes.route('/auth', authRoutes)
v1Routes.route('/bbaton', bbatonRoutes)
v1Routes.route('/billing', billingRoutes)
v1Routes.route('/chat', chatRoutes)
v1Routes.route('/me', meRoutes)
v1Routes.route('/notification', notificationRoutes)
v1Routes.route('/points', pointsRoutes)
v1Routes.route('/post', postRoutes)
v1Routes.route('/search', searchRoutes)
v1Routes.route('/turnstile', turnstileRoutes)
v1Routes.route('/user', userRoutes)

export default v1Routes
