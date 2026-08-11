# DeepType (딥타입) — 배포·운영 런북

`apps/vibe`의 정적 사이트와 `apps/database`에서 실행되는 딥타입 API를 Cloudflare Workers로 배포하는
절차와 돈이 걸린 경로를 스테이징에서 검증한 뒤 라이브로 전환하는 체크리스트다. 배포 인프라 선언은
`sobok-ops`에 있다.

---

## 1. 구조 한눈에

- **공개 Vibe Worker** = 정적 Next 에셋 + `/api/*`를 환경별 `DATABASE` Service Binding으로 전달하는 얇은
  gateway. DB·backend secret·Queue를 갖지 않는다.
- **Database Worker** = Vibe Hono API와 background job의 실행 경계. `database`/`database-stg`가 각각 같은
  환경의 fresh/cached Hyperdrive를 사용한다. 전체 Hyperdrive는 앱 수와 무관하게 네 개다.
- **Hyperdrive 2개/환경**: `HYPERDRIVE_FRESH`는 돈·entitlement 조회/쓰기, `HYPERDRIVE_CACHED`는 완료된
  불변 리포트 본문 전용이다. 각 환경의 Supabase direct endpoint가 origin이고 네 config 모두
  `verify-full`을 사용한다.
- **중앙 결제 서비스**: `apps/payments`만 PortOne API·Store/channel map·웹훅 서명을 소유한다. Database
  Worker의 `VIBE_PAYMENTS` binding이 checkout·조회·취소를 호출하고 검증된 이벤트 Queue를 소비한다.
- **Secrets Store**: Vibe backend secret은 Database Worker에만 바인딩한다. PortOne Secret은 Payments
  Worker만 읽는다.
- **공용 scheduler**: 계정 단일 `apps/scheduler`가 `*/15 * * * *`에 결제 pending 재조정,
  `0 3 * * *`에 리텐션 purge를 Database Worker의 `VibeMaintenance` RPC로 호출한다. 공개 Vibe Worker에는
  Cron Trigger가 없다.
- **결제수단 카탈로그**: V2는 채널 하나가 PG 하나라 결제수단 추가는 곧 채널 추가이고, 여러 채널을 한 창에서 고르게 해주는 UI가 없다(`loadPaymentUI`는 PayPal SPB 전용). 그래서 페이월이 먼저 고르게 하고 `requestPayment`에 채널 키와 `payMethod`를 함께 넘긴다. 무엇을 어느 로케일에 파는지는 워커와 페이월이 함께 쓰는 **`deep-type/pay-method.ts` 한 곳**에 있다 — 카탈로그는 `ko`에 카카오페이·토스페이·카드·계좌이체·휴대폰, 비한국어(en·ja·zh)에 **페이팔 단독**이다. 채널은 결제수단보다 적다: `kcp_v2` 하나가 계좌이체와 휴대폰을 함께 받는다. `/checkout`이 저장된 로케일로 다시 검증한 뒤 **승인한 채널 키 하나만** 내려준다 — 가격·채점·지급과 같은 서버 권위다.
- **페이팔(SPB) = 두 번째 SDK 모양**: 스펙의 `open` 판별자로 갈린다. `'window'` 수단은 우리 버튼이 `requestPayment`로 창을 열고, 페이팔은 `'ui'` — `loadPaymentUI`가 **페이팔 자신의 버튼**을 `portone-ui-container`에 렌더하며 우리 버튼으로는 못 연다. 그래서 페이월은 2단계다: 폼 제출 → `/checkout`이 가격·paymentId를 승인 → 결제하기 버튼 자리에 페이팔 버튼이 나타나고 그동안 폼은 `fieldset disabled`로 얼린다(생성된 결제가 그 값에 고정돼 있으므로). 창 닫힘/거절은 attempt 단위라 버튼이 남고, `돌아가기`로 세션을 버리면 pending 행은 닫힌 창과 같은 경로(reconcile·purge)로 수렴한다.
- **다통화 가격**: 페이팔은 KRW를 받지 않아 en·zh=USD 4.98, ja=JPY 698, ko=KRW 5,900(`deep-type/offer.ts` 한 곳, 통화당 가격 1개를 로케일이 참조). **모든 금액은 ISO 4217 minor unit 정수**(USD는 센트: 498=$4.98, KRW·JPY는 그대로)이고 PortOne `totalAmount`·DB·`/checkout` 응답이 같은 단위라 변환 없이 흐른다. 나누는 곳은 화면(`formatPrice`)과 GA4(major unit 필수, `majorUnits`) 둘뿐이다. CNY는 페이팔이 중국 내 계정에만 허용해서 못 쓴다 — zh가 USD인 이유.
- **판매 가능 목록 = 카탈로그 ∩ 배포 프로필**: 카탈로그가 "무엇을 파는가"라면
  `pay-method.ts`의 `SELLABLE_CHANNELS`가 각 배포가 노출할 채널을 정한다. 화면 메뉴는 두 표의
  교집합이고 `payMethodsFor(locale, profile)` 한 곳에서만 계산한다. 현재 production 한국어 메뉴는
  실연동 토스페이와 카드사 심사용 테스트 토스페이먼츠 카드, staging은 전체 테스트 수단이다.
