# Sobok 통합 계정 최초 배포

이 문서는 `apps/accounts` 중앙 authority와 첫 relying party인 Stella를 처음 배포하는 순서를 기록한다.
runtime secret 값은 Git, CI 로그, 문서에 복사하지 않는다. 기존 `apps/api` 인증은 이 배포의 선행 조건이나
authority가 아니다.

## 현재 진행 상태

2026-08-04 기준 상태다. 소스 반영과 외부 시스템 반영을 구분하며, 운영자 확인 전에는 HCP 또는 외부
콘솔 작업을 완료로 간주하지 않는다.

- [x] `apps/accounts` authority UI·Worker·DB schema·email consumer 구현
- [x] 단일 `packages/auth`에 authority/relying-party/OIDC 계약 구현
- [x] Stella OIDC session, 게스트 collection 귀속, 계정 보관함과 재열람 권한 흐름 구현
- [x] `sobok-ops`에 accounts·Stella·Turnstile·Supabase·GitHub desired state 구현
- [ ] Google·Kakao·BBaton production/staging application 발급 및 HCP 변수 입력 확인
- [ ] Resend production/staging 발신 도메인 검증 및 제한된 sending key 입력 확인
- [ ] HCP `account-accounts` workspace 생성·plan·apply 확인
- [ ] `accounts_hyperdrive_id`를 반영한 `apps/accounts/wrangler.jsonc`와 accounts 배포 workflow 추가
- [ ] `identity_stg`·`identity` schema push
- [ ] accounts staging·production Worker 최초 배포 후 custom domain 연결
- [ ] 두 환경의 `stella-web` client bootstrap
- [ ] Stella staging 수직 흐름 확인 후 production 반영

외부 작업의 실제 완료 여부가 확인되면 이 체크리스트를 갱신한다. 현재 저장소에
`apps/accounts/wrangler.jsonc`와 accounts 배포 workflow가 없는 것은 Hyperdrive ID 생성 전 임시
placeholder를 커밋하지 않기 위한 의도된 상태다.

## 1. 외부 인증 애플리케이션

production과 staging은 Google·Kakao·BBaton client를 각각 분리한다.

| 제공자 | production callback                                         | staging callback                                                |
| ------ | ----------------------------------------------------------- | --------------------------------------------------------------- |
| Google | `https://accounts.sobok.cc/api/auth/callback/google`        | `https://accounts-stg.sobok.cc/api/auth/callback/google`        |
| Kakao  | `https://accounts.sobok.cc/api/auth/callback/kakao`         | `https://accounts-stg.sobok.cc/api/auth/callback/kakao`         |
| BBaton | `https://accounts.sobok.cc/api/auth/oauth2/callback/bbaton` | `https://accounts-stg.sobok.cc/api/auth/oauth2/callback/bbaton` |

Google One Tap의 승인된 JavaScript origin도 두 accounts origin에 각각 맞춘다. Kakao는 이메일 제공에
필요한 동의 항목을 켠다. BBaton은 로그인 제공자가 아니라 로그인한 계정의 명시적 연결로만 사용한다.

제공자별 production과 staging application을 따로 만들고 값을 재사용하지 않는다.

- Google Web application의 승인된 JavaScript origin은 각각 `https://accounts.sobok.cc`와
  `https://accounts-stg.sobok.cc`다. Client ID와 Client secret을 같은 환경의 HCP 변수에 넣는다.
- Kakao client ID에는 JavaScript key나 Admin key가 아니라 **REST API key**를 넣는다. REST API key의
  Client secret을 생성·활성화하고 같은 환경의 secret 변수에 넣는다. 카카오 로그인과 profile/email 동의
  항목을 구성하며 `account_email` 사용에 필요한 앱 상태도 제공자 콘솔에서 확인한다.
- BBaton은 환경별 API application을 만들고 Client ID와 Secret Key를 대응하는 변수에 넣는다. Accounts는
  고정 outbound IP가 없는 Cloudflare Worker이므로 App IP 칸에 임의의 IP를 입력하지 않는다. BBaton에
  Cloudflare Workers 실행 환경임을 알리고 허용 방식부터 확인한다.
- HCP 값 입력 화면에서는 **HCL을 끄고**, 따옴표 없이 원문 값만 붙여 넣는다. ID는 공개 식별자이며
  client secret은 Sensitive로 유지한다.

### 계정 이메일

