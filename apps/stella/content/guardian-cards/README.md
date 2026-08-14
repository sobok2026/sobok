# Guardian card content sources

유료 리포트 카드의 한국어 원고와 production 제작 계획을 관리하는 Git source of truth다. 이 디렉터리는
Next의 `src`나 정적 `public` 아래가 아니므로 웹 빌드에 자동 포함되지 않는다.

## 현재 상태

| 파일                                         | 상태                     | 범위                                                                |
| -------------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| `guardian-card-families-ko.json`             | `authoring`              | 12별자리 × 자기이해·사랑·일·결정, 총 48개 기본 패밀리의 한국어 원고 |
| `production-edition-plan.json`               | `work_order`             | 실제 에디션 1,056개를 제작하기 위한 장면·표현·희귀도 매트릭스       |
| `guardian-self-edition-blueprints-ko.json`   | `authoring`              | 자기이해 12패밀리의 서사 맥락 48개와 네 표현 방식의 한국어 원고     |
| `guardian-self-editions-ko.json`             | `editorial_draft`        | 개별 ID·제목·장면·접근성 설명·한 줄을 명시한 자기이해 에디션 192개  |
| `guardian-love-edition-blueprints-ko.json`   | `authoring`              | 사랑 12패밀리의 서사 테마 120개와 네 희귀도의 한국어 원고           |
| `guardian-love-editions-ko.json`             | `editorial_draft`        | 개별 ID·고정 가중치·원고를 명시한 사랑 에디션 480개                 |
| `guardian-work-edition-blueprints-ko.json`   | `authoring`              | 일 12패밀리의 서사 맥락 48개와 네 표현 방식의 한국어 원고           |
| `guardian-work-editions-ko.json`             | `editorial_draft`        | 개별 ID·제목·장면·접근성 설명·한 줄을 명시한 일 에디션 192개        |
| `guardian-choice-edition-blueprints-ko.json` | `authoring`              | 결정 12패밀리의 서사 맥락 48개와 네 표현 방식의 한국어 원고         |
| `guardian-choice-editions-ko.json`           | `editorial_draft`        | 개별 ID·제목·장면·접근성 설명·한 줄을 명시한 결정 에디션 192개      |
| `production-art-pilot-plan-ko.json`          | `visual_review_complete` | 별자리별 대표 원고·3:4 원화 후보 12개 시각 승인 완료                |
| `production-art-batches-ko.json`             | `work_order`             | 1,056개 원화를 같은 제작 축의 12별자리 단위 88개 배치로 선언        |
| `production-art-batch-001-review-ko.json`    | `visual_review_complete` | 첫 production 배치 신규 PNG 11개 시각 승인·승인 해시 고정           |
| `production-art-batch-002-review-ko.json`    | `editorial_review_ready` | 두 번째 배치 12개 원고 해시·행동 구도 편집 승인 대기                |
| `guardian-card-asset-contract.json`          | `delivery_contract`      | R2 버킷·객체 키·WebP 최적화·캐시 불변 계약                          |
| `guardian-card-assets-ko.json`               | `release_candidate`      | 승인된 23개 WebP 배포 후보의 객체 키·원본/배포 SHA-256              |

파일명과 JSON에는 수동 버전을 두지 않는다. 각 파일이 현재 정본이며 변경 이력은 Git으로 추적한다. 이미
게시한 카드의 의미나 원화를 실질적으로 바꿔야 한다면 기존 ID를 덮어쓰지 않고 새 에디션 ID를 만든다.

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
5. 승인 원본을 1080×1440 WebP로 최적화하고 Cloudflare R2의 edition ID 기반 객체 키에 올린 뒤에만
   `assetStatus`와 `artworkPath`를 채운다.

현재 파일럿 12장의 로컬 원화 후보는 생성·시각 QA·사람의 최종 시각 승인을 마쳤다. 승인한 파일의
SHA-256은 제작 목록의 `approvedArtworkSha256`에 고정한다. 후보와 비교 시트는 공개 Git에 포함하지 않는
`apps/stella/private/guardian-art-pilot` 아래에서만 보관한다. R2 업로드 전까지
`imageStatus`는 `approved_local_candidate`, `artworkPath`는 `null`로 유지한다. 로컬 후보 경로를 runtime이나
공개 콘텐츠 manifest에 기록하지 않는다. 배포 후보 WebP도 `apps/stella/private/guardian-art-release`에
생성하며 Git에는 포함하지 않는다.

R2 resource는 sibling `sobok-ops`의 `infra/cloudflare/account/sobok/stella`가 선언한다. production은
`stella-guardian-assets`와 `guardian-assets.sobok.cc`, staging은 `stella-guardian-assets-stg`와
`guardian-assets-stg.sobok.cc`를 사용하고 `r2.dev`는 끈다. 객체 키는
`guardian-cards/ko/{editionId}.webp`이며, 게시된 객체를 의미 있게 바꿀 때는 기존 키를 덮어쓰지 않고 새
에디션 ID를 만든다. 앱 Worker가 R2를 프록시하지 않고 custom domain이 WebP를 직접 전달한다. 런타임은
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

