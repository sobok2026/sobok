# 유료 질문 콘텐츠 계약과 배포

유료 질문 원문·선택지·적응형 선택 정책·점수 행렬을 Git source of truth로 관리하고 Database Worker의
서버 전용 번들로 배포하는 구현 계약이다. 질문 콘텐츠를 PostgreSQL에 게시하거나 report에 질문 버전을
고정하지 않는다.

## 현재 계약

- 상품: `guardian-report-full-v1`
- 한국어 원본: `content/guardian-questionnaires/guardian-paid-ko.json`
- 핵심 선택형 질문: 네 주제별 3개, 정확히 12개
- 필수 맞춤 질문: 네 주제별 1개, 정확히 4개
- 심화 맞춤 질문: 필요할 때 네 주제별 최대 1개, 총 0~4개
- 문항은행: 최대 150개
- 자유 입력: 진행률에서 제외한 선택 메모 1개
- 현재 문항은행: 선택형 44개, 선택 메모 1개, 선택지 176개
- 사용자별 출제: 핵심 12개 + 필수 맞춤 4개 + 심화 맞춤 0~4개, 총 16~20개
- 브라우저 전달: 현재 선택형 문항 하나 또는 마지막 선택 메모만
- 저장 답변: `questionId → { type: "option", optionId } | { type: "text", text: string | null }`

## 적응형 선택

모든 사용자는 자기이해·사랑·일·결정의 핵심 질문을 각각 3개씩 먼저 지난다. 이후 서버는 누적된 모든
signal을 이용해 다음 문항을 매번 다시 고른다.

1. `required` 후보 중 아직 질문을 받지 않은 주제의 최고 점수 문항을 고른다.
2. 그 답의 signal을 누적하고 다시 계산한다. 네 주제에서 하나씩 고를 때까지 반복한다.
3. 네 주제의 필수 맞춤 질문이 끝나면 `deepening` 후보를 평가한다.
4. 설정된 `minimumScore`를 넘은 후보 중 최고 점수를 고르되, 주제별 심화 질문은 하나만 낸다.
5. 기준을 넘는 후보가 없거나 네 주제의 심화 질문이 모두 끝나면 선택 메모로 이동한다.

문항 점수는 `누적 signal 값 × 문항의 signalWeights` 합이다. 동점이면 큰 `priority`를 우선하고,
그래도 같으면 JSON에서 먼저 선언된 문항을 고른다.

## 서버 번들 경계

질문 JSON은 Next의 `src`와 정적 `public` 밖에 둔다. Next 화면에서는 import하지 않으며,
`worker/guardian/questionnaire-content.ts`만 명시적으로 import한다. 따라서 전체 문항은행은 Database
Worker 번들에는 포함되지만 정적 사이트의 브라우저 chunk에는 포함되지 않는다.

Worker는 module scope에서 JSON을 한 번 파싱하고 다음을 검증한다.

- question ID와 question 내부 option ID가 중복되지 않음
- 핵심 문항이 정확히 12개이고 네 주제별 3개임
- 네 주제마다 `required`와 `deepening` 후보가 각각 하나 이상 있음
- 선택 메모가 정확히 하나이고 JSON의 마지막 항목임
- 모든 adaptive 선택 signal을 실제 option 중 하나가 생성함
- 모든 선택지가 적어도 하나의 signal을 제공함
- 모든 선택형 문항에 같은 slot의 한국어 상세 본문 frame이 있음
- 본문 선택기가 참조하는 signal을 실제 option이 생성함

잘못된 콘텐츠는 다른 문항이나 점수로 대체하지 않는다. 검증 실패는 CI의
`bun run questionnaire:validate`에서 배포 전에 차단하고, Worker 시작 시에도 같은 검증을 반복한다.

이 repository는 public이므로 Git에 커밋한 질문 원문은 repository 독자에게 공개된다. 결제 entitlement는
Stella API에서 질문을 제공하는 시점을 제어하며 Git 원본 자체를 비밀로 만들지는 않는다.

## JSON 계약

최상위 필드:

