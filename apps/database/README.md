# Sobok Database Worker

`apps/database`는 production과 staging의 동적 애플리케이션 코드를 실행하는 비공개 Cloudflare Worker다.
공개 URL, custom domain, `workers.dev` 주소를 갖지 않으며 공개 앱 Worker의 Service Binding으로만 호출된다.

## 환경 경계

```text
production Supabase ← production fresh Hyperdrive ┐
                    ← production cached Hyperdrive ├→ database

staging Supabase    ← staging fresh Hyperdrive ┐
                    ← staging cached Hyperdrive ├→ database-stg
```

Hyperdrive는 정확히 네 개다. 앱이 추가되어도 수가 늘지 않는다. 새 앱은 양쪽 Supabase project에 동일한
schema를 추가하고 Database Worker에 이름 있는 entrypoint를 추가한다.

- `HYPERDRIVE_FRESH`: 세션, 인증, 돈, entitlement, 상태, 쓰기와 read-after-write 전용. 캐시 비활성.
- `HYPERDRIVE_CACHED`: 쓰기가 끝난 불변 본문처럼 stale read가 권한이나 상태를 바꾸지 않는 조회만 허용.
- 두 binding은 한 환경 안에서 같은 Supabase direct endpoint와 `sobok_runtime` role을 사용한다.
- production과 staging은 project, role credential, 연결 풀, Worker, secret을 공유하지 않는다.

## 권한 경계

공개 `accounts`, `stella`, `vibe` Worker에는 `ASSETS`와 `DATABASE` binding만 있다. 다음 capability는 이
Worker에만 둔다.

- 두 Hyperdrive binding
- backend Secrets Store binding
- Accounts email Queue producer/consumer
- Stella/Vibe payment event Queue consumer
- Payments Worker의 Stella/Vibe 전용 RPC binding
- Stella/Vibe 유지보수 RPC entrypoint

현재 HTTP entrypoint는 `AccountsService`, `StellaService`, `VibeService`다. Scheduler는 같은 환경 Worker의
`StellaMaintenance`, `VibeMaintenance`를 호출한다. 제품 코드는 제품 폴더에 남고 이 Worker는 실행 권한과
배포 단위만 소유한다.

## 배포

배포 순서는 schema → Payments → Database Worker → 공개 앱 Worker다. 공개 앱을 먼저 배포하면 존재하지
않는 Service Binding 대상 때문에 배포가 실패한다.

Cloudflare Terraform의 `account-database.hyperdrive_ids`를 적용한 뒤 네 값을
`apps/database/wrangler.jsonc`의 production/staging fresh/cached ID에 반영한다. OAuth 공개 client ID는
GitHub Environment variable에서 Database Worker 배포 시 `--var`로 주입한다.

```sh
bun --filter=@sobok/database type
WRANGLER_WRITE_LOGS=false bunx wrangler deploy --dry-run --env=""
WRANGLER_WRITE_LOGS=false bunx wrangler deploy --dry-run --env=stg
```
