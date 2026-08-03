# 한국 전체 리포트 결제·공개 수직 슬라이스

한국 사용자가 무료 출생 차트에서 두 질문으로 수호령 미리보기를 보고, 회원가입 없이 전체
리포트를 결제한 뒤 결제 후 개인화 질문에 답하고 네 장의 카드를 공개하는 첫 유료 수직 흐름의
구현 계약이다.

상품·가격·추첨·계정의 상위 결정은
[유료 카드 리포트 MVP와 확장 전략](./paid-mvp-product-strategy.md), 원화와 에디션 표현은
[카드 카탈로그](./card-catalog.md)를 따른다. 실제 화면과 API 경계는 이 문서를 기준으로 한다.

## 문서 상태

- 마지막 갱신: 2026-08-03
- 첫 시장과 로케일: `KR`, `ko`
- 첫 SKU: `guardian-report-full-v1`, 3,900원
- 결제 연동: PortOne V2 인증 결제
- 첫 실결제수단: 토스페이 직접 연동 `tosspay_v2`
- 후속 결제수단: 토스페이먼츠는 실결제 승인 뒤 활성화
- 현재 구현: 상품 매니페스트, 추첨, 게스트 컬렉션·리포트·구매·획득·보장 도메인,
  실제 한국어 선택형 질문 44개와 선택 메모 1개, 불변 콘텐츠 계약·DB·게시 CLI·답변별 저장과 현재 문항 계산,
  Turnstile·rate limit을 거치는 guest checkout, 중앙 payments를 통한 PortOne confirm·검증 이벤트, capability 기반 질문
  GET/PUT과 draft/fulfilled report GET API, 홈의 소형 상품 카드, 전용 공개 랜딩, 무료 미리보기·잠금 결과·checkout,
  결제 후 질문·12개 핵심 답변의 서버 중간 결과·적응형 질문·카드 공개·상세 웹 리포트, 공용 scheduler 기반
  15분 pending 결제 재조정
- 운영 반영: `stella_stg`·`stella` schema와 한국어 v1 문항 게시, PR #29의 production Worker 배포
- 아직 미연결: 이메일 복구 전송·재열람 토큰 교환, 보존 기간이 지난 미결제 checkout context 정리
- 아직 운영 검증하지 않음: PortOne 테스트 채널의 실제 결제·모바일 리디렉션·질문 재개·카드 공개 E2E
- 이 문서의 범위: 상품 랜딩 → 무료 질문 2개 → 잠금 미리보기·복구 이메일 → 결제 → 서버 검증 →
  핵심 질문 12개 → 중간 결과 → 적응형 질문 → 카드 공개 → 전체 웹 리포트

## 1. 왜 이 흐름이 다음 작업인가

이번 수직 슬라이스는 서버 도메인과 실제 구매 경험을 가장 짧은 하나의 경로로 연결한다. 계정,
재추첨, 수천 장의 카탈로그보다 먼저 첫 결제 전환과 카드 공개 경험을 검증한다.

첫 수직 슬라이스는 다음 질문에 가장 짧게 답한다.

- 무료 결과를 본 사용자가 미리보기 질문과 3,900원 결제까지 이동하는가
- 결제 후 개인화 질문을 끝내고 네 장을 공개하는 경험이 충분히 강한가
- 카드 공개 뒤 리포트를 끝까지 읽는가
- 결과를 다시 열 수 있는 게스트 접근 방식이 이해되는가
- 서버 검증과 카드 스냅샷이 중복 콜백에도 한 번만 생성되는가

### 포함

- 기존 무료 출생 차트 안의 소형 상품 CTA와 별도 `/[locale]/guardian-report` 공개 랜딩
- 랜딩의 상품 설명, 예시 원화, 진행 순서, FAQ와 직접 방문자의 무료 차트 생성 복귀 경로
- 무료 미리보기 질문 2개와 결제 전 유료 질문 분량·예상 시간 안내
- 결제 직전 필수 게스트 복구 이메일
- 게스트 컬렉션과 서버 가격의 pending 구매
- 전체 리포트 1개 SKU의 서버 가격
- PortOne 결제창과 모바일 리디렉션 복귀
- 브라우저 확인, 웹훅, 재조정의 서버 결제 검증
- 결제 확인 뒤 12개 핵심 질문, 개인화 중간 결과, 4~8개 적응형 선택 질문과 답변별 저장·재개
- 전체 답변 기반 기본 카드 선택
- 결제 후 네 카드의 순차 공개와 교차 주제 지도·차트 단서·상세 해석을 포함한 전체 웹 리포트
- 같은 브라우저에서 새로고침·재접속했을 때 같은 결과 복구

### 제외

- Stella 계정과 게스트 컬렉션 귀속
- 사랑 카드 재추첨 구매와 보장 카운터 UI
- 카카오 로그인·알림톡
- 중국 본토 결제
- PDF, 공개 공유 페이지, 카드별 댓글
- production 출시용 최소 1,024장 카탈로그와 계절·의상 확장

제외 항목을 위한 별도 임시 모델은 만들지 않는다. 현재 컬렉션, 리포트 스냅샷, 구매, 획득 이력
구조를 그대로 사용하고 이후 경로만 연결한다.

## 2. 권위 경계

다음 원칙은 구현 편의보다 우선한다.

- 브라우저는 무료 차트 계산, 표시된 질문 답변, 결제수단, PortOne 결제창 실행만 담당한다.
- SKU 가격, 통화, 시장, 주문명, 채널 키와 `paymentId`는 서버가 결정한다.
- 유료 질문 원문·선택지·적응형 선택 정책·점수는 Git JSON으로 관리하되 Next 정적 export에는 묶지 않는다.
  서버는 확인된 유료 entitlement에 다음 질문만 전달한다.
- 브라우저의 결제 성공 응답이나 리디렉션 파라미터는 카드 지급 근거가 아니다.
- 서버가 PortOne 결제 조회 결과의 상태, 금액, 통화를 로컬 pending 구매와 비교한다.
- 결제 확인은 paid questionnaire 접근 권한만 연다. 유료 질문이 완료되기 전에는 카드 패밀리나
  에디션을 선택하지 않는다.
- 전체 답변을 받은 뒤 서버가 기본 패밀리를 안정적으로 선택하고 사랑 희귀도를 한 번만 추첨한다.
- 12개 핵심 답변 뒤의 중간 결과는 서버가 현재 답변과 리포트 규칙으로 만들고, 브라우저가 임의로
  진도를 건너뛸 수 없도록 확인 상태를 report별 milestone 행에 저장한다.
- 최종 카드 스냅샷·획득 이력 저장은 하나의 DB 트랜잭션이다.
- 브라우저 확인, 웹훅, 재조정은 모두 같은 멱등 구매 확정 함수를 호출한다.
- 결과 화면은 콜백 응답에 들어 있던 임시 카드가 아니라 저장된 리포트 스냅샷을 조회한다.

