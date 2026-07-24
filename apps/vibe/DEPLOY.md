# DeepType (딥타입) — 배포·운영 런북

`apps/vibe`의 딥타입 유료 리포트 백엔드를 **Cloudflare Workers(정적 에셋 + Hono API 한 워커)** 로 올리는 절차와, 돈이 걸린 경로를 스테이징에서 검증한 뒤 라이브로 전환하는 체크리스트다. 배포 인프라 선언은 `sobok-ops`(Terraform/HCP)에 있다.

---

## 1. 구조 한눈에

- **워커 1개** = 정적 Next 에셋(`assets` 바인딩, `output: 'export'`) + `/api/deep-type/*` Hono 라우트(`run_worker_first`).
- **Hyperdrive 2개**: `HYPERDRIVE_FRESH`(캐시 비활성 — 돈·엔티틀먼트 조회/쓰기), `HYPERDRIVE_CACHED`(완료된 리포트 본문 등 불변 읽기). **Supabase Postgres(세션 풀러, 서울 ap-northeast-2)** origin. 공개 CA라 CA 업로드 불필요(`sslmode=require`).
- **Secrets Store**(계정당 1개): PortOne API/웹훅 시크릿, Anthropic 키, Resend 키, Turnstile 시크릿, Discord 웹훅. `await env.<binding>.get()`으로 읽음.
- **Cron 2개**: `*/15 * * * *` 결제 pending 재조정(`reconcileStalePending`), `0 3 * * *` 리텐션 purge(`runRetentionPurge`).
- **DB**: drizzle-kit `push`(버전 마이그레이션 없음). 테이블 5개(`deeptype_result/purchase/report/reopen_access/webhook_event`).
- **측정 계약**: `3.0.0`. 문항별 의미가 구체적인 4개 선택지로 구성된 무료 50문항을 Worker가 재채점해 겉 16유형·속 16유형·보석 16분류를 만들고, 결제 후에는 모든 사용자에게 동일한 24개 심화 문항으로 속·보석을 재산출한다. 클라이언트가 보낸 유형 코드는 신뢰하지 않는다.

라우트:

| 메서드 | 경로                             | 용도                                 |
| ------ | -------------------------------- | ------------------------------------ |
| GET    | `/api/deep-type/config`          | 공개 설정(스토어/채널/SKU)           |
| POST   | `/api/deep-type/session`         | 무료 50응답 검증·채점·저장           |
| POST   | `/api/deep-type/checkout`        | 결제 준비(**Turnstile 검증**)        |
| POST   | `/api/deep-type/verify`          | 결제 검증(서버측 금액 대조)          |
| POST   | `/api/deep-type/webhook`         | PortOne 웹훅(Standard Webhooks HMAC) |
| POST   | `/api/deep-type/report/generate` | 리포트 생성 킥                       |
| GET    | `/api/deep-type/report`          | 리포트 폴링                          |
| POST   | `/api/deep-type/refinement`      | 유료 24응답 검증·재채점              |
| POST   | `/api/deep-type/cancel`          | 청약철회 환불(미열람 한정)           |
| POST   | `/api/deep-type/reopen/request`  | 이메일 재열람 링크 요청              |
| POST   | `/api/deep-type/reopen/exchange` | 일회용 링크를 리포트 권한으로 교환   |

---

## 2. Phase 0 — 프로비저닝(라이브 전 1회)

배포 인프라는 HCP Terraform(org `sobok`)의 **워크스페이스별 root**로 선언한다. 딥타입 관련 워크스페이스는 둘:

- `supabase` project / **`sobok-prod`**(`sobok-ops/infra/supabase/prod`) — 결제 DB.
- `cloudflare` project / **`account-vibe`**(`sobok-ops/infra/cloudflare/account/sobok/vibe`) — Hyperdrive 2개 + Secrets Store + 커스텀 도메인. (프론트 3앱 stella/zwds/horn은 `account-workers`로 분리돼 있음.)

배포에 앞서 아래가 존재해야 하고, 각 산출물 id/시크릿을 3에서 config에 채운다.

