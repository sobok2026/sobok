# Guardian card content sources

유료 리포트 카드의 한국어 원고와 production 제작 계획을 관리하는 Git source of truth다. 이 디렉터리는
Next의 `src`나 정적 `public` 아래가 아니므로 웹 빌드에 자동 포함되지 않는다.

## 현재 상태

| 파일                                         | 상태                     | 범위                                                                          |
| -------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| `guardian-card-families-ko.json`             | `authoring`              | 12별자리 × 자기이해·사랑·일·결정, 총 48개 기본 패밀리의 한국어 원고           |
| `production-edition-plan.json`               | `work_order`             | 실제 에디션 1,056개를 제작하기 위한 장면·표현·희귀도 매트릭스                 |
| `guardian-self-edition-blueprints-ko.json`   | `authoring`              | 자기이해 12패밀리의 서사 맥락 48개와 네 표현 방식의 한국어 원고               |
| `guardian-self-editions-ko.json`             | `editorial_draft`        | 개별 ID·제목·장면·접근성 설명·한 줄을 명시한 자기이해 에디션 192개            |
| `guardian-love-edition-blueprints-ko.json`   | `authoring`              | 사랑 12패밀리의 서사 테마 120개와 네 희귀도의 한국어 원고                     |
| `guardian-love-editions-ko.json`             | `editorial_draft`        | 개별 ID·고정 가중치·원고를 명시한 사랑 에디션 480개                           |
| `guardian-work-edition-blueprints-ko.json`   | `authoring`              | 일 12패밀리의 서사 맥락 48개와 네 표현 방식의 한국어 원고                     |
| `guardian-work-editions-ko.json`             | `editorial_draft`        | 개별 ID·제목·장면·접근성 설명·한 줄을 명시한 일 에디션 192개                  |
| `guardian-choice-edition-blueprints-ko.json` | `authoring`              | 결정 12패밀리의 서사 맥락 48개와 네 표현 방식의 한국어 원고                   |
| `guardian-choice-editions-ko.json`           | `editorial_draft`        | 개별 ID·제목·장면·접근성 설명·한 줄을 명시한 결정 에디션 192개                |
| `production-art-pilot-plan-ko.json`          | `visual_review_complete` | 별자리별 대표 원고·3:4 원화 후보 12개 시각 승인 완료                          |
| `production-art-batches-ko.json`             | `work_order`             | 1,056개 원화를 같은 제작 축의 12별자리 단위 88개 배치로 선언                  |
| `production-art-batch-001-review-ko.json`    | `visual_review_complete` | 첫 production 배치 신규 PNG 11개 시각 승인·승인 해시 고정                     |
| `production-art-batch-002-review-ko.json`    | `visual_review_complete` | 두 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정                |
| `production-art-batch-003-review-ko.json`    | `visual_review_complete` | 세 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정                |
| `production-art-batch-004-review-ko.json`    | `visual_review_complete` | 네 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정                |
| `production-art-batch-005-review-ko.json`    | `visual_review_complete` | 다섯 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정              |
| `production-art-batch-006-review-ko.json`    | `visual_review_complete` | 여섯 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정              |
| `production-art-batch-007-review-ko.json`    | `visual_review_complete` | 일곱 번째 production 배치 파일럿 1개·신규 PNG 11개 시각 승인·승인 해시 고정   |
| `production-art-batch-008-review-ko.json`    | `visual_review_complete` | 여덟 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정              |
| `production-art-batch-009-review-ko.json`    | `visual_review_complete` | 아홉 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정              |
| `production-art-batch-010-review-ko.json`    | `visual_review_complete` | 열 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정                |
| `production-art-batch-011-review-ko.json`    | `visual_review_complete` | 열한 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정              |
| `production-art-batch-012-review-ko.json`    | `visual_review_complete` | 열두 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정              |
| `production-art-batch-013-review-ko.json`    | `visual_review_complete` | 열세 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정              |
| `production-art-batch-014-review-ko.json`    | `visual_review_complete` | 열네 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정              |
| `production-art-batch-015-review-ko.json`    | `visual_review_complete` | 열다섯 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정            |
| `production-art-batch-016-review-ko.json`    | `visual_review_complete` | 열여섯 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정            |
| `production-art-batch-017-review-ko.json`    | `visual_review_complete` | 열일곱 번째 production 배치 파일럿 1개·신규 PNG 11개 시각 승인·승인 해시 고정 |
| `production-art-batch-018-review-ko.json`    | `visual_review_complete` | 열여덟 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정            |
| `production-art-batch-019-review-ko.json`    | `visual_review_complete` | 열아홉 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정            |
| `production-art-batch-020-review-ko.json`    | `visual_review_complete` | 스무 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정              |
| `production-art-batch-021-review-ko.json`    | `visual_review_complete` | 스물한 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정            |
| `production-art-batch-022-review-ko.json`    | `visual_review_complete` | 스물두 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정            |
| `production-art-batch-023-review-ko.json`    | `visual_review_complete` | 스물세 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정            |
| `production-art-batch-024-review-ko.json`    | `visual_review_complete` | 스물네 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정            |
| `production-art-batch-025-review-ko.json`    | `visual_review_complete` | 스물다섯 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정          |
| `production-art-batch-026-review-ko.json`    | `visual_review_complete` | 스물여섯 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정          |
| `production-art-batch-027-review-ko.json`    | `visual_review_complete` | 스물일곱 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정          |
| `production-art-batch-028-review-ko.json`    | `visual_review_complete` | 스물여덟 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정          |
| `production-art-batch-029-review-ko.json`    | `visual_review_complete` | 스물아홉 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정          |
| `production-art-batch-030-review-ko.json`    | `visual_review_complete` | 서른 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정              |
| `production-art-batch-031-review-ko.json`    | `visual_review_complete` | 서른한 번째 production 배치 신규 PNG 12개 시각 승인·승인 해시 고정            |
| `production-art-batch-032-review-ko.json`    | `editorial_review_ready` | 서른두 번째 production 배치 신규 12개 편집 검토 준비, 사람 승인 대기          |
| `guardian-card-asset-contract.json`          | `delivery_contract`      | R2 버킷·객체 키·WebP 최적화·캐시 불변 계약                                    |
| `guardian-card-assets-ko.json`               | `release_candidate`      | 승인된 381개 WebP 배포 후보의 객체 키·원본/배포 SHA-256                       |

파일명과 JSON에는 수동 버전을 두지 않는다. 각 파일이 현재 정본이며 변경 이력은 Git으로 추적한다. 카드
원고와 의미를 바꾸면 새 에디션 ID를 만들고, 같은 에디션의 원화 교정은 ID를 유지한 채 WebP 해시를 넣은
새 객체 키를 게시한다. 어느 경우에도 기존 R2 객체를 덮어쓰지 않는다.

이 파일들은 아직 runtime manifest가 아니다. 현재 결제 결과에는
`worker/guardian/manifest.ts`에 명시된 유료 MVP 4개 패밀리·7개 실물 에디션만 노출된다. 제작 계획을
런타임에서 조합해 존재하지 않는 카드 ID나 이미지 경로를 만들면 안 된다.

## 기본 패밀리 원고

각 패밀리는 다음 내용을 하나의 편집 단위로 묶는다.

- 고정 ID, 별자리, 리포트 주제, 중심 수호령과 사용할 수 있는 동료
- 카드 제목, 기본 장면, 중심 감정, 접근성용 기본 이미지 설명
- 캐릭터 말투가 드러나는 짧은 대사
- 리포트의 개인화 초점이 정확히 한 번 들어가는 focus token 한 줄
- 사용자가 바로 답할 수 있는 회고 질문
- 에디션 제작에 유지할 시각 모티프 3개
- 현재 한국어 유료 질문에서 실제로 생성되는 신호 2개

`{focus}`는 저작 단계의 자리표시자다. 뒤에 한국어 조사가 필요하면 기존 repository의 template 문법과
같이 `{focus:을}`, `{focus:가}`, `{focus:은}`을 사용해 받침에 따라 을/를·이/가·은/는을 고른다. 예를
들어 `“{focus:을}” 돌보는 방식`은 초점이 `솔직한 대화`면 `“솔직한 대화를” 돌보는 방식`, `깊은 믿음`이면
`“깊은 믿음을” 돌보는 방식`으로 렌더한다. 사용자 결과에는 토큰을 그대로 노출하지 않고, 불변 리포트
스냅샷을 만들 때 선택된 해석 초점과 올바른 조사를 함께 치환한다.

## 비사랑 에디션 원고

### 자기이해

자기이해 192개는 별자리마다 다음 네 서사 맥락과 네 표현 방식을 교차해 명시한다.

- 서사 맥락: 지금 마음의 날씨, 숨은 필요, 익숙한 보호 방식, 다음의 나
- 표현 방식: 감정 클로즈업, 행동의 순간, 관계와 환경, 별자리 여운
- 선택 단서: 실제 유료 질문의 `self.*` 신호 2개와 무료 미리보기 tone 1개

`guardian-self-edition-blueprints-ko.json`은 편집 가능한 원고이고,
`guardian-self-editions-ko.json`은 제작·검수에서 사용할 명시적 작업 목록이다. 다음 명령으로
192개 작업 목록을 다시 만든다.

```bash
bun --filter=@sobok/stella guardian-cards:materialize-self
```

### 사랑

사랑 480개는 별자리마다 다음 열 가지 관계 서사와 네 희귀도를 교차해 명시한다.

- 관계 서사: 첫 신호, 조심스러운 접근, 일상의 돌봄, 솔직한 대화, 함께 노는 시간, 경계와 공간,
  거리와 귀환, 회복, 함께 성장하기, 다음 약속
- 희귀도: Orbit, Nebula, Eclipse, Stella
- 해석 단서: 실제 유료 질문의 `love.*` 신호 2개

질문 신호는 카드의 관계 맥락과 원고 해석에만 사용한다. 희귀도는 신호와 무관하게 패밀리 안에서
Orbit 55%, Nebula 30%, Eclipse 12%, Stella 3%의 고정 가중치로 추첨한다. blueprint를 수정한 뒤
다음 명령으로 명시적 480개 작업 목록을 다시 만든다.

```bash
bun --filter=@sobok/stella guardian-cards:materialize-love
```

### 일

일 192개도 별자리마다 네 서사 맥락과 네 표현 방식을 교차해 명시한다.

- 서사 맥락: 움직이는 이유, 이미 가진 힘, 압박을 다루는 법, 다음 한 수
- 표현 방식: 감정 클로즈업, 첫 작업, 협업, 결과와 다음 이정표
- 선택 단서: 실제 유료 질문의 `work.*` 신호 2개와 무료 미리보기 tone 1개

`guardian-work-edition-blueprints-ko.json`을 수정한 뒤 다음 명령으로 명시적 192개 작업 목록을
다시 만든다.

```bash
bun --filter=@sobok/stella guardian-cards:materialize-work
```

### 결정

결정 192개는 각 별자리의 선택 습관을 네 서사 맥락과 네 표현 방식으로 나눈다.

- 서사 맥락: 원하는 쪽, 확인할 단서, 지켜야 할 것, 되돌릴 수 있는 첫걸음
- 표현 방식: 감정 클로즈업, 첫 선택, 대화, 다음 판단 시점
- 선택 단서: 실제 유료 질문의 `choice.*` 신호 2개와 무료 미리보기 tone 1개

`guardian-choice-edition-blueprints-ko.json`을 수정한 뒤 다음 명령으로 명시적 192개 작업 목록을
다시 만든다.

```bash
bun --filter=@sobok/stella guardian-cards:materialize-choice
```

materialize는 저작 단계에서만 수행한다. 런타임은 blueprint를 읽거나 조합하지 않으며, 최종 원화와
편집 승인을 받은 개별 에디션만 현재 런타임 카탈로그에 직접 기록한다. 현재 네 주제 1,056개의
`artworkPath`는 모두 `null`, `assetStatus`는 `not_started`, `editorialStatus`는 `draft`다.

## production 제작 수량

| 주제     | 패밀리 | 패밀리당 에디션 |  합계 | 선택 방식                       |
| -------- | -----: | --------------: | ----: | ------------------------------- |
| 자기이해 |     12 |              16 |   192 | 답변·차트 맥락 점수             |
| 사랑     |     12 |              40 |   480 | 패밀리 선택 뒤 희귀도 가중 추첨 |
| 일       |     12 |              16 |   192 | 답변·차트 맥락 점수             |
| 결정     |     12 |              16 |   192 | 답변·차트 맥락 점수             |
| 전체     |     48 |                 | 1,056 |                                 |

