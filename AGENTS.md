# AGENTS.md

## Collaboration

- 도중에 결정이 필요하거나 애매한 부분이나 맥락을 모르거나 궁금한 점이 있으면 먼저 질문한다.
- 이 repo의 아키텍처 기본값을 바꾸는 변경은 사용자 확인 없이 진행하지 않는다.
- 구조 변경 전에는 관련 문서를 먼저 읽고, 문서와 충돌하면 먼저 질문한다.

## Repo Role

- 이 repo는 앱 소스 코드를 관리한다.
- Cloudflare Terraform 코드는 sibling repo `../sobok-ops`에 있다.

## Cloudflare Ownership

- Queue/DLQ, Hyperdrive config, Secrets Store 항목, Turnstile widget, custom domain, DNS·Zone 설정처럼
  Worker와 독립적인 Cloudflare resource의 lifecycle은 `../sobok-ops` Terraform만 소유한다.
- Worker script와 배포에 결합된 연결(`services`, Queue producer/consumer, Hyperdrive·Secrets Store binding,
  vars, assets, trigger)은 이 repo의 각 `wrangler.jsonc`만 소유하고 GitHub Actions로 배포한다.
- 같은 resource나 연결을 Terraform과 Wrangler 양쪽에 선언하지 않는다.
- Cloudflare Dashboard는 조회 전용이다. 원격 변경은 HCP Terraform 또는 GitHub Actions의 Wrangler
  배포로만 수행한다.

## Repo Rules

- 이 repository는 public repo다.
- 커밋되는 모든 파일은 공개될 수 있다고 가정한다.
- secret, token, private key, credential, 계정 정보, 민감한 운영 정보는 커밋하지 않는다.

## Code Style

- 포맷은 Biome(JS·TS·JSON)와 Prettier(CSS·Markdown·YAML·HTML)가 정한다. 아래 규칙은 포매터가 정하지 않는
  부분만 다룬다.
- 기존 코드는 그 파일을 수정할 때 맞춘다. `apps/cafe`는 모두 맞춰져 있고 중첩 삼항은 Biome
  `style/noNestedTernary`로 막는다.

### 빈 줄

- 빈 줄은 문단을 나눌 때만 한 줄씩 쓴다. 블록의 처음과 끝에는 넣지 않는다.
- import 블록 뒤와 최상위 선언 사이는 띄운다. 한 줄짜리 선언끼리는 붙이고 스키마와 그 `z.infer` 타입도 붙인다.
- 함수 본문은 준비 → 가드 → 본 작업 → 반환 단위로 나눈다.
  - 여러 줄 블록(`if`·`for`·`switch`·`try`·함수·핸들러)은 앞뒤를 띄운다. 본문이 한 문장인 `if`는 가드로 보고
    붙인다.
  - 여러 줄 `return` 앞은 띄운다. 컴포넌트는 훅 묶음 뒤도 띄운다.
- 빈 줄을 넣어도 흐름이 안 읽히면 함수 추출을 먼저 검토한다.

### 분기

- 중첩 삼항은 쓰지 않는다.
  - 값 선택은 early return 함수나 lookup 객체로 쓴다.
  - JSX 분기는 early return 하위 컴포넌트로 빼거나 서로 배타적인 조건 블록으로 나눈다.

### className

- 한 줄(120자)에 들어가면 문자열 하나로 쓴다.
- 넘으면 `clsx()` 인자로 나눈다. 글자 수가 아니라 의미로 나누고 아래 순서를 따른다.
  1. 기본 스타일. 길면 레이아웃(배치·표시·크기·바깥 여백)과 외형(테두리·배경·안쪽 여백·그림자·글자·모션)으로
     나눈다.
  2. 상태·선택자 variant(`hover:` `aria-*:` `data-*:` `group-*:` `after:` 등)
  3. 미디어 variant(`compact:` `max-tablet:` `motion-reduce:` 등)
  4. 조건부 클래스
  5. 밖에서 받은 `className`
- 각 문자열 안은 Tailwind 정렬 순서를 따른다.
- 여러 줄 문자열과 템플릿 리터럴은 쓰지 않는다. 공백이 DOM에 남고 클래스 정렬기가 한 줄로 합친다.
- `[...].join(' ')`은 쓰지 않는다. falsy 값이 `false` 클래스로 남는다.
- `tailwind-merge`는 override가 실제로 충돌하는 공용 컴포넌트에서만 쓰고 커스텀 테마 토큰을 설정에 등록한다.
- 같은 클래스 묶음이 반복되면 문자열을 나누기보다 반복문이나 컴포넌트로 뺀다.

## Web Rules

- `apps/web`는 App Router + Server Components + Tailwind를 사용한다.
  - Tailwind 디자인 시 `pt-[55px]` 등 동적 레이아웃은 지양한다.
- Next.js는 HTML 서버로만 사용한다.
- Next API route는 probe 정도만 허용한다.
- Server Action은 사용하지 않는다.
- 로직은 먼저 호출부 근처에 두고, 두 군데 이상에서 재사용될 때만 공용 폴더로 승격한다.

## DB Boundary

- PostgreSQL + Drizzle를 사용한다.
- Drizzle migration 파일은 사용하지 않고 `drizzle-kit push`만 사용한다.