- **profile**: `production` / `staging`은 PortOne의 `live` / `test` 설정 모드가 아니라 제품 배포
  메뉴 이름이다. 한 production 프로필 안에서도 채널별 모드는 다를 수 있다. 워커는
  `DEEPTYPE_PAY_PROFILE`, 정적 페이월은 빌드 시 `NEXT_PUBLIC_DEEPTYPE_PAY_PROFILE`을 받으며 둘 다
  배포 job에 리터럴로 고정한다. 시크릿·호스트네임·브랜치에서 유도하지 않는다. 어긋나면 페이월이
  내놓은 수단을 `/checkout`이 거절하므로 첫 QA에서 드러난다.
- **결제수단 추가 절차**(채널은 계속 늘어난다): ① `pay-method.ts`의 `PAY_METHODS`·`PAY_METHOD_SPEC`에
  한 줄 ② 로케일 목록에 추가 ③ `SELLABLE_CHANNELS`에서 노출할 profile마다 한 줄 ④ 중앙
  `apps/payments/wrangler.jsonc`의 해당 배포 `PORTONE_CHANNELS`에 `channelKey`·`mode`·`vibe` scope를
  추가 ⑤ `_content` 4개 로케일에 라벨 ⑥ 그 PG가 bypass를 요구할 때만 `use-checkout`의 `BYPASS`
  표에 한 줄. ③과 ④는 같은 릴리스 단위로 배포한다.
- **채널 키에 placeholder·빈 문자열을 두지 않는다.** 못 파는 채널은 맵에서 **빠져 있다**(`Partial<Record<...>>`). 빈 문자열은 `string`을 만족해 타입이 잡지 못하고 `requestPayment`까지 흘러가며, placeholder는 truthy라 falsy 검사로도 안 걸린다. `""`는 `DEEPTYPE_GA4_MEASUREMENT_ID`처럼 **없으면 생략하면 되는**(fail-open) 스칼라에만 쓴다 — 결제 능력은 fail-closed이고 집합이라 원소를 담지 않는 것이 부재의 정직한 표현이다.
- **드리프트 점검**: `GET /api/deep-type/config`가 `payProfile`, Vibe scope로 바인딩된 채널,
  `unbound`(팔겠다고 했는데 scoped entry가 없음 → `/checkout`이 500 + Discord), `unsold`(entry는
  있는데 `SELLABLE_CHANNELS`에 안 넣음), 로케일별 최종 메뉴를 함께 돌려준다. 배포 직후 이 한 번의
  요청이 스모크 체크다.
- **DB**: drizzle-kit `push`(버전 마이그레이션 없음). production과 staging은 별도 Supabase 프로젝트이며 둘 다 고정 `deeptype` schema를 쓴다. `pgSchema('deeptype')`를 코드에 직접 선언하며 런타임 또는 빌드타임 schema 선택은 없다.
- **분석 파이프라인**: GTM 컨테이너 `GTM-MH37D28N`(4개 사이트 공용) → GA4 `G-RHHX4JRYDS`. 컨테이너 로더는 **앱이 싣는다**(`@sobok/analytics/gtm-loader`, 4개 앱 공용). Cloudflare Google tag gateway는 zone에서 **프록시로만** 켜져 있고(`setUpTag` off) `/h8ou/*`를 서빙할 뿐 HTML에 아무것도 주입하지 않으므로, 이 컴포넌트를 빼면 측정이 통째로 사라진다. 브라우저는 `dataLayer`에 퍼널 이벤트만 push하고, 돈이 걸린 `purchase`는 **결제 승인 CAS를 이긴 Worker가 Measurement Protocol로 직접** 보낸다.
- **측정 계약**: `3.0.0`. 문항별 의미가 구체적인 4개 선택지로 구성된 무료 50문항을 Worker가 재채점해 겉 16유형·속 16유형·보석 16분류를 만들고, 결제 후에는 모든 사용자에게 동일한 24개 심화 문항으로 속·보석을 재산출한다. 클라이언트가 보낸 유형 코드는 신뢰하지 않는다.

라우트:

| 메서드 | 경로                             | 용도                               |
| ------ | -------------------------------- | ---------------------------------- |
| GET    | `/api/deep-type/config`          | 배포 스모크(스토어/채널 vars 확인) |
| POST   | `/api/deep-type/session`         | 무료 50응답 검증·채점·저장         |
| POST   | `/api/deep-type/checkout`        | 결제 준비(**Turnstile 검증**)      |
| POST   | `/api/deep-type/verify`          | 결제 검증(서버측 금액 대조)        |
| POST   | `/api/deep-type/report/generate` | 리포트 생성 킥                     |
| GET    | `/api/deep-type/report`          | 리포트 폴링                        |
| POST   | `/api/deep-type/refinement`      | 유료 24응답 검증·재채점            |
| POST   | `/api/deep-type/cancel`          | 청약철회 환불(미열람 한정)         |
| POST   | `/api/deep-type/reopen/request`  | 이메일 재열람 링크 요청            |
| POST   | `/api/deep-type/reopen/exchange` | 일회용 링크를 리포트 권한으로 교환 |

---

## 2. Phase 0 — 프로비저닝(라이브 전 1회)

배포 인프라는 HCP Terraform(org `sobok2026`)의 **워크스페이스별 root**로 선언한다. 관련
워크스페이스는 다음과 같다.

- `supabase` project / **`sobok-production`**(`sobok-ops/infra/supabase/production`)과
  **`sobok-staging`**(`sobok-ops/infra/supabase/staging`) — 환경별 Pro 프로젝트.
- `cloudflare` project / **`account-database`**(`sobok-ops/infra/cloudflare/account/sobok/database`) — 환경별
  fresh/cached Hyperdrive 네 개.