자기이해·일·결정은 주제별 서사 맥락 4개와 표현 방식 4개를 교차해 패밀리당 16개를 제작한다. 사랑은
서사 테마 10개마다 Orbit·Nebula·Eclipse·Stella 4개 희귀도를 각각 제작한다. 사랑 패밀리 하나의
가중치 합은 10,000이며 희귀도 합산 확률은 Orbit 55%, Nebula 30%, Eclipse 12%, Stella 3%다.

1,056은 출시 최소선 1,024보다 32개 많다. 이 숫자는 자동 생성 허용량이 아니라, 최종 원화와 원고를
개별 검수해야 하는 제작 발주량이다.

네 주제 1,056개는 모두 고유 ID·제목·장면·접근성 설명·한 줄·회고 질문을 가진 명시적 편집 초안으로
materialize했다. 콘텐츠 작업 목록의 남은 조합은 없으며, 다음 게이트는 원고 개별 편집 승인과 원화
제작이다.

## production 편집 게이트

자동 검증은 1,056개 초안에 다음 최소 편집 기준을 적용한다.

- 제목 30자, 장면 160자, 접근성 설명 110자, 개인화 한 줄 120자, 회고 문장 60자 이내
- 개인화 한 줄은 focus token으로 시작하고 정확히 두 개의 짧은 문장으로 끝남
- 받침에 따라 달라지는 조사는 `{focus:을}`·`{focus:가}`·`{focus:은}` 문법으로 명시
- 접근성 설명에는 개인화 token·대사·보이지 않는 해석을 넣지 않음
- 무조건적인 미래·운명·성공을 단정하는 표현을 사용하지 않음
- 장면과 원화에는 읽을 수 있는 제목·설명 문구를 굽지 않음

이 검증 통과는 사람의 편집 승인을 대신하지 않는다. 모든 에디션의 `editorialStatus`는 여전히
`draft`다. 대표 후보 12개는 캐릭터 연속성·장면 제작 가능성·보이는 정보만 담은 대체 텍스트·비단정
문구·비개인화 마스터 원화·기호만 사용하는 화면 표식의 사전 검수를 마쳐
`editorialReviewStatus: approved` 상태다. 각 후보의 `editorialContentHash`는 제목·장면·대체 텍스트·
한 줄·성찰 문구 등 사람이 승인한 정확한 원고를 고정한다. 원고가 바뀌면 검증이 실패하므로 다시
검수한 뒤 해시를 갱신해야 한다. 이 승인은 12개 파일럿 원고만 대상으로 하며 나머지 에디션의
`editorialStatus: draft`를 일괄 승인하지 않는다.

## 이미지 제작 시점

production 출시에 1,024장 이상의 실제 카드 이미지는 필수다. 다만 원고의 중심 행동·소품·동료가
확정되기 전에 대량 제작하지 않는다.

1. 에디션 원고와 접근성 설명을 편집 승인한다.
2. `production-art-pilot-plan-ko.json`의 별자리별 대표 에디션 한 장씩 12장으로 3:4
   구도·표정·소품을 먼저 확인한다.
3. 승인된 캐릭터 시트와 에디션 `scene`을 사용해 주제 단위로 배치 제작한다.
4. 80px 식별성, 중심 행동, 최대 두 캐릭터, 텍스트 미삽입을 검수한다.
5. 승인 원본을 1080×1440 WebP로 최적화하고 Cloudflare R2의 콘텐츠 주소형 객체 키에 올린 뒤에만
   `assetStatus`와 `artworkPath`를 채운다.

현재 파일럿 12장의 로컬 원화 후보는 생성·시각 QA·사람의 최종 시각 승인을 마쳤다. 승인한 파일의
SHA-256은 제작 목록의 `approvedArtworkSha256`에 고정한다. 후보와 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-pilot` 아래에서만 보관한다. R2 업로드 전까지
`imageStatus`는 `approved_local_candidate`, `artworkPath`는 `null`로 유지한다. 로컬 후보 경로를 runtime이나
공개 콘텐츠 manifest에 기록하지 않는다. 배포 후보 WebP도 `apps/stella/private/guardian-art-release`에
생성하며 Git에는 포함하지 않는다.

R2 resource는 sibling `sobok-ops`의 `infra/cloudflare/account/sobok/stella`가 선언한다. production은
`stella-guardian-assets`와 `guardian-assets.sobok.cc`, staging은 `stella-guardian-assets-stg`와
`guardian-assets-stg.sobok.cc`를 사용하고 `r2.dev`는 끈다. 새 객체 키는
`guardian-cards/ko/{editionId}.{deliverySha256_12}.webp`다. 전환 전 동일 바이트는 기존
`guardian-cards/ko/{editionId}.webp` 키를 재사용하며, 교정·신규 원화만 해시 키를 만든다. 정확한 키는
`guardian-card-assets-ko.json`에 고정하고 기존 객체는 덮어쓰지 않는다. 앱 Worker가 R2를 프록시하지
않고 custom domain이 WebP를 직접 전달한다. 런타임은
Database Worker의 Wrangler가 환경별로 소유하는 `STELLA_GUARDIAN_ASSET_ORIGIN`과 객체 키를 결합해
`artworkPath`를 만든다.
따라서 공개 읽기에 Worker R2 binding을 추가하지 않는다.

Stella 등급도 마스터 원화 자체에는 사용자의 실제 출생 차트 선이나 개인 색을 넣지 않는다. 원화는
옅은 비개인화 별자리 광륜만으로 완결하고, 실제 차트 선과 개인 색은 다운로드·공유 합성 단계의 별도
오버레이로만 더한다. 장면 속 편지·표·달력·시간 표식은 읽을 수 있는 글자가 아니라 선·아이콘·도형으로
표현한다.

따라서 시각 승인 뒤에도 추적되는 제작 목록에 이미지 경로가 없는 것은 생략이 아니라 의도된 제작
게이트다. 승인된 로컬 후보를 업로드된 운영 자산으로 오인하지 않고, 런타임이 존재하지 않는 R2
object를 참조하지 않게 한다.

현재 파일럿 12개와 production 배치 31개의 신규 369개, 총 381개 승인 원본을 WebP quality 82·effort 6으로
최적화했다. 누적 배포 후보 합계는 74,779,858 bytes다.
`guardian-card-assets-ko.json`은 파일 본문 대신 각
WebP의 객체 키·정확한 byte 수·원본과 배포 SHA-256만 추적한다. release bundle의 매니페스트가 Git의 이
파일과 byte 단위로 같지 않으면 GitHub Actions가 배포하지 않는다.

## production 원화 배치

`production-art-batches-ko.json`은 1,056개 에디션을 같은 주제·서사·표현 축의 12별자리 단위로 묶은
88개 제작 배치다. 자기이해·일·결정은 `맥락 × 표현 방식`, 사랑은 `관계 서사 × 희귀도`가 한 배치를
이룬다. 이 단위는 캐릭터별 외형을 비교하면서도 같은 시각 문법의 반복 여부를 한 장의 비교 시트에서
검수하기 위한 것이다.

승인된 파일럿 12개는 각각 서로 다른 배치에 하나씩 포함된다. 따라서 12개 배치는 파일럿 한 장과 신규
11장으로 구성되고, 나머지 76개 배치는 신규 12장으로 구성된다. 파일럿만 승인했을 때의 시작 잔여량은
1,044장이며 서른한 번째 production 배치의 신규 369개까지 승인·WebP 준비한 현재 잔여량은 675장이다. 이 목록은
에디션 정본, 파일럿 원고 해시, 누적 WebP 매니페스트에서 materialize하며 다음 명령으로 다시 만든다.

```bash
bun --filter=@sobok/stella guardian-cards:materialize-art-batches
```

`production-art-batch-001-review-ko.json`처럼 각 배치의 검수 묶음은 현재 정본 원고의
`editorialContentHash`, 원소별 캐릭터 시트, 후보 사이에서 겹치지 않는 `compositionFamily`, 카드별
`artDirection`을 명시한다. `editorialReviewStatus: approved`인 항목만 원화를 생성한다. 생성한 PNG도
사람의 시각 승인을 받기 전에는 WebP 변환·R2 업로드·런타임 게시로 넘기지 않는다.

첫 배치의 신규 11개 PNG는 1080×1440으로 생성·시각 승인하고 SHA-256을
`approvedArtworkSha256`에 고정했다. 파일은 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-present-weather-close-emotion`에서만 보관한다. 기존 승인
사자자리 파일럿과 함께 12장을 비교한 contact sheet와 80px 축소 비교로 사람의 최종 시각 승인을
마쳤으므로 신규 항목은 `approved_local_candidate`다. 누적 23개 WebP release에는 이 11개와 기존 12개가
함께 들어가며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

두 번째 배치는 같은 `self.present-weather` 원고를 `action-beat` 표현 방식으로 제작하는 신규 12개다.
`production-art-batch-002-review-ko.json`에 현재 원고의 canonical SHA-256, 캐릭터별 행동이 막 시작되는
순간, 첫 배치와 겹치지 않는 카메라·소품·운동 방향을 고정했다. 사람 편집 승인을 마친 원고와 구도로
imagegen 원화 후보 12개를 제작하고, 마스터 크기와 80px contact sheet에서 캐릭터 정체성·중심 행동·배치
내부 구도 중복·첫 배치 비반복 여부를 보조 검수했다. close-emotion 카드와 가까웠던 전갈 첫 후보는 넓은
저시점 회랑 구도로 교정했으며, 교정본을 포함한 12개 모두 사람의 최종 시각 승인을 마쳤다. 승인 PNG와
contact sheet는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-present-weather-action-beat`에 보관한다. 승인 원본의
SHA-256은 검수 파일과 누적 35개 WebP 매니페스트에 고정하며 환경별 R2 반영 이력은
`Guardian Card Art Deploy` workflow가 남긴다.

세 번째 배치는 같은 `self.present-weather` 원고를 `shared-world` 표현 방식으로 제작하는 신규 12개다.
`production-art-batch-003-review-ko.json`에 현재 원고의 canonical SHA-256과 주인공의 감정을 대신
해결하지 않고 곁을 지키는 동료 행동을 고정했다. 앞선 두 배치의 같은 별자리 카메라·소품·운동 방향을
반복하지 않고, 두 캐릭터의 역할과 관계 여백이 80px에서도 분리되도록 12개 구도를 설계했다. 편집 승인된
원고와 구도로 imagegen PNG 후보 12개를 제작하고 마스터 크기와 80px contact sheet에서 캐릭터 정체성,
관계 행동, 배치 내부 구도 중복을 보조 검수했다. 중복 저울이 있던 천칭자리와 두 번째 물병이 있던
물병자리는 소품 하나만 남도록 교정했으며, 교정본을 포함한 12개 모두 사람의 최종 시각 승인을 마쳤다.
승인 PNG와 contact sheet는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-present-weather-shared-world`에 보관한다. 승인 원본의
SHA-256은 검수 파일과 누적 47개 WebP 매니페스트에 고정하며 환경별 R2 반영 이력은
`Guardian Card Art Deploy` workflow가 남긴다.