1. **Supabase 프로젝트(딥타입 전용)** — 대시보드에서 **서울(ap-northeast-2) + DB 비밀번호** 생성(billing·region·password는 out-of-band; 실결제 전 Pro 권장). `sobok-prod` 워크스페이스에 `import` 블록으로 입양(`import { to=supabase_project.deeptype, id=<project-ref> }`) + HCP 변수 `organization_id`·`pooler_host`(대시보드 Connect의 `aws-N-ap-northeast-2.pooler.supabase.com`)·`database_password`(sensitive)·`SUPABASE_ACCESS_TOKEN`(project variable set). apply 후 `plan`에 replace 없어야 함 → outputs `deeptype_pg_host/port/database/user/password`.
   **런타임 역할·권한도 이 워크스페이스가 소유한다**(`roles.tf`, `cyrilgdn/postgresql` provider): 최소권한 `deeptype_app`(+ stella용 `stella_app`) 역할·grant·default privileges를 세션 풀러로 접속해 생성하고 비밀번호를 `random_password`로 만들어 sensitive output으로 노출한다. ⚠️ 이 provider 때문에 **이 워크스페이스의 모든 plan/apply가 DB 접속을 요구**한다 — Free 플랜 일시정지 시 실패하므로 ops 실행 전 **Pro 유지(또는 사전 언포즈)** 필요.
2. **Hyperdrive ×2 (`account-vibe`)** — `terraform apply` → 두 config id. **origin(host/port/db/user/password) 전부 `sobok-prod`에서 `terraform_remote_state`로 링크**(수동 복사·손-설정 비밀번호 없음, 별도 토큰 불필요 — 런 자체 크레덴셜). user는 최소권한 `deeptype_app.<ref>`(owner `postgres` 아님). 전제: ① `sobok-prod` 먼저 apply(outputs 존재) ② sobok-prod → account-vibe **Remote State Sharing** 활성화 ③ 데이터소스의 `organization`+워크스페이스 `name`이 실제 HCP와 정확히 일치(**org=`sobok2026`, ws=`sobok-prod`** — VCS-무시되는 cloud{} 블록의 "sobok"과 다름).
3. **Secrets Store** — 계정 스토어 id 확보(`wrangler secrets-store store list` 또는 대시보드). `account-vibe`의 `secrets.tf`가 시크릿 6개를 push:
   `deeptype-portone-api-secret` · `deeptype-portone-webhook-secret` · `deeptype-anthropic-api-key` · `deeptype-resend-api-key` · `sobok-turnstile-secret` · `deeptype-discord-webhook`.
   값은 HCP Terraform 민감 변수(`account-vibe`)로 설정.
4. **PortOne(딥타입 전용 스토어)** — 스토어 생성 → **store id + Toss Payments V2 channel key**(공개 vars), **API secret + 웹훅 secret**(Secrets Store). 콘솔에서 **웹훅 URL 등록**: `https://<worker-domain>/api/deep-type/webhook`. EN·JA·ZH 이용자에게 해외 발급 카드를 받으려면 Toss Payments에 **해외카드(KRW) 추가 계약·기능 활성화**를 완료해야 한다. 앱은 비한국어 결제에 PortOne의 `bypass.tosspayments.useInternationalCardOnly = true`를 사용한다. 계약 없이 코드만 켜서는 승인되지 않는다.
5. **Turnstile** — 공유 "sobok" 위젯의 **sitekey**(프론트 빌드 env) + **secret**(Secrets Store, `sobok-turnstile-secret`).
6. **Anthropic** — 리포트 생성용 API 키 → Secrets Store. 기본 모델은 재현 가능한 고정 스냅샷 `claude-haiku-4-5-20251001`이며, 교체는 품질 회귀 확인 후 `DEEPTYPE_REPORT_MODEL`로 명시한다.
7. **Resend** — `sending_access` 전용 API 키를 `deeptype-resend-api-key`로 저장하고 `vibe.sobok.cc` 발신 도메인을 검증한다. Resend가 발급한 SPF/DKIM/MX 레코드는 Cloudflare DNS의 desired state에 옮긴 뒤 검증하며, 인증 링크가 중계 서비스에 노출되지 않도록 이 트랜잭션 발신 도메인의 **클릭 추적과 오픈 추적을 끈다**. 발신자는 `vibe <reports@vibe.sobok.cc>`, 회신 주소는 실제 모니터링하는 `sobok2026@gmail.com`이다. 발송은 같은 idempotency key로 일시 오류를 최대 3회 재시도한다.
8. **Google Privacy & Messaging** — AdSense에서 유럽 규정 메시지와 미국 주 규정 메시지를 게시하고, 메시지 설정의 Consent Mode 광고·분석 통합을 모두 켠다. 앱은 선택 전 `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`을 `denied`로 초기화한다.
9. **Discord**(선택) — 알림 웹훅 URL → Secrets Store(`account-vibe` HCP 변수 `deeptype_discord_webhook`). 빈 값이면 알림 no-op. Discord에는 구매·결제 식별자를 보내지 않고 이벤트 종류만 보낸다.

