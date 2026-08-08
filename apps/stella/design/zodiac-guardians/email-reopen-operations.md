# 결제 완료 메일·리포트 재열람 운영 Runbook

Stella 한국 유료 MVP의 결제 완료 메일과 구매 이메일 기반 재열람 기능을 환경에 반영하고 검증하는
절차다. 제품 흐름과 API의 상위 계약은
[한국 전체 리포트 결제·공개 수직 슬라이스](./korea-paid-report-vertical-slice.md)를 따른다.

## 현재 상태

- 마지막 갱신: 2026-08-03
- 코드: 구현 및 정적 검증 완료
- 운영 인프라: `sobok-ops`에 환경별 Resend secret 선언 완료, apply 대기
- 데이터베이스: 새 enum·테이블 선언 완료, `stella_stg`·`stella` 반영 대기
- 외부 설정: `stella.sobok.cc` Resend 발신 도메인 확인과 환경별 API key 생성 필요
- 실제 검증: PortOne 테스트 결제부터 이메일 수신·재열람까지 staging E2E 필요

## 구현된 계약

### 결제 완료 자동 발송

전체 리포트의 `paid` 전환과 entitlement 지급 트랜잭션에서
`guardian_recovery_email_delivery` 행을 한 번만 만든다. 실제 Resend 호출은 커밋 뒤 실행한다.

- 브라우저 confirm과 중앙 결제 Queue 이벤트는 즉시 발송을 시도한다.
- 즉시 실행이 중단되거나 일시 실패해도 공용 scheduler의 15분 reconciliation이 대기 중이거나 lease가
  만료된 발송을 다시 가져간다.
- 최대 5회 시도하며 provider가 수락하면 `sent_at`과 `provider_message_id`를 기록한다.
- secret을 읽을 수 없는 상태는 구매를 실패시키거나 시도 횟수를 소모하지 않는다.
- 메일에는 상품명, 금액, 구매일, 주문 번호와 리포트 링크를 담는다.

### 1회용 링크 교환

- 링크는 256-bit 난수 token이며 15분 동안 한 번만 사용할 수 있다.
- URL fragment에 token을 넣어 최초 문서 요청, 서버 access log, referrer에 실리지 않게 한다.
- 재열람 화면은 fragment를 즉시 주소창에서 지우고 사용자의 명시적인 버튼 입력 뒤 교환한다.
- DB에는 SHA-256 digest, 만료 시각, 사용 시각만 저장한다.
- 교환 성공 트랜잭션은 token을 소비하면서 collection capability를 새 값으로 교체한다.
- `draft` 리포트는 유료 질문으로, `fulfilled` 리포트는 완성 결과로 이동한다.

### 구매 이메일 재발급

`POST /api/guardian-reopen/request`는 구매 존재 여부와 무관하게 같은 `202 accepted`를 반환한다.
구매 조회와 메일 발송은 응답 뒤 실행해 응답 시간으로도 구매 여부를 구분하기 어렵게 한다.

- Turnstile action: `guardian-reopen`
- IP 제한: 시간당 5회, 분당 2회
- 이메일별 재발급 간격: 5분
- 한 메일에 최근 paid 전체 리포트 최대 5개
- 사용됐거나 만료된 token은 기존 일일 retention purge에서 삭제

## 환경 설정

### Resend

1. 발신 도메인 `stella.sobok.cc`를 추가하고 Resend가 제시한 SPF·DKIM 레코드를 DNS에 반영한다.
2. open tracking과 click tracking은 활성화하지 않는다. 1회용 URL을 tracking URL로 재작성하지 않기
   위해서다.
3. `Sending access`와 `stella.sobok.cc` domain restriction으로 키를 두 개 만든다.

| Resend API key 이름 | HCP `account-stella` sensitive 변수 | Secrets Store 항목                 |
| ------------------- | ----------------------------------- | ---------------------------------- |
| `stella-staging`    | `stella_resend_api_key_staging`     | `stella-resend-api-key-staging`    |
| `stella-production` | `stella_resend_api_key_production`  | `stella-resend-api-key-production` |

키 원문은 저장소, 문서, 채팅에 넣지 않고 HCP Terraform 변수에 직접 입력한다. Worker에서는 두 환경 모두
`STELLA_RESEND_API_KEY`라는 binding으로 읽지만 `wrangler.jsonc`가 환경별 Secrets Store 항목을 선택한다.

### 발신·링크 환경값