네 번째 배치는 같은 `self.present-weather` 원고를 `constellation-afterglow` 표현 방식으로 제작한 신규
12개다. `production-art-batch-004-review-ko.json`에 현재 원고의 canonical SHA-256과 행동이 가라앉은 뒤
가슴의 Stella 별표에서 중심 소품 너머로 이어지는 비개인화 여운을 명시했다. 앞선 세 배치의 카메라·
실루엣·빛 경로를 반복하지 않으며, 실제 별자리 배열·점성술 기호·출생 차트 원과 닮지 않는 성긴 점과
단순 곡선만 사용한다. 12개 원고 해시와 구도의 사람 편집 승인을 2026-08-15에 마치고 imagegen PNG 후보
12개를 제작했다. 마스터 크기와 80px contact sheet에서 캐릭터 정체성·중심 소품·배치 내부 구도 중복을
보조 검수했다. 별자리 선처럼 보였던 게자리, 하트 꼬리를 건너뛴 전갈자리, 이전 행동 자세와 가까웠던
사수자리, 가슴에서 시작하지 않은 물병자리, 좌우 대칭이었던 물고기자리는 각각 단일 수정 또는 재생성해
교정했으며, 교정본을 포함한 12개 모두 사람의 최종 시각 승인을 마쳤다. 승인 PNG와 비교 시트는 공개
Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-present-weather-constellation-afterglow`에 보관한다.
승인 원본의 SHA-256은 검수 파일과 누적 59개 WebP 매니페스트에 고정하며 환경별 R2 반영 이력은
`Guardian Card Art Deploy` workflow가 남긴다.

다섯 번째 배치는 `self.hidden-need` 원고를 `close-emotion` 표현 방식으로 제작할 신규 12개다.
`production-art-batch-005-review-ko.json`에 현재 원고의 canonical SHA-256과 얼굴·손끝·중심 소품에서 숨은
필요가 가까이 읽히는 구도를 명시했다. 앞선 `present-weather` 네 배치의 출발선·창·거울·저울·망원경·
계단·물병 카메라를 반복하지 않고, 배치 안에서도 열두 가지 전경 프레임과 여백 방향을 구분한다. 읽을 수
있는 편지·이름·지도·설명 대신 도형과 색면만 사용한다. 12개 원고 해시와 구도의 사람 편집 승인을
2026-08-15에 마치고 imagegen PNG 후보 12개를 제작했다. 마스터 크기와 80px contact sheet, 앞선 네 배치
contact sheet를 함께 비교해 캐릭터 정체성·중심 소품·카메라·배치 간 구도 중복을 보조 검수했다. 방석과
문 장식이 많았던 게자리는 뒤쪽 방석 두 개만 남겼고, 천칭자리 외형을 잘못 쓴 첫 물병자리 후보는 정본
외형으로 다시 생성한 뒤 배치 3 처녀자리 병풍과 가까웠던 높은 설명서를 낮은 수평 띠로 줄였다. 선택본과
비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-hidden-need-close-emotion`에 보관한다. 교정본을 포함한
12개 모두 사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 71개 WebP
매니페스트에 고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

여섯 번째 배치는 같은 `self.hidden-need` 원고를 `action-beat` 표현 방식으로 제작할 신규 12개다.
`production-art-batch-006-review-ko.json`에 현재 원고의 canonical SHA-256과 중심 소품이 막 움직이기 시작해
직전의 망설임과 미완료 다음 행동이 함께 보이는 구도를 명시했다. 배치 5의 표정·손끝 근접 대신 중간
전신과 한 개의 명확한 운동축을 사용하고, 앞선 다섯 배치의 출발선·온실·모빌·창·거울·저울·망원경·
계단·물병 카메라와 소품 배치를 반복하지 않는다. 열두 장은 불꽃 띄우기, 쪽지 밀기, 편지 펼치기,
별빛 굴리기처럼 서로 다른 운동 방향과 여백을 사용한다. 12개 원고 해시와 구도의 사람 편집 승인을
2026-08-15에 마치고 imagegen PNG 후보 12개를 제작했다. 마스터 크기와 80px contact sheet, 앞선 다섯
배치 contact sheet를 함께 비교해 캐릭터 정체성·중심 동작·카메라·배치 간 구도 중복을 보조 검수했다.
천칭자리의 긴 귀 실루엣을 가져온 첫 물병자리 후보는 시트 오른쪽 물병자리만 분리한 참조로 짧은 물결
귀·구름 앞머리를 교정하고 기존 붓질 구도를 보존했다. 선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-hidden-need-action-beat`에 보관한다. 교정본을 포함한 12개
모두 사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 83개 WebP 매니페스트에
고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

일곱 번째 배치는 같은 `self.hidden-need` 원고를 `shared-world` 표현 방식으로 제작하며, 승인된 쌍둥이자리
파일럿 1개와 신규 원화 11개로 구성한다. `production-art-batch-007-review-ko.json`에 현재 원고의 canonical
SHA-256과 주인공의 필요를 대신 해결하거나 재촉하지 않고 곁에서 듣고·기다리고·공간을 지키는 동료의
행동을 명시했다. 배치 3에서 같은 동료 조합에 사용한 깊은 길·인형집 단면·무대 턱·매달린 저울·전경
지도와 배치 5·6의 근접·단독 행동 구도를 반복하지 않는다. 신규 열한 장은 가로 바람 단면, 담요 섬
오버헤드, 문짝 평면 분할, 무대 뒤 역방향 깊이, 종이 아치, 창가 벤치, 낮은 복도 측면, 어긋난 지도
오버헤드, 등을 맞댄 담요, 사선 이젤, 가로 물병처럼 서로 다른 관계축과 여백을 사용한다. 쌍둥이자리
파일럿은 승인 PNG와 원본 SHA-256을 그대로 보존한다. 신규 11개 원고와 구도는 2026-08-15 사람의 편집
승인을 마치고 imagegen PNG 후보 11개를 제작했다. 마스터 크기와 80px contact sheet, 앞선 여섯 배치
contact sheet를 함께 비교해 캐릭터 정체성·두 역할·중심 소품·배치 간 구도 중복을 보조 검수했다. 첫
황소자리 후보의 불필요한 쿠션 네 개는 다른 요소를 유지한 채 제거했고, 첫 처녀자리 후보의 평평한
체크표는 관계 사이 빈 공간이 보이도록 낮은 종이 아치로 교정했다. 선택본과 비교 시트는 공개 Git에
포함하지 않는 `apps/stella/private/guardian-art-production/self-hidden-need-shared-world`에 보관한다. 교정본을
포함한 신규 11개와 보존한 파일럿 1개 모두 사람의 최종 시각 승인을 마쳤다. 신규 승인 원본의 SHA-256은
검수 파일과 누적 94개 WebP 매니페스트에 고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy`
workflow가 남긴다.

여덟 번째 배치는 같은 `self.hidden-need` 원고를 `constellation-afterglow` 표현 방식으로 제작할 신규 원화
12개의 편집 검수안이다. `production-art-batch-008-review-ko.json`에 현재 원고의 canonical SHA-256과 행동이
끝난 뒤에도 필요를 알아볼 수 있게 남는 비개인화 여운을 명시했다. 실제 별자리·점성술 glyph·출생 차트는
사용하지 않으며, 배치 4의 같은 표현 방식과 배치 5~7의 숨은 필요 구도를 반복하지 않는다. 열두 장은
후면 창턱, 바닥 높이 담요 수평선, 모서리로 선 편지, 천장 방석 오버헤드, 의상실의 접힌 커튼, 바닥의
삼각 종이 카드, 벽에 비친 기울어진 저울, 반투명 탁자 아래, 매달린 두 지도, 담요 휴식 요, 열린 종이
원통, 작은 물병과 큰 그림자처럼 서로 다른 카메라·중심 소품·여운 종료 방향을 사용한다. 12개 원고와
구도는 2026-08-15 사람의 편집 승인을 마치고 imagegen PNG 후보 12개를 제작했다. 마스터 크기와 80px
contact sheet, 앞선 일곱 배치 비교 contact sheet에서 캐릭터 정체성·중심 소품·여운 방향·구도 중복을
보조 검수했다. 양자리의 과도한 여운 점, 황소자리의 끊긴 담요, 게자리의 분리된 가슴 연결, 사자자리의
점선 여운, 염소자리의 과도한 여운 점은 다른 요소를 유지한 채 각각 교정했다. 선택본과 비교 시트는
공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-hidden-need-constellation-afterglow`에 보관한다. 현재 신규
12개 모두 사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 106개 WebP
매니페스트에 고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

아홉 번째 배치는 `self.coping-pattern` 원고를 `close-emotion` 표현 방식으로 제작할 신규 12개의 편집
검수안이다. `production-art-batch-009-review-ko.json`에 현재 원고의 canonical SHA-256과 익숙한 자동 반응이
완료되기 전에 멈춰 실제 감정이나 경계 단서를 알아보는 순간을 고정했다. 같은 표현 방식인 배치 1·5와
나머지 여섯 배치의 카메라·전경 프레임·소품 배치를 반복하지 않는다. 열두 장은 별기계 아래, 선반 틈,
접힌 도면 능선, 문 경첩 V자, 낮은 왕관과 무릎, 깨진 화분 안쪽, 퍼즐 표면, 상자 모서리, 두 팔 사이
지도, 별탑 모서리, 반투명 물결 시트, 얕은 바다 오버헤드처럼 서로 다른 근접 시점을 사용한다. 12개 원고와
구도는 2026-08-15 사람의 편집 승인을 마치고 imagegen PNG 후보 12개를 제작했다. 마스터 크기와 80px
contact sheet, 앞선 여덟 배치 비교 contact sheet에서 캐릭터 정체성·중심 소품·미완료 상태·구도 중복을
보조 검수했다. 쌍둥이자리의 누락된 열린 곡선·점, 염소자리의 불필요한 탑 꼭대기 별, 물병자리 붓끝의
추가 물방울, 물고기자리의 이중 제3 물결은 다른 요소를 유지한 채 각각 교정했다. 선택본과 비교 시트는
공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-coping-pattern-close-emotion`에 보관한다. 현재 신규 12개는
모두 사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 118개 WebP 매니페스트에
고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

열 번째 배치는 같은 `self.coping-pattern` 원고를 `action-beat` 표현 방식으로 제작할 신규 12개의 편집
검수안이다. `production-art-batch-010-review-ko.json`에 현재 원고의 canonical SHA-256과 익숙한 자동 반응의
중심 소품이 움직이기 시작하면서 몸이 가장 작은 대안으로 방향을 바꾸는 첫 동작을 고정했다. 같은 표현
방식인 배치 2·6과 바로 앞 배치 9의 카메라·실루엣·운동선·소품 배치를 반복하지 않는다. 열두 장은 기울어진
별기계와 구르는 나사, 높은 시점의 선반과 미끄러지는 받침, 작업대 가장자리의 움직이는 도안, 바깥에서
보는 문짝 호, 높은 시점의 구르는 왕관, 오버헤드 화분 조각 부채, 뒤쪽 퍼즐 팔 동작, 상자 그림자와
떨어지는 열쇠, 분기점 정면 제동, 높은 시점의 탑과 되가져오는 블록, 옆으로 휘는 물결 띠, 수면 위아래로
빠져나가는 제3 물결처럼 서로 다른 중간·전신 행동 구도를 사용한다. 12개 원고 해시와 구도는 2026-08-16
사람의 최종 편집 승인을 마치고 imagegen PNG 후보 12개를 제작했다. 마스터 크기와 80px contact sheet,
앞선 아홉 배치 비교 contact sheet에서 캐릭터 정체성·중심 소품·미완료 상태·구도 중복을 보조 검수했다.
처녀자리의 누락된 반대 손, 전갈자리의 완전히 드러난 하트 꼬리, 사수자리의 겹친 현재 위치 원,
염소자리의 중복 세모, 사자자리의 약한 왕관 굴림은 다른 요소를 유지한 채 각각 교정했다. 선택본과
비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-coping-pattern-action-beat`에 보관한다. 현재 신규 12개는
모두 사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 130개 WebP 매니페스트에
고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

열한 번째 배치는 같은 `self.coping-pattern` 원고를 `shared-world` 표현 방식으로 제작할 신규 12개의 편집
검수안이다. `production-art-batch-011-review-ko.json`에 현재 원고의 canonical SHA-256과 익숙한 보호 방식이
끝까지 진행되기 전에 동료가 해결하거나 재촉하지 않고 빛·시간·공간·재료 하나를 지키는 관계 행동을
고정했다. 같은 표현 방식인 배치 3·7과 바로 앞 배치 9·10의 카메라·캐릭터 높이·동료 행동·소품 배치를
반복하지 않는다. 열두 장은 계단식 정비 홈의 별등, 선반 그림자 밖 모래시계, 반원 소리 계단, 세 칸
현관 계단, 좌석 등받이 사이 거울, 열린 정리함과 체크표, 기울어진 모자이크 경사판, L자 방 모서리의
열쇠와 별등, 난간에 들린 지도 돛, 별탑 그림자와 초승달 담요, 두 높이의 반투명 감정 시트, 어긋난
초승달 바위턱처럼 서로 다른 관계축과 여백을 사용한다. 12개 원고 해시와 구도는 2026-08-16 사람의 최종
편집 승인을 마치고 imagegen PNG 후보 12개를 제작했다. 마스터 크기와 80px contact sheet, 앞선 열 배치
비교 contact sheet에서 캐릭터 정체성·관계축·동료 행동·중심 소품·미완료 상태·구도 중복을 보조 검수했다.
천칭자리의 다섯 갈래 개인 조각, 전갈자리의 상자 위 노출과 열쇠까지 닿은 등불, 사수자리의 겹친 시선은
다른 요소를 유지한 채 각각 교정했다. 선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-coping-pattern-shared-world`에 보관한다. 현재 신규 12개는
모두 사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 142개 WebP 매니페스트에
고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