- `cloudflare` project / **`account-vibe`**(`sobok-ops/infra/cloudflare/account/sobok/vibe`) — Vibe runtime
  secret과 커스텀 도메인 두 개(`vibe` / `vibe-stg`).
- `cloudflare` project / **`account-payments`**(`sobok-ops/infra/cloudflare/account/sobok/payments`) —
  중앙 payments custom domain, PortOne API Secret, Vibe 결제 이벤트 Queue/DLQ.

배포에 앞서 아래가 존재해야 하고, 각 산출물 id/시크릿을 3에서 config에 채운다.

0. **Supabase Pro 프로젝트 ×2** — 대시보드에서 production과 staging 프로젝트를 각각 서울
   (`ap-northeast-2`)에 만들고 `sobok-production`·`sobok-staging` root의 import 블록으로 입양한다.
   두 프로젝트 모두 `identity`, `stella`, `deeptype` schema, 환경별 `sobok_runtime`, 제품별 migrator를
   같은 이름으로 갖는다. 환경 경계는 프로젝트이며 schema 이름에 환경 suffix를 붙이지 않는다.
1. **역할·권한** — 공용 database module이 `sobok_runtime`과 `vibe_migrator`를 만들고, `sobok_runtime`에
   모든 앱 schema의 현재 권한과 future default privilege를 선언한다. HCP와 Drizzle은 session pooler를
   사용한다.
2. **Hyperdrive ×4 (`account-database`)** — 환경마다 fresh/cached config를 하나씩 만든다. origin은 각
   Supabase direct endpoint이고 user는 그 환경의 `sobok_runtime`이다. 두 Supabase workspace와
   `account-secrets-store`의 Remote State Sharing을 `account-database`에 허용한다.
3. **Secrets Store** — 계정 스토어 id 확보(`wrangler secrets-store store list` 또는 대시보드). 값의 발급·공유 경계별로 Terraform 소유권을 나눈다.
   - `account-secrets-store`: 대표 Store가 모드별로 한 번만 발급하는 `portone-webhook-secret-live` · `portone-webhook-secret-test`. 중앙 payments Worker만 바인딩한다.
   - `account-payments`: 대표 Store의 배포별 V2 API Secret
     `payments-portone-api-secret-production`·`payments-portone-api-secret-staging`과 방향별 core service
     credential.
   - `account-vibe`: `deeptype-anthropic-api-key` · `deeptype-resend-api-key` · `deeptype-discord-webhook` · `deeptype-ga4-api-secret`.
   - `account-turnstile`: 위젯과 함께 생성하는 `vibe-turnstile-secret`.
     값은 각 HCP Terraform 워크스페이스의 sensitive 변수로 설정하고 public repo나 `*.tfvars`에 넣지 않는다.
4. **PortOne(공용 대표 Store)** — 같은 사업·정산 경계의 Sobok 앱은 Store ID와 채널을 공유한다(현재
   `tosspayments`·`tosspay_v2`·`kakaopay`·`kcp_v2`·`paypal_v2`; 채널 키는 공개 vars). 앱 도메인마다
   하위 상점을 만들지 않는다. KCP의 사이트코드·PG-API 인증서·개인 키·키 비밀번호는 **포트원
   콘솔에만** 넣는다. V2 API Secret과 Store/channel map은 중앙 payments가 소유한다.
   - **테스트 ↔ 실연동은 중앙 payments 카탈로그의 채널별 `mode`와 channel key가 가른다.** Store
     ID는 공유하고 V2 API Secret은 배포별 독립 교체를 위해 따로 발급하지만 둘 다 같은 Store
     권한이다. Vibe의 `DEEPTYPE_PAY_PROFILE`은 production/staging 메뉴만 고르며 자격증명이나 채널
     모드를 소유하지 않는다.
   - **웹훅**은 [결제 연동] → [연동 관리] → [결제알림(Webhook) 관리]에서 설정 모드별 중앙 URL을
     둔다. 실연동은 `https://payments.sobok.cc/webhooks/portone`, 테스트는
     `https://payments-stg.sobok.cc/webhooks/portone`이다. payments가 서명과 결제 단건을 검증한 뒤
     `dt_` payment ID만 Vibe Queue에 넣는다.
   - **production 카드사 심사 예외**: `SELLABLE_CHANNELS.production`은 토스페이와 토스페이먼츠를
     노출한다. 중앙 production 카탈로그는 토스페이는 `live`, 토스페이먼츠는 `test`로 두고 둘 다
     `vibe` scope를 갖는다. 카드사 승인 뒤 토스페이먼츠 entry의 channel key와 `mode`만 실연동으로
     교체한다. 테스트 모드 웹훅은 `payments-stg`로 들어오므로 production 심사 거래는 브라우저
     confirm과 production scheduler 재조정으로 완료하며, 웹훅까지 포함한 수직 QA는 staging에서 한다.
   - EN·JA·ZH 판매는 **페이팔(`paypal_v2`) 단독**이다. 테스트 채널은 포트원이 제공하는 **국가별 샌드박스 판매자 계정** 목록에서 만든다 — 목록의 국가는 구매자 국가가 아니라 **수취 계정의 등록 국가**라서 "한국"을 고른다(실연동에서 연결할 본인 PayPal Business 계정이 한국이므로). 실연동은 목록에서 고르는 게 아니라 **본인 PayPal Business 계정을 채널에 연결**하는 방식이고, 연결이 끝나는 날 `SELLABLE_CHANNELS.production`과 중앙 production 카탈로그에 `mode: "live"`, `vibe` scope의 `paypal_v2`를 같은 커밋으로 추가한다. 구매자 국적별 분기는 없다 — 판매자 계정 하나에 전 세계가 결제하고 창 현지화는 페이팔이 구매자 계정 로케일로 한다. 정기결제는 RT 별도라 SPB 일반결제만 쓴다.
