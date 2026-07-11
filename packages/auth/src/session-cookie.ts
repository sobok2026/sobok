import { auth } from './auth'

/**
 * 세션 쿠키 캐시를 강제로 갱신하기 위한 Set-Cookie 헤더들을 만든다.
 *
 * cookieCache가 켜져 있으면 세션(+user)이 서명 쿠키에 최대 maxAge 동안 캐시된다. isAdult 같은
 * 민감 상태를 서버에서 바꾼 직후에는 그 쿠키가 옛 값을 들고 있으므로, disableCookieCache로 스토리지에서
 * 재조회해 새 쿠키를 재발급한다. 반환된 Set-Cookie들을 현재 응답에 실어 보내면 클라이언트 캐시가 즉시 최신화된다.
 * 세션이 없으면 빈 배열을 반환한다.
 */
export async function refreshSessionCookies(headers: Headers): Promise<string[]> {
  const response = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
    asResponse: true,
  })

  return response.headers.getSetCookie()
}