열두 번째 배치는 같은 `self.coping-pattern` 원고를 `constellation-afterglow` 표현 방식으로 제작할 신규
12개의 편집 검수안이다. `production-art-batch-012-review-ko.json`에 현재 원고의 canonical SHA-256과 익숙한
보호 방식이 멈춘 뒤 감정·사실·경계를 다음의 내가 알아볼 수 있도록 남기는 비개인화 여운을 고정했다.
같은 표현 방식인 배치 4·8과 같은 이야기의 배치 9·10·11에서 사용한 카메라·소품 실루엣·빛의 종료
방향을 반복하지 않는다. 열두 장은 초승달 작업 매트 오버헤드, 선반 옆 단면, 세로 병풍형 도안,
달집 옆 단면, 곡선 단과 왕관 홈, 정면 그림자 상자, 세로 투명 모자이크, 두 높이의 상자와 열쇠,
원형 전망대 오버헤드, 별탑과 보관 홈 단면, 열린 초승달 감정 트레이, 물결 아치 안쪽처럼 서로 다른
깊이와 열린 여운 방향을 사용한다. 12개 원고 해시와 구도는 2026-08-16 사람의 최종 편집 승인을 마치고
imagegen PNG 후보 12개를 제작했다. 마스터 크기와 80px contact sheet, 앞선 열한 배치 비교 contact
sheet에서 캐릭터 정체성·중심 소품·미완료 상태·여운 종료 방향·구도 중복을 보조 검수했다. 양자리의
분기된 수리 여운, 처녀자리의 입체 물방울·추가 선·끊긴 가슴 연결, 전갈자리의 네 종점, 사수자리의 끊긴
가슴 연결·중복 위치 원, 염소자리의 2:3 비율·분기 여운, 물병자리의 끊긴 가슴 연결, 물고기자리의 별 모양
종점은 다른 요소를 유지한 채 각각 교정했다. 선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-coping-pattern-constellation-afterglow`에 보관한다. 현재
신규 12개는 모두 사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 154개 WebP
매니페스트에 고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

열세 번째 배치는 `self.next-self` 원고를 `close-emotion` 표현 방식으로 제작할 신규 12개의 편집 검수안이다.
`production-art-batch-013-review-ko.json`에 현재 원고의 canonical SHA-256과 완성된 미래 자아·운명 예고 대신
지금 선택할 수 있는 작고 되돌릴 수 있는 성장 단서를 고정했다. 같은 표현 방식인 배치 1·5·9의
전경 프레임·시선축·중심 소품을 반복하지 않는다. 열두 장은 깃발 천의 삼각 창, 별싹 옆 세 눈금,
말린 지도 터널, 달집 하네스 버클, 작은 바닥 조명, 확인표 주머니와 첫 다리 널판, 열린 가방과 빈
이름표, 손바닥 너비 문틈, 귀환 토큰 표식돌, 세 기호 계획띠, 한 개의 구름 발판, 깊이가 어긋난 두
꿈문과 중심 별그릇처럼 서로 다른 가까운 프레임을 사용한다. 12개 원고 해시와 구도는 2026-08-16 사람의
최종 편집 승인을 마치고 imagegen PNG 후보 12개를 제작했다. 마스터 크기와 80px contact sheet, 앞선
열두 배치 비교 contact sheet에서 캐릭터 정체성·중심 소품·현재 행동·미완료 상태·구도 중복을 보조
검수했다. 게자리의 민무늬 버클, 처녀자리의 펼친 확인표·출발 받침 발·움켜쥔 난간 손, 천칭자리의 손에
남은 태그·완성 경로형 디딤돌, 사수자리의 출발지에 남은 두 발, 물고기자리의 복잡한 나침반 선은 다른
요소를 유지한 채 각각 교정했다. 선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-next-self-close-emotion`에 보관한다. 현재 신규 12개는 모두
사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 166개 WebP 매니페스트에
고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

열네 번째 배치는 같은 `self.next-self` 원고를 `action-beat` 표현 방식으로 제작할 신규 12개의 편집
검수안이다. `production-art-batch-014-review-ko.json`에 현재 원고의 canonical SHA-256과 중심 소품이 막
움직이며 작고 되돌릴 수 있는 성장 행동으로 옮겨지는 찰나를 고정했다. 같은 표현 방식인 배치 2·6·10의
카메라·실루엣·운동선과 같은 이야기인 배치 13의 근접 구도를 반복하지 않는다. 열두 장은 깃대 압입과
뒤돌린 시선, ㄴ자 측정틀의 표식 집게, 지도 모서리 아래 종이비행기 방출, 달집의 물가 체중 이동,
바닥 조명 가리개 뒤집기, 다리 아래 첫 널판 눌림, 접힌 저울 수납과 이름표 투척, 오버헤드 문 멈춤,
발굽으로 남기는 귀환 원판, U자 계획띠의 두 타일, 물붓으로 뭉치는 단일 구름 발판, 반대 방향의 두
꿈문 열기처럼 서로 다른 중간·넓은 행동 구도를 사용한다. 12개 원고 해시와 구도는 2026-08-16 사람의
최종 편집 승인을 마치고 imagegen PNG 후보 12개를 제작했다. 마스터 크기와 80px contact sheet, 앞선
열세 배치 비교 contact sheet에서 캐릭터 정체성·중심 소품·현재 행동·미완료 상태·구도 중복을 보조
검수했다. 양자리의 다음 돌 위 뜬 앞발, 황소자리의 후면 고각, 게자리의 끈 당김, 처녀자리의 확인표·
출발 발, 천칭자리의 열린 방향, 사수자리의 발굽·원판 접촉은 다른 요소를 유지하거나 정체성을 고정한
새 구도로 각각 교정했다. 선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-next-self-action-beat`에 보관한다. 현재 신규 12개는 모두
사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 178개 WebP 매니페스트에
고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

열다섯 번째 배치는 같은 `self.next-self` 원고를 `shared-world` 표현 방식으로 제작할 신규 12개의 편집
검수안이다. `production-art-batch-015-review-ko.json`에 현재 원고의 canonical SHA-256과 주인공의 작고
되돌릴 수 있는 성장 행동을 재촉하거나 대신 완성하지 않는 한 사람의 곁을 고정했다. 같은 표현 방식인
배치 3·7·11의 카메라·두 캐릭터 실루엣·지원 행동과 같은 이야기인 배치 13·14의 근접·행동 구도를
반복하지 않는다. 열두 장은 스위치백 위아래 층의 출발 돌 별등, 온실 옆 단면의 손대지 않은 모래시계,
사선 지도 천막의 한 음, 초승달 물가의 별간식과 두 걸음 거리, 무대·피트 이중 층의 거울, 반대편 물가
정면의 첫 널판과 쿠키 문진, 끊긴 두 발코니의 빈 이름표와 기다림, 수면 띠가 있는 비대칭 뜰의 별등,
협곡 입구 이중 선반의 귀환 표식과 지도, 이중 데크의 계획띠와 쉼 홈, 상하로 떨어진 구름 발판과 빈
이름표 받침, 끊긴 두 발코니와 중심 별그릇처럼 서로 다른 관계 축을 사용한다. 12개 원고 해시와 구도는
2026-08-16 사람의 최종 편집 승인을 마치고 imagegen PNG 후보 12개를 제작했다. 마스터 크기와 80px
contact sheet, 앞선 열네 배치 비교 contact sheet에서 캐릭터 정체성·두 역할·비지시적 지원 행동·미완료
상태·구도 중복을 보조 검수했다. 쌍둥이자리의 단일 음파, 처녀자리의 미완성 첫 널판, 사수자리의 내려둔
활·단일 귀환 표식, 물고기자리의 단일 청록 물결·네 갈래 별그릇은 나머지 요소를 유지한 채 교정했다.
선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-next-self-shared-world`에 보관한다. 현재 신규 12개는 모두
사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 190개 WebP 매니페스트에
고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

열여섯 번째 배치는 같은 `self.next-self` 원고를 `constellation-afterglow` 표현 방식으로 제작할 신규
12개의 편집 검수안이다. `production-art-batch-016-review-ko.json`에 현재 원고의 canonical SHA-256과
오늘 선택한 작고 되돌릴 수 있는 행동 뒤 다음의 내가 알아볼 비개인화 흔적을 고정했다. 같은 표현
방식인 배치 4·8·12의 카메라·소품 실루엣·여운 종료 방향과 같은 이야기인 배치 13·14·15의 근접·행동·
관계 구도를 반복하지 않는다. 열두 장은 다음 돌에서 되돌아보는 바위 틈과 깃대 매듭 그림자, 잎 아래
흙 높이의 오늘 집게, 평평한 지도의 서로 다른 두 여백, 물 위 낮은 정면의 달집 그림자, 연습실
오버헤드의 빛 바깥 점, 고각 첫 널판과 출발 받침, 모서리형 길표식의 빈 이름표, 상자 뒤 낮은 실내
벽, 새 바닥에서 되돌아본 귀환 원판, 원통형 계획북의 쉼 홈, 구름 발판 밑면과 반응 기록, 두 꿈문의
문그림자와 중심 별그릇처럼 서로 다른 깊이·여운 축을 사용한다. 12개 원고 해시와 구도는 2026-08-16
사람의 최종 편집 승인을 마치고 imagegen PNG 후보 12개를 제작했다. 마스터 크기와 80px contact sheet,
앞선 열다섯 배치 비교 contact sheet에서 캐릭터 정체성·중심 소품·작고 되돌릴 수 있는 현재 행동·
미완료 상태·실제 별자리로 읽히지 않는 여운·구도 중복을 보조 검수했다. 쌍둥이자리의 분리된 두 여운,
게자리의 달집 그림자 귀환, 사자자리의 완전 오버헤드 명암, 사수자리의 귀환 원판을 지나는 단일 여운,
물병자리의 단일 구름 밑면, 물고기자리의 합쳐지지 않는 두 선은 나머지 정체성과 장면을 유지하며
교정했다. 선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/self-next-self-constellation-afterglow`에 보관한다. 현재 신규
12개는 모두 사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 202개 WebP
매니페스트에 고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

열일곱 번째 배치는 `love.first-signal` 원고를 `orbit` 희귀도로 제작하며, 승인된 양자리 파일럿 1개를
그대로 재사용하고 나머지 11개를 새로 만들 편집 검수안이다. `production-art-batch-017-review-ko.json`에
현재 원고의 canonical SHA-256과 고백의 성사·상대의 답·상호 호감을 앞당기지 않는 작고 부담 없는 첫
신호를 고정했다. Orbit은 한 중심 수호령·한 중심 소품·한 절제된 감정의 가까운 화면으로 제한한다.
신규 장면은 빈 의자 높이의 마지막 쿠키, 아래에서 교차하는 두 빈 봉투, 문턱의 간식 쟁반과 문 아래
빛, 빈 좌석 너머 옆빛과 별 카드, 꽃 높이의 비뚤어진 꽃과 풀린 리본, 저울대 아래의 따뜻한 추, 바닥
별등과 망토 밖 꼬리 끝, 무릎 위 지도와 하트 도장, 첫 계단 아래 흔들리는 금빛 판, 빈자리 시점의 파란
하트 병, 종 높이의 교차한 지느러미와 갈라진 꿈구름처럼 서로 다른 카메라·소품·빈자리 축을 사용한다.
신규 11개의 원고 해시와 구도는 2026-08-16 사람의 최종 편집 승인을 마쳤고, 승인 해시만 입력으로
imagegen PNG 후보를 제작했다. 마스터 크기와 80px contact sheet, 앞선 열여섯 배치 비교 contact
sheet에서 캐릭터 정체성·한 중심 소품·첫 신호의 미완료 상태·구도 비반복을 보조 검수했다. 쌍둥이자리의
열린 두 봉투와 빈 답칸, 게자리의 철회된 집게, 사수자리의 선 없는 지도 여백, 물병자리의 병 아래 접힌
도면은 나머지 정체성과 장면을 유지하며 교정했다. 선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/love-first-signal-orbit`에 보관한다. 승인 양자리 파일럿을
제외한 신규 11개는 모두 사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 213개
WebP 매니페스트에 고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