5. **Turnstile** — vibe **전용 위젯**(`account-turnstile` 워크스페이스, 호스트네임 `vibe.sobok.cc` + `vibe-stg.sobok.cc`)의 **sitekey**(GitHub 저장소 변수 `VIBE_TURNSTILE_SITE_KEY` → 프론트 빌드 env) + **secret**(Secrets Store, `vibe-turnstile-secret`). 아직 apply 전이며 `moved`/`import` 블록이 없어 apply 시 기존 공유 위젯이 파괴·재생성된다 — sitekey 교체와 반드시 한 번에 넘겨야 한다.
6. **Anthropic** — 리포트 생성용 API 키 → Secrets Store. 기본 모델은 재현 가능한 고정 스냅샷 `claude-haiku-4-5-20251001`이며, 교체는 품질 회귀 확인 후 `DEEPTYPE_REPORT_MODEL`로 명시한다.
7. **Resend** — `sending_access` 전용 API 키를 `deeptype-resend-api-key`로 저장하고 `vibe.sobok.cc` 발신 도메인을 검증한다. Resend가 발급한 SPF/DKIM/MX 레코드는 Cloudflare DNS의 desired state에 옮긴 뒤 검증하며, 인증 링크가 중계 서비스에 노출되지 않도록 이 트랜잭션 발신 도메인의 **클릭 추적과 오픈 추적을 끈다**. 발신자는 `vibe <reports@vibe.sobok.cc>`, 회신 주소는 실제 모니터링하는 `sobok2026@gmail.com`이다. 발송은 같은 idempotency key로 일시 오류를 최대 3회 재시도한다.
8. **Google Privacy & Messaging** — AdSense에서 유럽 규정 메시지와 미국 주 규정 메시지를 게시하고, 메시지 설정의 Consent Mode 광고·분석 통합을 모두 켠다. Google 인증 CMP가 유일한 `consent update` 주체다.
   동의 **기본값은 앱이 아니라 GTM 컨테이너**(`sobok-ops/infra/gtm/sobok.cc/GTM-MH37D28N.json`의 `Consent Mode - 지역별 기본값`, Consent Initialization 트리거)가 소유한다. Consent Initialization은 GTM이 다른 모든 태그보다 먼저 실행을 보장하는 유일한 훅이라, 기본값을 페이지로 옮기면 법적 통제 장치의 진실 원천이 둘로 갈린다. EEA·영국·스위스 32개국은 선택 전 전부 `denied`(+`wait_for_update: 500`), 그 외 지역은 `granted`이며 `ads_data_redaction`·`url_passthrough`는 항상 켜 둔다.
9. **GA4 Measurement Protocol** — GA4 관리 → 데이터 스트림 → `vibe.sobok.cc`(`G-RHHX4JRYDS`) → **Measurement Protocol API 비밀번호**를 발급해 `deeptype-ga4-api-secret`으로 저장한다(HCP 변수 `deeptype_ga4_api_secret`). 결제 승인 CAS를 이긴 호출만 `purchase`를 보낸다. 전송 여부를 정하는 건 **`DEEPTYPE_GA4_MEASUREMENT_ID`(배포별 var)** 이고 빈 문자열이면 전송만 생략된다 — 시크릿은 두 배포가 공유한다. 어느 쪽이 비어도 결제·리포트는 영향받지 않는다. GA4에서 `purchase`를 **키 이벤트로 표시**해야 Ads 전환 가져오기가 가능하다.
10. **Discord**(선택) — 알림 웹훅 URL → Secrets Store(`account-vibe` HCP 변수 `deeptype_discord_webhook`). 빈 값이면 알림 no-op. Discord에는 구매·결제 식별자를 보내지 않고 이벤트 종류만 보낸다.

> **drizzle-kit push**는 Hyperdrive를 우회해 해당 환경의 Supabase session pooler에 `vibe_migrator`로
> 붙는다. 런타임은 direct-origin Hyperdrive를 통해 그 환경의 `sobok_runtime`만 사용한다.

---

## 3. Config 채우기(placeholder 치환)

- `apps/database/wrangler.jsonc`
  - top-level과 `env.stg`의 fresh/cached ID = `account-database.hyperdrive_ids`
  - Payments binding, Vibe Queue consumer, backend vars와 Secrets Store binding은 모두 이 config에 둔다.
  - `vars.DEEPTYPE_PAY_PROFILE` = top-level `production`, `env.stg` `staging`. 빌드 쪽 짝은 각 배포
    workflow가 직접 주입하는 `NEXT_PUBLIC_DEEPTYPE_PAY_PROFILE`이며 비어 있거나 다른 값이면 빌드가 실패한다
  - `vars.DEEPTYPE_REPORT_MODEL` = `claude-haiku-4-5-20251001`처럼 별칭이 아닌 검증된 고정 model id. 내레이션의 목적지이자 스위치라 `""`면 내레이션이 꺼진다(GA4 measurement id와 같은 모양) — 코드에 기본 모델은 없다
  - `vars.DEEPTYPE_PUBLIC_ORIGIN` / `DEEPTYPE_EMAIL_FROM` / `DEEPTYPE_EMAIL_REPLY_TO`가 실제 프로덕션 값인지 확인
  - `vars.DEEPTYPE_GA4_MEASUREMENT_ID` = `src/constants.ts`와 GTM lookup의 production 값과 일치
