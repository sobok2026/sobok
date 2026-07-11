import { Hono } from 'hono'

import authRouter from './auth'
import v1Router from './v1'

const apiRouter = new Hono()

apiRouter.route('/auth', authRouter)
apiRouter.route('/v1', v1Router)

export default apiRouter
