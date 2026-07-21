# DeepType (딥타입) — 배포·운영 런북

`apps/vibe`의 딥타입 유료 리포트 백엔드를 **Cloudflare Workers(정적 에셋 + Hono API 한 워커)** 로 올리는 절차와, 돈이 걸린 경로를 스테이징에서 검증한 뒤 라이브로 전환하는 체크리스트다. 배포 인프라 선언은 `sobok-ops`(Terraform/HCP)에 있다.

---

## 1. 구조 한눈에

- **워커 1개** = 정적 Next 에셋(`assets` 바인딩, `output: 'export'`) + `/api/deep-type/*` Hono 라우트(`run_worker_first`).
- **Hyperdrive 2개**: `HYPERDRIVE_FRESH`(캐시 비활성 — 돈·엔티틀먼트 조회/쓰기), `HYPERDRIVE_CACHED`(완료된 리포트 본문 등 불변 읽기). Aiven Postgres origin.
- **Secrets Store**(계정당 1개): PortOne API/웹훅 시크릿, Anthropic 키, Turnstile 시크릿, Discord 웹훅. `await env.<binding>.get()`으로 읽음.
- **Cron 2개**: `*/15 * * * *` 결제 pending 재조정(`reconcileStalePending`), `0 3 * * *` 리텐션 purge(`runRetentionPurge` — 미전환 결과 30일·웹훅 90일).
- **DB**: drizzle-kit `push`(버전 마이그레이션 없음). 테이블 4개(`deeptype_result/purchase/report/webhook_event`).

라우트:

| 메서드 | 경로                             | 용도                                 |
| ------ | -------------------------------- | ------------------------------------ |
| GET    | `/api/deep-type/config`          | 공개 설정(스토어/채널/SKU)           |
| POST   | `/api/deep-type/session`         | 무료 결과 저장                       |
| POST   | `/api/deep-type/checkout`        | 결제 준비(**Turnstile 검증**)        |
| POST   | `/api/deep-type/verify`          | 결제 검증(서버측 금액 대조)          |
| POST   | `/api/deep-type/webhook`         | PortOne 웹훅(Standard Webhooks HMAC) |
| POST   | `/api/deep-type/report/generate` | 리포트 생성 킥                       |
| GET    | `/api/deep-type/report`          | 리포트 폴링                          |
| POST   | `/api/deep-type/precision`       | 정밀 문항 응답 저장                  |
| POST   | `/api/deep-type/cancel`          | 청약철회 환불(미열람 한정)           |

---

## 2. Phase 0 — 프로비저닝(라이브 전 1회)

배포에 앞서 아래가 존재해야 하고, 각 산출물 id/시크릿을 3에서 config에 채운다.

1. **Aiven Postgres** — `sobok-ops/infra/aiven/environment/prod`(`deeptype_pg` 모듈) apply → `deeptype_pg_host/port/database/admin_username/admin_password` 출력.
2. **Hyperdrive ×2** — `sobok-ops/infra/cloudflare/account/sobok/workers/vibe/hyperdrive.tf` apply → 두 config id. origin은 1의 Aiven 접속정보를 HCP 민감 변수로 주입.
3. **Secrets Store** — 계정 스토어 id 확보(`wrangler secrets-store store list` 또는 대시보드). TF(`.../workers/vibe/secrets.tf`)가 시크릿 5개를 push:
   `deeptype-portone-api-secret` · `deeptype-portone-webhook-secret` · `deeptype-anthropic-api-key` · `sobok-turnstile-secret` · `deeptype-discord-webhook`.
   값은 HCP Terraform 민감 변수로 설정.
4. **PortOne(딥타입 전용 스토어)** — 스토어 생성 → **store id + channel key**(공개 vars), **API secret + 웹훅 secret**(Secrets Store). 콘솔에서 **웹훅 URL 등록**: `https://<worker-domain>/api/deep-type/webhook`.
5. **Turnstile** — 공유 "sobok" 위젯의 **sitekey**(프론트 빌드 env) + **secret**(Secrets Store, `sobok-turnstile-secret`).
6. **Anthropic** — 리포트 생성용 API 키 → Secrets Store.
7. **Discord**(선택) — 알림 웹훅 URL → Secrets Store. 빈 값이면 알림 no-op.

---

## 3. Config 채우기(placeholder 치환)

- `apps/vibe/wrangler.jsonc`
  - `hyperdrive[].id` = `REPLACE_WITH_*_ID` → 2의 fresh/cached id
  - `secrets_store_secrets[].store_id` = `REPLACE_WITH_SECRETS_STORE_ID`(5곳) → 3의 스토어 id
  - `vars.DEEPTYPE_PORTONE_STORE_ID` / `DEEPTYPE_PORTONE_CHANNEL_KEY` → 4의 값
  - `vars.DEEPTYPE_LLM_ENABLED` = `"0"` → **라이브는 `"1"`**(0이면 정적 폴백만 생성)