질문 콘텐츠의 Git source와 런타임 전달 경계, 운영 절차는
[유료 질문 콘텐츠 계약과 게시](./paid-questionnaire-content.md)를 따른다.

PortOne도 인증 결제의 금액 등이 브라우저에서 처리되므로, 성공한 `paymentId`를 서버로 보내 결제
조회 API의 상태와 실제 금액을 검증하도록 요구한다.

- [PortOne V2 인증 결제 연동](https://developers.portone.io/opi/ko/integration/start/v2/checkout)
- [PortOne V2 웹훅 연동](https://developers.portone.io/opi/ko/integration/webhook/readme-v2?v=v2)

## 3. 전체 흐름

```mermaid
sequenceDiagram
  actor U as 사용자
  participant B as Stella 웹
  participant W as Stella Worker
  participant D as stella DB
  participant X as Sobok payments
  participant P as PortOne

  U->>B: 홈 상품 카드에서 전용 랜딩 진입
  B-->>U: 상품 설명·예시 원화·진행 순서
  U->>B: 미리보기 질문 2개
  B-->>U: provisional sealed 미리보기
  U->>B: 가격 확인·구매 선택
  U->>B: 복구 이메일 입력
  B->>W: 무료 컨텍스트와 checkout 생성
  W->>D: collection + 복구 이메일 + pending purchase
  W-->>B: paymentId + guest capability + 결제창 설정
  B->>P: requestPayment

  par 브라우저 복귀
    P-->>B: paymentId 또는 오류
    B->>W: 결제 확인 요청
    W->>X: paymentId 결제 단건 조회
    X->>P: 결제 단건 조회
    P-->>X: 상태 + 금액 + 통화
    X-->>W: 정규화된 결제 상태
  and 웹훅
    P->>X: 서명된 결제 이벤트
    X->>P: 결제 단건 조회
    P-->>X: 상태 + 금액 + 통화
    X-->>W: 검증된 Stella Queue 이벤트
  and 누락 복구
    W->>X: 15분 pending 결제 재조회
  end

  W->>D: paid + questionnaire entitlement
  W-->>B: 유료 질문 접근 가능
  loop 네 주제의 핵심 질문 12개
    B->>W: 답변 저장·다음 질문 요청
    W->>D: versioned answer map 갱신
    W-->>B: 다음 한 문항
  end
  W-->>B: 핵심 답변 기반 개인화 중간 결과
  U->>B: 중간 결과 확인
  B->>W: milestone 확인 저장
  W->>D: report + milestone acknowledgement
  loop 답변에 따라 선택된 적응형 질문 4~8개
    B->>W: 답변 저장·다음 질문 요청
    W->>D: versioned answer map 갱신
    W-->>B: 다음 한 문항 또는 완료
  end
  W->>D: 패밀리 선택 + 사랑 희귀도 추첨 + snapshot + acquisitions
  B->>W: 권한 있는 리포트 조회
  W-->>B: 동일한 네 카드 snapshot
  B-->>U: 네 장 순차 공개 → 전체 리포트
```

동시에 여러 확인 경로가 도착해도 구매 행 잠금과 `entitlementGrantedAt`을 기준으로 유료 질문
접근은 한 번만 열린다. 중간 결과 확인과 카드 선택·추첨은 각각 report 행을 잠그고 한 번만
실행한다. 나머지 호출은 저장된 milestone, 질문 진행 상태나 최종 결과를 반환한다. PortOne에서 결제는
완료됐지만 DB 트랜잭션이 실패했다면 로컬 구매는 `pending`으로 남고 웹훅이나 재조정이 다시
확정한다.

## 4. API 경계

경로 이름은 구현 시 다음 형태를 기본값으로 사용한다.

| API                                                        | 권한                 | 책임                                                                                 |
| ---------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `POST /api/guardian-checkouts`                             | Turnstile·rate limit | 무료 컨텍스트·이메일 검증, collection·pending 구매 생성·재사용                       |
| `POST /api/guardian-purchases/:paymentId/confirm`          | 게스트 capability    | PortOne 원격 상태 조회, paid entitlement·questionnaire draft 생성                    |
| `GET /api/guardian-reports/:reportPublicId`                | 게스트 capability    | 유료 질문 진행 메타데이터 또는 fulfilled 결과 조회                                   |
| `GET /api/guardian-reports/:reportPublicId/question`       | paid capability      | 현재 session에서 허용된 다음 한 문항 조회                                            |
| `PUT /api/guardian-reports/:reportPublicId/answers/:id`    | paid capability      | 한 답변 저장, 다음 맞춤 문항 계산, 마지막 답변이면 카드 선택·report fulfillment 수행 |
| `PUT /api/guardian-reports/:reportPublicId/milestones/:id` | paid capability      | 현재 중간 결과 확인을 멱등 저장하고 다음 적응형 문항 반환                            |

### 무료 미리보기와 결제 컨텍스트

- 무료 질문 2개의 provisional 미리보기는 브라우저에서 만들고 DB 행이나 capability를 생성하지
  않는다.
- provisional 미리보기는 태양 별자리 수호령과 답변별 로케일 문구만 조합하며 서버의 production
  패밀리 scorer를 브라우저에 복제하지 않는다.
- checkout은 `locale`, 무료 결과에서 이미 계산한 정규화된 차트 핵심값, 무료 답변 ID와 복구
  이메일만 받는다.
- 생년월일·시간·장소를 다시 묻거나 purchase context에 원본 출생 프로필로 저장하지 않는다. 계정 보관을
  선택하는 후속 단계에서만 원본 프로필을 별도로 저장한다.
- 출생 시간을 모르는 결과에는 하우스와 각도 값을 보내지 않는다. 서버는 없는 값을 추정하지 않는다.
- 출생 시간을 모르면 `moonLongitudeRange`를 함께 보내고, 시간을 아는 결과에서는 이 값을 `null`로
  보낸다. 이후 scorer가 정오 달 위치를 확정값으로 오인하지 않게 `timeKnown`도 snapshot에 고정한다.
- 미결제 purchase context는 짧은 보존 기간 뒤 pending 구매와 함께 삭제한다.

### Checkout

- 첫 수직 슬라이스에서는 `guardian-report-full-v1`만 허용한다.
- `market=KR`, `currency=KRW`, `amount=3900`은 저장된 매니페스트에서 읽는다.
- checkout 생성 요청에서 복구 이메일을 필수로 받고 trim과 형식 검증을 적용한다. 전달용 값과
  비교용 소문자 값을 구매에 연결한다.
- 입력란에는 `영수증과 재열람 링크를 보내드려요 · 계정 생성 아님`을 바로 표시한다. 비밀번호,
  전화번호, 마케팅 동의를 함께 요구하지 않는다.
- `paymentId`는 서버가 짧은 ASCII ID로 생성한다. 제품 구분이 가능한 `st_` 접두사를 사용한다.
- 같은 무료 컨텍스트와 collection에 활성 pending 구매가 있으면 새 행을 만들지 않고 기존 checkout을
  돌려준다.
- 아직 결제되지 않은 기존 pending 구매에서는 사용자가 다시 제출한 복구 이메일로 갱신할 수 있다.
  `paid` 이후에는 checkout 재시도로 구매 이메일을 바꾸지 않는다.
- PortOne은 같은 `paymentId`로 여러 결제 시도를 허용하고 최종 성공은 한 번만 허용하므로,
  결제창 이탈 뒤 같은 pending checkout을 다시 열 수 있다.
- 브라우저는 결제창을 열기 전에 `paymentId`, collection capability를 `sessionStorage`에
  저장해 모바일 리디렉션 뒤 복구한다.

신규 `POST /api/guardian-checkouts` 요청은 다음 필드만 받는다.

| 필드             | 계약                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| `locale`         | 공용 `Locale` 계약을 사용하며 해당 로케일에 게시된 상품 콘텐츠가 있어야 함 |
| `chart`          | `timeKnown`, 정규화된 행성 경도, 각도·하우스, 시간 미상 시 달 경도 범위    |
| `previewAnswers` | `tone`, `movement`의 공개 선택지 ID                                        |
| `email`          | trim·형식·254자 제한을 통과한 복구 이메일                                  |
| `turnstileToken` | action이 `guardian-checkout`인 solve                                       |

`chart.planets`는 태양~명왕성, 남·북노드, 릴리트, 키론을 모두 포함하고 출생 시간을 아는
경우에만 포르투나를 추가한다. 모든 경도는 `[0, 360)`이며 행성 ID는 중복될 수 없다.

기존 checkout 재개 요청은 같은 endpoint에 `reportPublicId`, 새 `email`, `turnstileToken`만 보내고
collection capability를 `Authorization: Bearer`로 전달한다. active `pending`이면 같은 `paymentId`를
반환하며 이메일만 갱신하고, `paid`이면 이메일을 바꾸지 않는다. 이전 구매가 `failed` 또는
`cancelled`이고 report가 아직 draft면 같은 report에 새 pending 구매를 만든다.

신규 응답은 `guest.{collectionPublicId,reportPublicId,accessToken}`과
`payment.{paymentId,status,sku,storeId,channelKey,payMethod,orderName,amount,market,currency}`로 나눈다.
재개 응답은 이미 Authorization으로 보낸 capability를 다시 싣지 않는다. 신규는 `201`, 재개는
`200`이며 `payment.status`가 `pending`일 때만 브라우저가 결제창을 연다.
가격과 PortOne 채널은 요청에서 받지 않고 매니페스트와 배포별 channel map에서만 정한다.

### 로케일과 출시 상태

- 경로, 클라이언트 상태, checkout·questionnaire·report 계약은 `ko`, `en`, `ja`, `zh`를 동일하게
  처리한다. 로케일별 조건문으로 한국 흐름을 별도 구현하지 않는다.
- UI 콘텐츠는 `GUARDIAN_REPORT_UI`의 동일한 타입에 네 로케일을 모두 선언한다. 이번 출시는 한국어만
  `published`이고 다른 로케일 값은 빈 콘텐츠로 유지한다. 번역을 채우고 게시 상태를 바꾸면 같은
  화면과 API 흐름을 그대로 사용한다.
- 서버 checkout 가능 여부는 하드코딩한 `locale === "ko"`가 아니라 상품명, 유료 질문 버전,
  리포트 copy, 가격이 매니페스트에 함께 게시됐는지로 판단한다.
- 검색 노출과 `hreflang`, sitemap은 게시된 로케일만 포함한다. 미게시 로케일 경로는 같은 렌더링
  계약을 유지하되 색인하지 않는다.

### Confirm과 리포트 조회

- confirm은 브라우저가 보낸 금액·통화·성공 여부를 사용하지 않는다.
- capability가 해당 collection과 purchase에 연결되는지 먼저 확인한다.
- 원격 상태가 `PAID`일 때만 로컬 구매와 금액·통화를 비교하고 유료 질문 entitlement를 지급한다.
- 처리 중이거나 PortOne 조회가 일시 실패하면 `pending`을 유지한다.
- PortOne에 결제가 아직 없거나 `READY`·`PAY_PENDING`이면 confirm은 `202`와 `pending`을 반환한다.
  명시적 실패·취소·환불은 로컬 구매 상태를 수렴한 뒤 `200`으로 그 상태를 반환한다.
- 금액·통화 불일치는 `review_required`로 고정하고 `409`를 반환해 같은 불일치를 무한 재조회하지 않는다.
- 질문 진행과 카드 공개 데이터는 confirm의 일회성 응답에만 의존하지 않는다. confirm 뒤 리포트 조회 API를
  호출해 새로고침, 웹훅 선착, 지연 완료가 모두 같은 UI 경로를 사용한다.
- draft 응답에는 질문 진행률만 포함하고 전체 질문 은행, `familySnapshot`, `cardSnapshot`,
  선택된 희귀도를 포함하지 않는다.
- fulfilled 응답만 네 `cardEditionId`, 카드 표시 메타데이터, 리포트 문구 버전과 렌더가 끝난
  `narrative` snapshot을 제공한다.
- fulfilled 카드에는 `cardEditionId`, `familyId`, `slot`, `rarity`, `artworkPath`만 포함한다.
  `narrative`에는 hero, 네 section의 차트 요약·선택 답변별 상세 문단·조언·한 줄, closing만
  포함한다. 리포트 입력 snapshot, 답변 ID, 누적 signal과 family snapshot은 반환하지 않는다.
- 최종 응답의 상세 계약과 copy version 규칙은
  [한국어 개인화 리포트 본문 엔진과 최종 계약](./paid-report-content-engine.md)을 따른다.

### 유료 질문 HTTP 계약

- 질문 관련 세 API 모두 `Authorization: Bearer <collection capability>`를 요구하며 URL의 `reportPublicId`가
  같은 collection 소유인지 한 DB 조인으로 확인한다.
- `GET .../question`은 `{ "step": ... }`만 반환한다. step은 현재 한 문항, 12개 핵심 답변 뒤의
  중간 결과, 선택 메모, 완료 중 하나이며 전체 문항 은행·선택 점수·누적 signal은 내려보내지 않는다.
- `PUT .../answers/:id`는 선택형에 `{ "answer": { "type": "option", "optionId": "..." } }`,
  선택 메모에 `{ "answer": { "type": "text", "text": "..." } }`를 받는다. 메모 건너뛰기는
  `text: null`이다.
- 성공 응답은 `{ "saved": "saved|already-saved", "step": ... }`다. 같은 답변 재전송은 멱등이고,
  이미 지난 문항을 다른 값으로 바꾸면 `409`, entitlement 전에는 `402`를 반환한다.
- 핵심 질문 12개가 모두 저장되면 서버는 다음 적응형 질문 대신 `core-reflection-v1` milestone을
  반환한다. 네 주제 insight와 연결 문장은 핵심 답변의 signal과 리포트 경로로 서버에서 작성하며
  signal ID·점수는 응답하지 않는다.
- `PUT .../milestones/:id`는 현재 노출 가능한 milestone만 확인한다. 같은 ID 재전송은 멱등이고,
  건너뛴 ID나 이미 다른 단계로 진행된 요청은 `409`로 최신 step을 다시 읽게 한다. 확인 행은
  `guardian_questionnaire_milestone(report_id, milestone_id, acknowledged_at)`에 저장한다.
- 마지막 step 저장은 별도 공개 endpoint를 거치지 않고 답변 snapshot·signal snapshot·네 카드 선택·
  acquisition 기록·report fulfillment를 기존 한 트랜잭션에서 끝낸다.

### 출시 선택 규칙 권장안

현재 두 질문은 무료 미리보기용으로 유지한다. 결제 후에는 네 주제마다 핵심 맥락 3개와 누적
답변으로 고른 필수 맞춤 질문 1개를 묻는다. 관련도 기준을 넘긴 주제에 심화 질문을 하나씩 더해
전체 16~20개를 제공한다. 필수 문항은 모두 선택지 기반이며 자유 입력은 진행률이 끝난 뒤 별도
선택 메모로 최대 한 개만 제공한다. 실제 문구, 선택지, 선택 정책과 점수 행렬은 versioned JSON에 둔다.

| 슬롯     | 차트의 주축                             | 유료 질문의 구조적 역할         |
| -------- | --------------------------------------- | ------------------------------- |
| 자기이해 | 태양 별자리, 달·상승궁은 보조           | 현재 맥락·바라는 변화·반복 패턴 |
| 사랑     | 금성, 신뢰 가능한 경우 디센던트·7하우스 | 관계 맥락·바라는 변화·반복 패턴 |
| 일       | 신뢰 가능한 경우 중천점, 토성·10하우스  | 업무 맥락·바라는 변화·제약      |
| 결정     | 수성, 화성                              | 선택 맥락·우선순위·제약         |

- 자기이해는 사용자의 태양 별자리 캐릭터를 반드시 선택한다.
- 유료 MVP는 자기이해·사랑·일·결정 각 한 패밀리, 총 4개 패밀리·7개 에디션만 게시한다. 네
  family pool의 후보가 각각 하나이므로 입력은 MVP 패밀리를 바꾸지 않는다.
- 차트 관련성을 기본 축으로 두고 결제 후 주제 답변을 무료 공통 답변보다 강하게 반영한다. 정확한
  점수 행렬은 questionnaire Git version과 함께 서버 콘텐츠로 게시한다.
- 16~20개의 선택 답변은 네 주제 상세 리포트 본문, 섹션별 해석 초점, 전체 요약과 한 줄을 실질적으로
  바꾼다. 선택 자유 입력을 작성했다면 본문 보조 맥락으로만 사용하고 미작성은 완료를 막지 않는다.
- 자기이해 유료 답변은 태양 별자리 패밀리를 바꾸지 않고 장면·한 줄·해석의 초점을 바꾼다.
- 하나의 보편적인 `위로=물` 매핑을 모든 슬롯에 재사용하지 않는다. 같은 답도 사랑, 일, 결정에서
  다른 친화도를 갖는 작은 슬롯별 행렬로 관리한다.
- 동일 점수는 `selectionRuleVersion`과 정규화 입력의 안정적인 hash로 해소한다. 같은 입력의
  재시도는 같은 패밀리가 나오고 임의 새로고침으로 카드를 탐색할 수 없다.
- production에서 후보가 추가되면 답변은 기본 패밀리와 원화에도 실제 영향을 주지만, 답 하나를
  바꿀 때마다 네 장 모두 바뀐다고 약속하지 않는다.
- 기본 패밀리 선택과 사랑 희귀도 추첨을 분리한다. 답변, 별자리, 출생 정확도는 희귀도 확률을
  올리거나 내리지 않는다.

유료 MVP는 4개 패밀리·7개 에디션을 같은 매니페스트에 게시한다. production 출시에는 실제 3:4
에디션을 최소 1,024장 게시하며 상세 제작 원칙은
[카드 카탈로그](./card-catalog.md)를 따른다.

## 5. 상태와 멱등성

### 리포트

```text
draft ── 유료 질문 완료 + 카드 선택 ──> fulfilled
```

report draft는 checkout에서 pending 구매와 함께 만들어 questionnaire version과 무료 입력
snapshot을 먼저 고정한다. 결제 확인 전에는 질문을 읽을 권한이 없고, 확인 뒤 같은 draft에 유료
질문 진행 상태를 저장한다. 별도의 `awaiting_questions` 상태를 추가하지 않는다. fulfilled
리포트는 현재 규칙으로 다시 계산하지 않는다.

중간 결과는 report status를 늘리지 않는다. 현재 질문 resolver가 `milestone` step을 반환하고,
사용자가 확인하면 generic `guardian_questionnaire_milestone` 행을 추가한다. 이후 장기 문항은행에서
중간 지점이 늘어나도 report 컬럼이나 상태 enum을 계속 추가하지 않는다.

### 구매

```text
pending ── PAID + 일치 ───────────────> paid
pending ── 명시적 실패·취소 ─────────> failed | cancelled
pending ── 금액·통화 불일치 ─────────> review_required
paid ───── 환불 확인 ────────────────> refunded
```

- `paid` 전환과 유료 질문 entitlement 지급은 같은 트랜잭션이므로 둘 중 하나만 성공한 상태를
  만들지 않는다. 카드 지급은 유료 질문 완료 시 별도 report 트랜잭션으로 수행한다.
- `review_required`는 카드를 지급하지 않고 운영 알림을 보낸다. 계속 `pending`으로 두고 매번
  재조정하면 같은 불일치를 무한 조회하게 되므로 별도 상태가 필요하다.
- `paymentId` unique, full-report의 활성 구매 unique, 구매의 entitlement timestamp, 최초 슬롯별
  acquisition unique를 함께 사용한다.
- PortOne 웹훅의 `webhook-id`도 별도 이벤트 테이블에서 unique로 기록한다.
- 이미 지급된 구매를 다시 확인하면 새로운 난수 추첨이 아니라 저장된 스냅샷을 반환한다.

## 6. PortOne 연결 기준

### 브라우저와 서버

- 브라우저는 `@portone/browser-sdk/v2`의 `requestPayment`를 사용한다.
- 첫 실결제 채널은 승인된 토스페이 직접 연동 `tosspay_v2`로 고정하고 `payMethod: "EASY_PAY"`를
  사용한다.
- 승인 중인 토스페이먼츠 결제창은 첫 흐름에 조건부 분기로 넣지 않는다. 실결제 승인이 끝나면
  `CARD` 등의 결제수단과 channel key를 서버 channel map에 추가한다.
- 모바일을 포함하므로 `redirectUrl`을 항상 제공하고 반환값 방식과 리디렉션 방식을 모두 처리한다.
- `storeId`와 `channelKey`는 공개 설정이지만 클라이언트가 임의로 고르는 값은 받지 않는다. 서버가
  허용한 결제수단에 대응하는 한 채널만 checkout 응답으로 보낸다.
- PortOne API Secret, 대표 Store의 Webhook Secret, Store/channel map은 중앙 `apps/payments` Worker만
  소유한다. Stella는 `PAYMENTS` Service Binding으로 `st_` 결제만 조회·취소할 수 있다.
- 대표 Store의 콘솔 기본 웹훅은 실연동 `payments.sobok.cc`, 테스트 `payments-stg.sobok.cc`의 중앙
  endpoint를 사용한다. checkout 응답이나 브라우저 결제 요청에 `noticeUrls`를 넣지 않는다.
- 중앙화해도 Vibe 결제 테이블이나 계정을 공유하지 않는다. Stella 주문·리포트·카드 권한 원장은
  계속 Stella schema가 소유한다.

### 웹훅과 재조정

- 중앙 payments는 웹훅 버전 `2024-04-25`의 raw body와 서명 헤더를 검증하고, PortOne 결제 단건을
  다시 조회한 뒤 `st_` 이벤트만 Stella 전용 Queue에 넣는다.
- Stella Queue consumer는 처리 완료 이벤트만 `webhook-id`, type, `paymentId`로 기록한다. Queue는
  at-least-once이므로 event ID unique와 구매 상태 전이 CAS로 멱등 처리하고, 실패는 재시도 뒤 DLQ로
  보낸다. raw payload는 저장하지 않으며 완료 이벤트 행은 90일 뒤 일일 purge에서 정리한다.
- 15분 이상 `pending`인 구매 재조회는 Stella maintenance RPC로 구현한 뒤 공용 scheduler의 기존
  15분 주기에 추가한다. 제품 Worker에 별도 Cron Trigger를 만들지 않는다.
- 결제 확인 경로는 웹훅 누락과 브라우저 이탈을 서로 보완해야 하며 어느 하나만 필수 경로가 되지
  않게 한다. PortOne도 브라우저 응답 유실에 대비해 웹훅 사용을 강하게 권장한다.

### 설정 경계

Stella에 다음 결제 설정이 필요하다.

| 종류            | 이름                                                                           |
| --------------- | ------------------------------------------------------------------------------ |
| Service Binding | `PAYMENTS` → live `payments` / stg `payments-stg`, entrypoint `StellaPayments` |
| Queue consumer  | live `stella-payment-events` / stg `stella-payment-events-stg`                 |
| Queue DLQ       | 환경별 `*-dlq`                                                                 |

Store ID와 channel map은 `apps/payments/wrangler.jsonc`, V2 API Secret은 `account-payments`, 설정
모드별 Webhook Secret은 `account-secrets-store`가 소유한다. Stella Worker에는 PortOne 자격증명을
바인딩하지 않는다. 세부 운영 계약은 `apps/payments/README.md`를 따른다.

- [PortOne 결제 연동 준비](https://developers.portone.io/opi/ko/integration/ready/readme)
- [PortOne 연동 정보와 채널 관리](https://developers.portone.io/opi/ko/console/guide/channel-manage)
- [PortOne V2 토스페이](https://developers.portone.io/opi/ko/integration/pg/v2/tosspay-v2?v=v2)

## 7. 게스트 접근과 복구

- 256-bit collection capability 원문은 브라우저에 한 번만 반환하고 DB에는 SHA-256 digest만 둔다.
- API에서는 `Authorization: Bearer`로 전달한다. URL, 쿼리 문자열, analytics, 오류 로그에 넣지 않는다.
- 같은 기기의 결제 복귀에는 `sessionStorage`를 사용한다. `localStorage`의 프로토타입 컬렉션은
  서버 소유권으로 대체한다.
- 결제 완료와 카드 공개 사이에 회원가입을 요구하지 않는다.
- 계정을 만들면 기존 collection 행을 계정에 연결하고 guest capability를 폐기한다.

### 확정된 이메일 복구

한국 게스트 checkout에서는 이메일을 필수 복구 채널로 받되 “회원가입”이 아니라 영수증과 구매
복구 용도임을 입력 시점에 명확히 표시한다.

- 한 번만 입력받고 `type="email"`, `autocomplete="email"`을 사용한다. 확인용 재입력이나 결제 전
  이메일 OTP 인증은 요구하지 않는다.
- 전화번호와 카카오톡 수신은 첫 결제 필수값으로 두지 않는다.
- 메일 발송 실패가 결제 확정이나 카드 공개 트랜잭션을 되돌리면 안 된다.
- 재열람 메일은 장기 collection capability를 그대로 URL에 넣지 않고, 짧은 만료 시간과 1회성을
  가진 교환 토큰으로 새 접근을 발급한다.
- 이메일 정규화 값과 전달 상태는 구매 복구에 필요한 범위에서 구매와 연결한다.

## 8. 무료 결과에서 결제로 이어지는 화면

기존 무료 출생 차트의 Big 3, 차트 휠, 세부 해석, 원소·각·패턴·장문 리포트를 삭제하거나 중간에서
잠그지 않는다. 유료 상품은 기존 무료 문장의 잠금 해제가 아니라 네 수호령 원화, 질문을 반영한
교차 주제 해석, 구매 스냅샷, 컬렉션 보관을 제공하는 별도 경험이어야 한다.

### 제안 위치

- 홈에서는 `ConstellationActions` 다음, `ElementBalance` 앞에 상품 카드 하나만 배치한다. 질문,
  가격표, 이메일 입력, 잠금 결과는 홈 안에서 열지 않는다.
- 상품 카드는 완성 원화 예시, 가치 제안, 짧은 배지와 단일 CTA만 보여주고
  `/[locale]/guardian-report`로 이동한다.
- 최초 버전에는 전역 팝업, 장문 리포트 끝의 반복 CTA, 계속 따라오는 sticky CTA를 넣지 않는다.
  홈 CTA와 전용 랜딩 안의 전환을 분리해 측정한다.
- 다른 사람의 공유 차트에서는 그 사람의 입력으로 유료 draft를 만들지 않는다. 자신의 무료 차트
  만들기로 이어간 뒤 본인 차트를 만든 사용자에게 제안한다.

### 전용 상품 랜딩

공개 랜딩은 결제창의 앞 단계가 아니라 상품을 충분히 이해하고 무료로 참여하는 독립 페이지다.
첫 화면에는 완성 원화 3장을 작은 부채꼴로 보여주되 `카드 예시`라고 표시해 실제 당첨 결과처럼
오해하지 않게 한다. 이어서 네 가지 결과물, 진행 순서, FAQ를 보여주고 첫 CTA는 무료 질문으로
이동한다.

```text
네 차트에 숨어 있는 네 수호령을 만나봐
두 가지 선택으로 먼저 방향을 보고, 결제 후 정밀 질문으로 네 카드를 찾아요.
[내 수호령 찾기 · 약 20초]
```

- 직접 랜딩에 들어왔지만 저장된 본인 출생 입력이 없으면 상품 소개와 무료 질문은 볼 수 있다.
  결제 CTA에서는 무료 차트 만들기로 명확히 복귀시키며 임의 기본 차트를 만들지 않는다.
- 첫 CTA 뒤 두 무료 질문을 한 화면에 하나씩 보여준다.
- 무료 답을 마치면 DB를 쓰지 않고 `자기이해`, `사랑`, `일`, `결정` 이름이 붙은 카드 뒷면 네
  장과 한 줄 provisional teaser를 보여준다. `미리 본 방향`이라고 표시해 최종 카드가 정해졌다고
  말하지 않는다.
- teaser는 `네 리포트에는 시작하려는 마음과 지키려는 마음이 함께 보여요`처럼 입력을 반영한
  종합 방향만 말한다. 정확한 카드 패밀리, 제목, 장면 원화, 사랑 희귀도는 공개하지 않는다.
- sealed 미리보기에는 최종 리포트의 네 주제 제목과 일부 문장만 잠금 상태로 보여준다. 무료 차트
  원문을 잠근 것처럼 보이지 않게 별도 유료 결과물임을 유지한다.
- 구매 CTA는 가격을 버튼 안에 포함한다:
  `네 카드와 전체 리포트 열기 · 3,900원`.
- 구매 CTA를 누르면 유료 질문 원문 대신 `결제 후 16~20개 · 네 주제 · 약 4~7분 · 중간 저장`
  안내와 납품물을 보여준다.
- 같은 checkout 영역에서 복구 이메일을 받은 뒤 토스페이로 이동한다. 결제가 확인되면
  자기이해·사랑·일·결정 질문을 한 화면에 하나씩 제공하고 진행률을 표시한다.
- 희귀도 확률과 미보유 보장 설명은 CTA 가까이에서 한 번에 열 수 있게 하고, 질문 응답이 희귀도
  확률을 바꾸지 않는다고 명시한다.

### Checkout과 공개

provisional 미리보기 뒤 한 화면짜리 checkout sheet를 열고 질문 분량과 결과물을 안내한다.
이메일을 입력한 다음 토스페이로 이동하며 계정, 비밀번호, 전화번호는 요구하지 않는다.

```text
homeOffer
  → productLanding
  → previewQuestions
  → provisionalPreview
  → lockedReportPreview
  → checkoutEmail
  → checkoutCreating
  → paymentOpen
  → verifying
  → paidCoreQuestions(12)
  → coreMilestone
  → paidAdaptiveQuestions(4~8)
  → optionalNote
  → fulfilling
  → reveal
  → report
```

- 무료 질문 진행 상태는 checkout 전까지 브라우저 안에만 두고 서버 draft를 만들지 않는다. 유료
  질문 답변은 매 문항 서버 draft에 저장해 기기 이탈 뒤에도 복구한다.
- report 공개 참조와 capability는 URL에 함께 싣지 않고 `sessionStorage`로 `/[locale]/cards`
  화면에 넘긴다. 이메일 재열람은 짧은 교환 토큰으로 새 capability를 발급한다.
- `/[locale]/cards`는 session이 없으면 랜딩으로 돌아가는 안내만 보여준다. 클라이언트 난수,
  localStorage 컬렉션, query rarity, prototype report fallback은 두지 않고 fulfilled API의 카드
  스냅샷만 사용한다.
- `verifying`은 오류 화면이 아니라 결제 상태를 맞추는 정상 단계다.
- 일시적인 `pending`이면 짧게 재조회하고, 이후에는 같은 브라우저에서 다시 확인할 수 있는 복구
  화면을 제공한다.
- 이미 paid이고 draft라면 저장된 다음 유료 질문으로, fulfilled라면 저장된 네 카드 공개 흐름으로
  진입한다.
- 핵심 12문항 뒤에는 모든 구매자에게 네 주제의 개인화 중간 결과를 보여준다. 이는 광고성 예고가
  아니라 이미 저장된 답변을 요약한 첫 납품물이며, 사용자가 확인해야 적응형 질문으로 진행한다.
- 카드 공개는 3:4 카드 뒷면을 한 장씩 뒤집고, 공개마다 한 줄 해석과 다음 CTA를 보여준다. 전체
  건너뛰기는 허용하되 모바일 하단 내비게이션에 가리지 않는 카드 위에 둔다.
- 최종 웹 리포트는 네 카드 모음, 네 주제 연결 지도, 반복 차트 단서, 주제별 상세 문단·조언·성찰,
  오늘 곁에 둘 네 문장과 closing을 순서대로 제공한다.
- 3D 카드 뒤집기와 reduced motion 접근성을 유지한다.
- Stella 계정 보관 제안은 네 카드와 요약을 공개한 뒤에만 보여준다.

## 9. 관측과 운영

| 이벤트                                       | 기록 시점                                                  |
| -------------------------------------------- | ---------------------------------------------------------- |
| `guardian_offer_view`                        | 홈 상품 카드가 viewport에 처음 들어왔을 때                 |
| `guardian_landing_open`                      | 홈 상품 CTA로 전용 랜딩에 이동할 때                        |
| `guardian_preview_started`                   | 랜딩에서 첫 무료 질문을 시작할 때                          |
| `guardian_preview_complete`                  | 무료 답변 2개를 모두 선택해 잠금 미리보기를 볼 때          |
| `guardian_paywall_open`                      | 가격·복구 이메일 checkout 영역을 열 때                     |
| ecommerce `begin_checkout`                   | 서버 checkout을 만들고 PortOne 결제창을 열기 직전          |
| `guardian_payment_confirmed`                 | 브라우저 복귀 경로에서 서버 검증된 paid 상태를 확인할 때   |
| `guardian_question_answered`                 | 유료 선택형 또는 선택 메모 답변을 서버에 저장했을 때       |
| `guardian_questionnaire_milestone_completed` | 12개 핵심 답변의 개인화 중간 결과를 확인했을 때            |
| `guardian_report_fulfilled`                  | fulfilled report snapshot을 브라우저가 처음 읽었을 때      |
| `guardian_card_revealed`                     | 사용자가 실제 카드 앞면을 한 장 열었을 때                  |
| `guardian_report_opened`                     | 공개를 마치거나 건너뛰어 전체 리포트를 열었을 때           |
| `guardian_report_complete`                   | closing이 viewport에 들어와 전체 리포트 끝까지 도달했을 때 |

매출 원장의 `guardian_purchase_complete`는 브라우저 이벤트가 아니라 구매 확정 함수가 처음 이긴
시점에 서버에서 한 번만 기록한다. `guardian_payment_confirmed`는 결제 상태의 권위가 아니라 브라우저
복귀 전환을 측정하는 보조 이벤트다.

무료 결과 방문자를 분모로 제안 노출 → 무료 질문 완료 → checkout → 결제 → 유료 질문 시작·완료 →
첫 카드 공개 → 완독의 이탈을 본다. 특히 결제 완료 대비 질문 완료율과 평균 완료 시간을 따로 봐서
결제 후 질문의 풍부함이 결과 공개를 과도하게 늦추지 않는지 확인한다. 매출만 보지 않고
`무료 결과 방문당 매출`, 구매 후 카드 공개율, 완독률, 7일 재열람률을 함께 본다.

운영 알림 대상은 금액·통화 불일치, 동일 구매의 반복 확정 실패, 오래된 pending backlog,
중앙 payments 또는 PortOne 자격증명 설정 오류다. capability, 출생 입력, 질문 답변, 전체 결제 응답은 로그에
남기지 않는다.

Stella API에도 request ID, 일관된 problem 응답, secure headers, 전역 오류 처리를 적용해 결제
오류를 HTML 예외나 원문 스택으로 반환하지 않는다.

## 10. 인프라와 배포 경계

- `stella-stg`와 `stella`는 별도 Worker 배포이며 각각 `payments-stg`, `payments` Service Binding을 사용한다.
- Supabase 프로젝트와 Postgres 데이터베이스는 하나만 사용한다.
- 두 Worker가 기존 제품 단위 `stella` Hyperdrive config 하나를 그대로 공유한다.
- entitlement와 collection의 read-after-write가 필요하므로 Hyperdrive 캐시는 계속 끈다.
- 별도 Hyperdrive, DB role, Supabase 프로젝트를 만들지 않는다.
- 확정 데이터 경계는 같은 DB 안의 `stella_stg`와 `stella` PostgreSQL schema다. staging과
  production이 같은 테이블을 쓰며 행마다 `environment`를 검사하는 구조는 사용하지 않는다.
- `STELLA_DB_SCHEMA`를 build-time에 schema-qualified SQL로 굽고 production fallback을 두지 않는다.
- `stella_app` role은 두 schema의 table·sequence default privilege를 가지되 `search_path`는
  `pg_catalog`만 사용한다.
- `sobok-ops`에는 `stella_stg` schema·grant, 중앙 payments custom domain, Stella Queue/DLQ를
  선언한다. Store ID·channel map과 PortOne 자격증명은 중앙 payments 경계가 소유하며 Stella용
  Hyperdrive resource는 추가하지 않는다.
- 유료 질문 은행도 별도 데이터베이스를 만들지 않고 Git 원본을 각 Stella schema의 서버 콘텐츠
  테이블에 게시한다.
- 실제 DB 반영은 앱 코드와 운영 binding이 준비된 뒤 같은 DB에 `drizzle-kit push`를
  `stella_stg`, `stella` 순서로 각각 수행한다.
- Worker와 정적 자산 배포는 로컬 Wrangler 명령으로 수행하지 않는다. 커밋을 원격 브랜치에 올린
  뒤 `.github/workflows/stella-deploy.yml`을 사용한다. staging은 해당 브랜치의 수동
  `workflow_dispatch(target=staging)`, production은 `main` push가 유일한 배포 경로다.
- 계정 단일 `apps/scheduler`가 Cron Trigger를 소유한다. Stella는 `StellaMaintenance` RPC로 일일 purge와
  15분 pending 결제 재조정을 제공하며 production·staging 모두 같은 scheduler 주기에 연결한다.

## 11. 권장 구현 순서

1. **완료:** 중앙 payments Service Binding, Stella Queue consumer, 웹훅 이벤트 데이터를 연결한다.
2. **완료:** confirm·payment event·report read API를 현재 guest checkout·paid questionnaire API에 연결한다.
3. **완료:** 한국어 개인화 본문 엔진, 불변 narrative snapshot과 최종 report GET 계약을 연결한다.
4. **완료:** 홈 상품 카드, 전용 랜딩, 무료 질문·잠금 미리보기와 결제 뒤 질문·fulfillment 화면을 연결한다.
5. **재조정 완료:** 15분 이상 pending인 구매를 최대 100개씩 중앙 payments로 다시 조회하고 기존 멱등
   결제 확정 함수로 수렴시킨다. production·staging 모두 공용 scheduler의 기존 15분 주기에 연결한다.
   미결제 checkout context 삭제는 보존 기간 확정 뒤 일일 purge에 추가한다.
6. **완료:** `/[locale]/cards`의 클라이언트 난수·로컬 소유권·prototype fallback을 서버 상태로 교체한다.
7. **완료:** 중앙 Wrangler에 Store ID·channel map을, `sobok-ops`에 payments Secret·Queue·custom
   domain을 반영한다.
8. **완료:** `guardian_questionnaire_milestone`을 `stella_stg`·`stella` 양쪽 schema에 반영하고 같은
   `guardian-paid-ko-mvp-v1` 콘텐츠 해시를 게시한다.
9. **일부 완료:** 브랜치의 `Stella Deploy` staging workflow와 HTTP/API smoke check는 성공했다. PortOne
   테스트 결제·모바일 리디렉션·질문 재개·카드 공개의 실제 E2E는 별도로 수행한다.
10. **완료:** production `stella` schema·문항 게시 뒤 PR #29를 `main`에 병합하고 production workflow와
    공개 URL smoke check를 완료했다.

### 2026-08-01 운영 반영 기록

| 항목          | 결과                                                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB            | `stella_stg`·`stella`에 `guardian_questionnaire_milestone`과 관련 제약 반영                                                                                |
| 유료 문항     | 양쪽 schema에 `guardian-paid-ko-mvp-v1`, 45문항·176선택지 게시                                                                                             |
| 콘텐츠 동일성 | SHA-256 `38b0f79a2b838f2fa7a461be7d269b39fa67c0c47d302939b88c46eb70d2c85e` 일치                                                                            |
| 코드 배포     | [PR #29](https://github.com/sobok2026/sobok/pull/29) squash merge, [production workflow](https://github.com/sobok2026/sobok/actions/runs/30704300267) 성공 |
| smoke check   | `stella.sobok.cc`의 한국어 상품 랜딩·카드 페이지·상품 API가 `200` 응답                                                                                     |

### 완료 기준

- 기존 무료 결과는 결제하지 않아도 끝까지 읽을 수 있다.
- 공유받은 타인의 차트에서는 checkout을 만들 수 없고 자신의 무료 차트 생성으로 이어진다.
- 무료 질문 2개만 끝낸 사용자는 DB draft나 guest collection을 만들지 않는다.
- 결제 전에 유료 질문의 범위와 예상 시간은 보이지만 원문·선택지·선택 정책은 내려오지 않는다.
- 서버가 결제를 확인하면 계정 생성 없이 유료 질문을 시작하고 답변마다 진행 상태가 저장된다.
- 핵심 12문항 뒤에는 서버가 만든 개인화 중간 결과가 표시되고, 확인 상태를 저장한 뒤에만 적응형
  문항으로 진행한다.
- 유료 질문을 모두 완료해야 기본 패밀리와 카드 에디션이 한 번만 선택된다. MVP의 단일 후보
  풀도 production과 같은 선택 함수를 통과한다.
- 결제 후 브라우저를 닫아도 복구 이메일로 남은 질문부터 이어서 할 수 있다.
- 같은 정규화 입력과 규칙 버전은 같은 기본 패밀리를 선택한다.
- 질문 답변은 상세 리포트 본문과 한 줄을 실질적으로 바꾸고, production 후보가 늘어나면 기본
  패밀리와 원화에도 영향을 주지만 사랑 희귀도 확률은 바꾸지 않는다.
- 선택형 16~20개의 각 답은 해당 주제의 상세 근거 문단에 남고, 합산 signal은 섹션 중심·조언·
  한 줄과 전체 경로를 고른다. fulfilled 뒤에는 같은 본문을 다시 계산하지 않는다.
- checkout은 복구 이메일을 요구하되 계정·비밀번호·전화번호를 요구하지 않는다.
- 결제 전 응답에는 선택된 기본 패밀리 ID, 사랑 희귀도, 카드 앞면 원화가 나타나지 않는다.
- 변조한 브라우저 성공 응답이나 금액으로 카드를 받을 수 없다.
- 브라우저 confirm과 같은 웹훅이 동시에 도착해도 paid entitlement와 구매 완료 이벤트가 한 번만 생긴다.
- 마지막 답변이 중복 제출돼도 카드 네 장과 획득 이력이 한 번만 생긴다.
- 결제 뒤 새로고침해도 같은 질문 진행 상태 또는 같은 네 카드와 리포트를 읽는다.
- 브라우저가 닫혀도 웹훅·재조정으로 구매가 paid에 수렴한다.
- 결제창을 중복 클릭해도 활성 전체 리포트 구매와 카드 스냅샷이 중복 생성되지 않는다.
- PortOne API/Webhook Secret은 중앙 payments Worker 외부로 노출되지 않는다.
- 카드 공개부터 네 섹션 완독까지 기존 접근성과 reduced-motion 동작이 유지된다.
- `stella-stg`와 `stella`는 같은 Hyperdrive ID를 사용하면서 각각 `stella_stg`, `stella` schema만
  명시적으로 조회한다.

## 12. 구현 전에 필요한 제품·운영 결정

| 결정               | 상태·권장안                                                | 이유                                                      |
| ------------------ | ---------------------------------------------------------- | --------------------------------------------------------- |
| 한국 PortOne Store | 기존 대표 Store 사용으로 확정                              | 같은 사업·정산 경계의 앱을 Store 이름만으로 나누지 않는다 |
| 첫 실결제수단      | 토스페이 `tosspay_v2`·`EASY_PAY`로 확정                    | 실결제 승인이 완료된 가장 작은 채널부터 연다              |
| 토스페이먼츠       | 실결제 승인 뒤 channel map에 추가                          | 승인 전 분기를 production UI에 노출하지 않는다            |
| test/live 배포     | `stella-stg`와 `stella` 분리로 확정                        | test channel이 production에서 선택되지 않게 한다          |
| DB·Hyperdrive      | 같은 Supabase DB·같은 Hyperdrive 공유로 확정               | Free plan 자원과 연결 풀을 늘리지 않는다                  |
| DB 내부 경계       | 같은 DB의 `stella_stg`·`stella` schema 분리 확정           | 행별 환경 필터 없이 테스트 데이터를 분리한다              |
| 게스트 이메일      | 결제 직전 필수, 계정 생성과 분리로 확정                    | 결제 후 기기 이탈에도 구매를 복구한다                     |
| 질문 단계          | 무료 2개, 서버 결제 확인 뒤 유료 질문으로 확정             | 앱에서는 paid entitlement 뒤에만 유료 문항을 제공한다     |
| 유료 질문 분량     | 주제별 핵심 3개+필수 맞춤 1개+심화 0~1개, 전체 16~20개     | 모든 주제의 깊이와 구매 후 완료율을 함께 관리한다         |
| 중간 결과          | 핵심 12문항 뒤 모든 구매자에게 1회 제공                    | 첫 납품물을 주고 적응형 질문 전 이탈을 줄인다             |
| 자유 입력          | 질문 수 밖의 선택 메모 최대 1개로 확정                     | 표현 여지는 주되 카드 공개를 지연시키지 않는다            |
| 유료 질문 저장     | Git JSON을 같은 환경 schema의 불변 콘텐츠 행으로 게시      | 배포 재현성과 report별 version 고정을 함께 얻는다         |
| 출시 카드 선택     | MVP 단일 후보, production은 전체 입력으로 패밀리 변경      | 같은 계약에서 후보만 늘린다                               |
| 선택 점수          | 차트 중심, 유료 주제 답변은 무료 공통 답변보다 강하게 반영 | 관련성과 유료 개인화를 함께 확보한다                      |
| MVP 카드 수        | 4개 패밀리·7개 실제 에디션으로 확정                        | 현재 완성 원화로 가장 작은 유료 흐름을 검증한다           |
| production 카드 수 | 실제 게시 에디션 최소 1,024장으로 확정                     | 검수된 원화만 실제 카드 수로 센다                         |
| 무료 결과 제안     | actions 뒤 소형 상품 카드 하나, 이후 전용 랜딩으로 확정    | 홈과 전환 흐름의 책임을 분리한다                          |
| 로케일 출시        | 공용 흐름·콘텐츠 타입 유지, 이번 단계는 한국어만 게시      | 번역 추가만으로 같은 경로를 확장한다                      |
| 출생 입력          | 기존 무료 차트 핵심값 재사용, 추가 재입력 없음 권장        | 구매 전 중복 입력을 없앤다                                |

출시 전 다음 우선순위는 실제 PortOne 테스트 결제 E2E, 이메일 복구·재열람 링크, 미결제 checkout
보존 기간 확정과 purge다. 그다음 제품 결정은 사랑 카드 재추첨 화면·결제, Stella 계정 귀속,
장기 문항은행의 제작 범위와 production 1,024장의 제작 매트릭스다. 대표 Store의 PortOne API Secret과
live/test Webhook Secret은 채팅이나 public repository에 전달하지 않고 중앙 payments 관련 HCP Terraform
sensitive 변수에서 Secrets Store로 넣는다. 유료 질문 원문은 Git의 questionnaire source 디렉터리에
커밋한 뒤 게시 CLI로 DB에 반영한다.
