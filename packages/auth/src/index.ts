// 어디서나 안전한 subset — 타입 + 공유 상수만. 서버 싱글턴(auth)과 서버 유틸은 여기서 내보내지
// 않는다(클라이언트 번들 유입 방지). 서버 런타임은 '@sobok/auth/server'에서 가져온다.
export type { Auth, Session, SessionUser } from './auth'
export { BBATON_PROVIDER_ID } from './bbaton'
export {
  normalizeIssuer,
  SOBOK_ACCOUNT_LABELS,
  SOBOK_ACCOUNT_TECHNICAL_NAME,
  SOBOK_AUTH_PATH,
  SOBOK_AUTH_TURNSTILE_ACTION,
  SOBOK_OIDC_PROVIDER_ID,
  SOBOK_OIDC_SCOPES,
  type SobokIdentity,
  sobokDiscoveryUrl,
} from './contracts'