열여덟 번째 배치는 같은 `love.first-signal` 원고를 `nebula` 희귀도로 제작하는 신규 12개 편집
검수안이다. 이미 건넨 첫 신호 하나를 비·눈·바람·황혼·새벽 가운데서 옷·덮개·주머니·처마·받침·우산
같은 보호 구조 하나로 오래 알아볼 수 있게 지키는 두 장면을 하나의 연속된 순간으로 합친다. 상대의
등장·답·합의·관계 성사·미래 확정은 만들지 않는다. 빗물 높이의 비옷 지붕, 성에 낀 창 너머 담요 덮개,
세로 바람막이 양면의 열린 편지, 처마 밑 마른 선반, 커튼 밑 망토 반원, 꽃바구니 안 저각, 독립된 두
받침 사이의 풀린 리본, 빈 우산 반쪽, 망토 주머니 안쪽, 작업 망토의 삼각 틈, 겨울 코트 안주머니,
물결 아래 열린 U자 빛줄기처럼 서로 다른 카메라·날씨 경계·보호 실루엣을 고정했다. 12개 정본 원고
해시와 구도는 2026-08-16 사람의 최종 편집 승인을 마쳤고, 승인 해시만 입력으로 imagegen PNG 후보
12개를 제작했다. 마스터 크기와 80px contact sheet, 앞선 열일곱 배치 비교 contact sheet에서 캐릭터
정체성·첫 신호·날씨 경계·보호 구조·미완료 상태·구도 비반복을 보조 검수했다. 쌍둥이자리의 정본 연결
리본, 게자리의 단일 집게, 처녀자리의 정확히 세 꽃, 사수자리의 등 뒤 활은 나머지 정체성과 구도를
유지하며 교정했다. 선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/love-first-signal-nebula`에 보관한다. 신규 12개는 모두 사람의
최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 225개 WebP 매니페스트에 고정하며
환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

열아홉 번째 배치는 같은 `love.first-signal` 원고를 `eclipse` 희귀도로 제작할 신규 12개 편집 검수안이다.
`production-art-batch-019-review-ko.json`에 현재 원고의 canonical SHA-256과, 정해진 두 수호령이 강요 없는
경계 하나를 각자의 선택으로 건너 첫 신호를 실제 상호작용으로 바꾸는 연속 장면을 고정했다. 우체통
옆문 안쪽의 큰 하트 양끝, 대각선 테이블 이음선의 나뉜 쿠키, 오버헤드 듣기 원의 열린 편지와 차례표,
문설주 장축의 안팎 간식, 두 조명통 사이의 빛 경계, 꽃잎 틈 너머 한 송이 인수, 저울 축 고리 너머 세
별, 인방 위에서 본 별등과 한 자물쇠, 여행 북 위 지도와 귀환 표식, 발판 모서리의 상하 두 층, 새
별물병을 통과한 무문자 번역, 세로 거품 기둥의 지느러미 재접촉처럼 서로 다른 경계·상호 동작·깊이
축을 사용한다. 쌍둥이자리와 물고기자리는 정본 내부 쌍만 사용하고, 나머지도 지정된 안전한 동료 한
명만 함께 배치한다. 각자의 신호·접촉점·선택권을 분리해 고백 성사·강제 접촉·관계 확정·미래 약속을
앞당기지 않는다. 12개 정본 원고 해시와 구도는 2026-08-16 사람의 최종 편집 승인을 마쳤고, 승인 해시만
입력으로 built-in imagegen PNG 후보 12개를 제작했다. 1080×1440 마스터와 80px contact sheet, 앞선
열여덟 배치 비교 contact sheet에서 캐릭터 정체성·두 역할·경계와 상호 행동·각자의 선택권·중심 소품
수·구도 비반복을 보조 검수했으며 별도 교정 없이 12개 모두 후보로 채택했다. 선택본과 비교 시트는 공개
Git에 포함하지 않는 `apps/stella/private/guardian-art-production/love-first-signal-eclipse`에 보관한다.
신규 12개는 모두 사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 237개 WebP
매니페스트에 고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

스무 번째 배치는 같은 `love.first-signal` 원고를 `stella` 희귀도로 제작할 신규 12개 편집 검수안이다.
`production-art-batch-020-review-ko.json`에 현재 원고의 canonical SHA-256과, 정해진 두 수호령이 함께 만든
소품·공간에서 각자의 가슴 별빛이 출발해 잠시 관계를 맺은 뒤 다시 열리거나 갈라지는 다음 단계 구조를
고정했다. 열린 하트 내부의 두 덮개와 전진 갈래, 흙 단면의 씨앗과 열린 나이테, 책등 아래의 묶이지 않은
다음 페이지, 양쪽 반달 창짝과 위가 빈 광륜, 리깅 위에서 본 열린 U자 무대, 뿌리 굴 위 비대칭 화관,
삼각 모빌의 빈 꼭짓점, 별상자 안 직각 덮개와 끊긴 깊이 호, 산등성이 공동 별표에서 다시 갈라지는 길,
첫 발판 위 보폭이 다른 두 계단, 구름 정원의 빈 화분과 독립 수로, 넓은 물살 원의 열린 틈처럼 서로 다른
공동 구조·깊이 축·빛 종료 방향을 사용한다. 실제 별자리 배열·출생 차트·개인 색·닫힌 운명 고리·확정된
관계나 미래는 넣지 않는다. 12개 정본 원고 해시와 구도는 2026-08-16 사람의 최종 편집 승인을 마쳤고, 승인
해시만 입력으로 built-in imagegen PNG 후보 12개를 제작했다. 1080×1440 마스터와 80px contact sheet,
앞선 열아홉 배치 비교 contact sheet에서 캐릭터 정체성·독립된 접촉점·열린 다음 단계·중심 구조·구도
비반복을 보조 검수했다. 게자리·천칭자리·물병자리·물고기자리 후보를 교정해 12개 모두 후보로 채택했으며,
선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/love-first-signal-stella`에 보관한다. 신규 12개는 모두 사람의
최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 249개 WebP 매니페스트에 고정하며 환경별
R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

스물한 번째 배치는 `love.careful-approach` 원고를 `orbit` 희귀도로 제작할 신규 12개 편집 검수안이다.
`production-art-batch-021-review-ko.json`에 현재 원고의 canonical SHA-256과, 중심 수호령이 자기 속도만
조절한 뒤 상대의 선택을 기다리는 되돌릴 수 있는 근접 행동을 고정했다. 되돌아온 발과 보폭 띠, 온도를
맞춘 두 찻잔 받침, 말하기 발판 사이 빈 쉼판, 달집 이음매의 한 집게 폭, 세 밝기 사이 중간 원, 빈 단계
탭과 내려놓은 연필, 두 보폭 리본 사이 탈착식 발판, 잠긴 문 앞 거리 집게, 두 시간 띠의 독립 별클립,
겹친 일정 레일의 반쯤 놓인 발판, 단일 파동 뒤 빈 되돌림 홈, 옆으로 본 열린 장력 호처럼 서로 다른
속도 조절 소품·카메라 높이·응답 여백을 사용한다. 쌍둥이자리와 물고기자리는 정본 내부 쌍만 배치하고,
나머지는 지정된 수호령 하나만 배치한다. 상대의 몸·손·그림자·이미 온 답은 그리지 않으며 비어 있는
홈이나 추상 표식도 관계 성사·기다림 통과·미래 약속으로 만들지 않는다. 12개 정본 원고 해시와 구도는
2026-08-16 사람의 최종 편집 승인을 마쳤으며 imagegen은 이 승인 해시만 입력으로 사용했다. 승인 해시로
built-in imagegen PNG 후보 12개를 제작하고 1080×1440 마스터·80px contact sheet·앞선 스무 배치 비교
contact sheet에서 정본 정체성, 단일 속도 조절 행동, 비어 있는 응답 자리, 중심 소품, 구도 비반복을 보조
검수했다. 쌍둥이자리 연결 리본, 처녀자리 연필 방향, 물병자리 단일 파동, 물고기자리 한쪽만 누른 열린
장력 호를 제한 교정해 12개 모두 사람의 최종 시각 승인 후보로 채택했다. 선택본과 비교 시트는 공개 Git에
포함하지 않는 `apps/stella/private/guardian-art-production/love-careful-approach-orbit`에 보관한다. 신규
12개는 모두 사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 261개 WebP
매니페스트에 고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

스물두 번째 배치는 같은 `love.careful-approach` 원고를 `nebula` 희귀도로 제작할 신규 12개 편집
검수안이다. `production-art-batch-022-review-ko.json`에 현재 원고의 canonical SHA-256과, 자기 쪽
접근 표식만 조절한 수호령이 비·눈·바람·안개·물살 속 보호 경계를 유지하면서 상대의 선택 자리를 비워
두는 하나의 연속 장면을 고정했다. 물웅덩이 반사의 접이식 바람막이, 성에 벽의 두 칸 보온 서랍, 타원
바람주머니의 빈 듣기 주머니, 빗사슬 옆 주름 통로, 안개막 아래 접이식 반사판, 열린 잎 지붕의 화분,
V자 바람막이의 독립 별추 주머니, 홈통 반사의 꼬리 후드, 안장가방 두 관찰창, 계단 아래 돌 바람받이,
구름 터널의 보온 소매와 단일 파동, 두 물살 사이 열린 S자 끈처럼 서로 다른 날씨 경계·보호 실루엣·
응답 여백을 사용한다. 첫 신호 Nebula의 보호 구조와 바로 앞 Orbit의 조절 소품을 그대로 반복하지 않고,
상대의 몸·손·그림자·답·합의·관계 확정도 화면에 만들지 않는다. 12개 정본 원고 해시와 구도는 2026-08-16
사람의 최종 편집 승인을 마쳤으며 imagegen은 이 승인 해시만 입력으로 사용했다. 승인 해시로 built-in
imagegen PNG 후보 12개를 제작하고 1080×1440 마스터·80px contact sheet·앞선 스물한 배치 비교 contact
sheet에서 정본 정체성, 단일 접근 행동, 날씨 보호 경계, 비어 있는 응답 자리, 구도 비반복을 보조
검수했다. 전갈자리의 노출된 하트 꼬리와 평행 집게를 벌집 보호망 안 하트 불빛과 한쪽 끝만 닿는 U자
간격 포크로 제한 교정해 12개 모두 사람의 최종 시각 승인 후보로 채택했다. 선택본과 비교 시트는 공개
Git에 포함하지 않는 `apps/stella/private/guardian-art-production/love-careful-approach-nebula`에 보관한다.
신규 12개는 모두 사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 273개 WebP
매니페스트에 고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

