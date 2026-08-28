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

공개 `accounts`, `civil`, `stella`, `vibe` Worker에는 `ASSETS`와 `DATABASE` binding만 있다. 다음 capability는 이
Worker에만 둔다.

- 두 Hyperdrive binding
- backend Secrets Store binding
- Accounts email Queue producer/consumer
- Civil calculation Queue producer
- Stella/Vibe payment event Queue consumer
- Payments Worker의 Stella/Vibe 전용 RPC binding
- Stella/Vibe 유지보수 RPC entrypoint

현재 HTTP entrypoint는 `AccountsService`, `CivilService`, `StellaService`, `VibeService`다. Civil의 비공개
계산 Queue Worker는 `CivilComputationService` RPC만 호출하고 PostgreSQL credential을 갖지 않는다. Scheduler는
같은 환경 Worker의 `StellaMaintenance`, `VibeMaintenance`를 호출한다. 제품 코드는 제품 폴더에 남고 이 Worker는
실행 권한과 배포 단위만 소유한다.

## 설정 소유권

| 소유자                         | 범위                                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `sobok-ops` Terraform          | Hyperdrive config, Queue/DLQ, Secrets Store 항목 등 Worker와 독립적인 resource lifecycle                                    |
| `apps/database/wrangler.jsonc` | Hyperdrive·Secrets Store·Payments Service Binding, Accounts/Civil Queue producer와 Accounts/Stella/Vibe Queue consumer 설정 |

한 설정을 두 도구가 함께 관리하지 않는다. 따라서 Terraform에는 `cloudflare_queue_consumer`를 선언하지 않고,
Wrangler에는 Queue나 Hyperdrive 자체를 생성·삭제하는 절차를 두지 않는다. Cloudflare Dashboard는 조회
전용이며 Worker 연결 변경은 GitHub Actions의 Wrangler 배포로만 반영한다.

## 배포

배포 순서는 schema → 고정 Stella OAuth client bootstrap → Payments → Database Worker → 공개 앱 Worker다.
공개 앱을 먼저 배포하면 존재하지 않는 Service Binding 대상 때문에 배포가 실패한다.

Cloudflare Terraform의 `account-database.hyperdrive_ids`를 적용한 뒤 네 값을
`apps/database/wrangler.jsonc`의 production/staging fresh/cached ID에 반영한다. OAuth 공개 client ID는
GitHub Environment variable에서 Database Worker 배포 시 `--var`로 주입한다.

Queue consumer를 다른 Worker로 옮길 때도 Dashboard에서 trigger를 제거하지 않는다. 이전 소유자의
version-controlled Wrangler 선언을 먼저 제거·배포한 뒤 새 소유자를 배포하는 별도 릴리스로 처리한다.

```sh
bun --filter=@sobok/database type
WRANGLER_WRITE_LOGS=false bunx wrangler deploy --dry-run --env=""
WRANGLER_WRITE_LOGS=false bunx wrangler deploy --dry-run --env=stg
```