- `apps/vibe/wrangler.jsonc`에는 static assets와 환경별 `DATABASE` Service Binding만 둔다.
- **프론트 sitekey**: `apps/vibe/src/constants.ts`의 `TURNSTILE_SITE_KEY`가 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`를 읽고, 배포 workflow가 저장소 변수 `VIBE_TURNSTILE_SITE_KEY`를 직접 주입한다(값이 비면 빌드가 실패한다). 이 sitekey와 서버 `vibe-turnstile-secret`은 **같은 위젯 짝**이어야 함.
- **프론트 profile**: 같은 파일의 `PAY_PROFILE`이 `NEXT_PUBLIC_DEEPTYPE_PAY_PROFILE`을 읽는다.
  `production`/`staging` 둘 중 하나가 아니면 빌드가 실패한다. CI에서는 `deploy-app` composite action의
  `target` 입력을 그대로 사용한다(등록할 GitHub 변수 없음). 로컬은 `.env.local`에 `staging`.
- **중앙 채널 카탈로그**: Store ID와 배포별 channel entry는 `apps/payments/wrangler.jsonc`에서
  관리한다. 각 entry는 `channelKey`·`mode`·제품 `scopes`를 가지며, Vibe의
  `SELLABLE_CHANNELS[profile]`과 해당 환경에서 `vibe` scope로 보이는 채널 집합이 일치해야 한다.

---

## 4. 스키마 push & 배포

Staging은 브랜치 통합 workflow가 schema를 Worker보다 먼저 자동 반영한다. Production은 제품별 수동
workflow에서 먼저 plan하고 별도 apply 실행으로 반영한 뒤 앱 배포 workflow를 수동 실행한다. 어느
환경에서도 `--force`를 사용하지 않는다. 전체 순서는
[`docs/operations/product-releases.md`](../../docs/operations/product-releases.md)를 따른다.

로컬에서는 정적 검증만 수행한다. 운영 schema 반영은 GitHub Actions의 schema workflow에서만 수행한다.

```bash
cd apps/vibe
bun run type # next typegen && tsc(프론트) && tsc(worker) — 0 이어야 함
```

---

## 4.1 스테이징(기능·결제 QA) 배포

**PR을 여는 것만으로는 배포되지 않는다.** 스테이징의 유일한 소스는 보호된 `staging` 브랜치다.
일반 경로는 PR을 `staging`에 병합하는 것이고, repository admin은 긴급하거나 작은 통합 변경일 때
정상 fast-forward push로 change gate를 우회할 수 있다. 일반 collaborator는 계속 PR과 필수 체크를
거쳐야 한다. 관리자도 force-push와 브랜치 삭제는 할 수 없다.

두 경로 모두 branch push event가 발생하면 `.github/workflows/staging-deploy.yml`이 브랜치 전체를 한
릴리스로 배포한다. 순서는 다음과 같다.

1. Environment나 secret 없이 Biome, Prettier, repository-wide TypeScript 검증을 실행한다.
2. `staging` Environment의 제품별 최소 권한 migrator로 staging 프로젝트의 `stella`와 `deeptype` schema를 조정한다.
3. 중앙 `payments-stg`를 배포한다.
4. Stella와 Vibe를 병렬로 빌드해 각각의 staging Worker를 배포한다.

preflight가 실패하면 staging Environment와 DB migrator secret에 접근하지 않는다. DB 단계가 실패하면 어떤
Worker도 배포하지 않고, payments가 실패하면 제품 Worker도 배포하지 않는다.
새 `staging` 커밋이 들어와도 SQL 적용 중인 run은 취소하지 않는다. `concurrency: sobok-staging`과
GitHub의 기본 single pending slot을 사용해 현재 실행은 끝까지 완료하고, 대기 중인 커밋은 가장 최신
하나로 교체한다. 따라서 중간 커밋을 모두 순차 배포하지 않으면서도 drizzle 실행을 중간에 끊지 않고
최종적으로 브랜치 최신 통합 상태에 수렴한다.

재실행은 Actions의 **Staging Deploy**에서 ref를 `staging`으로 골라 수동 실행한다. 워크플로 자체가
다른 ref를 거부하고, `staging` GitHub Environment도 `staging` 브랜치만 허용한다. 현재 배포된 commit과
상태는 저장소의 Deployments 및 해당 workflow run에서 확인한다.

- **관리자 직접 push는 명시적인 편의 경로다.** `staging-change-gate`의 Admin `always` bypass가 정상
  fast-forward update를 허용한다. `exempt`가 아니라 GitHub의 bypass 평가 경로를 사용하지만 확인
  대화상자가 뜨는 임시 권한은 아니다. 역할 기반 허용이므로 일상 경로는 계속 PR로 유지한다. push가
  수락된 뒤 preflight가 실패하면 Worker와 DB는 그대로지만 `staging` branch는 실패한 commit을 가리킨다.
  이때도 force-push하지 않고 후속 fix 또는 revert commit으로 복구한다.
- **history 보호는 별도다.** bypass actor가 없는 `staging-history`가 deletion과 non-fast-forward를
  차단하므로 change gate를 우회해도 force-push나 브랜치 삭제는 허용되지 않는다.
- **DB는 하나의 staging 릴리스 상태다.** staging 프로젝트의 `stella`와 `deeptype`도 `staging` 브랜치 최신 커밋과 함께
  전진한다. 파괴적 변경이나 rename처럼 판단이 필요한 변경은 자동 승인하지 않고 run을 실패시킨다.
- `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID`·`STELLA_MIGRATOR_URL`·
  `VIBE_MIGRATOR_URL`은 `staging` Environment에 둔다. Schema matrix는 제품에 맞는
  DB secret 하나만 `SOBOK_MIGRATOR_URL`로 주입한다.
- production schema와 앱 배포는 `main`에서 각각 수동 실행하고 둘 다 `production`
  Environment를 사용한다. Schema job만 제품별 DB secret을 참조하며 앱 배포 workflow에는
  DB URL을 전달하지 않는다.

**PR에서 도는 것은 검증뿐이다.** `lint.yml`의 `Release builds`가 네 앱을 명시적으로 빌드하고 Vibe의
`check:export`까지 수행한다. 이 job에는 GitHub Environment를 붙이지 않는다.

⚠️ **PR build에 GitHub Environment를 붙이지 마라.** `pull_request`는 PR 브랜치의 워크플로 파일을
실행하므로, environment를 붙이는 순간 PR job이 환경 시크릿을 쥘 수 있다. 같은 이유로 레포 레벨
`CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID`·`STELLA_MIGRATOR_URL`·
`VIBE_MIGRATOR_URL`은 존재하면 안 된다. 값은 보호된 `production`/`staging`
Environment에만 둔다.

이 경계가 **보장하는 것과 보장하지 않는 것**을 정확히:

- **보장** — 모든 PR에서 도는 product build는 Cloudflare와 DB migrator 크레덴셜을 쥐지 않는다.
- **보장** — staging 크레덴셜은 보호된 `staging` 브랜치의 통합 워크플로만 받고, secret 없는
  preflight가 먼저 통과한다. PR head에서 staging deployment job을 직접 실행하는 경로는 없다.
- **보장하지 않음** — Cloudflare API token의 `Workers Scripts: Edit`은 스크립트 하나로 좁힐 수 없다.
  따라서 `staging`에 변경을 병합하거나 관리자 fast-forward push를 할 수 있는 사람과 브랜치 보호가
  신뢰 경계다.
- 그리고 **스테이징은 저가치 환경이 아니다.** `env.stg`는 실연동과 같은 Anthropic 키·Resend
  키·Discord 웹훅·GA4 시크릿을 바인딩하고 `payments-stg`를 통해 테스트 거래를 제어한다. 데이터와
  자격증명은 production과 다른 Supabase 프로젝트·Hyperdrive·migrator URL로 격리하지만,
  `staging` 브랜치 병합과 관리자 fast-forward push 권한은 여전히 실제 배포 권한이다.

**코드 롤백**은 정상 revert commit을 `staging`에 올려 같은 전체 파이프라인으로 재배포한다. 이 방식은
Payments, Database Worker, 공개 앱 Worker와 schema 선언의 source revision을 다시 일치시킨다. Cloudflare의 즉시 Worker
rollback은 장애 완화용일 뿐이며 DB schema를 되돌리지 않으므로 이후 반드시 Git revert로 수렴시킨다.

최초 custom domain 프로비저닝 전에도 로컬 deploy 대신 **Staging Deploy**를 먼저 실행한다.

- **순서 불변식**: 커스텀 도메인은 **이미 존재하는 Worker**에만 붙는다. 첫 Staging Deploy보다
  `account-vibe` apply를 먼저 돌리면 `404 This Worker does not exist on your account.`로 실패한다
  (프로덕션 `vibe`도 같은 전제다). 배포와 apply 사이에는 워커가 잠시 도달 불가 상태로 존재하는데,
  정상이다.
- **도메인 소유자는 Terraform 하나뿐이다.** `wrangler.jsonc`에는 top-level에도 `env.stg`에도 `routes`를 두지 않는다 — 양쪽에 선언하면 같은 바인딩에 주인이 둘이 된다.
- **채널 모드는 중앙 카탈로그 entry로만 정한다.** `/checkout`이 scope를 검증해 채널 키를 내리는
  유일한 지점이고, production의 테스트 카드는 심사 기간에만 명시적으로 둔다. 런타임 플래그나
  쿼리 파라미터로 test/live를 바꾸지 않으며 승인 즉시 같은 entry를 실연동으로 교체한다.
- Database Wrangler의 `vars`·`hyperdrive`·`services`·`queues`·`secrets_store_secrets`는 비상속이라
  `env.stg`에 완전 선언한다. 공개 Vibe Wrangler는 assets와 `DATABASE` binding만 갖는다.
- **Turnstile**: Cloudflare의 always-pass 더미 시크릿은 `hostname`을 `example.com`으로 돌려주므로 이 검증기를 통과할 수 없다(`packages/edge/src/turnstile.ts`). 스테이징도 **실제 vibe 위젯**을 쓰고, `vibe-stg.sobok.cc`를 위젯 Hostname Management에 등록해야 한다. `vibe.sobok.cc`의 서브도메인이 아니라 형제 호스트라 자동 커버되지 않는다.
- **GA4**: 스테이징은 `DEEPTYPE_GA4_MEASUREMENT_ID`가 빈 문자열이라 `confirmPurchase`가 Measurement Protocol 전송을 건너뛴다. 킬스위치는 **목적지이지 크레덴셜이 아니다** — 시크릿은 프로덕션과 같은 것을 바인딩하고 보낼 곳이 없어서 안 보낸다. 테스트 결제는 프로덕션 매출 지표에 잡히지 않는다. 브라우저 GTM은 hostname 룩업으로 property를 고르므로 `vibe-stg.sobok.cc`를 룩업 테이블에 넣지 않는 편이 안전하다.
- **scheduler가 두 환경을 각각 호출한다** — `database`와 `database-stg`의 `VibeMaintenance`가 같은
  주기에 각자 production/staging project를 정리한다(E2E F가 이걸 검증한다).

---

## 5. 스테이징 E2E 테스트 플랜(돈이 걸린 경로 우선)

> `vibe-stg` + `database-stg` + PortOne 테스트 채널 + 실제 Vibe Turnstile 위젯 + staging의
> `deeptype` schema로 수행한다. 각 단계는 DB 행 상태와 Discord 알림을 함께 확인한다.

**A. 정상 결제 → 리포트 → 열람**

1. 무료 테스트 완주 → 정확히 50개 원응답으로 `POST /session` 201, Worker 산출 코드·프로필과 `deeptype_result` 1행 확인.
2. 페이월에서 Turnstile 통과 → `POST /checkout` 200(토큰 없으면 거부되는지 음성 케이스도 확인).
3. PortOne 테스트 결제 완료 → `/deep-type/checkout-return` 복귀 → `POST /verify` 200, `deeptype_purchase.status = paid`, **금액이 서버 기대값과 일치**.
4. 중앙 payments 웹훅 수신 → Vibe Queue 전달 → `deeptype_webhook_event` 기록. 같은 event ID를
   재전달해도 중복 지급이 없는지 확인한다.
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
3. 카드를 고르면 `CARD` + 토스페이먼츠 채널로 열리는지 확인한다(카드는 `ko` 전용이고 bypass 없이 열린다).
4. 토스페이 결제 만료(기본 15분) 뒤 복귀하면 `pending`으로 남고 `*/15` 재조정이 정리하는지 확인한다.
5. 토스페이 결제 건에 청약철회(`POST /cancel`)를 걸어 전액취소가 반영되는지 확인한다.

**J. 페이팔(SPB)·모바일 복귀**

1. EN·JA·ZH에서 폼 제출 → `/checkout` 승인 → 결제하기 버튼 자리에 페이팔 버튼이 나타나고 그동안 폼 입력이 잠기는지 확인한다. `돌아가기`를 누르면 폼이 다시 열리고 pending 행이 `*/15` 재조정으로 수렴하는지도 본다.
2. 페이팔 샌드박스 구매자 계정으로 승인·거절·창 닫기 세 경로를 확인한다. 거절과 닫기는 attempt 단위라 버튼이 남고 다시 눌러 완료할 수 있어야 한다. 금액·통화는 EN·ZH = **USD 4.98**, JA = **JPY 698** — PortOne `totalAmount`는 minor unit이라 USD는 `498`로 실려야 한다.
3. 승인 후 `/verify`가 `paid`를 주고 24문항으로 이어지는지, `deeptype_purchase.method`·통화·금액이 맞게 남는지 확인한다. GA4 `purchase`의 `value`는 major unit(4.98)이어야 한다.
4. iOS Safari·Android Chrome에서 SPB 팝업 완료가 콜백으로 돌아오는지 확인한다(SPB는 리디렉션이 아니라 PC·모바일 모두 UI 방식이다). `ko` 창 결제는 기존대로 `/deep-type/checkout-return` 복귀를 확인한다.
5. 결제 복귀 탭의 세션 저장소가 없거나 만료된 경우 구매 이메일 재열람 경로로 복구할 수 있는지 확인한다.

---

## 6. 라이브 전환 체크리스트

- [ ] Phase 0 산출물 전부 존재(Supabase Pro 프로젝트×2·Hyperdrive×4·Vibe 전용 Secrets Store 항목 5개·중앙 payments
      Worker·Vibe Queue/DLQ·PortOne API Secret 1개·Webhook Secret 2개·Turnstile·PortOne 대표 Store).
- [ ] **CI 크레덴셜 경계** — `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID`·
      `STELLA_MIGRATOR_URL`·`VIBE_MIGRATOR_URL`은 `production`·`staging`
      Environment에만 있고 레포 레벨에는 없음.
- [ ] `sobok-ops`의 `staging-history`·`staging-change-gate` ruleset과 `staging` Environment branch
      policy 적용 완료. Admin fast-forward push는 허용되고 force-push·삭제는 차단됨.
- [ ] `account-secrets-store`의 Supabase CA가 생성되고 네 Hyperdrive가 같은 CA id와
      `sslmode=verify-full`을 사용함.
- [ ] `sobok-production`·`sobok-staging`의 database module이 `deeptype` 현재 object grant와 future default privileges를 적용 완료.
- [ ] `wrangler.jsonc` placeholder 전부 치환, `DEEPTYPE_REPORT_MODEL`은 검증된 고정 id(내레이션의 목적지이자 스위치 — `""`면 룰 엔진 리포트만 나간다).
- [ ] Database Wrangler의 top-level `vars`·service·queue·Hyperdrive·secret이 `env.stg`에도 완전 선언됐는지.
- [ ] 중앙 `PORTONE_CHANNELS`의 각 entry에 올바른 `mode`와 `vibe` scope가 있고, 해당 환경에서
      Vibe에 보이는 채널 집합이 `SELLABLE_CHANNELS[profile]`과 정확히 같음 —
      `GET /api/deep-type/config`의 `unbound`·`unsold`가 둘 다 빈 배열이고 출시 로케일 메뉴가 비어
      있지 않음. 심사 기간 production은 토스페이 `live` + 토스페이먼츠 `test`가 의도된 조합이다.
- [ ] 배포된 페이월의 결제수단이 `GET /api/deep-type/config`의 `payMethods`와 일치(빌드 리터럴
      profile ↔ 워커 var profile 정합 확인).
- [ ] 저장소 변수 `VIBE_TURNSTILE_SITE_KEY` = vibe 위젯 sitekey, 서버 `vibe-turnstile-secret` = 그 위젯의 secret(짝 일치), 위젯 호스트네임에 `vibe.sobok.cc`·`vibe-stg.sobok.cc` 둘 다 등록.
- [ ] PortOne 콘솔 기본 웹훅 URL이 **모드별 중앙 URL**로 등록(실연동 =
      `payments.sobok.cc/webhooks/portone`, 테스트 = `payments-stg.sobok.cc/webhooks/portone`)되고 서명값이
      각각 `portone-webhook-secret-live`·`portone-webhook-secret-test`에 들어감.
- [ ] 토스페이 실연동 MID의 **원천사 심사 완료** 확인. 토스페이먼츠 카드 승인 직후 production
      entry를 실연동 channel key + `mode: "live"`로 교체. 페이팔은 **본인 PayPal Business 계정을
      실연동 채널에 연결**하고 그 커밋에서 `SELLABLE_CHANNELS.production`과 중앙 production
      카탈로그에 `paypal_v2`를 함께 추가.
- [ ] Resend 발신 도메인 검증, SPF/DKIM/MX 정상, 인증 메일 클릭·오픈 추적 비활성.
- [ ] Google 유럽/미국 메시지 게시 및 Consent Mode 광고·분석 통합 활성.
- [ ] GTM 컨테이너 v3 import·게시 완료(`Consent Mode - 지역별 기본값` + 전자상거래 태그 4종), GA4에서 `purchase` 키 이벤트 표시.
- [ ] `bun run type` = 0, staging 자동 schema push 완료, production schema plan/apply 후 앱 수동 배포 완료.
- [ ] 스테이징 E2E A–L 통과(특히 B/C/D/H/J/K/L — 돈·멱등·환불·재열람·페이팔/모바일 결제·측정·토스페이).
- [ ] Discord 알림 채널 수신 확인.
- [ ] `wrangler deploy` 후 스모크: `/config` 200, 무료 세션 200, 소액 실결제 1건 → 환불로 정리.
- [ ] `scheduler` Worker의 account-wide Cron Trigger 2개 활성(`*/15`, `0 3`), 공개 Vibe Worker의 Cron
      Trigger는 0개.

---

## 7. 관측·운영

- **알림**: 웹훅 금액 불일치, 리포트 생성 실패 시 Discord로 이벤트 종류만 통지(식별자는 제한된 Worker 로그에서 확인, 웹훅 URL 빈 값이면 조용히 비활성).
- **재조정**: 공용 scheduler의 `*/15` trigger가 Database Worker의 `VibeMaintenance`를 호출해 pending을
  PortOne 재조회로 마감한다.
- **리텐션**: 공용 scheduler의 `0 3` trigger가 Database Worker의 `VibeMaintenance`를 호출해 미전환 결과와
  pending/failed 구매 30일, 완료 리포트의 원본·심화 응답 3개월, 원본 웹훅 90일을 기준으로 정리한다.
  결제 1년 뒤 이메일·접근 토큰·파생 결과·리포트를 삭제하고 최소 거래 기록만 5년까지 보관한 뒤
  삭제한다. 일회용 재열람 토큰은 만료 즉시 다음 purge에서 삭제한다.
- **재열람 보안**: 메일 링크는 15분·1회용 SHA-256 해시로 저장한다. 원본 토큰은 URL fragment에 두고, 화면에서 명시적으로 열기를 누르기 전에는 교환하지 않는다.
- **결제 복귀 보안**: PortOne의 결제 id만 복귀 쿼리로 받고 즉시 URL에서 제거한다. 리포트 access token은 URL에 넣지 않고 탭 한정 `sessionStorage`에 최대 1시간 보관하며, 복귀 페이지에서는 **AdSense를 로드하지 않는다**(GTM은 측정 연속성 때문에 로드된다 — I-5 참고).
- **환불 불변식**: `viewed_at != null`이면 환불 거부(청약철회 = 콘텐츠 미열람 한정).
- **결제수단별 환불 기한**(카드·간편결제는 사실상 제약 없음): **휴대폰 소액결제는 당월 거래만 PG 취소 가능**하고 익월부터는 취소가 실패한다(납부 완료 시에는 PG가 아예 못 지운다). 실시간 계좌이체는 약 3개월이다. 우리 정책은 미열람이면 언제든 전액 환불이고 재열람 링크가 1년이라, 결제만 하고 심화 문항을 마치지 않은 구매자가 기한을 넘겨 환불을 요청하면 `POST /cancel`이 실패한다 — 화면은 `refundFailed`로 고객센터를 안내하고, 그 뒤는 **수동 송금**이다. 그래서 두 수단은 페이월 목록에서 맨 뒤에 두어 기본 선택이 되지 않게 한다.
- **캐시 주의**: 돈·엔티틀먼트는 반드시 `HYPERDRIVE_FRESH`(캐시 비활성)로만 조회/쓰기. 완료 리포트 본문 등 불변 데이터만 `HYPERDRIVE_CACHED` 사용.
