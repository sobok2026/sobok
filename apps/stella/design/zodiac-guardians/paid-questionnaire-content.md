# 유료 질문 콘텐츠 계약과 게시

유료 질문 원문·선택지·적응형 선택 정책·점수 행렬을 Git source of truth로 관리하고, 정적 JavaScript에는
묶지 않으면서 `stella_stg`와 `stella`에 재현 가능한 불변 버전으로 게시하는 구현 계약이다.

## 현재 결정

- 첫 한국어 유료 질문 버전 ID: `guardian-paid-ko-mvp-v1`
- 상품: `guardian-report-full-v1`
- 핵심 선택형 질문: 네 주제별 3개, 정확히 12개
- 필수 맞춤 질문: 네 주제별 1개, 정확히 4개
- 심화 맞춤 질문: 필요할 때 네 주제별 최대 1개, 총 0~4개
- Git 문항은행: 최대 150개
- 자유 입력: 진행률과 질문 수에서 제외한 선택 메모 1개, 빈 값으로 건너뛸 수 있음
- 현재 문항은행: 선택형 44개와 선택 메모 1개, 선택지 176개
- 사용자별 출제: 핵심 12개 + 필수 맞춤 4개 + 심화 맞춤 0~4개, 총 16~20개
- 브라우저 전달: 현재 선택형 문항 하나 또는 마지막 선택 메모만
- 저장 답변:
  `questionId → { type: "option", optionId } | { type: "text", text: string | null }`
- 게시된 버전은 수정하지 않는다. 수정은 새 version ID로 게시한다.

### 한국어 v1 적응형 선택

모든 사용자는 자기이해·사랑·일·결정의 핵심 질문을 각각 3개씩 먼저 지난다. 이후 서버는 지금까지
누적된 모든 signal을 이용해 다음 문항을 매번 다시 고른다.

1. `required` 후보 중 아직 질문을 받지 않은 주제의 최고 점수 문항을 고른다.
2. 그 답의 signal을 누적하고 다시 계산한다. 네 주제에서 하나씩 고를 때까지 반복한다.
3. 네 주제의 필수 맞춤 질문이 끝나면 `deepening` 후보를 평가한다.
4. 게시된 `minimumScore`를 넘은 후보 중 최고 점수를 고르되, 주제별 심화 질문은 하나만 낸다.
5. 기준을 넘는 후보가 없거나 네 주제의 심화 질문이 모두 끝나면 선택 메모로 이동한다.

문항 점수는 `누적 signal 값 × 문항의 signalWeights` 합이다. 동점이면 큰 `priority`를 우선하고,
그래도 같으면 JSON에 먼저 기록된 문항을 고른다. `inner`, `relationship`, `reality`, `timing`은
문항은행을 정리하기 위한 ID 묶음일 뿐 고정 코스가 아니다. 열두 번째 답의 `choice.blocker.*`도
여러 signal 중 하나로만 반영되므로 한 답이 이후 문항 전체를 고정하지 않는다.

## Git 소스와 런타임 전달 경계

질문 콘텐츠는 다음 위치에 JSON으로 커밋한다.

```text
apps/stella/content/guardian-questionnaires/<version>.json
```

각 파일에는 다음을 모두 포함한다.

- 실제 질문 문구와 보조 문구
- 실제 선택지 문구
- 맞춤 문항의 역할·우선순위·선택 signal과 심화 기준
- 선택지별 signal 이름과 가중치

이 repository는 public이므로 Git에 커밋한 질문 원문은 repository 독자에게 공개된다. 결제
entitlement는 Stella 앱과 API에서 질문을 제공하는 시점을 제어하며 Git 원본 자체를 비밀로 만들지는
않는다.

질문 디렉터리는 Next의 `src`와 정적 `public` 밖에 둔다. Next 화면 코드에서 JSON을 import하지
않고 게시 CLI만 읽으므로 전체 문항은행이 정적 export나 브라우저 chunk에 자동 포함되지 않는다.
Worker runtime은 Git 파일이 아니라 report에 고정된 DB version을 읽어 현재 문항 하나만 반환한다.

## JSON 계약

최상위 필드:

| 필드                               | 의미                                         |
| ---------------------------------- | -------------------------------------------- |
| `schemaVersion`                    | 현재 `1`                                     |
| `version`                          | 한번 게시하면 재사용하지 않는 콘텐츠 버전 ID |
| `productSku`                       | 전체 리포트 SKU                              |
| `locale`                           | 질문 원문 로케일                             |
| `coreQuestionsPerSlot`             | 현재 `3`                                     |
| `requiredAdaptiveQuestionsPerSlot` | 현재 `1`                                     |
| `maximumAdaptiveQuestionsPerSlot`  | 현재 `2`                                     |
| `questions`                        | 최대 150개의 선택형 문항과 선택 메모         |

`single_choice` 문항은 2~7개의 option을 가지며 option에는 서버용 `signals` 숫자 map만 둔다.
core 문항은 JSON 배열 순서대로 제공한다. adaptive 문항은 `selection`에 다음을 선언한다.

- `role`: 주제별 하나를 반드시 고르는 `required` 또는 기준을 넘을 때만 고르는 `deepening`
- `priority`: 선택 점수가 같을 때 사용하는 명시적 우선순위
- `signalWeights`: 누적 signal에서 이 문항의 관련도를 계산하는 가중치
- `minimumScore`: `deepening` 문항에만 있으며 추가 출제에 필요한 최소 관련도

`free_text`는 `phase: "note"`, `optional: true`인 마지막 항목 하나다. 미작성은
`{ "type": "text", "text": null }`로 저장한다. 자유 입력은 점수로 직접 변환하지 않고 상세
리포트의 보조 맥락으로만 사용하며, 16~20개 진행률에는 포함하지 않는다.

### signal 계약

signal key는 리포트 문장 자체가 아니라 답변에서 확인된 의미 축이다.

- 첫 namespace는 `self`, `love`, `work`, `choice`, `guidance`, `report` 중 하나다.
- 핵심·맞춤 선택의 중심 의미에는 보통 `3`, 보조 의미에는 `2`를 준다.
- 결정을 어렵게 만드는 중심 요인은 `choice.blocker.* = 4`와 `report.path.* = 1`을 기록하지만,
  다른 핵심 답변과 똑같이 누적 선택 점수의 일부로만 사용한다.
- 같은 key가 여러 답에서 반복되면 합산해 강조도를 높인다. 서로 다른 의미의 숫자를 하나의
  총점으로 합치지는 않는다.
- 선택 사항 자유 입력은 signal로 환산하지 않고 원문 답변 snapshot으로만 보존한다.

리포트 생성기는 슬롯별 signal과 원래 `questionId/optionId` 답변을 함께 사용한다. signal은
본문의 중심·조언 방식·한 줄 메시지를 선택하고, 원래 답변은 왜 그 해석이 선택됐는지 설명하는
근거가 된다.

게시 검증은 다음을 확인한다.

- question ID와 question 내부 option ID가 중복되지 않음
- 핵심 문항이 정확히 12개, 네 주제별 3개이고 모두 선택형임
- 네 주제마다 `required`와 `deepening` 후보가 각각 하나 이상 있음
- 선택 메모가 정확히 하나이고 JSON의 마지막 항목임
- 모든 adaptive 선택 signal을 실제 option 중 하나가 생성함
- 모든 선택지가 적어도 하나의 signal을 제공함
- 현재 manifest가 가리키는 질문 version이면 모든 선택형 문항에 같은 slot의 한국어 상세 본문 frame이 있음
- 한국어 본문 중심·조언·말투·종합 경로가 참조하는 signal을 실제 option이 생성함

잘못된 콘텐츠는 요청 처리 중 다른 문항이나 점수로 대체하지 않고 게시 단계에서 거부한다.

## DB와 진행 모델

콘텐츠는 다음 세 테이블에 원자적으로 게시한다.

- `guardian_questionnaire_version`: 상품·로케일·주제별 출제 수 정책·SHA-256
- `guardian_question`: 문항 원문, 주제 슬롯, phase, adaptive 선택 정책
- `guardian_question_option`: 표시 문구와 서버용 signal map

구매 진행은 다음 두 위치에 저장한다.

- `guardian_question_answer`: 한 문항마다 즉시 저장하는 재개용 행
- `guardian_report`: 완료 순간 answer map과 합산 signal map을 불변 snapshot으로 저장