스물세 번째 배치는 같은 `love.careful-approach` 원고를 `eclipse` 희귀도로 제작할 신규 12개 편집
검수안이다. `production-art-batch-023-review-ko.json`에 현재 원고의 canonical SHA-256과, 정해진 두
수호령이 각자의 속도·선택권·조절점을 유지한 채 실제 신호와 행동을 주고받는 하나의 연속 장면을
고정했다. 하트 회전문의 독립 속도 다이얼, 원형 찻잔 보관함의 준비 탭, 지그재그 공중 보폭길의 쉼표
승강판, 문턱 터널의 간식 셔틀, 프리즘 양면의 독립 조명, 온실 작업대의 빈 계획 바퀴, 두 공중 다리의
회전 접점, 경첩 쪽 문틈의 별등 썰매, 지도 돛의 두 일정 띠, 절벽 창 안 겹침 발판, 상하 파동관의 왕복
표식, 열린 물살 아치의 분리 구슬처럼 서로 다른 속도 경계·상호 동작·카메라 깊이를 사용한다. 첫 신호
Eclipse와 바로 앞 Orbit·Nebula의 소품·경계·구도를 반복하지 않고, 공동 지점도 잠그거나 완성하지 않아
관계 확정·영구 결합·한쪽의 속도 포기로 보이지 않게 한다. 12개 정본 원고 해시와 구도는 2026-08-17
사람의 최종 편집 승인을 마쳤으며 imagegen은 이 승인 해시만 입력으로 사용했다. 승인 해시로 built-in
imagegen PNG 후보 12개를 제작하고 1080×1440 마스터·80px contact sheet·앞선 스물두 배치 비교 contact
sheet에서 정본 정체성, 상호 속도 조절, 독립 선택권, 열린 공동 지점, 구도 비반복을 보조 검수했다.
황소자리의 여분 찻잔, 쌍둥이자리의 여분 편지, 사수자리의 여분 시간 점은 제한 편집으로 제거하고,
물병자리는 가로 구도와 중복된 파동 표식을 세로 3:4의 C자 하나·둥근 점 두 개로 다시 생성해 12개 모두
사람의 최종 시각 승인 후보로 채택했다. 선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/love-careful-approach-eclipse`에 보관한다. 신규 12개는 모두
사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 285개 WebP 매니페스트에
고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

스물네 번째 배치는 같은 `love.careful-approach` 원고를 `stella` 희귀도로 제작할 신규 12개 편집
검토안이다. `production-art-batch-024-review-ko.json`에 현재 원고의 canonical SHA-256과, 서로 속도를
확인한 두 수호령이 독립 조절점을 유지하면서 하나의 다시 열 수 있는 구조를 함께 만드는 연속 장면을
고정했다. 종이 하트등의 열린 지붕 이음선, 계절 잎차임의 빠진 사분면, 별이야기 부채의 빈 꽃잎,
달집 지붕 통풍창의 닫힌 마지막 잎, 별빛 직조막의 빈 천 조각, 별꽃 격자의 미삽입 연결핀, 균형 아치의
빈 꼭대기 쐐기, 별상자 빛기둥의 열린 C자 여백, 케이블 정거장의 분리 곤돌라, 격자탑의 비어 있는 다음
칸, 날씨 직조틀의 미완성 조각, 물살 부채꼴의 빠진 위쪽 살처럼 서로 다른 공동 구조·독립 동작·여운
종료 방향을 사용한다. 첫 신호 Stella와 바로 앞 Orbit·Nebula·Eclipse의 소품·카메라·구도를 반복하지
않고, 두 가슴 별빛도 각자의 색을 잃거나 닫힌 결속 표식이 되지 않게 했다. 12개 정본 원고 해시와 구도는
2026-08-17 사람의 최종 편집 승인을 마쳤으며 imagegen은 이 승인 해시만 입력으로 사용했다. 승인 해시로
built-in imagegen PNG 후보 12개를 제작하고 1080×1440 마스터·80px contact sheet·앞선 스물세 배치 비교
contact sheet에서 정본 정체성, 독립 조절점, 열린 공동 구조, 색 분리, 구도 비반복을 보조 검수했다.
쌍둥이자리는 양자리와 가까웠던 정면 방사형 실루엣을 강한 대각선·비대칭 부채로 다시 생성하고,
전갈자리의 닫힐 듯한 빛띠는 서로 떨어진 C자 여백으로 열었으며 사수자리의 여분 곤돌라 하나는 제한
편집으로 제거했다. 선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/love-careful-approach-stella`에 보관한다. 신규 12개는 모두
사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 297개 WebP 매니페스트에
고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

스물다섯 번째 배치는 `love.everyday-care` 원고를 `orbit` 희귀도로 제작할 신규 12개 편집 승인안이다.
`production-art-batch-025-review-ko.json`에 현재 원고의 canonical SHA-256과, 상대를 화면에 확정하지
않으면서도 자기 몫을 남긴 채 무리 없이 반복할 수 있는 작은 돌봄 행동을 고정했다. 우산꽂이의 자기
수건 칸, 쿠키 통의 빈 리필 칸, 플립 스탠드의 빈 다음 카드, 간식 포드의 독립 뚜껑, 수납칸의 반환
클립, 화병의 조건 슬라이더, 돌봄 주머니의 교환 고리, 우산 회전축의 되돌림 손잡이, 여행 가방의 꺼냄
고리, 계단참의 드러난 누락 칸, 돌봄 병 사이의 선택 틈, 꿈방울 받침의 빈 다음 칸처럼 서로 다른 반복
단서와 수령 여백을 사용한다. 같은 배치에서 우산이 겹치는 양자리와 전갈자리는 각각 펼친 우산 전체를
보는 탑뷰 우산꽂이·자기 수건과 캐노피를 잘라 낸 손잡이 높이 회전축·반환 손잡이로 분리했다. 첫 신호
Orbit과 바로 앞 careful-approach Orbit·Nebula·Eclipse·Stella의 메시지 전달·속도 조절·보호 경계·상호
교환·공동 구조를 반복하지 않는다. 2026-08-17 사람의 편집 승인을 마쳤으며 imagegen은 이 승인 해시만
입력으로 사용했다. 승인 해시로 built-in imagegen PNG 후보 12개를 제작하고 1080×1440 마스터·80px
contact sheet·앞선 스물네 배치 비교 contact sheet에서 정본 정체성, 정확한 소품 수, 상대 부재, 열린
선택권, 텍스트 부재와 구도 비반복을 보조 검수했다. 양자리의 여분 수건, 처녀자리의 여분 유리 용기,
염소자리의 네 번째 홈은 제한 편집으로 제거했으며 수정 전 후보도 보존했다. 선택본과 비교 시트는 공개
Git에 포함하지 않는 `apps/stella/private/guardian-art-production/love-everyday-care-orbit`에 보관한다.
신규 12개는 모두 사람의 최종 시각 승인을 마쳤다. 승인 원본의 SHA-256은 검수 파일과 누적 309개 WebP
매니페스트에 고정하며 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

스물여섯 번째 배치는 같은 `love.everyday-care` 원고를 `nebula` 희귀도로 제작할 신규 12개 편집
검토안이다. `production-art-batch-026-review-ko.json`에 현재 원고의 canonical SHA-256과, 자기 몫과
상대 선택권을 남긴 작은 돌봄을 비·눈·바람·황혼·새벽 속에서도 무리 없이 지키는 장면을 고정했다.
우산 거치대 안쪽의 빗물 칼라, 뜨개 해먹의 쿠키 소매, 망사등의 인사 고리, 물방울 구슬막의 간식 레일,
연습실 문 경첩의 살창, 잎 이슬 커튼의 물 캡슐, 갈대 바람받이의 독립 별컵, 빗물 창밖의 우산 레일,
혜성 목도리의 간식 캡슐, 눈더미 뒤 돌봄 기둥, 구름받침의 물방울 요람, 꿈방울 내부의 열린 숨구멍처럼
서로 다른 날씨 경계·보호 장치·빈 응답 자리를 사용한다. 바로 앞 Orbit의 일상 소품과 첫 신호·
careful-approach Nebula의 보호 구조를 반복하지 않으며, 양자리와 전갈자리의 우산도 각각 거치대 내부
저각·자기 수건과 빗물 창 너머 수평 옆모습·천장 레일로 분리했다. 2026-08-17 사람의 최종 편집 승인을
마쳤으며 imagegen은 이 승인 해시만 입력으로 사용했다. 승인 해시로 built-in imagegen PNG 후보 12개를
제작하고 1080×1440 마스터·80px contact sheet·앞선 스물다섯 배치 비교 contact sheet에서 정본 정체성,
정확한 소품 수, 상대 부재, 열린 선택권, 텍스트 부재와 구도 비반복을 보조 검수했다. 양자리의 접힌
우산, 처녀자리의 배경 꽃무리, 전갈자리와 사수자리의 얼굴형 비드 표식은 제한 편집으로 바로잡았으며
수정 전 후보도 보존했다. 선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/love-everyday-care-nebula`에 보관한다. 2026-08-26에는 열두
캐릭터의 얼굴형·눈·귀·뿔·지느러미를 정본 시트와 다시 대조해 장면과 소품을 보존한 교정본을 최종
승인했다. 승인 SHA-256과 교정 WebP의 콘텐츠 주소형 객체 키는 누적 333개 매니페스트에 고정하며 환경별
R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

스물일곱 번째 배치는 같은 `love.everyday-care` 원고를 `eclipse` 희귀도로 제작할 신규 12개 편집
검토안이다. `production-art-batch-027-review-ko.json`에 현재 원고의 canonical SHA-256과, 지정된 두
수호령이 각자의 선택권·조절점·자기 몫을 유지한 채 작은 돌봄을 실제로 주고받는 장면을 고정했다. 우산
캐노피 아래 하트 회전축, 직조 점심보의 잎 받침, 속삭임 조개의 듣기 컵, 달집 원형 문의 간식 뗏목,
두 빛 사이 그림자 틈, 모세관 작업대 아래의 두 밸브, 세 갈래 갈대 배 수로, 우산 아래 경계 레일,
여행 가방 바닥의 길찾기 판, 계단참 아래 망원식 지지잭, 이름표 베틀, 수평 렌즈형 꿈방울처럼 서로
다른 상호작용 장치·카메라·빈 다음 선택 자리를 사용한다. 첫 신호·조심스러운 다가감 Eclipse와 바로 앞
everyday-care Orbit·Nebula의 구도를 반복하지 않으며, 양자리와 전갈자리의 우산도 각각 캐노피 안쪽
방사 살·하트 회전축과 캐노피 아래 사선 경계 레일·별등 균형추로 분리했다. 2026-08-17 사람의 최종 편집
승인을 마쳤으며 imagegen은 이 승인 해시만 입력으로 사용했다. 승인 해시로 built-in imagegen PNG 후보
12개를 제작하고 1080×1440 마스터·80px contact sheet·앞선 스물여섯 배치 비교 contact sheet에서 두
수호령의 정본 정체성, 독립 조절점, 정확한 소품 수, 열린 다음 선택, 텍스트·실제 일식 부재와 구도
비반복을 보조 검수했다. 쌍둥이자리의 비율·실제 일식, 사자자리의 고르미 귀, 천칭자리의 양쪽 돌봄 별,
전갈자리의 닫힌 꼬리 빛, 사수자리의 총총이 뿔·얼굴형 연락 표식, 염소자리의 얼굴형 타일, 물병자리의
세 번째 병, 물고기자리의 지느러미 접점은 제한 편집으로 바로잡았으며 수정 전 후보도 보존했다. 선택본과
비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/love-everyday-care-eclipse`에 보관한다. 열두 캐릭터의 정본
외형 교정과 물고기자리의 크고 중앙을 보는 보라색 눈동자 교정을 포함한 최종 비교본은 2026-08-26
사람의 시각 승인을 마쳤다. 승인 원본 SHA-256과 신규 WebP의 콘텐츠 주소형 객체 키는 누적 333개
매니페스트에 고정한다.

