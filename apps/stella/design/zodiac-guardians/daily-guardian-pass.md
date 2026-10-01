# Daily guardian and fixed seven-card week

## 사용자 경험

```text
/today
  → 오늘의 하늘과 개인 운세
  → 사용자별 4일 순환에서 오늘의 테마 결정
  → 오늘의 수호령 카드 전체 무료 공개
  → 내일 행운 음식 티저

/tomorrow
  → 구매한 일주일의 날짜 7개 표시
  → 날짜 선택 → 그날의 목소리 선택 → 카드 공개·보관
  → 이미 열린 날짜는 같은 스냅샷 재열람
  → 내일 행운 음식·색상 무료 공개
  → 구매가 없으면 일주일 카드 checkout
  → 기존 V1 구매는 원래 내일 카드 선공개 흐름 유지
```

오늘 카드는 그림, 한 줄 해석, 행동 문장, 회고 질문을 전부 보여 준다. 일주일 화면은 날짜 선택 아래에 선택한
한 장만 크게 표시한다. 카드가 처음 공개되면 스냅샷은 고정되며 오늘의 카드 및 보관함과 같은 날짜의 카드를
공유한다. 신규 구매는 결제 다음 날부터 고정된 7개 날짜의 카드를 미리 여는 권한이다.

공개된 카드는 수호령 이름을 제목으로 쓰고, 그림 아래에 한마디·작은 실천·나에게 묻기를 하나의 영역으로
보여 준다. 수호령의 본문은 반말로, 서비스 안내는 존댓말로 쓴다. 작품명은 짧은 캡션으로 남기고 주제·말투·
별자리 선정 기준은 접을 수 있는 카드 정보에 둔다. 선공개 이용권 만료 시각은 내일 카드 이동 버튼 아래에 둔다.

## 콘텐츠 경계

- 그림 제작 원고·승인 기록은 에디션과 원화의 관계를 관리한다.
- `worker/guardian/manifest.ts`는 그림 선택에 필요한 런타임 목록을 읽는다.
- `worker/guardian/daily-card.ts`는 선택한 에디션의 본문과 행동 문장을 카드 스냅샷으로 결합한다.
- `GuardianCardReading.tsx`는 오늘·내일·일주일 공개 카드의 표시를 담당한다.

## 상품

| 필드             | 값                                        |
| ---------------- | ----------------------------------------- |
| SKU              | `guardian-fixed-week-7-cards-v2`          |
| 상품명           | 수호령 일주일 카드 7장                    |
| 가격             | 1,900 KRW, VAT 포함                       |
| 갱신             | 없음                                      |
| 기간             | 구매 다음 날부터 7번째 날짜 종료 자정까지 |
| 지원 시장·콘텐츠 | KR, 한국어                                |

## 날짜와 시각

- 브라우저의 IANA time zone에서 계산한 날짜가 사용자의 오늘·내일이다.
- `/today`는 현지 date key를 요청한다. 일주일 범위는 구매의 `paidAt`과 `timeZone`에서 다음 날짜부터 7개를 계산한다.
- 서버는 `week` 요청의 date key와 time zone을 해당 구매의 범위와 다시 비교한다.
- PostgreSQL이 구매 시간대의 날짜에 8일을 더한 자정을 UTC 절대 만료 시각으로 변환한다. DST도 같은 계산을 따른다.
- 결제 승인, 권한 시작·만료, 첫 유료 카드 열람은 timezone-aware timestamp로 저장한다.
- 사용자가 여행해도 구매한 7개 날짜와 만료 시각은 바뀌지 않는다. 일주일 카드의 하늘은 구매 시간대의 날짜별 정오로 계산한다.
- V1 SKU의 168시간 계산은 그대로 남겨 기존 구매·미완료 결제의 confirm과 webhook을 처리한다.

## 선택과 개인정보 경계

- 출생 정보 원본과 상세 차트는 서버로 보내지 않는다.
- 브라우저가 이미 계산한 태양 별자리와 `natal_sun` basis만 보낸다.
- 출생 차트가 없으면 해당 날짜의 달 별자리와 `daily_moon` basis를 보낸다.
- 브라우저 random UUID는 그대로 저장하지 않고 digest만 결정적 선택 seed로 사용한다.
- seed마다 자기이해·사랑·일·결정의 순서를 한 번 정하고, 현지 날짜 ordinal로 4일 순환한다.
- 자기이해·일·결정은 기존 목소리 메타데이터를 사용한다.
- 사랑의 관계 테마는 `comfort`에 everyday-care·distance-and-return·repair,
  `honesty`에 first-signal·honest-conversation·boundary-and-space,
  `action`에 careful-approach·shared-play,
  `possibility`에 mutual-growth·future-promise를 연결한다.