report는 checkout 때 questionnaire version을 고정하지만, `paid` 구매의
`entitlementGrantedAt`이 없으면 질문을 읽거나 저장할 수 없다. 마지막 답변 전까지
`familySnapshot`, `loveFamilyId`, `cardSnapshot`은 `null`이다. 결제 확인은 질문 권한만 열며
카드를 뽑지 않는다.

Worker는 pinned version 전체를 서버 내부에서 읽고 저장 답변을 순서대로 재생해 다음 adaptive 문항을
결정한다. 브라우저 projection은 현재 문항의 ID·주제·문구·표시 option 또는 마지막 선택 메모만
허용한다. 다른 문항, 선택 역할·기준, signal 이름·가중치, 누적 답변은 응답에 넣지 않는다.

## 게시 절차

먼저 환경별 schema에 현재 Drizzle 선언을 반영한다.

```bash
STELLA_DB_SCHEMA=stella_stg STELLA_POSTGRES_URL_DIRECT=... bun run db:push
STELLA_DB_SCHEMA=stella STELLA_POSTGRES_URL_DIRECT=... bun run db:push
```

Git에 커밋할 파일은 DB 연결 없이 검증할 수 있다.

```bash
bun run questionnaire:validate \
  --file content/guardian-questionnaires/guardian-paid-ko-mvp-v1.json
```

staging에 원자적으로 게시한다.

```bash
STELLA_DB_SCHEMA=stella_stg STELLA_POSTGRES_URL_DIRECT=... \
  bun run questionnaire:publish \
  --file content/guardian-questionnaires/guardian-paid-ko-mvp-v1.json
```

CLI가 출력한 SHA-256을 staging 검수 기록에 남긴다. production은 같은 파일과 그 hash를 명시해야
게시된다.

```bash
STELLA_DB_SCHEMA=stella STELLA_POSTGRES_URL_DIRECT=... \
  bun run questionnaire:publish \
  --file content/guardian-questionnaires/guardian-paid-ko-mvp-v1.json \
  --expected-hash <staging-sha256>
```

같은 version이 이미 있으면 overwrite나 upsert를 하지 않고 실패한다. 문구, 선택 정책, signal을
수정했다면 새 ID로 staging에 게시·검수하고 상품 manifest의 locale별 version pointer를 새 ID로
바꾼 뒤 production에 같은 hash로 게시한다. 이미 생성된 report는 기존 pinned version을 계속
사용한다.

`STELLA_POSTGRES_URL_DIRECT`는 schema를 만들고 행을 게시할 수 있는 운영자 연결로만 사용한다.
Worker runtime은 기존 `stella_app` + Hyperdrive를 사용한다. sobok-ops의 두 Stella schema
default privilege가 새 테이블·sequence에도 적용되므로 이 기능만을 위한 role, Hyperdrive,
Supabase 프로젝트는 추가하지 않는다.

## 현재 게시·수직 연결

2026-08-01에 `guardian-paid-ko-mvp-v1`을 `stella_stg`·`stella` 양쪽 schema에 45문항·176선택지로
게시했다. 두 환경의 SHA-256은
`38b0f79a2b838f2fa7a461be7d269b39fa67c0c47d302939b88c46eb70d2c85e`로 같다.

`guardian-paid-ko-mvp-v1.json`, guest checkout, 결제 entitlement, capability 기반 질문 GET/PUT,
마지막 답변의 report fulfillment, PortOne confirm·webhook·15분 pending 재조정과 fulfilled report GET이
연결되어 있다.
checkout은 questionnaire version을 고정하고 질문 API는 아직 공개되지 않은 문항이나 signal을
반환하지 않는다.

마지막 답변 transaction은 answer·signal snapshot, 카드 네 장과 함께 렌더가 끝난 한국어
`narrative_snapshot`도 고정한다. 각 선택 답변이 상세 근거 문단으로 남는 방식과 최종 GET 응답은
[한국어 개인화 리포트 본문 엔진과 최종 계약](./paid-report-content-engine.md)을 따른다. 무료 미리보기 →
checkout → 유료 질문 → 카드 공개 화면과 결제 완료 메일·재열람 링크 교환도 연결되어 있다. 남은 외부
연결은 복구 메일 schema·Secrets Store의 환경 반영과 실제 PortOne 테스트 결제부터 메일 수신·질문
재개·카드 공개까지의 E2E다.
