import { auth } from '@sobok/auth/server'
import { Hono } from 'hono'

const authRouter = new Hono()

// better-auth가 이 서브트리 전체(가입/로그인/세션/패스키/2FA/OAuth 콜백)를 소유한다.
// 원본 Request(c.req.raw)를 그대로 위임하므로 마운트 경로 재작성의 영향을 받지 않는다.
authRouter.on(['POST', 'GET'], '/*', (c) => auth.handler(c.req.raw))

export default authRouter
