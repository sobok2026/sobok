import { beforeEach, describe, expect, test } from 'bun:test'

import '../../../../test/setup.dom'

import { readGAIdentity } from '../ga-identity'

const MEASUREMENT_ID = 'G-RHHX4JRYDS'
const SESSION_COOKIE = '_ga_RHHX4JRYDS'

// happy-dom's cookie jar cannot hold duplicate names or malformed entries, and those are exactly the cases
// worth pinning — so the jar is stubbed directly.
function jar(cookie: string) {
  Object.defineProperty(document, 'cookie', { configurable: true, get: () => cookie })
}

describe('readGAIdentity', () => {
  beforeEach(() => {
    jar('')
  })

  test('_ga가 없으면 null — 서버는 아무것도 보내지 않는다', () => {
    jar(`${SESSION_COOKIE}=GS2.1.s1785142481$o1`)

    expect(readGAIdentity(MEASUREMENT_ID)).toBeNull()
  })

  test('client id는 추출하고 session 쿠키는 원문 그대로 넘긴다', () => {
    const session = 'GS2.1.s1785142481$o1$g0$t1785142481$j60$l0$h0$dwPpKK1cCEClwMK6BGRhWLTcnLSJjWDlApg'
    jar(`_ga=GA1.1.1393776780.1785142481; ${SESSION_COOKIE}=${session}`)

    expect(readGAIdentity(MEASUREMENT_ID)).toEqual({ clientId: '1393776780.1785142481', sessionId: session })
  })

  // `_ga`가 `_ga_RHHX4JRYDS`에 걸리면 client id 파싱이 조용히 엉뚱한 값을 낸다. 이름 전체 비교라 안 걸린다.
  test('_ga는 _ga_<STREAM>에 접두사로 걸리지 않는다 — 순서가 뒤집혀도', () => {
    jar(`${SESSION_COOKIE}=GS2.1.s1$o1; _ga=GA1.1.111.222`)

    expect(readGAIdentity(MEASUREMENT_ID)).toEqual({ clientId: '111.222', sessionId: 'GS2.1.s1$o1' })
  })

  // `=`는 유효한 cookie-octet이라 base64 패딩이 값 안에 들어올 수 있다. split('=')이면 잘려 나간다.
  test('값에 = 가 있어도 첫 = 에서만 자른다', () => {
    jar(`_ga=GA1.1.111.222; ${SESSION_COOKIE}=GS2.1.s1$dAbC==`)

    expect(readGAIdentity(MEASUREMENT_ID)?.sessionId).toBe('GS2.1.s1$dAbC==')
  })

  // 같은 이름이 두 번 = host-only 쿠키와 등록가능도메인 쿠키가 공존하는 상태. document.cookie는 domain을
  // 노출하지 않아 어느 쪽이 맞는지 알 수 없고, 잘못 고르면 client id와 session id가 서로 다른 신원이 된다.
  test('_ga가 중복이면 신원 전체를 포기한다', () => {
    jar(`_ga=GA1.2.111.222; _ga=GA1.1.333.444; ${SESSION_COOKIE}=GS2.1.s1$o1`)

    expect(readGAIdentity(MEASUREMENT_ID)).toBeNull()
  })

  test('session 쿠키가 중복이면 session만 버리고 client id는 살린다', () => {
    jar(`_ga=GA1.1.111.222; ${SESSION_COOKIE}=GS2.1.sA; ${SESSION_COOKIE}=GS2.1.sB`)

    expect(readGAIdentity(MEASUREMENT_ID)).toEqual({ clientId: '111.222', sessionId: null })
  })

  // 동의 도구가 쿠키를 "지울" 때 빈 값을 쓰는 경우가 있다. ''를 그대로 올리면 서버 zod가 analytics 객체째
  // 떨어뜨려서 멀쩡한 client id까지 잃는다.
  test('빈 값 쿠키는 없는 것으로 읽는다', () => {
    jar(`_ga=GA1.1.111.222; ${SESSION_COOKIE}=`)

    expect(readGAIdentity(MEASUREMENT_ID)).toEqual({ clientId: '111.222', sessionId: null })
  })

  test('값 없는 항목·빈 이름 항목·빈 쿠키 항아리에서 터지지 않는다', () => {
    jar('')
    expect(readGAIdentity(MEASUREMENT_ID)).toBeNull()

    jar('_ga; =GA1.1.999.999')
    expect(readGAIdentity(MEASUREMENT_ID)).toBeNull()
  })

  test('_ga 모양이 깨지면 client id를 지어내지 않고 null을 낸다', () => {
    jar('_ga=GA1.1.notanumber')
    expect(readGAIdentity(MEASUREMENT_ID)).toBeNull()

    jar('_ga=GA1.1.111.222.333')
    expect(readGAIdentity(MEASUREMENT_ID)).toEqual({ clientId: '222.333', sessionId: null })
  })
})