Resend에는 production `accounts.sobok.cc`와 staging `accounts-stg.sobok.cc` 발신 도메인을 분리해
검증한다. 각 환경에 해당 도메인으로 제한한 `Sending access` key를 만들고 HCP의 `accounts_resend_api_key_*`
변수에 넣는다. 발신 도메인 DNS 레코드는 아직 `sobok-ops` Terraform에 선언되어 있지 않으므로 최초
배포 전에 추가하거나, 제공자 콘솔에서 검증한 상태를 운영 문서에 명시해야 한다.

실제 From 주소와 표시 이름은 아직 확정하지 않았다. 확정 전까지 예시 주소를 production 설정으로
승격하지 않는다.

## 2. HCP Terraform과 인프라 적용

`account-accounts`는 production과 staging 자원을 함께 소유하는 하나의 workspace다. 환경별 workspace를
추가로 만들지 않는다.

| 설정              | 값                                          |
| ----------------- | ------------------------------------------- |
| Organization      | `sobok2026`                                 |
| Project           | `cloudflare`                                |
| Workspace         | `account-accounts`                          |
| Repository        | `sobok2026/sobok-ops`                       |
| Branch            | `main`                                      |
| Working directory | `infra/cloudflare/account/sobok/accounts`   |
| Workflow          | VCS-driven, manual apply, Auto Apply 비활성 |
| Terraform         | `1.14.x` (`>= 1.14.0, < 2.0.0`)             |

Cloudflare project variable set의 sensitive environment variable `CLOUDFLARE_API_TOKEN`을 사용한다. 최초
plan 전에 다음 Remote State Sharing을 허용한다.

- `sobok-prod` → `account-accounts`
- `account-secrets-store` → `account-accounts`
- `account-accounts` → `sobok2026`

`account-accounts` Terraform 변수는 다음 14개다. `{production,staging}` 표기는 두 변수를 각각 만든다는
뜻이다. HCL은 모두 끄고 값만 입력한다.

| 변수                                                 | Sensitive | 값 출처                                          |
| ---------------------------------------------------- | --------- | ------------------------------------------------ |
| `accounts_google_client_id_{production,staging}`     | No        | 환경별 Google OAuth Web application Client ID    |
| `accounts_google_client_secret_{production,staging}` | Yes       | 같은 Google application Client secret            |
| `accounts_kakao_client_id_{production,staging}`      | No        | 환경별 Kakao application REST API key            |
| `accounts_kakao_client_secret_{production,staging}`  | Yes       | 같은 REST API key에 활성화한 Client secret       |
| `accounts_bbaton_client_id_{production,staging}`     | No        | 환경별 BBaton API application Client ID          |
| `accounts_bbaton_client_secret_{production,staging}` | Yes       | 같은 BBaton application Secret Key               |
| `accounts_resend_api_key_{production,staging}`       | Yes       | 환경별 발신 도메인으로 제한한 Resend sending key |

Better Auth authority secret과 `stella-web` OIDC client secret은 Terraform이 환경별로 생성하므로 사용자가
HCP 변수로 만들지 않는다. 생성된 client secret은 문서나 로그에 복사하지 않고 one-time bootstrap 입력과
Stella Worker Secrets Store binding에만 사용한다.

HCP Terraform의 VCS working directory와 remote-state sharing은
`sobok-ops/infra/cloudflare/README.md`를 따른다. 적용 순서는 다음과 같다.

1. `sobok-prod`: `identity`·`identity_stg` schema와 `identity_app` role
2. `account-turnstile`: accounts widget와 secret
3. `account-accounts`: accounts Hyperdrive, email Queue/DLQ, 환경별 authority/upstream OAuth/email secret,
   Stella OIDC client secret
4. `account-stella`: Stella 환경별 relying-party session secret
5. `sobok2026`: accounts Turnstile sitekey와 공개 upstream OAuth client ID를 GitHub environment로 동기화

`account-accounts`의 `accounts_hyperdrive_id`는 공개 배포 식별자다. 이 값이 생긴 뒤에만
`apps/accounts/wrangler.jsonc`의 두 환경에 같은 Hyperdrive binding을 기록한다. Secrets Store binding은
환경별 secret 이름을 선택하고, Worker plain var에는 client ID만 둔다.

## 3. schema push

Drizzle migration 파일은 만들지 않는다. direct PostgreSQL URL을 현재 셸에만 둔 상태에서 환경을 명시해
push한다.

```sh
ACCOUNTS_DB_SCHEMA=identity_stg bun run --filter=@sobok/accounts db:push
ACCOUNTS_DB_SCHEMA=identity bun run --filter=@sobok/accounts db:push
```

