# Sobok Scheduler

`apps/scheduler`는 계정 전체 Cloudflare Worker Cron Trigger를 소유하는 비공개 Worker다. DB·secret을 갖지
않고 production/staging Database Worker의 이름 있는 maintenance entrypoint만 호출한다.

```text
Cloudflare Cron Trigger → scheduler ─┬→ database / VibeMaintenance
                                     ├→ database-stg / VibeMaintenance
                                     ├→ database / StellaMaintenance
                                     └→ database-stg / StellaMaintenance
```

| cron           | 작업                | 대상                            |
| -------------- | ------------------- | ------------------------------- |
| `*/15 * * * *` | pending 결제 재조정 | Vibe/Stella, production/staging |
| `0 3 * * *`    | 보존 기간 정리      | Vibe/Stella, production/staging |

같은 주기의 대상은 병렬 실행한다. 일부가 실패해도 나머지는 완료하고, 하나라도 실패하면 scheduled invocation을
실패로 기록한다. 로그에는 작업 이름과 오류 종류만 남긴다.

새 앱이 같은 주기를 사용하면 새 trigger를 만들지 않는다. `packages/scheduler`에 최소 RPC 계약을 추가하고
Database Worker가 이를 구현한 뒤 scheduler 작업 목록과 Service Binding을 추가한다. 배포 순서는 Database
Worker → 공개 앱 → scheduler다. Scheduler workflow는 성공한 production 배포의 동일 SHA를 checkout해
실행하므로 최초 전환에서도 존재하지 않는 Database Worker를 먼저 참조하지 않는다. 긴급 재배포는 main에서
수동 실행한다.

```sh
bun --filter=@sobok/scheduler-service type
bun --filter=@sobok/scheduler-service deploy
```

- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Cloudflare Service Binding RPC](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/rpc/)
