# Sobok 통합 계정 아키텍처

## 상태

- 확정일: 2026-08-03
- 공개 호스트: `accounts.sobok.cc`
- 기술 식별자: `Sobok`
- 한국어 공개 이름: `소복 계정`
- 인증 런타임: Cloudflare Worker + 정적 Next.js UI
- 계정 구현: Better Auth 기반 중앙 OAuth 2.1 / OpenID Connect authority

이 문서는 `apps/web`, `apps/chat`, `apps/stella`, `apps/vibe`, `apps/zwds`가 공유하는 하나의 Sobok
계정 경계와 각 앱의 세션·프로필·도메인 데이터 소유권을 정한다. 기존 `apps/api` 인증 경로는 새
구조의 authority 또는 공용 BFF로 사용하지 않는다.

## 1. 핵심 결정

- 계정 원장과 인증 비밀은 `apps/accounts`만 소유한다.
- 사용자 앱은 `accounts.sobok.cc`의 고정 confidential OIDC client다.
- OAuth authorization code flow와 PKCE `S256`을 함께 사용한다.
- dynamic client registration과 익명 client registration은 열지 않는다.
- 초기 scope는 `openid profile email`만 허용하고 `offline_access`는 제공하지 않는다.
- 앱은 중앙 사용자를 이메일이나 username이 아니라 OIDC `(issuer, sub)`로 식별한다.
- `username`은 모든 Sobok 서비스에서 공통인 전역 로그인 아이디다.
- 소셜 가입자가 username 없이 만들어진 경우 첫 OIDC 승인 전에 중앙 profile-completion 단계에서 반드시
  전역 로그인 아이디를 정한다.
- 공개 nickname과 앱별 프로필은 각 앱이 별도로 소유한다.
- `.sobok.cc` 공유 쿠키를 만들지 않는다. 중앙 계정 쿠키와 각 앱 쿠키는 모두 host-only다.
- 로그인하지 않은 사용자의 구매를 계속 허용하고, 가치를 확인한 직후 계정 보관을 제안한다.
- `packages/auth-core`를 추가하지 않는다. 공용 인증 계약과 factory는 하나의 `packages/auth`에 둔다.

## 2. 시스템 경계

```text
Browser
  ├─ accounts.sobok.cc
  │    ├─ 중앙 로그인·가입·계정 관리 UI
  │    ├─ Better Auth authority session (host-only)
  │    ├─ OAuth 2.1 / OIDC authorize·token·userinfo·JWKS
  │    └─ identity / identity_stg PostgreSQL schema
  │
  ├─ stella.sobok.cc
  │    ├─ Stella UI와 Worker API
  │    ├─ Stella relying-party session (host-only)
  │    └─ Stella 프로필·구매·리포트·카드 컬렉션
  │
  ├─ vibe.sobok.cc / zwds.sobok.cc / sobok.cc
  │    └─ 앱별 relying-party session과 앱별 도메인 데이터
  │
  └─ chat resource services
       └─ 중앙 계정의 master secret이나 쿠키를 공유하지 않음
```

`accounts`는 누가 로그인했는지를 증명한다. Stella·Vibe·ZWDS·Web·Chat은 그 사용자가 앱 안에서
무엇을 소유하고 어떤 공개 프로필을 쓰는지를 결정한다. 중앙 계정 삭제처럼 여러 서비스가 함께
반응해야 하는 작업은 authority의 DB hook에서 다른 DB를 직접 수정하지 않는다. 앱별 삭제 소비자와
재시도 가능한 전달 경로가 모두 연결되기 전에는 삭제 엔드포인트를 열지 않으며, 이후 명시적인 계정
lifecycle event로 전달한다.

## 3. 인증 수단

첫 릴리스부터 다음 수단을 중앙 계정에서 제공한다.

- 이메일 + 비밀번호
- 전역 username + 비밀번호
- 이메일 magic link
- Google OAuth와 Google One Tap
- Kakao OAuth
- passkey
- TOTP와 backup code
- BBaton 계정 연결 기반 성인 인증