스물여덟 번째 배치는 같은 `love.everyday-care` 원고를 `stella` 희귀도로 제작할 신규 12개 편집
검토안이다. `production-art-batch-028-review-ko.json`에 현재 원고의 canonical SHA-256과, 지정된 두
수호령이 각자의 선택권·조절점·자기 몫을 유지한 채 반복 가능한 작은 돌봄에서 다시 열 수 있는 공동
구조를 만드는 장면을 고정했다. 빗물 수로의 하트 수문, 수직 별씨앗 승강기, 두 인사 카드 연, 달집
모서리 창과 접이식 창턱, 무대 뒤 발광 거울, 잎 수로와 기울임 물컵, 세 별 수직 승강 틀, 별상자 뚜껑
위 이중 빗물 덮개, 세운 여행 가방의 수직 선반, 계단참 옆 돌봄 서랍, 구름 덩굴시렁, 두 물결 단의
단일 꿈방울 릴레이처럼 서로 다른 구조·카메라·빈 다음 선택 자리를 사용한다. 첫 신호·조심스러운 다가감
Stella와 바로 앞 everyday-care Orbit·Nebula·Eclipse의 구도를 반복하지 않으며, 양자리와 전갈자리의
우산도 각각 지면 옆모습의 분할 하트 수문과 별상자 뚜껑을 내려다보는 이중 빗물 덮개로 분리했다.
2026-08-26 사람의 최종 편집 승인을 마쳤으며 imagegen은 이 승인 해시만 입력으로 사용했다. 승인 해시로
built-in imagegen PNG 후보 12개를 제작하고 1080×1440 마스터·80px contact sheet·앞선 스물일곱 배치
비교 contact sheet에서 두 수호령의 정본 정체성, 독립 조절점, 정확한 소품 수, 열린 다음 선택, 텍스트
부재와 구도 비반복을 보조 검수했다. 쌍둥이자리 인사 연의 여분 점 두 개와 게자리의 닫힌 별빛 고리는
장면·캐릭터·나머지 소품을 유지한 제한 편집으로 바로잡았으며 수정 전 후보도 보존했다. 선택본과 비교
시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/love-everyday-care-stella`에 보관한다. 2026-08-26 사람의
최종 시각 승인을 마쳤으며 승인 원본 SHA-256과 신규 WebP의 콘텐츠 주소형 객체 키는 누적 345개
매니페스트에 고정한다. 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

스물아홉 번째 배치는 `love.honest-conversation` 원고를 `orbit` 희귀도로 제작할 신규 12개 편집
검토안이다. `production-art-batch-029-review-ko.json`에 현재 원고의 canonical SHA-256과, 상대의 답이나
관계 결론을 화면에 미리 만들지 않은 채 바람·걱정·감정·부탁·한계·모르는 부분을 가까운 첫 표현으로
드러내는 장면을 고정했다. 열린 문턱의 두 하트 잎, 별돌 아래 잎 서랍, 두 말조개의 빈 듣기 홈, 달집
경첩 옆의 양면 부탁 타일, 왕관과 두 대본 슬랫, 접힌 초안 폴리오의 두 잎 카드, 엎은 합의 부채와 두
구름 토큰, 한 꽃잎만 연 봉인 편지, 두 길깃발, 접은 계획 폴리오와 두 돌 약속 탭, 접히는 기하 종이틀의
두 파란 창, 갈라진 꿈휘장의 투명 물방울 두 개처럼 서로 다른 소품 실루엣·카메라·빈 응답 자리를
사용한다. 원고 속 문장·쪽지·표지판·대본·도안은 읽을 수 있는 글자나 가짜 글줄 없이 별·물방울·잎·
열린 곡선 같은 분리된 추상 기호로만 번역한다. 첫 신호·조심스러운 다가감·일상 돌봄 Orbit의 거대한
신호·속도 장치·돌봄 수납 구조를 반복하지 않는다. 2026-08-26 사람의 편집 승인을 마쳤으며 imagegen은
고정된 승인 해시만 입력으로 사용했다. 승인 해시로 built-in imagegen PNG 후보 12개를 제작하고
1080×1440 마스터·80px contact sheet·앞선 스물여덟 배치 비교 contact sheet에서 정본 정체성, 정확한
소품 수, 비어 있는 응답 자리, 글자 부재와 구도 비반복을 보조 검수했다. 쌍둥이자리의 중앙 듣기 여백을
가로지른 리본, 천칭자리 구름 토큰의 여분 물방울, 물병자리 파란 창의 여분 별은 장면·캐릭터·나머지
소품을 유지한 제한 편집으로 바로잡았으며 수정 전 후보도 보존했다. 선택본과 비교 시트는 공개 Git에
포함하지 않는 `apps/stella/private/guardian-art-production/love-honest-conversation-orbit`에 보관한다.
2026-08-26 사람의 최종 시각 승인을 마쳤으며 승인 원본 SHA-256과 신규 WebP의 콘텐츠 주소형 객체 키는
누적 357개 매니페스트에 고정한다. 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

서른 번째 배치는 `love.honest-conversation` 원고를 `nebula` 희귀도로 제작할 신규 12개 편집 검토안이다.
`production-art-batch-030-review-ko.json`에 현재 원고의 canonical SHA-256과, 감정·필요·부탁·한계·
모르는 부분을 비·눈·바람·황혼·새벽·물살 속에서도 알아볼 수 있게 보호하되 상대의 답이나 관계 결론은
만들지 않는 장면을 고정했다. 빗물 신호 원뿔의 두 하트 셔터, 눈 속 속삭임 관의 필요 캡슐, 지면
바람빗의 두 목소리 꽃잎, 달집 지붕 빗물 우물의 부탁 원판, 구멍 난 무대 막 뒤의 두 대본 프리즘,
세 별꽃 줄기 다리 아래의 두 잎 소매, 독립 갈대 굴뚝의 두 진실 창, 장축 편지 캡슐의 단일 진실 슬릿,
비나침반형 바람 회전체의 두 방향 날개, 눈받침 경첩 아래의 두 약속 판, S자 구름 잠망경의 두 파란 창,
세로 달물살 수문의 두 투명 물방울처럼 서로 다른 날씨 경계·소품 실루엣·카메라·빈 응답 자리를
사용한다. 원고의 쪽지·대본·계획·표지판·도안은 글자나 가짜 글줄 없이 별·물방울·잎·열린 곡선 같은
분리된 추상 기호로만 번역한다. 첫 신호·조심스러운 다가감·일상 돌봄 Nebula의 보호 장치와 바로 앞
honest-conversation Orbit의 근접 소품을 반복하지 않는다. 2026-08-27 사람의 편집 승인을 마쳤으며
고정된 승인 해시와 원소별 캐릭터 시트·직전 동일 캐릭터 승인본을 입력으로 built-in imagegen PNG 후보
12개를 제작했다. 1080×1440 마스터·80px contact sheet·앞선 스물아홉 배치 비교 contact sheet에서 정본
정체성, 눈동자, 정확한 소품 수, 비어 있는 응답 자리, 글자 부재와 구도 비반복을 보조 검수했다. 황소자리
필요 캡슐의 중복 별, 전갈자리의 화난 눈썹, 사수자리의 여분 별간식, 염소자리의 채워진 중앙 볼트 자리는
장면·캐릭터·나머지 소품을 유지한 제한 편집으로 바로잡았으며 수정 전 후보도 보존했다. 선택본과 비교
시트는 공개 Git에 포함하지 않는 `apps/stella/private/guardian-art-production/love-honest-conversation-nebula`에
보관한다. 2026-08-27 사람의 최종 시각 승인을 마쳤으며 승인 원본 SHA-256과 신규 WebP의 콘텐츠 주소형
객체 키는 누적 369개 매니페스트에 고정한다. 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가
남긴다.

서른한 번째 배치는 `love.honest-conversation` 원고를 `eclipse` 희귀도로 제작할 신규 12개 편집 검토안이다.
`production-art-batch-031-review-ko.json`에 현재 원고의 canonical SHA-256과, 정해진 두 수호령이 실제로
감정·필요·부탁·한계·모르는 부분을 주고받되 각자의 조절점과 다음 선택을 유지하는 장면을 고정했다. 열린
혜성 대화 레일의 두 진실 타일, 도자 종 내부의 필요 돌과 잎 수령판, 매달린 두 공명 갈비의 소리 타일,
달집 외벽 발코니의 부탁 타일과 듣기 스쿱, 반투명 무대 바닥 아래의 두 진실 블록, 열린 표본틀의 두
상징 잎과 삐뚤어진 별꽃, 열린 육각 모래 탁자의 진실 돌과 공동 별, 자수정 지오드의 단일 진실 면,
두 갈래 지평 망원경의 관계·자유 렌즈, 열린 지지 아치의 책임·한계 돌, 파란 공명 탁자의 두 물결 키,
초승달 물결 실로폰의 두 투명 원판처럼 서로 다른 실루엣·카메라·양방향 행동·빈 다음 자리를 사용한다.
앞선 첫 신호·조심스러운 다가감·일상 돌봄 Eclipse의 우체통·문·조명·저울·지도·병·꿈방울 구조와 바로
앞 honest-conversation Orbit·Nebula의 근접·날씨 보호 소품을 반복하지 않는다. 원고 속 쪽지·대본·계획·
표지판·도안은 읽을 수 있는 글자나 가짜 글줄 없이 별·물방울·잎·점·열린 곡선 같은 분리된 추상 기호로만
번역한다. 2026-08-27 사람의 최종 편집 승인과 canonical hash 고정 뒤 built-in imagegen으로 PNG 후보
12개를 독립 생성하고 1080×1440으로 정규화했다. 마스터·80px·앞선 30개 배치 비교 보조 QA에서 황소자리의
단일 쿠키 조각 관계, 쌍둥이자리의 여분 소리 타일, 처녀자리의 닫힌 외부 걸쇠, 천칭자리의 분산된 진실
돌, 염소자리의 잘못 섞인 총총이 정체성과 시험 손잡이를 제한 수정했으며 수정 전 후보도 보존했다.
선택본과 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-production/love-honest-conversation-eclipse`에 보관한다. 현재
12개 모두 사람의 최종 시각 승인을 마쳤으며 승인 원본 SHA-256과 신규 WebP의 콘텐츠 주소형 객체 키를
누적 381개 매니페스트에 고정한다. 환경별 R2 반영 이력은 `Guardian Card Art Deploy` workflow가 남긴다.

서른두 번째 배치는 `love.honest-conversation` 원고를 `stella` 희귀도로 제작할 신규 12개 편집 검토안이다.
`production-art-batch-032-review-ko.json`에 현재 원고의 canonical SHA-256과, 솔직히 드러낸 내용과 확인한
응답을 바탕으로 다시 열 수 있는 공동 대화 구조를 만들되 각자의 조절점·공개 범위·나갈 길과 빈 다음
자리를 유지하는 장면을 고정했다. 열린 온기돌 화로, 앞벽이 빠진 점토 별찬장, 부유 별쿠션 틀, 초승달
자갈 만, 부서진 해 모자이크, L자 별못판, 세로 물받이, 밤빛 별선인장, 구름 절벽 별쉼터, 모듈 달빛
작업대, 열린 오로라 뜰, 갈라진 초승달 모래톱처럼 서로 다른 실루엣·카메라·공동 구조·빈 재확인 자리를
사용한다. 앞선 첫 신호·조심스러운 다가감·일상 돌봄 Stella의 하트 문·계절 장치·별책·무대·꽃 구조·
균형 장치·별상자·길·계단·구름 정원·물살 원과 바로 앞 honest-conversation Orbit·Nebula·Eclipse의
근접·날씨 보호·양방향 대화 장치를 반복하지 않는다. 원고 속 쪽지·대본·계획·표지판·도안은 읽을 수
있는 글자나 가짜 글줄 없이 별·물방울·잎·점·열린 곡선 같은 분리된 추상 기호로만 번역한다. 2026-08-27
사람 편집 검토를 위해 준비했으며 현재 12개 모두 `pending_human_approval`이다. 사람의 편집 승인과
canonical hash 고정 전에는 imagegen 입력·PNG 후보 생성·WebP/R2 반영을 허용하지 않는다.

## 검증

repository root에서 다음 명령을 실행한다.

```bash
bun --filter=@sobok/stella guardian-cards:validate
```

검증기는 다음 계약을 확인한다.

- 12별자리 × 4주제의 정확한 48개 패밀리와 중복 없는 ID·제목
- `{focus}` 한 번, 시각 모티프 3개, 유료 질문에 존재하는 같은 주제 신호 2개
- 캐릭터 바이블의 관계와 화면 중심 최대 두 명 제약을 지키는 동료 목록
- 자기이해·일·결정 각 12패밀리 × 4맥락 × 4표현의 명시적 576개 ID와 중복 없는 원고
- 비사랑 576개 에디션의 질문 신호·미리보기 tone·동료 수·미제작 asset 상태
- 사랑 12패밀리 × 10서사 × 4희귀도의 명시적 480개 ID와 중복 없는 원고
- 사랑 480개의 질문 신호·동료 수·미제작 asset 상태와 신호에 영향받지 않는 고정 희귀도 가중치
- blueprint에서 materialize한 작업 목록이 최신 상태인지 여부
- 비사랑 카드 576개와 사랑 카드 480개의 산식, 총 1,056개 제작 목표
- 사랑 카드 네 희귀도와 패밀리별 10,000 가중치
- 1,056개 원고의 길이·문장 수·조사 token·접근성·비단정 표현 기준
- 대표 이미지 후보 12개의 별자리 1종씩, 네 주제, 사랑 희귀도 4종, 비사랑 표현 방식 4종 커버리지
- 대표 후보의 현재 원고와 편집 검수 해시 일치, 사람 승인 전 이미지 제작 차단
- 열일곱 번째 production 배치의 승인 파일럿 1개·신규 11개 원고 해시와 Orbit 고유 구도, 편집 승인 전
  신규 이미지 제작 및 사람의 시각 승인 전 배포 후보 확정 차단
- 열여덟 번째 production 배치 신규 12개 원고 해시와 날씨 속 첫 신호를 지키는 Nebula 고유 구도,
  Orbit·승인 게자리 Nebula 파일럿 비반복 및 사람의 편집 승인 전 이미지 제작 차단
- 열아홉 번째 production 배치 신규 12개 원고 해시와 지정된 두 수호령이 선택권을 유지하며 첫 신호를
  상호작용으로 바꾸는 Eclipse 고유 구도, Orbit·Nebula·앞선 관계 장면 비반복 및 사람의 시각 승인 전
  배포 후보 확정 차단