| 필드                               | 의미                                 |
| ---------------------------------- | ------------------------------------ |
| `productSku`                       | 전체 리포트 SKU                      |
| `locale`                           | 질문 원문 로케일                     |
| `coreQuestionsPerSlot`             | 현재 `3`                             |
| `requiredAdaptiveQuestionsPerSlot` | 현재 `1`                             |
| `maximumAdaptiveQuestionsPerSlot`  | 현재 `2`                             |
| `questions`                        | 최대 150개의 선택형 문항과 선택 메모 |

`single_choice` 문항은 2~7개의 option을 가지며 option에는 서버용 `signals` 숫자 map을 둔다. core 문항은
JSON 배열 순서대로 제공한다. adaptive 문항은 `selection`에 다음을 선언한다.

- `role`: 주제별 하나를 반드시 고르는 `required` 또는 기준을 넘을 때만 고르는 `deepening`
- `priority`: 선택 점수가 같을 때 사용하는 우선순위
- `signalWeights`: 누적 signal에서 이 문항의 관련도를 계산하는 가중치
- `minimumScore`: `deepening` 문항에만 있는 추가 출제 최소 관련도

`free_text`는 `phase: "note"`, `optional: true`인 마지막 항목 하나다. 미작성은
`{ "type": "text", "text": null }`로 저장한다. 자유 입력은 signal로 변환하지 않고 최종 리포트의
보조 맥락으로만 사용한다.

## ID와 콘텐츠 변경 규칙

`questionId`와 `optionId`는 DB에 저장되는 영구 식별자다.

- 기존 ID를 다른 의미에 재사용하지 않는다.
- 같은 의미의 문구를 다듬을 때 ID는 유지한다.
- 선택지의 의미나 signal 의미를 바꾸는 경우 새 ID를 사용한다.
- 진행 중인 답변을 배포 시 자동 삭제하거나 초기화하지 않는다.
- draft report는 항상 현재 배포된 Worker의 질문 콘텐츠로 이어서 진행한다.
- fulfilled report는 이미 렌더된 `narrative_snapshot`을 반환하므로 질문 변경의 영향을 받지 않는다.

이 계약은 과거 질문 원문을 정확히 재현하는 기능보다 단일 현재 콘텐츠와 단순한 운영 경계를 선택한다.
과거 질문 원문 재현이 제품 요구가 되면 질문 버전을 다시 암묵적으로 만들지 말고 별도 보존 요구로
재설계한다.

## DB와 진행 모델

질문 원문·선택지·선택 정책을 저장하는 테이블은 없다. 구매 진행은 두 위치에만 저장한다.

- `guardian_question_answer`: `report_id`, 문자열 `question_id`, 답변 kind, 문자열 `option_id` 또는 text
- `guardian_report`: 완료 순간 answer map과 합산 signal map을 불변 snapshot으로 저장

`paid` 구매의 `entitlementGrantedAt`이 없으면 질문을 읽거나 저장할 수 없다. 마지막 답변 전까지
`familySnapshot`, `loveFamilyId`, `cardSnapshot`은 `null`이다. 결제 확인은 질문 권한만 열며 카드를
뽑지 않는다.

Worker는 저장 답변을 순서대로 재생해 다음 adaptive 문항을 결정한다. 브라우저 projection은 현재
문항의 ID·주제·문구·표시 option 또는 마지막 선택 메모만 허용한다. 다른 문항, 선택 역할·기준,
signal 이름·가중치, 누적 답변은 응답에 넣지 않는다.

## 변경과 배포

질문을 변경할 때는 다음 순서만 사용한다.

1. `guardian-paid-ko.json`을 수정한다.
2. `bun --filter=@sobok/stella questionnaire:validate`를 실행한다.
3. schema 변경이 함께 있다면 환경별 Drizzle schema apply를 먼저 완료한다.
4. Database Worker를 배포한다.

질문 콘텐츠용 DB 연결, hash 비교, staging/production 별도 게시, manifest pointer 변경은 없다. 동일한
commit의 Worker 번들이 각 환경의 질문 source of truth다.

마지막 답변 transaction은 answer·signal snapshot, 카드 네 장과 렌더된 한국어
`narrative_snapshot`을 함께 고정한다. 각 선택 답변이 상세 근거 문단으로 남는 방식과 최종 GET 응답은
[한국어 개인화 리포트 본문 엔진과 최종 계약](./paid-report-content-engine.md)을 따른다.
