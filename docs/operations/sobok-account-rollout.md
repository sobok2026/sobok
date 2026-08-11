# Sobok 통합 계정 최초 배포

이 문서는 `apps/accounts` authority와 첫 relying party인 Stella를 production/staging 독립 Supabase project에
처음 배포하는 순서를 기록한다. runtime secret은 Git, CI 로그, 문서에 복사하지 않는다.

## 현재 진행 상태

2026-08-11 기준 소스 상태다. HCP apply, Supabase project 생성, GitHub secret 입력, Cloudflare 배포는 운영자
확인 전 완료로 간주하지 않는다.

- [x] Accounts authority UI·도메인 코드·email 처리기와 고정 `identity` schema 구현
- [x] `packages/auth` authority/relying-party/OIDC 계약 구현
- [x] Stella OIDC session과 guest collection 귀속 구현
- [x] production/staging Supabase root와 공용 DB role/grant 모듈 구현
- [x] 환경별 Database Worker와 전체 네 Hyperdrive desired state 구현
- [x] Better Auth client IP를 환경별 HMAC 가명값으로 처리하도록 구현
- [ ] Supabase production/staging project를 Pro로 준비하고 두 HCP workspace apply
- [x] Cloudflare Terraform apply 후 Wrangler에 production/staging Hyperdrive ID 네 개 반영
- [x] GitHub Environment에 환경별 migrator URL과 Stella OIDC client secret 입력
- [x] production/staging 배포의 고정 `stella-web` client 자동 bootstrap 구현
- [ ] staging schema push와 Accounts/Stella 최초 배포
- [ ] 두 환경의 `stella-web` client bootstrap
- [ ] production schema와 앱 배포

## 1. 외부 인증 애플리케이션

Google·Kakao·BBaton client는 production과 staging을 분리한다.

| 제공자 | production callback                                         | staging callback                                                |
| ------ | ----------------------------------------------------------- | --------------------------------------------------------------- |
| Google | `https://accounts.sobok.cc/api/auth/callback/google`        | `https://accounts-stg.sobok.cc/api/auth/callback/google`        |
| Kakao  | `https://accounts.sobok.cc/api/auth/callback/kakao`         | `https://accounts-stg.sobok.cc/api/auth/callback/kakao`         |
| BBaton | `https://accounts.sobok.cc/api/auth/oauth2/callback/bbaton` | `https://accounts-stg.sobok.cc/api/auth/oauth2/callback/bbaton` |

Google One Tap JavaScript origin도 환경별 accounts origin으로 제한한다. Kakao client ID는 REST API key를
사용하고 해당 key의 client secret을 활성화한다. BBaton은 로그인 제공자가 아니라 로그인한 계정의 명시적
성인 인증 연결로만 사용한다. HCP 값은 HCL을 끄고 원문을 넣으며 secret은 Sensitive로 유지한다.

Resend에서는 `accounts.sobok.cc` 발신 도메인을 검증하고 두 환경에 각각 sending-only key를 둔다.
발신자는 production `Sobok Accounts <accounts@accounts.sobok.cc>`, staging
`Sobok Accounts Staging <accounts-stg@accounts.sobok.cc>`다.

## 2. Supabase와 HCP Terraform

환경 경계는 다음 두 project뿐이다.

| 환경       | HCP workspace      | Working directory           | Supabase project 이름 |
| ---------- | ------------------ | --------------------------- | --------------------- |
| production | `sobok-production` | `infra/supabase/production` | `sobok-production`    |
| staging    | `sobok-staging`    | `infra/supabase/staging`    | `sobok-staging`       |

두 project 모두 서울 리전 Pro로 준비한다. 각 workspace에는 다음 값을 설정한다.

- `organization_id`
- `project_ref`
- `database_password` (Sensitive)
- `SUPABASE_ACCESS_TOKEN` (Sensitive environment variable)

Terraform은 각 project에 동일한 `identity`·`stella`·`deeptype` schema, Database Worker 전용
`sobok_runtime`, 앱별 migrator role을 만든다. `_stg` schema나 환경 접미사 role은 만들지 않는다.

