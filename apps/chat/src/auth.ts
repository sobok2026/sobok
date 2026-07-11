import { auth } from '@sobok/auth/server'

// WebSocket 업그레이드 요청의 쿠키로 better-auth 세션을 검증한다.
// cookieCache(5분) 창 안에서는 서명 검증만으로 끝나 DB 왕복이 없다.
export async function authenticateRequest(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return null
    }

    return { userId: session.user.id }
  } catch (error) {
    console.error('Unexpected error during session verification:', error)
    return null
  }
}