BBaton은 로그인 제공자가 아니라 이미 로그인한 계정에 연결하는 성인 인증 수단이다. 비밀번호 가입은
이메일 확인을 완료해야 정상 계정으로 사용한다. magic link token은 단일 사용·해시 저장으로 운용한다.
중앙 원장은 BBaton의 제공자 식별자·성인 여부·확인 시각만 보관하며, 성인 확인에 필요하지 않은 응답
속성은 저장하지 않는다.
이메일 확인·magic link는 최초 요청과 다른 브라우저 요청에서 세션을 만들고 Google One Tap은 응답의
redirect보다 자체 callback URL을 우선하므로, 중앙 UI는 완료 표시가 있는 반환 URL에서만 원래 OIDC
authorization을 재개한다. 단순히 로그인 세션이 있다는 이유로 `prompt=login` 요청을 건너뛰지는 않는다.

Google처럼 확인된 동일 이메일을 제공하는 신뢰 가능한 제공자는 기존 계정에 연결할 수 있다. Kakao를
전역 신뢰 제공자로 강제하지 않으며 이메일 또는 subject가 다르면 기존 인증을 거친 명시적 연결을
요구한다. 모든 인증 수단을 해제해 계정에 들어갈 방법이 사라지는 상태는 허용하지 않는다.

## 4. 2단계 인증 정책

TOTP가 활성화된 계정은 이메일/비밀번호와 username/비밀번호 로그인 뒤에만 자동으로 2단계 인증을
요구한다. passkey, Google, Kakao, Google One Tap, magic link는 이미 possession 또는 외부 제공자의
강한 인증을 거치므로 중앙 TOTP를 다시 강제하지 않는다.

이 정책은 로그인 UI의 분기만이 아니라 Better Auth credential endpoint의 실제 세션 발급 경계에서
적용한다. 계정 설정에서 보안 수단을 변경하거나 복구 정보를 확인하는 고위험 작업은 별도의 최근 인증
확인을 요구할 수 있다.

## 5. 안정적으로 유지할 식별자

| 목적                 | 값 / 규칙                                                            |
| -------------------- | -------------------------------------------------------------------- |
| OIDC issuer          | 환경별 `https://accounts.sobok.cc` / `https://accounts-stg.sobok.cc` |
| OIDC subject         | 중앙 계정의 불변 사용자 ID                                           |
| passkey RP ID        | 환경별 정확한 호스트: `accounts.sobok.cc` / `accounts-stg.sobok.cc`  |
| passkey origin       | 환경별 정확한 HTTPS origin                                           |
| passkey RP name      | `Sobok`                                                              |
| TOTP issuer          | `Sobok`                                                              |
| 앱 내부 identity key | `(issuer, subject)` unique                                           |
| 전역 로그인 ID       | 중앙 `username` unique                                               |
| 공개 nickname        | 앱별 테이블과 앱별 unique 정책                                       |

표시 이름은 로케일별로 자연스럽게 번역하지만 issuer, RP ID, TOTP issuer, provider ID, scope 같은 기술
식별자는 번역하거나 출시 뒤 바꾸지 않는다.

## 6. OIDC client 운영

- Stella, Vibe, ZWDS, Web, Chat에 production·staging client를 각각 만든다.
- client별 redirect URI를 완전 일치로 등록한다.
- client secret은 Git, Wrangler vars, Next public env에 넣지 않는다.
- Cloudflare Secrets Store에서 앱 Worker에 client secret을 binding한다.
- first-party client는 consent를 생략할 수 있지만 DB에 등록된 고정 client만 허용한다.
- client credential은 앱별로 분리하고 한 앱의 secret으로 다른 앱의 callback을 사용할 수 없게 한다.
- secret 회전은 새 secret 배포와 client 갱신 순서를 운영 절차로 남긴 뒤 수행한다.

중앙 authority의 well-known metadata는 issuer 루트의
`/.well-known/openid-configuration`과 `/.well-known/oauth-authorization-server`에서 제공한다. 앱은
discovery 문서로 endpoint와 JWKS를 찾고 callback의 `iss`, state, nonce와 PKCE verifier를 검증한다.

## 7. 데이터베이스와 배포