> **drizzle-kit push**는 Hyperdrive를 우회해 Supabase에 **owner로 직접** 붙는다: `DEEPTYPE_POSTGRES_URL_DIRECT`를 Supabase **세션 풀러**(5432, `postgres.<ref>`) 또는 IPv6 가능 머신에서 direct 연결로 설정한다. 런타임 Worker는 이와 별개로 최소권한 `deeptype_app`로 접속한다. **순서 불변식**: `sobok-prod` apply(스키마·역할·grant·default privileges 생성)가 **첫 `db:push`보다 먼저** — 그래야 push가 만드는 테이블이 default privileges를 상속한다.

---

## 3. Config 채우기(placeholder 치환)

- `apps/vibe/wrangler.jsonc`
  - `hyperdrive[].id` = `REPLACE_WITH_*_ID` → 2의 fresh/cached id
  - `secrets_store_secrets[].store_id` = 계정 Secrets Store id(6곳)
  - `vars.DEEPTYPE_PORTONE_STORE_ID` / `DEEPTYPE_PORTONE_CHANNEL_KEY` → 4의 값
  - `vars.DEEPTYPE_LLM_ENABLED` = **라이브는 `"1"`**(0이면 정적 폴백만 생성)
  - `vars.DEEPTYPE_REPORT_MODEL` = `claude-haiku-4-5-20251001`처럼 별칭이 아닌 검증된 고정 model id
  - `vars.DEEPTYPE_PUBLIC_ORIGIN` / `DEEPTYPE_EMAIL_FROM` / `DEEPTYPE_EMAIL_REPLY_TO`가 실제 프로덕션 값인지 확인
- **프론트 sitekey**: `apps/vibe/src/constants.ts`의 `TURNSTILE_SITE_KEY`(공개 상수, AdSense/GTM id와 동일 컨벤션) → 빌드 시 인라인. 이 sitekey와 서버 `sobok-turnstile-secret`은 **같은 위젯 짝**이어야 함(위젯 호스트네임은 `sobok.cc`가 서브도메인 커버).

---

## 4. 스키마 push & 배포

```bash
cd apps/vibe
# DEEPTYPE_POSTGRES_URL_DIRECT(Supabase 세션 풀러, direct owner)를 drizzle-kit에 주입(로컬 1회)
bun run db:push        # drizzle-kit push (5 테이블 + 5 enum)
bun run type           # next typegen && tsc(프론트) && tsc(worker) — 0 이어야 함
# deploy = `next build && wrangler deploy` — 정적 out/을 먼저 재빌드한다.
# Turnstile sitekey는 src/constants.ts의 TURNSTILE_SITE_KEY(공개 상수)에서 빌드 시 인라인된다(값 바꾸려면
# 그 파일 수정). 프론트 sitekey와 서버 sobok-turnstile-secret은 반드시 같은 위젯 짝이어야 한다.
bun run deploy
```

---

## 5. 스테이징 E2E 테스트 플랜(돈이 걸린 경로 우선)

> 스테이징 워커 + PortOne 테스트 채널 + Turnstile 테스트 키 + Supabase 스테이징 프로젝트로 수행. 각 단계는 DB 행 상태와 Discord 알림을 함께 확인한다.

**A. 정상 결제 → 리포트 → 열람**

