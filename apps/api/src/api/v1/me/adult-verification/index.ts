import { Hono } from 'hono'

import type { Env } from '@/app'

import deleteRoute from './DELETE'

const route = new Hono<Env>()

route.route('/', deleteRoute)

export default route
