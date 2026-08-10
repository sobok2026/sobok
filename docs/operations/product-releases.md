# Product 배포 운영

배포 로직은 GitHub Actions YAML과 각 앱의 `package.json`·`wrangler.jsonc`에 명시한다. 별도 제품
레지스트리나 배포용 TypeScript 프로그램은 두지 않는다.

## 배포 모델

| 대상       | 시작 방법                | DB schema                           | 앱                               |
| ---------- | ------------------------ | ----------------------------------- | -------------------------------- |
| staging    | `staging` push           | Stella·Vibe 자동 `drizzle-kit push` | Payments → Stella·Vibe 자동 배포 |
| production | GitHub Actions 수동 실행 | 제품별 plan/apply 수동 실행         | Payments → 전체 앱 수동 배포     |

Staging은 공유 통합 환경이므로 push된 commit 전체를 자동 반영한다. Production은 schema와 앱을 서로
독립된 수동 workflow로 실행한다. 두 production workflow는 같은 concurrency group을 사용해 schema
작업과 앱 배포가 겹치지 않는다. Production 앱 workflow는 DB를 변경하지 않는다.

## Staging 자동 배포

`.github/workflows/staging-deploy.yml`은 `staging` push마다 다음 순서를 수행한다.

1. Environment 없이 repository 정적 검증을 수행한다.
2. `staging` Environment의 제품별 migrator secret으로 schema를 순차 push한다.
3. `payments-stg`를 배포한다.
4. Stella와 Vibe staging Worker를 배포한다.

Schema push는 각 앱의 `drizzle.config.mjs`를 직접 사용하고 `--force`를 사용하지 않는다. Drizzle가
rename 판단이나 데이터 손실 승인을 요구하면 배포는 실패한다. Schema 단계가 실패하면 Payments와 앱은
배포하지 않는다. 모든 direct URL은 `sslmode=verify-full`이어야 하며, job은 저장소에 고정한
`certs/supabase/prod-ca-2021.crt`를 `NODE_EXTRA_CA_CERTS`로 로드해 CA와 pooler hostname을 검증한다.

Staging branch는 일반 collaborator에게 PR과 required checks를 요구한다. Repository admin은 긴급한
fast-forward 직접 push가 가능하지만 삭제와 force-push는 별도 ruleset으로 계속 차단한다. 직접 push도
배포 workflow의 정적 검증을 우회하지 않는다.

## Production schema 수동 반영

`.github/workflows/production-schema.yml`을 `main`에서 수동 실행한다.

1. `product`에서 `stella` 또는 `vibe`를 선택한다.
2. 먼저 `mode=plan`을 실행해 `drizzle-kit push --explain --verbose` 결과를 확인한다.
3. SQL과 운영 영향을 검토한 뒤 `mode=apply`, `confirmation=APPLY`로 다시 실행한다.
4. 일반 `drizzle-kit push`가 실행된다. `--force`는 사용하지 않는다.

Schema job도 실제 배포 대상인 `production` GitHub Environment를 사용한다. Stella는
`STELLA_POSTGRES_URL_DIRECT`, Vibe는 `VIBE_POSTGRES_URL_DIRECT`만 자기 job의
`SOBOK_POSTGRES_URL_DIRECT`로 명시적 매핑한다. 앱 배포 job은 이 DB secret을 참조하지 않는다.

## Production 앱 수동 배포

필요한 production schema를 모두 반영한 뒤 `.github/workflows/production-deploy.yml`을 `main`에서
수동 실행하고 `confirmation=DEPLOY`를 입력한다.

Workflow는 repository를 다시 검증한 후 Payments를 먼저 배포하고 Stella, Vibe, ZWDS, Horn을
배포한다. DB schema는 변경하지 않는다. Schema 변경과 앱 변경이 같은 release에 포함됐다면 아래 순서를
반드시 지킨다.

1. 해당 제품 schema `plan`
2. 해당 제품 schema `apply`
3. production 앱 배포

Schema 변경이 없다면 1~2를 생략한다.

## 설정과 권한

GitHub Environment는 실제 배포 대상인 `production`과 `staging` 두 개만 둔다. 각 Environment에
Cloudflare credential과 해당 배포 대상의 제품별 schema migrator URL을 함께 등록한다.

