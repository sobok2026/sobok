# Sobok Scheduler

`apps/scheduler`는 Sobok 계정의 Cloudflare Worker Cron Trigger를 한곳에서 소유하는 내부 Worker다.
데이터나 제품 규칙을 직접 소유하지 않고, 각 제품 Worker의 이름 있는 `WorkerEntrypoint`를 Service
Binding RPC로 호출한다.

## 경계

```text
Cloudflare Cron Trigger → scheduler ─┬→ vibe / vibe-stg     → 각 deeptype schema
                                     └→ stella / stella-stg → 각 stella schema
```

- scheduler에는 공개 URL, custom domain, secret, DB binding을 두지 않는다.
- 유지보수 SQL과 결제 상태 전이는 데이터를 소유한 제품 Worker에 남긴다.
- production과 staging을 위한 scheduler를 따로 만들지 않는다. 단일 scheduler가 네 Worker를 명시적으로
  바인딩하므로 환경별 데이터 경계는 대상 Worker의 build-time schema와 binding이 계속 보장한다.
- 제품별 RPC 계약은 `@sobok/scheduler`가 소유한다. scheduler와 제품이 메서드 이름을 각자 복제하지
  않는다.

## 작업표

Cloudflare cron은 UTC다.

| cron           | 호출 대상                                  | 작업                |
| -------------- | ------------------------------------------ | ------------------- |
| `*/15 * * * *` | `vibe`, `vibe-stg`, `stella`, `stella-stg` | pending 결제 재조정 |
| `0 3 * * *`    | `vibe`, `vibe-stg`, `stella`, `stella-stg` | 일일 보존 기간 정리 |

같은 주기의 대상은 병렬로 실행한다. 한 대상이 실패해도 나머지 대상은 끝까지 실행하고, 하나라도 실패하면
전체 scheduled invocation을 실패로 기록한다. scheduler 로그에는 대상 이름과 오류 종류만 남기며 제품
데이터나 하위 Worker 오류 메시지를 복제하지 않는다.

이 저장소가 관리하는 Worker Cron Trigger는 위 두 개뿐이다. 새 앱이 같은 주기를 쓰면 새 trigger를
만들지 않고 기존 작업 목록에 대상만 추가한다. 주기가 실제로 달라야 할 때만 scheduler에 trigger를
하나 추가한다.

## 앱 추가

1. `packages/scheduler`에 필요한 최소 RPC capability를 선언한다.
2. 제품 Worker가 이름 있는 `WorkerEntrypoint`로 그 계약을 구현한다.
3. scheduler의 `wrangler.jsonc`에 production/staging Service Binding을 추가한다.
4. `worker/index.ts`의 해당 주기 작업 목록에 두 대상을 추가한다.
5. 제품 Worker를 먼저 배포한 뒤 scheduler를 배포한다.

Service Binding 대상 Worker와 이름 있는 entrypoint가 먼저 존재해야 한다. 최초 전환 순서는 다음과 같다.

1. `vibe`, `vibe-stg`, `stella`, `stella-stg`를 배포해 maintenance entrypoint를 공개하고 각 앱의 기존
   Cron Trigger를 제거한다.
2. `scheduler`를 배포해 두 account-wide trigger와 네 Service Binding을 만든다.

일반 배포는 `.github/workflows/scheduler-deploy.yml`을 사용한다.

```sh
bun --filter=@sobok/scheduler-service type
bun --filter=@sobok/scheduler-service deploy
```

## 공식 문서

- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Cloudflare Service Binding RPC](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/rpc/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