- **프론트 빌드 env**: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = 5의 sitekey(미설정 시 Turnstile 테스트 키로 폴백).

---

## 4. 스키마 push & 배포

```bash
cd apps/vibe
# Aiven 접속문자열을 drizzle-kit이 쓰도록 환경변수 주입(로컬 1회)
bun run db:push        # drizzle-kit push
bun run type           # next typegen && tsc(프론트) && tsc(worker) — 0 이어야 함
bun run deploy         # wrangler deploy
```

---

## 5. 스테이징 E2E 테스트 플랜(돈이 걸린 경로 우선)

> 스테이징 워커 + PortOne 테스트 채널 + Turnstile 테스트 키 + Aiven 스테이징 DB로 수행. 각 단계는 DB 행 상태와 Discord 알림을 함께 확인한다.

**A. 정상 결제 → 리포트 → 열람**

1. 무료 테스트 완주 → `POST /session` 200, `deeptype_result` 1행.
2. 페이월에서 Turnstile 통과 → `POST /checkout` 200(토큰 없으면 거부되는지 음성 케이스도 확인).
3. PortOne 테스트 결제 완료 → `POST /verify` 200, `deeptype_purchase.status = paid`, **금액이 서버 기대값과 일치**.
4. 웹훅 수신 → `deeptype_webhook_event` 기록, 서명 검증 통과.
5. `report/generate` → 폴링(`GET /report`)이 `done`으로 수렴, 본문 저장.
6. 최초 열람 시 `viewed_at` 스탬프.

**B. 금액 불일치(공격/오설정)**

- 웹훅 금액 ≠ 기대값 → 결제 승인 안 됨 + **Discord 알림** 발생 확인.

**C. 웹훅 재전송/중복**

- 동일 이벤트 2회 → CAS 멱등(중복 지급/중복 상태전이 없음), `deeptype_webhook_event` 유니크.

**D. 청약철회 환불(핵심)**

- **미열람** 결제에 `POST /cancel` → `refunded`, PortOne 취소 반영, 상태 `refunded`.
- **열람 후**(`viewed_at != null`) `POST /cancel` → `viewed`로 거부(환불 불가).
- 미결제/없는 토큰 → `not-paid` / `not-found`.

**E. 리포트 생성 실패 폴백**

- Anthropic 실패 유도(키 무효 등) → 프론트가 정적 리포트로 폴백 + **환불 CTA(FailedReport)** 노출 + Discord 알림.

**F. 크론**

- pending 결제 방치 → `*/15` 재조정이 상태를 정리.
- 미전환 결과 30일·웹훅 90일 경과분 → `0 3` purge가 삭제(결제된 결과는 보존).

**G. Turnstile 위젯(라이브 위젯 최초 실검증)**

- 페이월에서 실제 위젯 렌더 + 토큰 발급 확인(로컬/샌드박스는 외부 CDN 의존으로 스킵, 스테이징에서 확인).

---

## 6. 라이브 전환 체크리스트

- [ ] Phase 0 산출물 전부 존재(Aiven·Hyperdrive×2·Secrets Store 5개·PortOne 스토어·Turnstile·Anthropic).
- [ ] `wrangler.jsonc` placeholder 전부 치환, `DEEPTYPE_LLM_ENABLED = "1"`.
- [ ] 프론트 빌드에 실제 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 주입.
- [ ] PortOne 콘솔 웹훅 URL = 프로덕션 워커 도메인.
- [ ] `bun run type` = 0, `db:push` 완료(프로덕션 Aiven).
- [ ] 스테이징 E2E A–G 통과(특히 B/C/D — 돈·멱등·환불).
- [ ] Discord 알림 채널 수신 확인.
- [ ] `wrangler deploy` 후 스모크: `/config` 200, 무료 세션 200, 소액 실결제 1건 → 환불로 정리.
- [ ] Cron 트리거 2개 활성(`*/15`, `0 3`).

---

## 7. 관측·운영

- **알림**: 웹훅 금액 불일치, 리포트 생성 실패 시 Discord로 통지(웹훅 URL 빈 값이면 조용히 비활성).
- **재조정**: `*/15` cron이 `verify`를 놓친 pending을 PortOne 재조회로 마감.
- **리텐션(PIPA)**: `0 3` cron이 미전환 결과 30일·웹훅 이벤트 90일 초과분 삭제. 결제 연결된 결과는 보존.
- **환불 불변식**: `viewed_at != null`이면 환불 거부(청약철회 = 콘텐츠 미열람 한정).
- **캐시 주의**: 돈·엔티틀먼트는 반드시 `HYPERDRIVE_FRESH`(캐시 비활성)로만 조회/쓰기. 완료 리포트 본문 등 불변 데이터만 `HYPERDRIVE_CACHED` 사용.