| Environment  | Secret                       | DB role/schema                       |
| ------------ | ---------------------------- | ------------------------------------ |
| `production` | `STELLA_POSTGRES_URL_DIRECT` | `stella_prod_migrator` / `stella`    |
| `production` | `VIBE_POSTGRES_URL_DIRECT`   | `vibe_prod_migrator` / `deeptype`    |
| `staging`    | `STELLA_POSTGRES_URL_DIRECT` | `stella_stg_migrator` / `stella_stg` |
| `staging`    | `VIBE_POSTGRES_URL_DIRECT`   | `vibe_stg_migrator` / `deeptype_stg` |

Public Turnstile site key는 repository variable `STELLA_TURNSTILE_SITE_KEY`와
`VIBE_TURNSTILE_SITE_KEY`로 관리한다. Secret이나 DB URL을 repository variable에 넣지 않는다.

`sobok-ops/infra/supabase/prod`의 `product_schema_migrator_urls` sensitive output이 Environment와
secret 이름으로 중첩된 값의 원본이다. 이 output도 `sslmode=verify-full`을 고정하며 다른 mode의 URL은
앱별 Drizzle config가 거부한다. 각 로그인 역할은 정확히 한 schema에만 `USAGE`/
`CREATE`를 갖고, 그 안에 직접 만든 object만 소유한다. Schema 자체는 `postgres`가 소유한다.
런타임 역할은 schema 사용과 테이블 DML 권한만 갖는다.

현재 Supabase Root 2021 CA는 2031-04-26에 만료된다. CA를 교체할 때는 이 저장소의
`certs/supabase/prod-ca-2021.crt`와 `sobok-ops/infra/supabase/prod/certs/prod-ca-2021.crt`를 같은 PEM으로
갱신하고, `account-secrets-store`와 모든 Hyperdrive workspace를 먼저 apply한 뒤 schema workflow를 실행한다.

## 새 제품 추가

새 제품을 추가할 때는 해당되는 위치를 명시적으로 확장한다.

1. 앱 `package.json`에 표준 `build` script를 둔다.
2. `wrangler.jsonc`에 production Worker와 필요하면 `stg` environment를 선언한다.
3. `.github/workflows/production-deploy.yml`에 reusable app deploy job을 추가한다.
4. Staging을 제공하면 `.github/workflows/staging-deploy.yml`에도 job을 추가한다.
5. DB를 사용하면 staging schema matrix와 `.github/workflows/production-schema.yml`에 제품 job을
   추가하고 `sobok-ops`에 schema migrator·grant를 추가한다. 새 GitHub Environment는 만들지
   않고 기존 `production`/`staging`에 제품별 migrator secret을 추가한다.
6. Payments를 사용하면 중앙 payment scope·entrypoint와 제품 Service Binding을 추가한다.
7. 공개 build 값이 있으면 app별 GitHub repository variable로 선언한다.

추가 지점이 여러 개인 것은 각 시스템의 실제 권한·배포 경계를 명시하기 위해서다. 이를 감추는 별도
코드 생성기나 제품 레지스트리는 두지 않는다.

## 최초 반영 순서

현재 product schema가 비어 있다는 전제에서 다음 순서로 전환한다.

1. `sobok-ops/infra/cloudflare/account/sobok/secrets-store`를 apply해 Supabase CA trust bundle을 만든다.
2. `sobok-ops/infra/supabase/prod`를 apply해 schema migrator·grant, runtime default privileges와
   `verify-full` migrator URL output을 만든다.
3. Accounts·Stella·Vibe Cloudflare workspace를 apply해 모든 Hyperdrive origin에 `verify-full`을 반영한다.
4. `sobok-ops/infra/github/sobok2026`을 apply해 Environment, branch policy, repository variable,
   required checks를 만든다.
5. `product_schema_migrator_urls`의 `production`/`staging` 하위 값을 같은 이름의 GitHub
   Environment secret으로 넣는다.
6. `staging` push로 staging schema와 staging을 제공하는 앱의 배포를 완료한다.
7. Production schema를 제품별로 plan한 뒤 apply한다.
8. Production 앱 배포 workflow를 수동 실행한다.