1. 무료 테스트 완주 → 정확히 50개 원응답으로 `POST /session` 201, Worker 산출 코드·프로필과 `deeptype_result` 1행 확인.
2. 페이월에서 Turnstile 통과 → `POST /checkout` 200(토큰 없으면 거부되는지 음성 케이스도 확인).
3. PortOne 테스트 결제 완료 → `/deep-type/checkout-return` 복귀 → `POST /verify` 200, `deeptype_purchase.status = paid`, **금액이 서버 기대값과 일치**.
4. 웹훅 수신 → `deeptype_webhook_event` 기록, 서명 검증 통과.
5. 모든 사용자에게 같은 24문항을 표시하고 `POST /refinement` 200 → 서버 재산출 프로필 저장, 경계 축에서는 무료 코드가 바뀔 수 있음을 확인.
6. 심화 응답 전 `report/generate`는 `409 refinement-required`, 응답 후에는 폴링(`GET /report`)이 `done`으로 수렴하는지 확인.
7. `GET /report`가 최종 프로필과 12개 섹션을 함께 반환하고, 최초 열람 시 `viewed_at`이 스탬프되는지 확인.

**B. 금액 불일치(공격/오설정)**

- 웹훅 금액 ≠ 기대값 → 결제 승인 안 됨 + **Discord 알림** 발생 확인.

**C. 웹훅 재전송/중복**

- 동일 이벤트 2회 → CAS 멱등(중복 지급/중복 상태전이 없음), `deeptype_webhook_event` 유니크.

**D. 청약철회 환불(핵심)**

- **미열람** 결제에 `POST /cancel` → `refunded`, PortOne 취소 반영, 상태 `refunded`.
- **열람 후**(`viewed_at != null`) `POST /cancel` → `viewed`로 거부(환불 불가).
- 미결제/없는 토큰 → `not-paid` / `not-found`.

**E. 리포트 생성 실패 폴백**

- Anthropic 실패 유도(키 무효 등) → 생성 호출이 서버의 최대 5회 한도 안에서 자동 재시도되고, 최종 실패하면 서버 산출 정밀 프로필은 유지한 채 **전액 환불 CTA(FailedReport)** 노출 + Discord 알림.

**F. 크론**

- pending 결제 방치 → `*/15` 재조정이 상태를 정리.
- 미전환 결과 30일·웹훅 90일 경과분 → `0 3` purge가 삭제(결제된 결과는 보존).

**G. Turnstile 위젯(라이브 위젯 최초 실검증)**

- 페이월에서 실제 위젯 렌더 + 토큰 발급 확인(로컬/샌드박스는 외부 CDN 의존으로 스킵, 스테이징에서 확인).

**H. 이메일 재열람**

1. 구매 이메일 입력 시 존재 여부와 무관하게 동일한 `202 accepted` 응답인지 확인한다.
2. 유효 구매에는 Resend 메일이 도착하고, 원본 토큰이 Worker 접근 로그·리퍼러에 남지 않는지 확인한다(URL fragment 사용).
3. 링크 진입 뒤 사용자가 `감정서 열기`를 눌렀을 때만 교환되며, 같은 링크의 두 번째 사용과 15분 경과 링크가 `410`인지 확인한다.
4. 결제일 1년 전후 경계에서 재열람 허용·거부와 화면의 만료일이 일치하는지 확인한다.
5. 결제 후 24문항을 마치기 전에 이탈한 구매자는 링크로 돌아오면 심화 문항부터 재개하고, 이미 끝낸 구매자는 즉시 감정서를 여는지 확인한다.

**I. 연령·동의·CMP**

1. 새 브라우저에서 무료 검사·재열람·결제 복귀 화면에 연령 게이트가 없고, 결제 화면에서만 만 14세 이상 확인이 필수인지 확인한다.
2. Google Privacy & Messaging 메시지를 `?fc=alwaysshow&fctype=gdpr`로 강제 표시해 언어·철회 UI를 확인한다.
3. 선택 전 Consent Mode v2 네 신호가 `denied`, 선택 후 CMP 선택대로 갱신되는지 Tag Assistant에서 확인한다. `/deep-type/reopen`과 `/deep-type/checkout-return`에는 GTM·AdSense 요청이 없어야 한다.
4. 미국 주 규정 메시지도 AdSense 메시지 진단 도구와 대상 지역 테스트로 확인한다.

**J. 해외카드·모바일 복귀**