| 환경       | canonical origin              | 발신자                                     |
| ---------- | ----------------------------- | ------------------------------------------ |
| staging    | `https://stella-stg.sobok.cc` | `Stella Staging <reports@stella.sobok.cc>` |
| production | `https://stella.sobok.cc`     | `Stella <reports@stella.sobok.cc>`         |

incoming Host header로 메일 링크 origin을 만들지 않는다. 회신 주소는 `STELLA_EMAIL_REPLY_TO`로 별도
관리한다.

## 최초 반영 순서

1. Resend 발신 도메인의 DNS 확인을 완료한다.
2. 환경별 API key를 만들고 HCP `account-stella`의 두 sensitive 변수를 설정한다.
3. `sobok-ops`의 `account-stella` plan을 확인하고 apply해 Secrets Store 항목을 만든다.
4. 앱 변경을 `staging` 브랜치에 병합한다. `Staging Deploy`가 `stella_stg` schema의 안전한 변경을
   자동 push하고 payments, Stella, Vibe 순서로 배포한다. 로컬 Wrangler 배포는 하지 않는다.
5. 아래 staging 수직 흐름을 모두 확인한다.
6. PR을 `main`에 병합한다.
7. `Production Schema` workflow에서 Stella `plan`을 검토하고 별도 `apply` 실행으로 반영한 뒤
   `Production Deploy` workflow를 수동 실행한다.
8. 첫 production 구매의 발송 상태와 Worker log를 확인한다.

schema 반영이 Worker 배포보다 먼저다. 새 코드는 entitlement 트랜잭션에서 새 발송 테이블을 바로 쓰므로
테이블이 없는 환경에 먼저 배포하면 결제 확정이 실패한다.

## Staging 수직 확인

1. 새로운 이메일 주소로 무료 검사와 PortOne 테스트 결제를 완료한다.
2. 결제 확인 뒤 유료 질문 화면으로 이동하고 결제 완료 메일이 한 통 도착하는지 확인한다.
3. 메일의 상품명·3,900원·구매일·주문 번호와 `stella-stg.sobok.cc` 링크를 확인한다.
4. 링크를 열었을 때 주소창의 fragment가 사라지고 `내 리포트 열기` 버튼이 나타나는지 확인한다.
5. 버튼을 누르면 미완료 리포트는 기존 답변 다음 질문으로 이어지는지 확인한다.
6. 같은 링크를 다시 열면 사용 불가 안내와 새 링크 요청 화면이 나타나는지 확인한다.
7. 구매 이메일로 새 링크를 요청하고 도착한 링크로 다시 열 수 있는지 확인한다.
8. 존재하지 않는 이메일도 화면과 API에서 같은 접수 안내를 받되 메일은 오지 않는지 확인한다.
9. 질문을 완료한 뒤 새 링크를 발급하면 완성 결과로 바로 이동하는지 확인한다.

DB에서 운영 상태를 볼 때 이메일 원문이나 token을 조회·출력하지 않는다. 확인 대상은
`guardian_recovery_email_delivery.status`, `attempts`, `sent_at`, `provider_message_id`,
`last_error_code`로 제한한다.

## 관측 지점

Worker 구조화 로그:

- `stella.guardian_recovery_email.sent`
- `stella.guardian_recovery_email.failed`
- `stella.guardian_recovery_email.secret_unavailable`
- `stella.guardian_reopen_request.email_failed`

브라우저 analytics:

- `guardian_reopen_request_view`
- `guardian_reopen_requested`
- `guardian_reopen_link_view`
- `guardian_report_reopen`

`sent`는 Resend API가 메시지를 수락했다는 뜻이다. 실제 inbox delivery, bounce, complaint는 현재 DB
상태에 반영하지 않는다.

## 이번 범위 뒤에 남는 작업

- Resend가 제시하는 실제 DNS record를 `sobok-ops`의 DNS state에 선언
- staging·production schema 반영과 GitHub Actions 배포
- 실제 PortOne 테스트 결제·모바일 복귀·이메일 수신·질문 재개·결과 재열람 E2E
- 발송량과 고객 문의가 생긴 뒤 Resend delivery/bounce webhook과 운영 재발송 도구의 필요성 재평가
- account-owned collection의 이메일 token은 stable report reference만 반환하고 새 guest capability를
  발급하지 않는 코드가 구현됨. accounts/Stella schema·OIDC client 배포 뒤 staging에서 실제 재열람 확인