- 사랑 카드 그림은 Orbit 55%, Nebula 30%, Eclipse 12%, Stella 3%의 고정 가중치를 사용한다.
- 결제 이메일은 영수증과 복구에만 사용한다.

## API

| 경로                                                   | 역할                                                   |
| ------------------------------------------------------ | ------------------------------------------------------ |
| `POST /api/guardian-daily/card`                        | 오늘 카드, 내일 테마 티저 또는 권한 카드 조회·보관     |
| `GET /api/guardian-pass/week`                          | 소유한 최신 일주일의 7개 날짜·테마·열린 카드·만료 조회 |
| `POST /api/guardian-pass/checkouts`                    | 서버 가격의 일회 결제 준비                             |
| `POST /api/guardian-pass/purchases/:paymentId/confirm` | PortOne 원격 상태 재조회와 권한 수렴                   |
| `GET /api/guardian-pass/library`                       | 게스트 또는 계정 카드와 최근 7장 요약                  |
| `POST /api/guardian-pass/collections/:publicId/claim`  | 게스트 capability를 계정 소유권으로 교환               |
| `POST /api/guardian-pass/reopen/request`               | 구매 이메일로 일회용 복구 링크 요청                    |
| `POST /api/guardian-pass/reopen/exchange`              | 복구 링크를 새 게스트 capability로 교환                |

결제 브라우저 복귀, 검증된 payment event, 15분 reconciliation은 모두 같은 row-locked 결제 수렴 함수를
사용한다. 가격·통화 불일치는 권한을 주지 않고 `review_required`로 남긴다.

`guardian-pass/week`는 게스트 capability 또는 계정 소유권으로 구매를 확인한다. 카드가 없는 날짜는 테마만
반환한다. `guardian-daily/card`의 `surface: week`는 해당 구매의 날짜 범위, 시간대, 현재 유효 권한을 확인한
뒤 확정한 목소리의 카드 스냅샷과 `firstUsedAt`을 만든다. 카드 보관 트랜잭션에서도 같은 구매 ID와 날짜
범위를 다시 확인한다. 이미 열린 날짜는 `ready`로 같은 스냅샷을 반환하며 만료 후에도 재열람할 수 있다.

## 환불과 보관

- 첫 유료 카드 열람 시각을 기록한다. 결제 직후 일주일 목록을 읽는 것만으로는 카드를 생성하지 않는다.
- checkout은 만 14세, 이용약관, 개인정보, 디지털 콘텐츠 제공·청약철회 제한 동의를 모두 확인하고
  동의 시각과 각 정책 버전을 구매 원장에 기록한다.
- 첫 선공개 카드를 열기 전에는 청약철회 요청을 처리할 수 있다.
- 카드 공개 뒤에는 디지털 콘텐츠 제공이 시작된 것으로 안내한다.
- paid/refunded 결제 원장은 법정 보존 대상이며 카드 보관 데이터와 분리한다.
- 미결제·실패·취소 checkout은 30일 뒤, 게스트 카드 보관함은 1년 뒤 정리한다.

## 전환 측정

```text
guardian_daily_card_view
  → guardian_tomorrow_preview_selected
  → view_item (잠금 화면)
  → guardian_pass_checkout_selected
  → begin_checkout
  → purchase
```

- 1차 지표는 잠금 화면 대비 구매율과 결제 시작 대비 완료율이다.
- 오늘 카드에서 내일 화면으로 이동하는 비율, 이용권 중 날짜별 카드 열람, 계정 귀속률을 보조 지표로 본다.
- 카드 조회와 잠금 화면 이벤트에는 테마를 포함해 테마별 전환율을 비교한다.
- 결제 이메일·capability·출생 정보는 분석 이벤트에 넣지 않는다.
- 환불률과 첫 선공개 열람 전후 환불 요청은 결제 원장으로 확인한다.