- production schema: `identity`
- staging schema: `identity_stg`
- 두 환경은 기존 공용 Supabase PostgreSQL 프로젝트를 사용하되 schema와 Worker secret을 분리한다.
- Worker의 PostgreSQL 연결은 Hyperdrive만 사용한다.
- 돈·소유권·세션처럼 read-after-write가 필요한 조회에는 캐시되지 않은 Hyperdrive를 사용한다.
- Drizzle migration 파일은 만들지 않고 환경을 명시해 `drizzle-kit push`한다.
- Worker와 정적 Next export는 GitHub Actions에서 하나의 Workers Static Assets 배포 단위로 배포한다.
- Terraform custom domain은 Worker가 최초 배포된 뒤 연결한다.

`identity` schema에는 중앙 user/session/account/verification/passkey/two-factor와 OAuth client, consent,
access-token, refresh-token, JWKS를 둔다. 앱별 nickname, 카드, 구매, 리포트, 구독 데이터는 두지 않는다.

## 8. Stella 게스트 컬렉션 귀속

Stella 첫 구매와 사랑 카드 재추첨은 로그인 없이 끝까지 가능하다.

```text
게스트 구매/획득
  → 이메일 재열람 + collection capability
  → 카드 공개
  → “소복 계정에 보관하기”
  → Stella OIDC 로그인
  → 같은 guardian_collection을 (issuer, sub)에 원자적으로 귀속
  → guest capability 폐기
  → account-save reward 1회 멱등 지급
```

새 계정용 컬렉션으로 카드를 복사하지 않는다. 기존 `guardian_collection`의 구매, 보유 카드, 대표 카드,
중복 수량, 미보유 보장 진행률을 그대로 귀속한다. 이미 다른 계정이 소유한 collection은 덮어쓰거나
자동 병합하지 않는다. 동일 계정의 여러 게스트 collection을 어떻게 앨범 단위로 합쳐 보여줄지는 Stella
도메인이 결정한다.

로그인 뒤에는 앱 세션이 기본 재열람 경로이고 구매 이메일 링크는 복구 경로로 남는다. 이메일은 계정
식별자나 소유권 병합 키로 사용하지 않는다. 계정 소유 collection의 이메일 링크는 새 guest capability를
발급하지 않고 stable report reference만 돌려준 뒤 Stella OIDC 로그인을 요구한다.

첫 고정 client ID는 `stella-web`이다. Stella 보관함은 계정 세션으로 소유 report 목록을 읽고
`/{locale}/guardian-report/result?report={publicId}`를 stable 재열람 URL로 사용한다. public report ID 자체는
권한이 아니며 모든 본문·재추첨 API는 Stella host-only session으로 collection owner를 다시 확인한다.

## 9. 패키지 책임

`packages/auth`는 다음만 제공한다.

- 중앙 authority 설정 factory
- 앱 relying-party 설정 factory
- authority/client 플러그인 구성이 맞는 browser client factory
- provider ID, scope, 기술 이름 같은 안정적인 계약
- OIDC identity `(issuer, subject)`의 타입과 정규화

공용 패키지는 환경변수를 직접 읽거나 DB·Redis 연결을 열지 않고, 결제·Chat·앱 도메인 테이블을
수정하지 않는다. `apps/accounts`와 각 앱 Worker가 binding, DB adapter, email 발송과 필요한 lifecycle
hook을 factory에 주입한다.

## 10. 구현 순서

1. `apps/accounts` authority, `identity_stg` schema, staging domain과 인증 UI를 배포한다.
2. 고정 Stella staging OIDC client를 등록하고 로그인·callback·host-only session을 검증한다.
3. Stella guest collection claim과 account-save reward를 연결한다.
4. production client와 `identity` schema를 반영한다.
5. Vibe·ZWDS를 같은 relying-party 계약으로 순차 전환한다.
6. Web·Chat에서 기존 `apps/api` 인증 의존성을 제거하고 중앙 계정으로 전환한다.
7. 모든 소비자가 전환된 뒤 중앙 master secret을 보유한 이전 인증 경로를 제거한다.

각 단계는 이전 앱의 DB나 쿠키를 새 authority의 진실 원장으로 취급하지 않는다. 필요한 사용자 전환은
별도 제품 결정을 거쳐 수행하며 새 구조 안에 장기 하위호환 분기를 넣지 않는다.
