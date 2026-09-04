# Daily guardian and seven-day early-access pass

## 사용자 경험

```text
/today
  → 오늘의 하늘과 개인 운세
  → 사용자별 4일 순환에서 오늘의 테마 결정
  → 오늘의 수호령 카드 전체 무료 공개
  → 내일 행운 음식 티저

/tomorrow
  → 내일 행운 음식·색상 무료 공개
  → 내일의 테마 먼저 공개
  → 필요한 목소리 선택
  → 활성 7일권이면 내일 카드 공개·보관
  → 없으면 7일권 checkout
```

오늘 카드는 그림, 한 줄 해석, 행동 문장, 회고 질문을 전부 보여 준다. 내일 카드는 자정이 지나 오늘 카드가
되면 같은 내용으로 무료 공개된다. 사용자가 구매하는 것은 카드 자체가 아니라 168시간 동안의 선공개 권한이다.

## 상품

| 필드             | 값                              |
| ---------------- | ------------------------------- |
| SKU              | `guardian-tomorrow-pass-7d-v1`  |
| 상품명           | 수호령 내일 선공개 7일권        |
| 가격             | 1,900 KRW, VAT 포함             |
| 갱신             | 없음                            |
| 기간             | 결제 승인 절대 시각부터 168시간 |
| 지원 시장·콘텐츠 | KR, 한국어                      |

## 날짜와 시각

- 브라우저의 IANA time zone에서 계산한 날짜가 사용자의 오늘·내일이다.
- `/today`는 현지 date key, `/tomorrow`는 그 다음 date key를 요청한다.
- 서버는 전달받은 IANA time zone으로 date key가 현재 surface와 일치하는지 다시 확인한다.
- 결제 승인, 권한 시작·만료, 첫 유료 카드 열람은 timezone-aware timestamp로 저장한다.
- 사용자가 여행하면 다음 요청부터 새 현지 날짜를 사용하되 이미 저장된 카드 스냅샷은 바꾸지 않는다.

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

| 경로                                                   | 역할                                               |
| ------------------------------------------------------ | -------------------------------------------------- |
| `POST /api/guardian-daily/card`                        | 오늘 카드, 내일 테마 티저 또는 권한 카드 조회·보관 |
| `POST /api/guardian-pass/checkouts`                    | 서버 가격의 일회 결제 준비                         |
| `POST /api/guardian-pass/purchases/:paymentId/confirm` | PortOne 원격 상태 재조회와 권한 수렴               |
| `GET /api/guardian-pass/library`                       | 게스트 또는 계정 카드와 최근 7장 요약              |
| `POST /api/guardian-pass/collections/:publicId/claim`  | 게스트 capability를 계정 소유권으로 교환           |
| `POST /api/guardian-pass/reopen/request`               | 구매 이메일로 일회용 복구 링크 요청                |
| `POST /api/guardian-pass/reopen/exchange`              | 복구 링크를 새 게스트 capability로 교환            |

결제 브라우저 복귀, 검증된 payment event, 15분 reconciliation은 모두 같은 row-locked 결제 수렴 함수를
사용한다. 가격·통화 불일치는 권한을 주지 않고 `review_required`로 남긴다.

`guardian-daily/card`는 미결제 내일 요청에 `locked`와 테마만 반환한다. 활성 이용권의 아직 열지 않은
내일 요청에는 `tone_required`를 반환하고, 사용자가 목소리를 확정해 다시 요청할 때만 카드 스냅샷과
`firstUsedAt`을 만든다. 이미 열린 날짜는 `ready`로 같은 스냅샷을 반환한다.

## 환불과 보관

- 첫 내일 카드 열람 시각을 기록한다.
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