`account-accounts`는 Cloudflare project의 단일 workspace로 두 환경의 Cloudflare 자원을 함께 관리한다.

| 설정              | 값                                        |
| ----------------- | ----------------------------------------- |
| HCP Project       | `cloudflare`                              |
| Workspace         | `account-accounts`                        |
| Working directory | `infra/cloudflare/account/sobok/accounts` |
| Apply             | VCS-driven, manual apply                  |

네 Hyperdrive는 별도 `account-database` workspace가 함께 소유한다.

| 설정              | 값                                        |
| ----------------- | ----------------------------------------- |
| HCP Project       | `cloudflare`                              |
| Workspace         | `account-database`                        |
| Working directory | `infra/cloudflare/account/sobok/database` |
| Apply             | VCS-driven, manual apply                  |

Cloudflare resource lifecycle은 `sobok-ops` Terraform이, Worker 연결은 앱 저장소의 `wrangler.jsonc`가
소유한다. Queue/DLQ와 Hyperdrive config는 Terraform에서 만들고, producer/consumer·Service Binding·
Hyperdrive binding은 Wrangler에서 연결한다. 같은 대상을 양쪽에서 관리하거나 Cloudflare Dashboard에서
수동 변경하지 않는다.

최초 plan 전에 Remote State Sharing을 연다.

- `sobok-production`, `sobok-staging` → `account-database`
- `account-secrets-store` → `account-database`와 secret을 쓰는 제품 workspace
- `account-accounts` → GitHub 인프라 workspace

`account-accounts`의 upstream OAuth/Resend 변수는 기존 환경별 이름을 사용한다. Better Auth signing secret,
Accounts IP HMAC salt, Stella OIDC client secret은 Terraform이 환경별로 생성한다. Stella workspace도 IP
HMAC salt와 auth secret을 환경별로 생성한다.

적용 순서는 다음과 같다.

1. `sobok-production`, `sobok-staging`
2. `account-secrets-store`, `account-turnstile`
3. `account-accounts`, `account-stella`, `account-vibe`, `account-database`
4. 네 Hyperdrive ID를 Database Wrangler config에 반영
5. GitHub 인프라 workspace

## 3. schema push

Drizzle migration 파일은 만들지 않는다. 선택한 환경 workspace의 `schema_migrator_urls`에서 제품 URL을
꺼내 현재 셸의 `SOBOK_MIGRATOR_URL`에만 둔다.

```sh
SOBOK_MIGRATOR_URL='<staging accounts URL>' bun run --filter=@sobok/accounts db:push
SOBOK_MIGRATOR_URL='<production accounts URL>' bun run --filter=@sobok/accounts db:push
```

두 명령 모두 schema 이름은 `identity`, role은 `accounts_migrator`다. project ref와 password가 환경을
구분한다. Drizzle config는 `sslmode=verify-full`과 예상 migrator role을 검증하며 다른 앱 role을 거부한다.
Staging workflow는 자동 push하고 production은 수동 plan/apply한다.

Terraform DB 모듈은 환경별 `sobok_runtime`에 두 종류의 권한을 모두 선언한다.

- `postgresql_grant`: 현재 table·sequence 전체
- `postgresql_default_privileges`: 이후 migrator가 만드는 table·sequence

이 순서를 생략하면 schema가 존재해도 Better Auth의 `rate_limit` 또는 Stella의 `auth_rate_limit` query가
`permission denied`로 500을 반환할 수 있다.

## 4. Database·Accounts 최초 배포와 domain

Terraform apply 뒤 `account-database.hyperdrive_ids`의 production/staging fresh/cached 네 값을
`apps/database/wrangler.jsonc`에 기록한다. 한 ID를 다른 환경이나 cache policy에 재사용하지 않는다.
각 GitHub Environment에는 그 환경의 공개 OAuth 식별자인 `ACCOUNTS_GOOGLE_CLIENT_ID`,
`ACCOUNTS_KAKAO_CLIENT_ID`, `ACCOUNTS_BBATON_CLIENT_ID` variable도 등록한다. Payments → Database Worker →
Accounts 공개 Worker 순으로 배포한 뒤 custom domain을 연결한다.

