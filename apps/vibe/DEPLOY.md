# DeepType (딥타입) — 배포·운영 런북

`apps/vibe`의 딥타입 유료 리포트 백엔드를 **Cloudflare Workers(정적 에셋 + Hono API 한 워커)** 로 올리는 절차와, 돈이 걸린 경로를 스테이징에서 검증한 뒤 라이브로 전환하는 체크리스트다. 배포 인프라 선언은 `sobok-ops`(Terraform/HCP)에 있다.

---

## 1. 구조 한눈에

- **워커 1개** = 정적 Next 에셋(`assets` 바인딩, `output: 'export'`) + `/api/deep-type/*` Hono 라우트(`run_worker_first`).
- **Hyperdrive 2개**: `HYPERDRIVE_FRESH`(캐시 비활성 — 돈·엔티틀먼트 조회/쓰기), `HYPERDRIVE_CACHED`(완료된 리포트 본문 등 불변 읽기). **Supabase Postgres(세션 풀러, 서울 ap-northeast-2)** origin. 공개 CA라 CA 업로드 불필요(`sslmode=require`).
- **Secrets Store**(계정당 1개): PortOne API/웹훅 시크릿, Anthropic 키, Resend 키, Turnstile 시크릿, Discord 웹훅, GA4 Measurement Protocol 시크릿. `await env.<binding>.get()`으로 읽음.
- **Cron 2개**: `*/15 * * * *` 결제 pending 재조정(`reconcileStalePending`), `0 3 * * *` 리텐션 purge(`runRetentionPurge`).
- **결제수단 카탈로그**: V2는 채널 하나가 PG 하나라 결제수단 추가는 곧 채널 추가이고, 여러 채널을 한 창에서 고르게 해주는 UI가 없다(`loadPaymentUI`는 PayPal SPB 전용). 그래서 페이월이 먼저 고르게 하고 `requestPayment`에 채널 키와 `payMethod`를 함께 넘긴다. 무엇을 어느 로케일에 파는지는 워커와 페이월이 함께 쓰는 **`deep-type/pay-method.ts` 한 곳**에 있다 — 지금은 `ko`에 카카오페이·토스페이·카드·계좌이체·휴대폰, 비한국어에 카드(해외 발급 전용 창). 채널은 결제수단보다 적다: `kcp_v2` 하나가 계좌이체와 휴대폰을 함께 받는다. `/checkout`이 저장된 로케일로 다시 검증한 뒤 **승인한 채널 키 하나만** 내려준다 — 가격·채점·지급과 같은 서버 권위다.
- **결제수단 추가 절차**(채널은 계속 늘어난다): ① `pay-method.ts`의 `PAY_METHODS`·`PAY_METHOD_SPEC`에 한 줄 ② 로케일 목록에 추가 ③ 각 wrangler 환경의 `DEEPTYPE_PORTONE_CHANNELS`에 채널 키 한 줄 ④ `_content` 4개 로케일에 라벨 ⑤ 그 PG가 bypass를 요구할 때만 `use-checkout`의 `BYPASS` 표에 한 줄. 바인딩도 리졸버도 분기도 건드리지 않는다.
- **DB**: drizzle-kit `push`(버전 마이그레이션 없음). 테이블 5개(`deeptype_result/purchase/report/reopen_access/webhook_event`). 스키마 이름은 배포마다 다르다 — 프로덕션 `deeptype`, 스테이징 `deeptype_stg`. `pgSchema()`는 모듈 로드 시점에 실행돼 바인딩을 볼 수 없으므로 이름은 wrangler `define`으로 넣는 **빌드타임 상수**다(`worker/db/schema-name.ts`). 기본값은 없다 — 값이 비면 부팅에서 던진다.
- **분석 파이프라인**: GTM 컨테이너 `GTM-MH37D28N`(4개 사이트 공용) → GA4 `G-RHHX4JRYDS`. 컨테이너 로더는 **앱이 싣는다**(`@sobok/analytics/gtm-loader`, 4개 앱 공용). Cloudflare Google tag gateway는 zone에서 **프록시로만** 켜져 있고(`setUpTag` off) `/h8ou/*`를 서빙할 뿐 HTML에 아무것도 주입하지 않으므로, 이 컴포넌트를 빼면 측정이 통째로 사라진다. 브라우저는 `dataLayer`에 퍼널 이벤트만 push하고, 돈이 걸린 `purchase`는 **결제 승인 CAS를 이긴 Worker가 Measurement Protocol로 직접** 보낸다.
- **측정 계약**: `3.0.0`. 문항별 의미가 구체적인 4개 선택지로 구성된 무료 50문항을 Worker가 재채점해 겉 16유형·속 16유형·보석 16분류를 만들고, 결제 후에는 모든 사용자에게 동일한 24개 심화 문항으로 속·보석을 재산출한다. 클라이언트가 보낸 유형 코드는 신뢰하지 않는다.

