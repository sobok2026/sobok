# 유료 질문 콘텐츠 계약과 게시

유료 질문 원문·선택지·분기·점수 행렬을 Git source of truth로 관리하고, 정적 JavaScript에는
묶지 않으면서 `stella_stg`와 `stella`에 재현 가능한 불변 버전으로 게시하는 구현 계약이다.

## 현재 결정

- 첫 한국어 유료 질문 버전 ID: `guardian-paid-ko-mvp-v1`
- 상품: `guardian-report-full-v1`
- 핵심 선택형 질문: 모든 경로에서 정확히 12개
- 적응형 후속 질문: 사용자 경로마다 최대 8개
- Git 문항은행: 최대 150개
- 자유 입력: 선택 사항 최대 1개, 빈 값으로 건너뛸 수 있음
- 브라우저 전달: 현재 한 문항의 문구와 표시 선택지만
- 저장 답변:
  `questionId → { type: "option", optionId } | { type: "text", text: string | null }`
- 게시된 버전은 수정하지 않는다. 수정은 새 version ID로 게시한다.

## Git 소스와 런타임 전달 경계

질문 콘텐츠는 다음 위치에 JSON으로 커밋한다.

```text
apps/stella/content/guardian-questionnaires/<version>.json
```

각 파일에는 다음을 모두 포함한다.

- 실제 질문 문구와 보조 문구
- 실제 선택지 문구
- 질문 간 분기
- 선택지별 signal 이름과 가중치

이 repository는 public이므로 Git에 커밋한 질문 원문은 repository 독자에게 공개된다. 결제
entitlement는 Stella 앱과 API에서 질문을 제공하는 시점을 제어하며 Git 원본 자체를 비밀로 만들지는
않는다.

질문 디렉터리는 Next의 `src`와 정적 `public` 밖에 둔다. Next 화면 코드에서 JSON을 import하지
않고 게시 CLI만 읽으므로 전체 문항은행이 정적 export나 브라우저 chunk에 자동 포함되지 않는다.
Worker runtime은 Git 파일이 아니라 report에 고정된 DB version을 읽어 현재 문항 하나만 반환한다.

## JSON 계약

최상위 필드:

| 필드                       | 의미                                         |
| -------------------------- | -------------------------------------------- |
| `schemaVersion`            | 현재 `1`                                     |
| `version`                  | 한번 게시하면 재사용하지 않는 콘텐츠 버전 ID |
| `productSku`               | 전체 리포트 SKU                              |
| `locale`                   | 질문 원문 로케일                             |
| `entryQuestionId`          | 첫 문항 ID                                   |
| `coreQuestionCount`        | 현재 `12`                                    |
| `maximumAdaptiveQuestions` | 현재 `8`                                     |
| `questions`                | 최대 150개의 문항과 분기                     |

`single_choice` 문항은 2~7개의 option을 가진다. option에는 현재 선택 뒤의
`nextQuestionId`와 서버용 `signals` 숫자 map이 들어간다. `null`인 다음 ID는 해당 경로의
완료를 뜻한다.

`free_text` 문항은 `optional: true`이며 question 자체에 다음 ID가 있다. 미작성은
`{ "type": "text", "text": null }`로 저장한다. 자유 입력은 점수로 직접 변환하지 않고 상세
리포트의 보조 맥락으로만 사용한다.

게시 검증은 다음을 확인한다.

- question ID와 question 내부 option ID가 중복되지 않음
- 모든 next ID와 entry ID가 존재함
- 순환과 entry에서 도달할 수 없는 문항이 없음
- 핵심 문항이 정확히 12개, 네 주제별 3개이고 모두 선택형임
- 모든 가능한 완료 경로가 핵심 문항 12개를 전부 지남
- 첫 문항은 core이고 adaptive 단계에서 core 문항으로 되돌아가지 않음
- 한 경로의 적응형 문항이 8개를 넘지 않음
- 전체 자유 입력 문항이 최대 1개임
- 모든 선택지가 적어도 하나의 signal을 제공함

잘못된 콘텐츠는 요청 처리 중 다른 문항이나 점수로 대체하지 않고 게시 단계에서 거부한다.

## DB와 진행 모델

콘텐츠는 다음 세 테이블에 원자적으로 게시한다.

- `guardian_questionnaire_version`: 상품·로케일·entry·정책 수치·SHA-256
- `guardian_question`: 문항 원문, 주제 슬롯, core/adaptive, 문항 종류
- `guardian_question_option`: 표시 문구, 다음 문항, 서버용 signal map

구매 진행은 다음 두 위치에 저장한다.

- `guardian_question_answer`: 한 문항마다 즉시 저장하는 재개용 행
- `guardian_report`: 완료 순간 answer map과 합산 signal map을 불변 snapshot으로 저장

report는 checkout 때 questionnaire version을 고정하지만, `paid` 구매의
`entitlementGrantedAt`이 없으면 질문을 읽거나 저장할 수 없다. 마지막 답변 전까지
`familySnapshot`, `loveFamilyId`, `cardSnapshot`은 `null`이다. 결제 확인은 질문 권한만 열며
카드를 뽑지 않는다.

Worker는 pinned version 전체를 서버 내부에서 읽어 저장 답변을 따라 한 경로만 계산한다.
브라우저 projection은 현재 문항의 ID·주제·문구·표시 option만 허용한다. 다음 ID, 다른 문항,
signal 이름·가중치, 누적 답변은 응답에 넣지 않는다.

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

같은 version이 이미 있으면 overwrite나 upsert를 하지 않고 실패한다. 문구, 분기, signal을
수정했다면 새 ID로 staging에 게시·검수하고 상품 manifest의 locale별 version pointer를 새 ID로
바꾼 뒤 production에 같은 hash로 게시한다. 이미 생성된 report는 기존 pinned version을 계속
사용한다.

`STELLA_POSTGRES_URL_DIRECT`는 schema를 만들고 행을 게시할 수 있는 운영자 연결로만 사용한다.
Worker runtime은 기존 `stella_app` + Hyperdrive를 사용한다. sobok-ops의 두 Stella schema
default privilege가 새 테이블·sequence에도 적용되므로 이 기능만을 위한 role, Hyperdrive,
Supabase 프로젝트는 추가하지 않는다.

## 다음 수직 연결

현재는 Git 저장 위치와 계약만 만들었고 실제 `guardian-paid-ko-mvp-v1.json` 문항은 아직 작성하지
않았다. guest draft, 결제 entitlement 함수, 질문 진행과 마지막 답변의 report fulfillment
도메인은 구현되어 있다. 다음 구현은 이 계약 위에 다음을 외부 흐름으로 연결한다.

1. guest checkout API에서 report와 현재 questionnaire version 고정
2. PortOne 원격 검증 성공을 기존 `paid` + 질문 entitlement 함수에 연결
3. 질문 GET/PUT API에서 collection capability 확인
4. 저장된 fulfilled snapshot을 카드 공개 화면에 전달