다음 endpoint를 확인한다.

- `https://accounts-stg.sobok.cc/.well-known/openid-configuration`
- `https://accounts-stg.sobok.cc/.well-known/oauth-authorization-server`
- `https://accounts-stg.sobok.cc/api/health`

issuer와 authorization/token/userinfo/JWKS endpoint는 모두 같은 환경의 accounts origin을 가리켜야 한다.
`sobok.cc/api/accounts` proxy나 공유 cookie는 만들지 않는다.

## 5. 고정 Stella OIDC client 등록

두 authority DB에 공개 client ID `stella-web`을 등록하되 secret과 redirect URI는 환경별로 분리한다.

| 환경       | origin                        | redirect URI                                                 |
| ---------- | ----------------------------- | ------------------------------------------------------------ |
| staging    | `https://stella-stg.sobok.cc` | `https://stella-stg.sobok.cc/api/auth/oauth2/callback/sobok` |
| production | `https://stella.sobok.cc`     | `https://stella.sobok.cc/api/auth/oauth2/callback/sobok`     |

각 GitHub Environment에 `account-accounts`의 같은 환경 sensitive output을
`STELLA_OIDC_CLIENT_SECRET` secret으로 등록한다. Repository secret으로 만들지 않는다. Staging workflow는
schema push 직후, production 배포 workflow는 Worker 배포 전에
`.github/actions/bootstrap-stella-oauth-client`를 실행하며 다음 값을 bootstrap 스크립트에 전달한다.

- `SOBOK_MIGRATOR_URL`: 해당 환경 Accounts migrator URL
- `SOBOK_OAUTH_CLIENT_ID=stella-web`
- `SOBOK_OAUTH_CLIENT_SECRET`: 해당 Environment의 `STELLA_OIDC_CLIENT_SECRET`
- `SOBOK_OAUTH_CLIENT_NAME=Stella`
- `SOBOK_OAUTH_CLIENT_ORIGIN`
- `SOBOK_OAUTH_REDIRECT_URIS`

Bootstrap job은 `SOBOK_MIGRATOR_URL`이 `accounts_migrator`와 `sslmode=verify-full`을 사용하는지도 검증한다.
로그인 세션이 필요한 OAuth 관리 API나 동적 client 등록을 열지 않고, migrator로 검토된 고정 row만 생성한다.
런타임과 bootstrap은 같은 명시적 secret hash 계약을 사용한다. 같은 credential과 metadata 재실행은 no-op이다.
기존 row가 다른 credential, redirect URI, scope, PKCE, consent 또는 token auth 설정을 가지면 자동 수정하지 않고
이후 Worker 배포 전에 실패한다. Client secret은 로그에 출력하지 않는다.

## 6. Stella 수직 확인

Stella 동적 코드는 환경별 Database Worker의 fresh Hyperdrive, `sobok_runtime`, auth secret, OIDC secret,
IP HMAC salt를 사용한다. staging에서 다음을 완주한 뒤 production을 배포한다.

1. 게스트 무료 결과 → 결제 → 유료 질문 → 카드 공개
2. “소복 계정으로 보관하기” → accounts 로그인/가입
3. 기존 collection의 원자적 계정 귀속과 guest capability 폐기 확인
4. account-save 보상 1회 멱등 지급 확인
5. 계정 보관함과 새 브라우저 OIDC 로그인 재열람 확인
6. 구매 이메일 링크가 account-owned collection에 guest capability를 다시 발급하지 않는지 확인
7. 무료/유료 재추첨과 대표 카드 변경을 계정 session으로 확인

중앙 계정 삭제 API는 앱별 lifecycle event와 재시도 가능한 소비자가 모두 생길 때까지 열지 않는다.