라우트:

| 메서드 | 경로                             | 용도                                 |
| ------ | -------------------------------- | ------------------------------------ |
| GET    | `/api/deep-type/config`          | 배포 스모크(스토어/채널 vars 확인)   |
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
- `cloudflare` project / **`account-vibe`**(`sobok-ops/infra/cloudflare/account/sobok/vibe`) — Hyperdrive 2개 + Secrets Store + 커스텀 도메인 2개(`vibe` / `vibe-stg`). (프론트 3앱 stella/zwds/horn은 `account-workers`로 분리돼 있음.)

배포에 앞서 아래가 존재해야 하고, 각 산출물 id/시크릿을 3에서 config에 채운다.

0. **스테이징 스키마 권한** — `sobok-prod`의 `roles.tf`가 `deeptype`과 함께 **`deeptype_stg`** 스키마에도 최소권한 `deeptype_app` grant와 default privileges를 걸어야 한다. 스테이징은 같은 Supabase 프로젝트·같은 Hyperdrive·같은 역할을 쓰고 **스키마 이름만 다르므로**, 이 grant가 없으면 스테이징 워커는 첫 쿼리에서 permission denied로 죽는다.
1. **Supabase 프로젝트(딥타입 전용)** — 대시보드에서 **서울(ap-northeast-2) + DB 비밀번호** 생성(billing·region·password는 out-of-band; 실결제 전 Pro 권장). `sobok-prod` 워크스페이스에 `import` 블록으로 입양(`import { to=supabase_project.deeptype, id=<project-ref> }`) + HCP 변수 `organization_id`·`pooler_host`(대시보드 Connect의 `aws-N-ap-northeast-2.pooler.supabase.com`)·`database_password`(sensitive)·`SUPABASE_ACCESS_TOKEN`(project variable set). apply 후 `plan`에 replace 없어야 함 → outputs `deeptype_pg_host/port/database/user/password`.
   **런타임 역할·권한도 이 워크스페이스가 소유한다**(`roles.tf`, `cyrilgdn/postgresql` provider): 최소권한 `deeptype_app`(+ stella용 `stella_app`) 역할·grant·default privileges를 세션 풀러로 접속해 생성하고 비밀번호를 `random_password`로 만들어 sensitive output으로 노출한다. ⚠️ 이 provider 때문에 **이 워크스페이스의 모든 plan/apply가 DB 접속을 요구**한다 — Free 플랜 일시정지 시 실패하므로 ops 실행 전 **Pro 유지(또는 사전 언포즈)** 필요.
2. **Hyperdrive ×2 (`account-vibe`)** — `terraform apply` → 두 config id. **origin(host/port/db/user/password) 전부 `sobok-prod`에서 `terraform_remote_state`로 링크**(수동 복사·손-설정 비밀번호 없음, 별도 토큰 불필요 — 런 자체 크레덴셜). user는 최소권한 `deeptype_app.<ref>`(owner `postgres` 아님). 전제: ① `sobok-prod` 먼저 apply(outputs 존재) ② sobok-prod → account-vibe **Remote State Sharing** 활성화 ③ 데이터소스의 `organization`+워크스페이스 `name`이 실제 HCP와 정확히 일치(**org=`sobok2026`, ws=`sobok-prod`** — VCS-무시되는 cloud{} 블록의 "sobok"과 다름).
3. **Secrets Store** — 계정 스토어 id 확보(`wrangler secrets-store store list` 또는 대시보드). `account-vibe`의 `secrets.tf`가 시크릿 7개를 push:
   `deeptype-portone-api-secret` · `deeptype-portone-webhook-secret` · **`deeptype-portone-webhook-secret-stg`** · `deeptype-anthropic-api-key` · `deeptype-resend-api-key` · `deeptype-discord-webhook` · `deeptype-ga4-api-secret`. 굵은 것 하나만 스테이징 전용이다 — 포트원이 실연동/테스트 모드별로 웹훅 시크릿을 각각 발급하기 때문이고, 나머지는 두 배포가 공유한다. Turnstile 시크릿(`vibe-turnstile-secret`)만 예외로 **`account-turnstile` 워크스페이스**가 위젯과 함께 push한다.
   값은 HCP Terraform 민감 변수(`account-vibe`)로 설정.
