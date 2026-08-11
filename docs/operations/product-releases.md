# Product 배포 운영

배포 로직은 GitHub Actions와 각 앱의 `package.json`·`wrangler.jsonc`에 명시한다. 별도 제품 레지스트리나
배포용 프로그램은 두지 않는다.

## 환경 불변식

| 환경       | HCP workspace      | Supabase project       | 앱 schema                                      |
| ---------- | ------------------ | ---------------------- | ---------------------------------------------- |
| production | `sobok-production` | `sobok-production` Pro | `identity`, `stella`, `deeptype`, 이후 앱 slug |
| staging    | `sobok-staging`    | `sobok-staging` Pro    | production과 동일                              |

환경은 Supabase project로 분리하고 앱은 project 안의 schema로 분리한다. 앱 수와 무관하게 장기 project는
두 개, Hyperdrive는 네 개를 유지한다. schema·role 이름에는 환경 접미사를 넣지 않는다.

각 project는 다음 role을 갖는다.

- `sobok_runtime`: 해당 환경 Database Worker 전용. 모든 앱 schema의 현재·미래 table DML과 sequence 사용.
- `<app>_migrator`: 해당 앱 schema의 `USAGE/CREATE`와 Drizzle object ownership.
- 모든 role의 `search_path`: `pg_catalog`만 허용. 앱 코드는 schema-qualified table만 사용.

현재 object grant와 migrator owner의 default privilege를 둘 다 관리한다. default privilege만으로는 이미
존재하는 table에 권한이 생기지 않는다.

## Database Worker와 Hyperdrive

`database`와 `database-stg`만 DB에 접속한다. 공개 앱 Worker는 static assets와 환경별 `DATABASE` Service
Binding만 갖는다.

| Supabase project | Worker         | fresh config                | cached config                |
| ---------------- | -------------- | --------------------------- | ---------------------------- |
| production       | `database`     | `database-production-fresh` | `database-production-cached` |
| staging          | `database-stg` | `database-staging-fresh`    | `database-staging-cached`    |

네 config 모두 Supabase direct endpoint, `verify-full`, 환경별 `sobok_runtime` credential을 사용한다. Fresh는
캐시를 끄고 인증·세션·돈·entitlement·쓰기·read-after-write에 사용한다. Cached는 완료 후 변경되지 않는
본문처럼 stale read가 권한이나 상태를 바꾸지 않는 데이터에만 사용한다.

새 앱은 기존 네 config를 재사용한다. 앱별 Hyperdrive나 Supabase project를 만들지 않는다.

## Cloudflare 설정 소유권

Cloudflare 설정은 `Terraform = resource lifecycle`, `Wrangler = Worker connection`으로 나눈다.

- `sobok-ops` Terraform: Queue/DLQ, Hyperdrive config, Secrets Store 항목, Turnstile widget, custom domain,
  DNS·Zone 설정처럼 Worker와 독립적으로 존재하는 resource
- 앱의 `wrangler.jsonc`: Worker script/assets/vars, Service Binding, Queue producer/consumer, Hyperdrive와
  Secrets Store binding, Worker trigger

같은 대상은 한쪽에만 선언한다. 특히 Queue consumer와 retry/batch/DLQ 연결은 소비 Worker의
`wrangler.jsonc`가 단독 소유하며 Terraform에 `cloudflare_queue_consumer`를 추가하지 않는다. Cloudflare
Dashboard는 조회 전용이고 원격 변경은 HCP Terraform 또는 GitHub Actions의 Wrangler 배포로만 수행한다.

## 배포 모델

Staging workflow 순서:

1. 저장소 정적 검증
2. 제품 schema를 `drizzle-kit push`
3. Payments Worker 배포
4. `database-stg` 배포
5. Accounts/Vibe 공개 Worker 배포, Accounts 이후 Stella 공개 Worker 배포

Production은 제품별 schema plan/apply를 먼저 실행하고 수동 배포 workflow가 Payments → `database` → 공개
앱 순서를 고정한다. 그 workflow가 성공하면 Scheduler workflow가 같은 production SHA를 checkout해
`database`·`database-stg` maintenance binding을 배포한다. 따라서 최초 전환에서도 Scheduler가 Database
Worker보다 먼저 배포되지 않는다. Schema와 앱 workflow는 같은 concurrency group을 사용한다.

Database Worker 배포만 Accounts의 Google·Kakao·BBaton 공개 client ID를 runtime var로 받는다. Accounts
정적 빌드는 Google client ID만 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`로 받는다. DB URL과 secret은 공개 앱
배포 job에 전달하지 않는다.

## GitHub Environment secret

실제 배포 Environment는 `production`과 `staging` 두 개뿐이다.

| Secret                  | Role / schema                    |
| ----------------------- | -------------------------------- |
| `ACCOUNTS_MIGRATOR_URL` | `accounts_migrator` / `identity` |
| `STELLA_MIGRATOR_URL`   | `stella_migrator` / `stella`     |
| `VIBE_MIGRATOR_URL`     | `vibe_migrator` / `deeptype`     |

같은 이름이라도 Environment마다 다른 Supabase project URL이다. URL은 session pooler와
`sslmode=verify-full`을 사용하고 앱의 공통 `SOBOK_MIGRATOR_URL`에만 주입한다. Runtime credential이나 owner
credential을 schema 작업에 재사용하지 않는다.

## Hyperdrive ID 반영

HCP Terraform `account-database` workspace의 `hyperdrive_ids` output은 다음 네 값을 제공한다.

- `production.fresh`, `production.cached`
- `staging.fresh`, `staging.cached`

Hyperdrive를 생성하거나 교체한 뒤 네 ID를 `apps/database/wrangler.jsonc`의 각 binding에 반영하고
`bun --filter=@sobok/database type`과 Wrangler dry-run을 수행한다. 알 수 없는 ID나 placeholder가 남은
revision은 배포하지 않으며, 한 ID를 두 환경이나 두 cache policy에 재사용하지 않는다.

## 새 제품 추가

1. Supabase module의 product map에 앱 slug와 고정 schema를 추가한다.
2. 양쪽 Supabase workspace를 apply해 schema, migrator, `sobok_runtime` grant를 반영한다.
3. 제품의 동적 코드를 Database Worker의 이름 있는 entrypoint로 노출한다.
4. 공개 앱 Worker는 `DATABASE` Service Binding만 갖게 한다.
5. Staging schema matrix와 production schema workflow에 migrator를 추가한다.
6. 외부 서비스나 Queue가 필요하면 Terraform에 resource를, Database Worker Wrangler에 최소 binding이나
   consumer를 선언하고 배포 선후관계를 추가한다.

Supabase project, GitHub Environment, Hyperdrive는 앱마다 추가하지 않는다.

## 최초 반영 순서

1. 서울 리전 production/staging Supabase Pro project를 준비한다.
2. `sobok-production`, `sobok-staging`을 apply한다.
3. 두 Supabase workspace와 `account-secrets-store`의 Remote State Sharing을 `account-database`에 연다.
4. `account-secrets-store`와 제품별 secret/Queue workspace를 apply한다.
5. `account-database`를 apply하고 네 Hyperdrive ID를 Database Wrangler config에 반영한다.
6. 환경별 migrator URL을 같은 GitHub Environment secret에 넣는다.
7. Staging schema와 Workers를 배포한 뒤 production schema plan/apply와 Workers 배포를 수행한다.

CA 교체 시 앱 저장소와 ops 저장소의 `prod-ca-2021.crt`를 함께 갱신하고 Secrets Store와 네 Hyperdrive를
schema 작업보다 먼저 apply한다.
