# Sobok 통합 계정 최초 배포

이 문서는 `apps/accounts` 중앙 authority와 첫 relying party인 Stella를 처음 배포하는 순서를 기록한다.
runtime secret 값은 Git, CI 로그, 문서에 복사하지 않는다. 기존 `apps/api` 인증은 이 배포의 선행 조건이나
authority가 아니다.

## 1. 외부 인증 애플리케이션

production과 staging은 Google·Kakao·BBaton client를 각각 분리한다.

| 제공자 | production callback                                         | staging callback                                                |
| ------ | ----------------------------------------------------------- | --------------------------------------------------------------- |
| Google | `https://accounts.sobok.cc/api/auth/callback/google`        | `https://accounts-stg.sobok.cc/api/auth/callback/google`        |
| Kakao  | `https://accounts.sobok.cc/api/auth/callback/kakao`         | `https://accounts-stg.sobok.cc/api/auth/callback/kakao`         |
| BBaton | `https://accounts.sobok.cc/api/auth/oauth2/callback/bbaton` | `https://accounts-stg.sobok.cc/api/auth/oauth2/callback/bbaton` |

Google One Tap의 승인된 JavaScript origin도 두 accounts origin에 각각 맞춘다. Kakao는 이메일 제공에
필요한 동의 항목을 켠다. BBaton은 로그인 제공자가 아니라 로그인한 계정의 명시적 연결로만 사용한다.

## 2. 인프라 적용

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
STELLA_DB_SCHEMA=stella_stg bun run --filter=@sobok/stella db:push
STELLA_DB_SCHEMA=stella bun run --filter=@sobok/stella db:push
```

각 명령에는 대응하는 `*_POSTGRES_URL_DIRECT`가 필요하다. diff가 대상 schema 밖의 객체를 건드리면
적용하지 않는다.

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