4. **PortOne(딥타입 전용 스토어)** — 스토어 생성 → **store id + 카탈로그가 요구하는 채널 전부**(현재 `tosspayments`·`tosspay_v2`·`kakaopay`·`kcp_v2`; 채널 키는 공개 vars). KCP의 사이트코드·PG-API 인증서·개인 키·키 비밀번호는 **포트원 콘솔에만** 넣는다 — 레포에도 Secrets Store에도 들어가지 않는다, **API secret + 웹훅 secret**(Secrets Store).
   - **테스트 ↔ 실연동을 가르는 것은 채널 키뿐이다.** store id와 V2 API Secret은 상점 단위라 두 모드가 공유한다. 그래서 채널 키는 wrangler 환경에 고정하고 런타임에서 고르지 않는다(5.1 참고).
   - **웹훅**은 [결제 연동] → [연동 관리] → [결제알림(Webhook) 관리]에서 **설정 모드(실연동/테스트)별로 URL을 따로** 등록하고 **시크릿도 환경별로 각각 발급**된다. 실연동 → `https://vibe.sobok.cc/api/deep-type/webhook`, 테스트 → `https://vibe-stg.sobok.cc/api/deep-type/webhook`. 웹훅은 상점 단위라 채널이 몇 개든 URL은 모드당 하나면 된다.
   - **실연동 채널은 채널마다** 계약 → MID/CID 발급 → **원천사 심사 완료**까지 끝나야 결제가 붙는다. 심사 전 상점아이디는 결제창이 열려도 승인되지 않는다. 채널의 과세구분도 테스트 채널과 같게 맞춘다.
   - EN·JA·ZH 이용자에게 해외 발급 카드를 받으려면 Toss Payments에 **해외카드(KRW) 추가 계약·기능 활성화**를 완료해야 한다. 앱은 비한국어 **카드** 결제에만 `bypass.tosspayments.useInternationalCardOnly = true`를 쓴다 — 이 bypass는 토스페이먼츠 전용이라 토스페이 채널에는 절대 실리지 않는다. 계약 없이 코드만 켜서는 승인되지 않는다.
5. **Turnstile** — vibe **전용 위젯**(`account-turnstile` 워크스페이스, 호스트네임 `vibe.sobok.cc` + `vibe-stg.sobok.cc`)의 **sitekey**(GitHub 저장소 변수 `VIBE_TURNSTILE_SITE_KEY` → 프론트 빌드 env) + **secret**(Secrets Store, `vibe-turnstile-secret`). 아직 apply 전이며 `moved`/`import` 블록이 없어 apply 시 기존 공유 위젯이 파괴·재생성된다 — sitekey 교체와 반드시 한 번에 넘겨야 한다.
6. **Anthropic** — 리포트 생성용 API 키 → Secrets Store. 기본 모델은 재현 가능한 고정 스냅샷 `claude-haiku-4-5-20251001`이며, 교체는 품질 회귀 확인 후 `DEEPTYPE_REPORT_MODEL`로 명시한다.
7. **Resend** — `sending_access` 전용 API 키를 `deeptype-resend-api-key`로 저장하고 `vibe.sobok.cc` 발신 도메인을 검증한다. Resend가 발급한 SPF/DKIM/MX 레코드는 Cloudflare DNS의 desired state에 옮긴 뒤 검증하며, 인증 링크가 중계 서비스에 노출되지 않도록 이 트랜잭션 발신 도메인의 **클릭 추적과 오픈 추적을 끈다**. 발신자는 `vibe <reports@vibe.sobok.cc>`, 회신 주소는 실제 모니터링하는 `sobok2026@gmail.com`이다. 발송은 같은 idempotency key로 일시 오류를 최대 3회 재시도한다.
8. **Google Privacy & Messaging** — AdSense에서 유럽 규정 메시지와 미국 주 규정 메시지를 게시하고, 메시지 설정의 Consent Mode 광고·분석 통합을 모두 켠다. Google 인증 CMP가 유일한 `consent update` 주체다.
   동의 **기본값은 앱이 아니라 GTM 컨테이너**(`sobok-ops/infra/gtm/sobok.cc/GTM-MH37D28N.json`의 `Consent Mode - 지역별 기본값`, Consent Initialization 트리거)가 소유한다. Consent Initialization은 GTM이 다른 모든 태그보다 먼저 실행을 보장하는 유일한 훅이라, 기본값을 페이지로 옮기면 법적 통제 장치의 진실 원천이 둘로 갈린다. EEA·영국·스위스 32개국은 선택 전 전부 `denied`(+`wait_for_update: 500`), 그 외 지역은 `granted`이며 `ads_data_redaction`·`url_passthrough`는 항상 켜 둔다.