1. Toss Payments 해외카드(KRW) 계약이 활성화된 테스트/실 MID에서 EN·JA·ZH 결제가 해외카드 전용 창으로 열리는지 확인한다.
2. Visa·Mastercard·JCB 승인/거절 케이스와 실제 해외 발급 카드 소액 결제 1건을 확인한다. 통화는 KRW이고 발급사 환율·해외 이용 수수료가 적용될 수 있다.
3. iOS Safari·Android Chrome에서 결제 후 `/deep-type/checkout-return`으로 돌아와 쿼리를 즉시 지우고, 서버 검증 후 24문항으로 이어지는지 확인한다.
4. 결제 복귀 탭의 세션 저장소가 없거나 만료된 경우 구매 이메일 재열람 경로로 복구할 수 있는지 확인한다.

---

## 6. 라이브 전환 체크리스트

- [ ] Phase 0 산출물 전부 존재(Supabase·Hyperdrive×2·Secrets Store 6개·PortOne 스토어·Turnstile·Anthropic·Resend).
- [ ] `wrangler.jsonc` placeholder 전부 치환, `DEEPTYPE_LLM_ENABLED = "1"`, `DEEPTYPE_REPORT_MODEL`은 검증된 고정 id.
- [ ] `src/constants.ts`의 `TURNSTILE_SITE_KEY` = 실 위젯 sitekey, 서버 `sobok-turnstile-secret` = 그 위젯의 secret(짝 일치).
- [ ] PortOne 콘솔 웹훅 URL = 프로덕션 워커 도메인, Toss Payments 해외카드(KRW) 추가 계약·기능 활성.
- [ ] Resend 발신 도메인 검증, SPF/DKIM/MX 정상, 인증 메일 클릭·오픈 추적 비활성.
- [ ] Google 유럽/미국 메시지 게시 및 Consent Mode 광고·분석 통합 활성.
- [ ] `bun run type` = 0, `db:push` 완료(프로덕션 Supabase).
- [ ] 스테이징 E2E A–J 통과(특히 B/C/D/H/J — 돈·멱등·환불·재열람·해외/모바일 결제).
- [ ] Discord 알림 채널 수신 확인.
- [ ] `wrangler deploy` 후 스모크: `/config` 200, 무료 세션 200, 소액 실결제 1건 → 환불로 정리.
- [ ] Cron 트리거 2개 활성(`*/15`, `0 3`).

---

## 7. 관측·운영

- **알림**: 웹훅 금액 불일치, 리포트 생성 실패 시 Discord로 이벤트 종류만 통지(식별자는 제한된 Worker 로그에서 확인, 웹훅 URL 빈 값이면 조용히 비활성).
- **재조정**: `*/15` cron이 `verify`를 놓친 pending을 PortOne 재조회로 마감.
- **리텐션**: `0 3` cron이 미전환 결과와 pending/failed 구매 30일, 완료 리포트의 원본·심화 응답 3개월, 원본 웹훅 90일을 기준으로 정리한다. 결제 1년 뒤 이메일·접근 토큰·파생 결과·리포트를 삭제하고 최소 거래 기록만 5년까지 보관한 뒤 삭제한다. 일회용 재열람 토큰은 만료 즉시 다음 purge에서 삭제한다.
- **재열람 보안**: 메일 링크는 15분·1회용 SHA-256 해시로 저장한다. 원본 토큰은 URL fragment에 두고, 화면에서 명시적으로 열기를 누르기 전에는 교환하지 않는다.
- **결제 복귀 보안**: PortOne의 결제 id만 복귀 쿼리로 받고 즉시 URL에서 제거한다. 리포트 access token은 URL에 넣지 않고 탭 한정 `sessionStorage`에 최대 1시간 보관하며, 복귀 페이지에서는 GTM·AdSense를 로드하지 않는다.
- **환불 불변식**: `viewed_at != null`이면 환불 거부(청약철회 = 콘텐츠 미열람 한정).
- **캐시 주의**: 돈·엔티틀먼트는 반드시 `HYPERDRIVE_FRESH`(캐시 비활성)로만 조회/쓰기. 완료 리포트 본문 등 불변 데이터만 `HYPERDRIVE_CACHED` 사용.