현재 파일럿 12개와 첫 production 배치 신규 11개, 총 23개 승인 원본을 WebP quality 82·effort 6으로
최적화했다. 누적 배포 후보 합계는 3,571,288 bytes다. `guardian-card-assets-ko.json`은 파일 본문 대신 각
WebP의 객체 키·정확한 byte 수·원본과 배포 SHA-256만 추적한다. release bundle의 매니페스트가 Git의 이
파일과 byte 단위로 같지 않으면 GitHub Actions가 배포하지 않는다.

## production 원화 배치

`production-art-batches-ko.json`은 1,056개 에디션을 같은 주제·서사·표현 축의 12별자리 단위로 묶은
88개 제작 배치다. 자기이해·일·결정은 `맥락 × 표현 방식`, 사랑은 `관계 서사 × 희귀도`가 한 배치를
이룬다. 이 단위는 캐릭터별 외형을 비교하면서도 같은 시각 문법의 반복 여부를 한 장의 비교 시트에서
검수하기 위한 것이다.

승인된 파일럿 12개는 각각 서로 다른 배치에 하나씩 포함된다. 따라서 12개 배치는 파일럿 한 장과 신규
11장으로 구성되고, 나머지 76개 배치는 신규 12장으로 구성된다. 파일럿만 승인했을 때의 시작 잔여량은
1,044장이며 첫 production 배치 11개까지 승인·WebP 준비한 현재 잔여량은 1,033장이다. 이 목록은 에디션
정본, 파일럿 원고 해시, 누적 WebP 매니페스트에서 materialize하며 다음 명령으로 다시 만든다.

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
순간, 첫 배치와 겹치지 않는 카메라·소품·운동 방향을 고정했다. 사람 편집 승인을 완료해
각 항목의 승인된 원고 해시와 구도를 입력으로 imagegen 원화 후보 12개를 제작했다. 마스터 크기와 80px
contact sheet에서 캐릭터 정체성·중심 행동·배치 내부 구도 중복·첫 배치 비반복 여부를 보조 검수했으며,
close-emotion 카드와 가까웠던 전갈 첫 후보는 넓은 저시점 회랑 구도로 교정했다. 현재
`visual_review_ready`로 사람의 최종 시각 승인을 기다린다. 후보와 contact sheet는 공개 Git에 포함하지
않는 `apps/stella/private/guardian-art-production/self-present-weather-action-beat`에 보관하며, 승인 전까지
WebP 변환·R2 업로드·런타임 게시로 넘기지 않는다.

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
- 발견된 모든 production 배치 검수 파일의 단계별 상태·현재 원고 해시·배치 축·고유 구도 일치
- 1,056개를 정확히 한 번씩 포함하는 88개 production 배치와 누적 승인 WebP 23개를 제외한 현재 잔여
  1,033개 산식
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
  --output private/guardian-art-release-023

bun --filter=@sobok/stella guardian-cards:validate-art-release --manifest \
  private/guardian-art-release-023/manifest.json

bun --filter=@sobok/stella guardian-cards:package-art-release --manifest \
  private/guardian-art-release-023/manifest.json --output \
  private/releases/guardian-art-release-023/guardian-card-art-release.tar.gz
```

`--source`는 사람 시각 승인이 끝난 매니페스트마다 반복한다. 출력은 모든 source를 합친 누적 release이며,
이미 게시한 에디션도 이전 WebP와 byte 단위로 같아야 한다.

시각 승인과 Git의 `guardian-card-assets-ko.json` 갱신 뒤, WebP와 같은 `manifest.json`을
`guardian-card-art-release.tar.gz`로 묶어 immutable GitHub Release asset으로 올린다. 원격 R2 변경은
로컬 CLI가 아니라 `Guardian Card Art Deploy` workflow만 수행한다. workflow는 environment branch gate,
Terraform이 동기화한 버킷 이름, WebP-only bundle, Git 매니페스트 일치를 확인한다. 공개 origin은 Database
Worker의 Wrangler가 소유한다. 같은 객체 키가 이미
있으면 SHA-256이 같을 때만 건너뛰며 다르면 실패한다.

구매 결과에는 카드 표현과 추첨 정책을 스냅샷으로 보존한다. 게시한 에디션의 제목·원고·이미지를 의미 있게
바꾸려면 기존 에디션 ID를 덮어쓰지 않고 새 ID를 추가한다. 선택 정책의 변경 이력은 Git과 구매·획득
스냅샷으로 추적한다.