9. **GA4 Measurement Protocol** — GA4 관리 → 데이터 스트림 → `vibe.sobok.cc`(`G-RHHX4JRYDS`) → **Measurement Protocol API 비밀번호**를 발급해 `deeptype-ga4-api-secret`으로 저장한다(HCP 변수 `deeptype_ga4_api_secret`). 결제 승인 CAS를 이긴 호출만 `purchase`를 보낸다. 전송 여부를 정하는 건 **`DEEPTYPE_GA4_MEASUREMENT_ID`(배포별 var)** 이고 빈 문자열이면 전송만 생략된다 — 시크릿은 두 배포가 공유한다. 어느 쪽이 비어도 결제·리포트는 영향받지 않는다. GA4에서 `purchase`를 **키 이벤트로 표시**해야 Ads 전환 가져오기가 가능하다.
10. **Discord**(선택) — 알림 웹훅 URL → Secrets Store(`account-vibe` HCP 변수 `deeptype_discord_webhook`). 빈 값이면 알림 no-op. Discord에는 구매·결제 식별자를 보내지 않고 이벤트 종류만 보낸다.

> **drizzle-kit push**는 Hyperdrive를 우회해 Supabase에 **owner로 직접** 붙는다: `DEEPTYPE_POSTGRES_URL_DIRECT`를 Supabase **세션 풀러**(5432, `postgres.<ref>`) 또는 IPv6 가능 머신에서 direct 연결로 설정한다. 런타임 Worker는 이와 별개로 최소권한 `deeptype_app`로 접속한다. **순서 불변식**: `sobok-prod` apply(스키마·역할·grant·default privileges 생성)가 **첫 `db:push`보다 먼저** — 그래야 push가 만드는 테이블이 default privileges를 상속한다.

---

## 3. Config 채우기(placeholder 치환)

- `apps/vibe/wrangler.jsonc`
  - `hyperdrive[].id` = `REPLACE_WITH_*_ID` → 2의 fresh/cached id
  - `secrets_store_secrets[].store_id` = 계정 Secrets Store id(7곳)
  - `vars.DEEPTYPE_PORTONE_STORE_ID` / `DEEPTYPE_PORTONE_CHANNELS` → 4의 값. 채널 맵은 **PG(pgProvider) 이름으로 키잉**한다 — 채널이 담는 건 결제수단이 아니라 계약이고, `tosspayments` 채널 하나가 카드도 가상계좌도 받는다. 어느 결제수단이 어느 채널을 타는지는 `deep-type/pay-method.ts`가 가진다. top-level은 **실연동** 채널, `env.stg`는 **테스트** 채널이다
  - `vars.DEEPTYPE_REPORT_MODEL` = `claude-haiku-4-5-20251001`처럼 별칭이 아닌 검증된 고정 model id
  - `vars.DEEPTYPE_PUBLIC_ORIGIN` / `DEEPTYPE_EMAIL_FROM` / `DEEPTYPE_EMAIL_REPLY_TO`가 실제 프로덕션 값인지 확인
  - `vars.DEEPTYPE_GA4_MEASUREMENT_ID` = `src/constants.ts`의 `GA4_MEASUREMENT_ID` 및 컨테이너 `LT - GA4 Measurement ID` 룩업의 `vibe.sobok.cc` 값과 **세 곳이 동일**해야 한다
