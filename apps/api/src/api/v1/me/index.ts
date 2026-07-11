import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'

import adultVerificationRoutes from './adult-verification'
import exportRoutes from './export'
import followingRoutes from './following'
import getRoute from './GET'
import pushRoutes from './push'
import settingsRoutes from './settings'

// 프로필 변경(updateUser)·탈퇴(deleteUser)·비밀번호·패스키·2FA·세션 관리는 better-auth(/api/auth/*)가 담당한다.
const route = new Hono<Env>()

route.use('*', requireAuth)
route.route('/', getRoute)
route.route('/adult-verification', adultVerificationRoutes)
route.route('/export', exportRoutes)
route.route('/push', pushRoutes)
route.route('/following', followingRoutes)
route.route('/settings', settingsRoutes)

export default route
