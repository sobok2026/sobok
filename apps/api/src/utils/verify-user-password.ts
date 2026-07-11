import { auth } from '@sobok/auth/server'
import { isAPIError } from 'better-auth/api'

/** 민감 작업(sudo) 재인증용 — 현재 세션 유저의 비밀번호를 better-auth 내장 엔드포인트로 검증한다. */
export async function verifyUserPassword(headers: Headers, password: string): Promise<boolean> {
  try {
    await auth.api.verifyPassword({ body: { password }, headers })
    return true
  } catch (error) {
    // 세션 없음(UNAUTHORIZED)·비밀번호 불일치(BAD_REQUEST)는 검증 실패로 처리하고,
    // 그 외(DB 오류 등)는 그대로 전파한다.
    if (isAPIError(error)) {
      return false
    }

    throw error
  }
}