- 스무 번째 production 배치 신규 12개 원고 해시와 함께 만든 다음 단계를 다시 선택할 수 있게 여는
  Stella 고유 구도, Orbit·Nebula·Eclipse·앞선 별자리 여운 비반복 및 사람의 시각 승인 전 배포 후보 확정
  차단
- 스물한 번째 production 배치 신규 12개 원고 해시와 상대를 화면에 확정하지 않는 되돌릴 수 있는 속도
  조절 행동, 첫 신호 Orbit·앞선 근접 장면 비반복 및 사람의 편집 승인 전 신규 이미지 제작 차단
- 스물두 번째 production 배치 신규 12개 원고 해시와 날씨 속에서도 상대 선택 자리를 비워 두는 보호
  속도 장면, 첫 신호 Nebula·바로 앞 Orbit 비반복 및 사람의 편집 승인 전 신규 이미지 제작 차단
- 스물세 번째 production 배치 신규 12개 원고 해시와 두 수호령이 각자의 선택권을 유지하며 속도를
  실제 행동으로 맞추는 Eclipse 장면, 첫 신호 Eclipse·바로 앞 Orbit·Nebula 비반복, 신규 PNG 후보·
  마스터/80px·이전 스물두 배치 비교 보조 시각 QA·사람의 최종 시각 승인·WebP/R2 배포 완료
- 스물네 번째 production 배치 신규 12개 원고 해시와 두 수호령이 독립 조절점을 유지한 채 다시 열 수
  있는 공동 구조를 만드는 Stella 장면, 첫 신호 Stella·바로 앞 Orbit·Nebula·Eclipse 비반복, 신규 PNG
  후보·마스터/80px·이전 스물세 배치 비교 보조 시각 QA·사람의 최종 시각 승인·WebP/R2 배포 완료
- 스물다섯 번째 production 배치 신규 12개 원고 해시와 자기 몫·상대 선택권을 남긴 반복 가능한 작은
  돌봄 행동, 첫 신호 Orbit·careful-approach 네 희귀도·앞선 일상 소품 비반복, 신규 PNG 후보·마스터/
  80px·이전 스물네 배치 비교 보조 시각 QA·사람의 최종 시각 승인·WebP/R2 배포 완료
- 스물여섯 번째 production 배치 신규 12개 원고 해시와 날씨 속에서도 자기 몫·상대 선택권을 남기는
  반복 가능한 작은 돌봄 보호 장면, 첫 신호·careful-approach Nebula·바로 앞 Orbit 비반복, 신규 PNG
  후보·마스터/80px·이전 스물다섯 배치 비교 보조 시각 QA·정본 외형 교정·사람의 최종 시각 승인·
  콘텐츠 주소형 WebP/R2 배포
- 스물일곱 번째 production 배치 신규 12개 원고 해시와 지정된 두 수호령이 각자의 조절점·선택권을
  유지하며 반복 가능한 작은 돌봄을 실제로 주고받는 Eclipse 장면, 첫 신호·careful-approach Eclipse·
  바로 앞 Orbit·Nebula 비반복, 신규 PNG 후보·마스터/80px·이전 스물여섯 배치 비교 보조 시각 QA·정본
  외형 교정·사람의 최종 시각 승인·콘텐츠 주소형 WebP/R2 배포
- 스물여덟 번째 production 배치 신규 12개 원고 해시와 지정된 두 수호령이 각자의 조절점·선택권을
  유지하며 반복 가능한 작은 돌봄에서 다시 열 수 있는 공동 구조를 만드는 Stella 장면, 첫 신호·
  careful-approach Stella·바로 앞 Orbit·Nebula·Eclipse 비반복, 신규 PNG 후보·마스터/80px·이전
  스물일곱 배치 비교 보조 시각 QA·사람의 최종 시각 승인·콘텐츠 주소형 WebP/R2 배포
- 스물아홉 번째 production 배치 신규 12개 원고 해시와 상대의 답·합의·관계 결론을 미리 만들지 않고
  바람·걱정·감정·부탁·한계·모르는 부분을 글자 없는 추상 기호로 드러내는 Orbit 고유 근접 장면,
  첫 신호·careful-approach·everyday-care Orbit 비반복, 신규 PNG 후보·마스터/80px·이전 스물여덟
  배치 비교 보조 시각 QA·사람의 최종 시각 승인·콘텐츠 주소형 WebP/R2 배포 후보 고정
- 서른 번째 production 배치 신규 12개 원고 해시와 감정·필요·부탁·한계·모르는 부분을 날씨 속에서도
  알아볼 수 있게 보호하면서 상대의 답·동의·용서·관계 결론을 비워 두는 Nebula 장면, 첫 신호·
  careful-approach·everyday-care Nebula와 바로 앞 honest-conversation Orbit 비반복, 편집 승인 해시 기반
  신규 PNG 후보·마스터/80px·이전 스물아홉 배치 비교 보조 시각 QA·사람의 최종 시각 승인·콘텐츠
  주소형 WebP/R2 배포 후보 고정
- 서른한 번째 production 배치 신규 12개 원고 해시와 정해진 두 수호령이 감정·필요·부탁·한계·모르는
  부분을 실제로 주고받으면서도 각자의 조절점·공개 범위·빈 다음 선택을 유지하는 Eclipse 장면, 앞선
  첫 신호·careful-approach·everyday-care Eclipse와 바로 앞 honest-conversation Orbit·Nebula 비반복,
  편집 승인 해시 기반 신규 PNG 후보·마스터/80px·이전 30개 배치 비교 보조 시각 QA·다섯 제한 수정,
  사람의 최종 시각 승인·콘텐츠 주소형 WebP/R2 배포 후보 고정
- 서른두 번째 production 배치 신규 12개 원고 해시와 솔직히 드러낸 내용·확인한 응답을 다시 열 수 있는
  공동 구조로 확장하면서도 각자의 조절점·공개 범위·나갈 길·빈 다음 자리를 유지하는 Stella 장면,
  앞선 첫 신호·careful-approach·everyday-care Stella와 바로 앞 honest-conversation Orbit·Nebula·Eclipse
  비반복, 사람의 편집 승인과 canonical hash 고정 전 imagegen·WebP/R2 반영 차단
- 발견된 모든 production 배치 검수 파일의 단계별 상태·현재 원고 해시·배치 축·고유 구도 일치
- 1,056개를 정확히 한 번씩 포함하는 88개 production 배치와 누적 승인 WebP 381개를 제외한 현재 잔여
  675개 산식
- R2 자산 계약의 1,056개 목표·환경별 버킷·WebP-only 객체 키와 승인 원본/배포 해시 연결
- 모든 마스터 원화 장면에서 실제 출생 차트·개인 색을 제외하고 비개인화 광륜만 사용
- 런타임 게시 전에 개별 에디션에 필요한 이미지·접근성·한 줄 원고 필드

검증 성공 시 각 콘텐츠 source의 canonical JSON SHA-256을 출력한다. 편집 승인 기록에 이 해시를 남기면
검수한 정본과 다음 제작 단계의 입력이 같은지 확인할 수 있다.

## MVP에서 production으로 게시하는 순서

1. 기본 패밀리 원고를 콘텐츠·브랜드 관점에서 승인한다.
2. 현재 1,056개 편집 초안처럼 제작 계획의 각 조합을 개별 작업 카드로 materialize해 고유 ID,
   한국어 한 줄, 접근성 설명을 쓰고 에디션마다 편집 승인한다.
3. 텍스트가 들어가지 않은 3:4 최종 원화를 WebP로 최적화하고 R2의 실제 객체와 연결한다.
4. staging의 현재 런타임 카탈로그에 승인된 1,056개를 모두 명시한다.
5. 답변 신호 기반 패밀리·에디션 선택과 사랑 희귀도·미보유 보장을 staging에서 확인한다.
6. staging에서 승인한 동일 commit과 콘텐츠 hash를 production에 배포한다.

## WebP 준비와 R2 배포

승인 원본 매니페스트에서 WebP release bundle을 만든다. 이 명령은 원본 PNG 해시와 1080×1440 크기를
검증한 뒤 WebP와 `manifest.json`만 출력한다.

```bash
bun --filter=@sobok/stella guardian-cards:prepare-art \
  --source private/guardian-art-pilot/manifest.json \
  --source private/guardian-art-production/self-present-weather-close-emotion/manifest.json \
  --source private/guardian-art-production/self-present-weather-action-beat/manifest.json \
  --source private/guardian-art-production/self-present-weather-shared-world/manifest.json \
  --source private/guardian-art-production/self-present-weather-constellation-afterglow/manifest.json \
  --source private/guardian-art-production/self-hidden-need-close-emotion/manifest.json \
  --source private/guardian-art-production/self-hidden-need-action-beat/manifest.json \
  --source private/guardian-art-production/self-hidden-need-shared-world/manifest.json \
  --source private/guardian-art-production/self-hidden-need-constellation-afterglow/manifest.json \
  --source private/guardian-art-production/self-coping-pattern-close-emotion/manifest.json \
  --source private/guardian-art-production/self-coping-pattern-action-beat/manifest.json \
  --source private/guardian-art-production/self-coping-pattern-shared-world/manifest.json \
  --source private/guardian-art-production/self-coping-pattern-constellation-afterglow/manifest.json \
  --source private/guardian-art-production/self-next-self-close-emotion/manifest.json \
  --source private/guardian-art-production/self-next-self-action-beat/manifest.json \
  --source private/guardian-art-production/self-next-self-shared-world/manifest.json \
  --source private/guardian-art-production/self-next-self-constellation-afterglow/manifest.json \
  --source private/guardian-art-production/love-first-signal-orbit/manifest.json \
  --source private/guardian-art-production/love-first-signal-nebula/manifest.json \
  --source private/guardian-art-production/love-first-signal-eclipse/manifest.json \
  --source private/guardian-art-production/love-first-signal-stella/manifest.json \
  --source private/guardian-art-production/love-careful-approach-orbit/manifest.json \
  --source private/guardian-art-production/love-careful-approach-nebula/manifest.json \
  --source private/guardian-art-production/love-careful-approach-eclipse/manifest.json \
  --source private/guardian-art-production/love-careful-approach-stella/manifest.json \
  --source private/guardian-art-production/love-everyday-care-orbit/manifest.json \
  --source private/guardian-art-production/love-everyday-care-nebula/identity-approved-manifest.json \
  --source private/guardian-art-production/love-everyday-care-eclipse/identity-approved-manifest.json \
  --source private/guardian-art-production/love-everyday-care-stella/manifest.json \
  --source private/guardian-art-production/love-honest-conversation-orbit/manifest.json \
  --source private/guardian-art-production/love-honest-conversation-nebula/manifest.json \
  --source private/guardian-art-production/love-honest-conversation-eclipse/manifest.json \
  --baseline content/guardian-cards/guardian-card-assets-ko.json \
  --output private/guardian-art-release-381

bun --filter=@sobok/stella guardian-cards:validate-art-release --manifest \
  private/guardian-art-release-381/manifest.json

bun --filter=@sobok/stella guardian-cards:package-art-release --manifest \
  private/guardian-art-release-381/manifest.json --output \
  private/releases/guardian-art-release-381/guardian-card-art-release.tar.gz
```

`--source`는 사람 시각 승인이 끝난 매니페스트마다 반복한다. `--baseline`은 같은 WebP 바이트의 기존 키를
재사용하고 교정·신규 바이트에만 해시 키를 만든다. 출력은 모든 source를 합친 누적 release다.

시각 승인과 Git의 `guardian-card-assets-ko.json` 갱신 뒤, WebP와 같은 `manifest.json`을
`guardian-card-art-release.tar.gz`로 묶어 immutable GitHub Release asset으로 올린다. 원격 R2 변경은
로컬 CLI가 아니라 `Guardian Card Art Deploy` workflow만 수행한다. workflow는 environment branch gate,
Terraform이 동기화한 버킷 이름, WebP-only bundle, Git 매니페스트 일치를 확인한다. 공개 origin은 Database
Worker의 Wrangler가 소유한다. 같은 객체 키가 이미
있으면 SHA-256이 같을 때만 건너뛰며 다르면 실패한다.

구매 결과에는 카드 표현과 추첨 정책을 스냅샷으로 보존한다. 게시한 에디션의 제목·원고·의미를 바꾸면 새
ID를 추가하고, 동일 의미의 원화 교정은 같은 ID와 새 콘텐츠 주소형 객체 키를 사용한다. 선택 정책과
원화 변경 이력은 Git·GitHub Release·구매/획득 스냅샷으로 추적한다.