- **프론트 sitekey**: `apps/vibe/src/constants.ts`의 `TURNSTILE_SITE_KEY`가 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`를 읽고, CI가 저장소 변수 `VIBE_TURNSTILE_SITE_KEY`로 주입해 빌드 시 인라인한다(값이 비면 빌드가 실패한다). 이 sitekey와 서버 `vibe-turnstile-secret`은 **같은 위젯 짝**이어야 함.

---

## 4. 스키마 push & 배포

```bash
cd apps/vibe
# DEEPTYPE_POSTGRES_URL_DIRECT(Supabase 세션 풀러, direct owner)를 drizzle-kit에 주입(로컬 1회).
# DEEPTYPE_DB_SCHEMA는 기본값이 없다 — push가 어느 스키마를 향하는지 매번 명시해야 한다.
DEEPTYPE_DB_SCHEMA=deeptype bun run db:push          # 프로덕션 (5 테이블 + 5 enum)
DEEPTYPE_DB_SCHEMA=deeptype_stg bun run db:push  # 스테이징 (같은 DB, 다른 스키마)
bun run type           # next typegen && tsc(프론트) && tsc(worker) — 0 이어야 함
# deploy = `next build && wrangler deploy` — 정적 out/을 먼저 재빌드한다.
# Turnstile sitekey는 NEXT_PUBLIC_TURNSTILE_SITE_KEY(CI 저장소 변수 VIBE_TURNSTILE_SITE_KEY)에서 빌드 시
# 인라인된다. 프론트 sitekey와 서버 vibe-turnstile-secret은 반드시 같은 위젯 짝이어야 한다.
bun run deploy
```

---

## 4.1 스테이징(테스트 결제) 배포

**브랜치를 밀면 스테이징, `main`을 밀면 프로덕션**이다(`.github/workflows/vibe-deploy.yml`). 워크플로가 보는 건 `main`이냐 아니냐뿐이고, 브랜치 이름은 배포에 관여하지 않는다 — 규약은 `<type>/<app>-<요약>`(`feat/vibe-kakaopay`)으로 커밋 메시지의 type과 같은 단어를 쓴다.

돈이 걸린 변경의 흐름은 이렇다:

1. 브랜치를 만들어 푸시 → `vibe-stg`에 배포된다
2. `vibe-stg.sobok.cc`에서 포트원 **테스트 채널**로 결제 E2E(5.L 포함)를 돌린다
3. `main`에 머지 → `vibe`에 배포된다

named environment는 별도 Worker 스크립트라 `deploy` 하나로는 `vibe`만 올라간다. 스테이징은 브랜치 수명을 따르므로 **머지 직후에는 프로덕션과 다른 코드를 들고 있다** — 배포 후 확인은 프로덕션에서 소액 실결제로 하고, 스테이징에서 한 검증은 머지 전 것으로 읽는다.

로컬에서 직접 올려야 할 때만:

```bash
cd apps/vibe
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<vibe 위젯 sitekey> bun run build   # 값이 비면 빌드가 실패한다
bunx wrangler deploy --env stg   # Worker `vibe-stg` 생성 (아직 도메인 없음)
# 그 다음에 account-vibe apply → cloudflare_workers_custom_domain.vibe_stg 가 붙는다
```

- **순서 불변식**: 커스텀 도메인은 **이미 존재하는 Worker**에만 붙는다. 첫 `wrangler deploy --env stg`보다 `account-vibe` apply를 먼저 돌리면 `404 This Worker does not exist on your account.`로 실패한다(프로덕션 `vibe`도 같은 전제다). 배포와 apply 사이에는 워커가 잠시 도달 불가 상태로 존재하는데, 정상이다.
- **도메인 소유자는 Terraform 하나뿐이다.** `wrangler.jsonc`에는 top-level에도 `env.stg`에도 `routes`를 두지 않는다 — 양쪽에 선언하면 같은 바인딩에 주인이 둘이 된다.
- **테스트 채널은 배포로만 갈린다.** `/checkout`이 채널 키를 정하는 유일한 지점이라, 프로덕션 빌드가 테스트 키를 내려줄 수 있는 경로가 하나라도 생기면 0원 결제로 유료 리포트가 나간다. 런타임 플래그·쿼리 파라미터로 모드를 바꾸지 않는다.
- `vars` · `define` · `hyperdrive` · `secrets_store_secrets`는 **비상속**이라 `env.stg`에 전부 다시 적혀 있다. 새 var를 top-level에 추가하면 staging에도 같이 넣어야 하고, 빠뜨리면 `undefined`로 도착한다(`guardTurnstile`이 `DEEPTYPE_PUBLIC_ORIGIN` 누락을 `misconfigured`로 잡아 주는 이유).
- **Turnstile**: Cloudflare의 always-pass 더미 시크릿은 `hostname`을 `example.com`으로 돌려주므로 이 검증기를 통과할 수 없다(`packages/edge/src/turnstile.ts`). 스테이징도 **실제 vibe 위젯**을 쓰고, `vibe-stg.sobok.cc`를 위젯 Hostname Management에 등록해야 한다. `vibe.sobok.cc`의 서브도메인이 아니라 형제 호스트라 자동 커버되지 않는다.
- **GA4**: 스테이징은 `DEEPTYPE_GA4_MEASUREMENT_ID`가 빈 문자열이라 `confirmPurchase`가 Measurement Protocol 전송을 건너뛴다. 킬스위치는 **목적지이지 크레덴셜이 아니다** — 시크릿은 프로덕션과 같은 것을 바인딩하고 보낼 곳이 없어서 안 보낸다. 테스트 결제는 프로덕션 매출 지표에 잡히지 않는다. 브라우저 GTM은 hostname 룩업으로 property를 고르므로 `vibe-stg.sobok.cc`를 룩업 테이블에 넣지 않는 편이 안전하다.
- **크론은 상속된다** — 스테이징도 재조정·purge를 자기 스키마에 대해 돌린다(E2E F가 이걸 검증한다).

---

## 5. 스테이징 E2E 테스트 플랜(돈이 걸린 경로 우선)

> `vibe-stg` 워커(4.1) + PortOne 테스트 채널 + 실제 vibe Turnstile 위젯 + `deeptype_stg` 스키마로 수행. 각 단계는 DB 행 상태와 Discord 알림을 함께 확인한다.

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
3. EEA/영국/스위스 IP에서 선택 전 Consent Mode v2 네 신호가 `denied`(GA4 요청의 `gcs=G100`), 선택 후 CMP 선택대로 갱신되는지 Tag Assistant에서 확인한다. 한국 IP에서는 선택 UI 없이 처음부터 `granted`(`gcs=G111`)여야 한다.
4. 미국 주 규정 메시지도 AdSense 메시지 진단 도구와 대상 지역 테스트로 확인한다.
5. `/deep-type/reopen`과 `/deep-type/checkout-return`에서 **GTM은 로드되고 AdSense(`pagead2.googlesyndication.com`) 요청만 없어야** 한다. 광고 없는 것은 결제 화면 UX 결정이지 측정 차단이 아니다.

**K. 측정 파이프라인**

1. 컨테이너 로더가 페이지당 **정확히 1개**인지 확인한다 — `<script id="gtm-loader">` 하나가 `/h8ou/gtm.js?id=GTM-MH37D28N`를 받고, `googletagmanager.com/gtm.js`는 `gtg_health` 요청 외에 없어야 한다. Cloudflare에서 `setUpTag`를 켜면 엣지가 두 번째 로더를 주입하므로 여기서 잡힌다(GTG는 zone 단위라 서브도메인별로 끌 수 없다).
2. GTM 미리보기에서 `view_item` · `begin_checkout` · `view_promotion` · `select_promotion`이 각각 발화하고, GA4 요청에 `items`·`value`·`currency`가 실려 나가는지 확인한다(빈 `items`면 `ecommerce` 객체가 아니라 평면 push로 되돌아간 것이다).
3. 소액 실결제 1건 후 GA4 실시간 보고서에 `purchase` 1건, `transaction_id` = PortOne `paymentId`, `value` = 결제 금액인지 확인한다. **정확히 1건**이어야 한다 — 웹훅과 브라우저 복귀가 모두 도착해도 CAS 승자만 전송한다.
4. 같은 결제의 `/verify`를 두 번 호출하고, 두 번째에는 GA4 이벤트가 추가되지 않는지 확인한다.
5. 전송 성공 후 `deeptype.purchase` 행의 `ga_client_id`·`ga_session_id`가 모두 `null`로 비워졌는지 확인한다.
6. **라이브 전 필수** — Measurement Protocol 디버그 엔드포인트(`/debug/mp/collect`)로 같은 body를 한 번 보내 `validationMessages`가 비어 있는지 확인한다. 운영 엔드포인트는 잘못된 이벤트도 204를 준다. 특히 `session_id`는 `_ga_<stream>` 쿠키를 **파싱하지 않고 통째로** 싣는 형태이므로(레퍼런스가 "send the full value of the cookie"로 허용하는 경로), 이 검증에서 거부되면 그때 숫자 세션 id 추출로 되돌린다.

**L. 결제수단 분기**

1. `ko` 페이월에 카탈로그 순서대로(카카오페이·토스페이·카드) 뜨고 첫 항목이 기본 선택인지, EN·JA·ZH에는 선택 UI가 아예 없는지 확인한다(결제수단이 하나뿐인 로케일).
2. 카카오페이·토스페이를 각각 골라 결제하면 `EASY_PAY` + 해당 채널 키로 창이 열리고, 승인 뒤 `deeptype_purchase.method`가 `easyPay`로 남는지 확인한다.
   2-1. 계좌이체·휴대폰은 **같은 `kcp_v2` 채널 키**로 열리되 `payMethod`가 각각 `TRANSFER`·`MOBILE`인지, 휴대폰 요청에만 `bypass.kcp_v2.shop_user_id`가 실리는지 확인한다(계좌이체에는 실리면 안 된다).
   2-2. 휴대폰 소액결제 건에 당월 내 청약철회를 걸어 취소가 반영되는지 확인하고, 취소 실패 경로가 `refundFailed` 안내로 끝나는지도 함께 본다.
3. 카드를 고르면 `CARD` + 토스페이먼츠 채널로 열리는지, **비한국어 카드 결제에만** `useInternationalCardOnly`가 실리는지 확인한다(간편결제 요청에 이 bypass가 실리면 안 된다).
4. 토스페이 결제 만료(기본 15분) 뒤 복귀하면 `pending`으로 남고 `*/15` 재조정이 정리하는지 확인한다.
5. 토스페이 결제 건에 청약철회(`POST /cancel`)를 걸어 전액취소가 반영되는지 확인한다.

**J. 해외카드·모바일 복귀**

1. Toss Payments 해외카드(KRW) 계약이 활성화된 테스트/실 MID에서 EN·JA·ZH 결제가 해외카드 전용 창으로 열리는지 확인한다.
2. Visa·Mastercard·JCB 승인/거절 케이스와 실제 해외 발급 카드 소액 결제 1건을 확인한다. 통화는 KRW이고 발급사 환율·해외 이용 수수료가 적용될 수 있다.
3. iOS Safari·Android Chrome에서 결제 후 `/deep-type/checkout-return`으로 돌아와 쿼리를 즉시 지우고, 서버 검증 후 24문항으로 이어지는지 확인한다.
4. 결제 복귀 탭의 세션 저장소가 없거나 만료된 경우 구매 이메일 재열람 경로로 복구할 수 있는지 확인한다.

---

## 6. 라이브 전환 체크리스트

- [ ] Phase 0 산출물 전부 존재(Supabase·Hyperdrive×2·Secrets Store 7개·PortOne 스토어·Turnstile·Anthropic·Resend·GA4 API secret).
- [ ] `sobok-prod` roles.tf가 `deeptype`·`deeptype_stg` 두 스키마에 grant·default privileges 적용 완료.
- [ ] `wrangler.jsonc` placeholder 전부 치환(top-level 토스페이 실연동 키 · `env.stg` 카드 테스트 키), `DEEPTYPE_LLM_ENABLED = "1"`, `DEEPTYPE_REPORT_MODEL`은 검증된 고정 id.
- [ ] top-level `vars`에 새로 추가한 항목이 `env.stg`에도 들어갔는지(비상속 키).
- [ ] 저장소 변수 `VIBE_TURNSTILE_SITE_KEY` = vibe 위젯 sitekey, 서버 `vibe-turnstile-secret` = 그 위젯의 secret(짝 일치), 위젯 호스트네임에 `vibe.sobok.cc`·`vibe-stg.sobok.cc` 둘 다 등록.
- [ ] PortOne 콘솔 웹훅 URL이 **모드별로** 등록(실연동 = `vibe.sobok.cc`, 테스트 = `vibe-stg.sobok.cc`)되고 테스트 모드 시크릿이 `deeptype-portone-webhook-secret-stg`에 들어감.
- [ ] 토스페이 실연동 MID의 **원천사 심사 완료** 확인, Toss Payments 해외카드(KRW) 추가 계약·기능 활성.
- [ ] Resend 발신 도메인 검증, SPF/DKIM/MX 정상, 인증 메일 클릭·오픈 추적 비활성.
- [ ] Google 유럽/미국 메시지 게시 및 Consent Mode 광고·분석 통합 활성.
- [ ] GTM 컨테이너 v3 import·게시 완료(`Consent Mode - 지역별 기본값` + 전자상거래 태그 4종), GA4에서 `purchase` 키 이벤트 표시.
- [ ] `bun run type` = 0, `DEEPTYPE_DB_SCHEMA=deeptype`으로 `db:push` 완료(프로덕션 Supabase).
- [ ] 스테이징 E2E A–L 통과(특히 B/C/D/H/J/K/L — 돈·멱등·환불·재열람·해외/모바일 결제·측정·토스페이).
- [ ] Discord 알림 채널 수신 확인.
- [ ] `wrangler deploy` 후 스모크: `/config` 200, 무료 세션 200, 소액 실결제 1건 → 환불로 정리.
- [ ] Cron 트리거 2개 활성(`*/15`, `0 3`).

---

## 7. 관측·운영

- **알림**: 웹훅 금액 불일치, 리포트 생성 실패 시 Discord로 이벤트 종류만 통지(식별자는 제한된 Worker 로그에서 확인, 웹훅 URL 빈 값이면 조용히 비활성).
- **재조정**: `*/15` cron이 `verify`를 놓친 pending을 PortOne 재조회로 마감.
- **리텐션**: `0 3` cron이 미전환 결과와 pending/failed 구매 30일, 완료 리포트의 원본·심화 응답 3개월, 원본 웹훅 90일을 기준으로 정리한다. 결제 1년 뒤 이메일·접근 토큰·파생 결과·리포트를 삭제하고 최소 거래 기록만 5년까지 보관한 뒤 삭제한다. 일회용 재열람 토큰은 만료 즉시 다음 purge에서 삭제한다.
- **재열람 보안**: 메일 링크는 15분·1회용 SHA-256 해시로 저장한다. 원본 토큰은 URL fragment에 두고, 화면에서 명시적으로 열기를 누르기 전에는 교환하지 않는다.
- **결제 복귀 보안**: PortOne의 결제 id만 복귀 쿼리로 받고 즉시 URL에서 제거한다. 리포트 access token은 URL에 넣지 않고 탭 한정 `sessionStorage`에 최대 1시간 보관하며, 복귀 페이지에서는 **AdSense를 로드하지 않는다**(GTM은 측정 연속성 때문에 로드된다 — I-5 참고).
- **환불 불변식**: `viewed_at != null`이면 환불 거부(청약철회 = 콘텐츠 미열람 한정).
- **결제수단별 환불 기한**(카드·간편결제는 사실상 제약 없음): **휴대폰 소액결제는 당월 거래만 PG 취소 가능**하고 익월부터는 취소가 실패한다(납부 완료 시에는 PG가 아예 못 지운다). 실시간 계좌이체는 약 3개월이다. 우리 정책은 미열람이면 언제든 전액 환불이고 재열람 링크가 1년이라, 결제만 하고 심화 문항을 마치지 않은 구매자가 기한을 넘겨 환불을 요청하면 `POST /cancel`이 실패한다 — 화면은 `refundFailed`로 고객센터를 안내하고, 그 뒤는 **수동 송금**이다. 그래서 두 수단은 페이월 목록에서 맨 뒤에 두어 기본 선택이 되지 않게 한다.
- **캐시 주의**: 돈·엔티틀먼트는 반드시 `HYPERDRIVE_FRESH`(캐시 비활성)로만 조회/쓰기. 완료 리포트 본문 등 불변 데이터만 `HYPERDRIVE_CACHED` 사용.
