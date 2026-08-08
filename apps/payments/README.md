# Sobok Payments

`apps/payments`는 Sobok의 PortOne 연동을 한곳에서 소유하는 Cloudflare Worker다. 결제 상품이나
구매 권한을 소유하는 중앙 원장은 아니며, 앱별 주문 원장 앞에 놓이는 **무상태 결제 게이트웨이**다.

## 경계

```text
브라우저 → 제품 앱/API → payments → PortOne
                         ↑
PortOne webhook → payments ─┬→ Stella Queue → Stella 주문 원장
                            ├→ Vibe Queue   → Vibe 주문 원장
                            └→ core Queue   → 인증된 callback → apps/api 구독 원장
```

- 대표 PortOne Store 하나를 사용한다. `stella.sobok.cc`, `vibe.sobok.cc`, `sobok.cc`처럼 도메인이
  다르다는 이유로 Store나 하위 상점을 나누지 않는다.
- Store를 추가하는 기준은 별도 사업자, 정산 계좌, 운영 권한, 계약·채널 또는 회계 경계가 실제로
  분리되는 경우다. 현재처럼 같은 Sobok 서비스군이면 제품별 주문 ID와 내부 라우팅으로 구분한다.
- 공용 Sobok 지갑은 만들지 않는다. 결제수단 보관, 주문, 구독, 환불 상태, 카드·리포트 권한은 해당
  제품이 계속 소유한다.
- PortOne V2 API Secret, Standard Webhooks Secret, Store ID, channel key map,
  `@portone/server-sdk`는 이 앱만 소유한다. 제품 앱은 PortOne 서버 API를 직접 호출하지 않는다.
- 브라우저용 Store ID와 channel key는 공개 식별자지만, 제품이 임의의 채널을 요청하게 두지 않는다.
  중앙 서비스의 제품별 allowlist가 최종 권한이다.

공통 wire contract와 결제 ID 규칙은 `packages/payments`가 소유한다.

| 소유 앱                                        | payment ID 접두사 | 호출 경로                                   | 이벤트 경로                    |
| ---------------------------------------------- | ----------------- | ------------------------------------------- | ------------------------------ |
| core (`apps/api`, `apps/billing-worker`, auth) | `sb_`             | 인증된 HTTPS `/v1/core/*`                   | core Queue → 인증된 callback   |
| Stella                                         | `st_`             | Cloudflare Service Binding `StellaPayments` | `stella-payment-events*` Queue |
| Vibe                                           | `dt_`             | Cloudflare Service Binding `VibePayments`   | `vibe-payment-events*` Queue   |

접두사는 보안 경계를 대신하지 않는다. RPC entrypoint와 HTTP 경로도 각각 자기 접두사만 허용한다.

## 웹훅

PortOne 콘솔의 결제알림 V2 설정은 대표 Store의 모드마다 하나만 둔다.

| 설정 모드 | URL                                              |
| --------- | ------------------------------------------------ |
| 실연동    | `https://payments.sobok.cc/webhooks/portone`     |
| 테스트    | `https://payments-stg.sobok.cc/webhooks/portone` |

- Content-Type은 `application/json`, 웹훅 버전은 `2024-04-25`다.
- 중앙 Worker가 raw body 서명을 먼저 검증하고 결제 단건을 다시 조회한다. 서명된 이벤트 본문만으로
  지급하지 않는다.
- Stella와 Vibe 이벤트는 앱별 Queue로 전달한다. Queue는 at-least-once 전달이므로 제품 consumer의
  기존 unique event ID와 상태 전이 CAS가 멱등성을 책임진다. 재시도 소진 이벤트는 앱별 DLQ로 간다.
- core 구독 이벤트도 전용 Queue에 넣은 뒤 서비스 토큰으로 `apps/api` 내부 endpoint에 전달한다.
  non-2xx와 네트워크 실패는 Queue가 재시도하고 소진된 이벤트는 core DLQ로 보낸다.
- 알 수 없는 접두사와 관심 없는 이벤트는 2xx로 종료한다. 다른 앱 주문으로 추측 라우팅하지 않는다.
- 모든 consumer는 실패를 60초 간격으로 최대 10회 재시도한다. Queue backlog와 DLQ를 운영 알림에
  연결하고, 원인을 고친 뒤 원래 event ID를 유지해 재처리한다.

Workers Free의 현재 한도는 계정당 Queue 10,000개, 표준 작업 10,000회/일, 보존 24시간이다. 정상
메시지는 보통 write/read/delete 3회를 사용하므로 성공 이벤트 약 3,333건/일에 도달하기 전에 Paid
전환과 보존 기간을 다시 결정한다. 실제 한도는 배포 전 Cloudflare 공식 문서를 다시 확인한다.

## 설정 소유권

공개 설정은 `apps/payments/wrangler.jsonc`가 소유한다.

- `PORTONE_STORE_ID`
- 환경별 `PORTONE_CHANNELS`: 각 항목은 `channelKey`, PortOne 설정 `mode`(`live`/`test`), 사용할 수
  있는 제품 `scopes`를 함께 가진다. RPC entrypoint는 자기 scope가 없는 채널을 반환하지 않는다.