Accounts 명령에는 대응하는 `ACCOUNTS_POSTGRES_URL_DIRECT`가 필요하다. Stella staging schema는
staging 배포가 자동 push하고 production schema는 수동 plan/apply workflow가
`SOBOK_DB_SCHEMA`와 schema 전용 `SOBOK_POSTGRES_URL_DIRECT`를 주입한다. 자세한 순서는
[`product-releases.md`](product-releases.md)를 따른다.

## 4. accounts 최초 배포와 domain

GitHub Actions에서 `accounts-stg`, `accounts` Worker를 먼저 만든다. `workers_dev=false`여도 Worker service는
생성되므로 custom domain은 아직 없어도 된다. 두 Worker가 존재한 뒤 `account-workers`를 apply해
`accounts-stg.sobok.cc`, `accounts.sobok.cc`를 연결한다. 반대 순서는 Cloudflare 10007/404가 난다.

well-known 문서와 health endpoint를 확인한다.

- `https://accounts-stg.sobok.cc/.well-known/openid-configuration`
- `https://accounts-stg.sobok.cc/.well-known/oauth-authorization-server`
- `https://accounts-stg.sobok.cc/api/health`

issuer는 accounts origin이고 authorization/token/userinfo/JWKS endpoint는 같은 환경의 `/api/auth` 아래를
가리켜야 한다.

`sobok.cc/accounts`가 필요하면 production accounts origin으로 보내는 `308` 편의 redirect만 둔다.
`sobok.cc/api/accounts` proxy는 만들지 않으며, 로그인 UI·API·issuer를 `accounts.sobok.cc` 밖에 복제하지
않는다.

## 5. 고정 Stella OIDC client 등록

두 authority DB에 같은 공개 client ID `stella-web`을 쓰되 confidential secret과 redirect URI는 환경별로
분리한다. `SOBOK_OAUTH_CLIENT_SECRET`에는 `account-accounts`의 해당 sensitive output을 셸 변수로 직접
전달한다. bootstrap은 runtime authority signing secret을 요구하지 않으며 secret을 출력하지 않는다.

| 환경       | origin                        | redirect URI                                                 |
| ---------- | ----------------------------- | ------------------------------------------------------------ |
| staging    | `https://stella-stg.sobok.cc` | `https://stella-stg.sobok.cc/api/auth/oauth2/callback/sobok` |
| production | `https://stella.sobok.cc`     | `https://stella.sobok.cc/api/auth/oauth2/callback/sobok`     |

`apps/accounts`에서 다음 metadata를 환경변수로 주고 `bun run oauth:bootstrap`을 실행한다.

- `ACCOUNTS_DB_SCHEMA`
- `ACCOUNTS_POSTGRES_URL_DIRECT`
- `ACCOUNTS_PUBLIC_ORIGIN`
- `SOBOK_OAUTH_CLIENT_ID=stella-web`
- `SOBOK_OAUTH_CLIENT_SECRET`
- `SOBOK_OAUTH_CLIENT_NAME=Stella`
- `SOBOK_OAUTH_CLIENT_ORIGIN`
- `SOBOK_OAUTH_REDIRECT_URIS`

같은 metadata로 재실행하는 것은 안전하다. 기존 row가 다른 redirect URI, scope, PKCE, consent 또는 token
auth 설정을 가지면 스크립트가 실패하고 자동 수정하지 않는다.

## 6. Stella 배포와 수직 확인

Stella Worker는 환경별 accounts issuer, `stella-web`, local auth secret, OIDC client secret을 바인딩한다.
staging에서 아래 순서를 한 번 완주한 뒤 production을 배포한다.

1. 게스트로 무료 결과 → 결제 → 유료 질문 → 네 카드 공개
2. “소복 계정으로 보관하기” → accounts 로그인/가입 → 필요하면 전역 username 완료
3. 원래 `guardian_collection`이 계정에 귀속되고 guest capability가 더 이상 report API를 열지 못하는지 확인
4. account-save 사랑 카드 재추첨 credit이 정확히 한 번 생기는지 확인
5. `/{locale}/account` 보관함에서 stable report URL로 다시 열기
6. 새 브라우저에서 Stella OIDC 로그인 후 같은 보관함과 리포트 열기
7. 구매 이메일 재열람 링크가 account-owned collection에 guest capability를 다시 발급하지 않고 로그인을
   요구하는지 확인
8. 무료 재추첨, 유료 재추첨, 명시적 대표 카드 변경을 계정 세션으로 완주

중앙 계정 삭제 API는 앱별 lifecycle event와 재시도 가능한 소비자가 모두 생길 때까지 열지 않는다.