- `CORE_PAYMENT_EVENTS_URL`

현재 production 카탈로그는 제품 도메인에서 카드사 심사를 받을 수 있도록 Stella·Vibe scope에
실연동 토스페이(`tosspay_v2`)와 테스트 토스페이먼츠 카드(`tosspayments`)를 함께 둔다. core에는
둘 다 노출하지 않는다. 심사 승인이 끝나면 `tosspayments` 항목의 channel key를 실연동 키로 바꾸고
`mode`를 `live`로 바꾸는 것이 전환의 전부다. 제품 UI나 checkout 분기는 다시 바꾸지 않는다.

PortOne의 테스트 모드 웹훅은 production 화면에서 시작한 거래라도 `payments-stg` URL로 들어온다.
따라서 production의 테스트 카드 심사 거래는 브라우저 confirm과 production scheduler 재조정을 완료
경로로 사용하며, production Queue 웹훅 전달 검증 수단으로 사용하지 않는다. 웹훅까지 포함한 테스트
결제 수직 확인은 staging에서 수행한다.

비밀 값은 `sobok-ops/infra/cloudflare/account/sobok/payments`가 계정 Secrets Store에 만든다.

- `payments-portone-api-secret-production`, `payments-portone-api-secret-staging`: 같은 대표 Store에서
  배포별로 따로 발급한 V2 API Secret. 독립 폐기·교체를 위한 구분이며 test/live 권한 경계는 아니다.
- `payments-core-client-token`: core API·billing-worker·auth가 payments를 호출하는 32자 이상 credential
- `payments-core-events-token`: payments가 core API에 이벤트를 보내는 별도 32자 이상 credential
- `portone-webhook-secret-live`, `portone-webhook-secret-test`: 대표 Store 설정 모드별 Secret이며
  `account-secrets-store`가 소유한다.

PG 채널 설정 화면의 MID, API key, secret key, client key를 레포나 Secrets Store로 복제하지 않는다.

## 배포

최초 배포는 의존 순서를 지킨다.

1. `account-secrets-store`를 먼저 적용한다.
2. `account-payments`에서 Secrets Store 항목과 Queue/DLQ를 먼저 만든다.
3. `payments-stg`, `payments` Worker를 배포한다.
4. `account-payments` 전체를 적용해 custom domain을 연결한다.
5. core API·billing-worker의 URL과 방향별 토큰을 배포한다.
6. Stella와 Vibe를 배포해 Service Binding과 Queue consumer를 연결한다.
7. PortOne 콘솔의 test/live 웹훅 URL을 위 중앙 URL로 바꾸고 호출 테스트를 수행한다.

staging 일반 배포는 `staging` 브랜치 push가 시작하는 `.github/workflows/staging-deploy.yml`이
`payments-stg`를 Stella·Vibe보다 먼저 올린다. production은 schema 반영 후 수동 실행하는
`.github/workflows/production-deploy.yml`이 Payments를 제품 앱보다 먼저 배포한다. RPC provider와
제품 consumer는 같은 수동 릴리스에서 함께 변경한다. 중앙 서비스 장애 시 앱이 결제를 성공으로
추정하지 않으며, checkout·confirm·renew는 재시도 가능한 실패로 닫힌다.

로컬 실행은 실제 secret을 커밋하지 않고 `apps/payments/.dev.vars`에만 둔다.

```sh
bun --filter=@sobok/payments-service dev
```

## 앱 추가 체크리스트

1. `packages/payments`에 충돌하지 않는 고정 payment ID 접두사를 추가한다.
2. 중앙 Worker에 그 접두사만 허용하는 이름 있는 RPC entrypoint를 추가한다.
3. 제품 전용 Queue와 DLQ를 만들고, 제품 Worker에 consumer를 하나만 연결한다.
4. 제품 DB에 event ID unique와 상태 전이 CAS를 둔다. 중앙 결제 원장을 새로 만들지 않는다.
5. 제품별 판매 가능 channel allowlist를 중앙 Worker에 명시한다.
6. checkout·confirm·reconcile은 중앙 계약만 호출하고 PortOne Secret이나 서버 SDK를 제품에 넣지 않는다.

## 공식 문서

- [PortOne 관리자 콘솔 계정·하위 상점](https://developers.portone.io/opi/ko/console/guide/account)
- [PortOne Store·채널·API Secret](https://developers.portone.io/opi/ko/console/guide/channel-manage?v=v2)
- [PortOne V2 웹훅](https://developers.portone.io/opi/ko/integration/webhook/readme-v2?v=v2)
- [Cloudflare Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [Cloudflare Queues 전달 보장](https://developers.cloudflare.com/queues/reference/delivery-guarantees/)
- [Cloudflare Queues 한도](https://developers.cloudflare.com/queues/platform/limits/)
- [Cloudflare Queues 가격](https://developers.cloudflare.com/queues/platform/pricing/)
