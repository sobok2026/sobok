# Cafe · Day Shift

1인칭 카페 매장 운영 게임의 첫 플레이 버전. Vite + React + TypeScript + Three.js로 실행하고 IndexedDB에 저장한다.

```sh
bun install
bun run --filter=@sobok/cafe dev
```

로컬 주소: `http://127.0.0.1:3018`.

```sh
bun run --filter=@sobok/cafe type
bun run --filter=@sobok/cafe build
bun run --filter=@sobok/cafe preview
```

`build` 결과는 `apps/cafe/dist`에 생긴다. 원격 서버·로그인·DB 설정 없이 실행한다. 이번 버전은 PC 키보드·마우스와 WebGL 2를 대상으로 한다.

## 배포

운영 주소는 `https://cafe.sobok.cc`다. GitHub Actions의 **Cafe Deploy**를 `main`에서 실행하고
`confirmation`에 `DEPLOY CAFE`를 입력하면 카페만 빌드·배포한다. **Production Deploy**의 전체 운영 배포에도 포함된다.

`wrangler.jsonc`는 `dist`를 Cloudflare Workers Static Assets로 배포한다. `workers.dev`와 preview URL은
끄고, custom domain은 `sobok-ops`의 `account-workers` HCP Terraform workspace가 소유한다.
최초 배포는 GitHub Actions에서 `cafe` Worker를 생성한 뒤 Terraform으로 도메인을 연결한다.
스테이징은 구성하지 않는다.

## 플레이

- WASD 이동, 마우스 또는 방향키로 시점 조작. 마우스 고정이 지원되지 않으면 화면을 누른 채 드래그해 둘러본다.
- E로 작업대 열기 또는 컵 집기·내려놓기. 컵은 작업대의 정해진 자리에 자동 정렬된다.
- 컵을 내려놓으면 마우스 커서가 풀려 화면의 제조 버튼도 누를 수 있다. 컵을 집으면 시점 조작으로 돌아간다.
- G로 도구를 집고, 클릭 또는 Space를 누르고 있으면 붓거나 젓는다. 펌프·파우더·얼음은 한 번 누를 때마다 한 회씩 넣는다.
- 목표 구간에서 멈추고 G로 도구를 놓은 뒤 F로 계량을 확인한다. 초과한 컵은 폐기하고 다시 만든다.
- POS에서 주문 입력 → 컵 보관대 → 주문표의 제조 단계 → 픽업대에 내려놓고 F로 전달.
- 카운터 안쪽 직원 통로에서 시작한다. 제조 장비·POS·픽업대는 직원 쪽에서만 사용할 수 있다.
- 사용한 피처는 세척대에서 씻고 도구 선반에서 정리한다.
- 직원 통로 뒤쪽에 준비대·세척대·도구 선반·창고가 있다. 객석 청소와 분리수거는 POS 옆 직원 출입구로 나가서 진행한다.
- 준비대에서 폼·바모카를 선택하고 G로 도구를 집어 직접 계량한다. 폼은 크림 → 우유 → 7펌프 → 3번 블렌딩, 바모카는 원팩 → 온수 → 젓기 순서다.
- 준비가 끝나면 날짜 라벨을 붙이고 보관 위치를 선택한다. 폼은 냉장, 바모카는 실온이며, 라벨·보관 전에는 음료에 사용할 수 없다.
- 냉장고·창고에서 배치의 잔량·기한을 확인하고 개봉·보충·입고한다.
- 새 원팩도 개봉 → 날짜 라벨 → 보관을 거쳐 보충한다. 기한은 실제 개봉·제조 시점부터 계산하며 라벨을 다시 확인해도 늘어나지 않는다.
- POS에서 신규 주문을 마감하고 청소·설거지·정리·폐기를 마치면 결산할 수 있다.
- Esc로 일시정지. 메뉴에서 JSON 백업을 내보내거나 불러온다.

## 자료 갱신

사용자가 제공한 네 엑셀을 `apps/cafe/references/`에 두고 레포 루트에서 다음을 실행한다.

```sh
bun run --filter=@sobok/cafe import:references
```

생성된 `src/data/references.generated.json`을 사용하므로 빌드 시 원본 엑셀은 필요하지 않다. 가져오기는 원본 파일을 수정하지 않는다. 자료 공개는 사용자가 명시적으로 허용했다.

## 문서

- [게임 설계](../../docs/cafe/design.md)
- [구현 구조와 순서](../../docs/cafe/implementation.md)
- [자료 근거와 임시 규칙](../../docs/cafe/prototype-rules.md)

컵과 부재료의 내용물·도구·계량 도중의 진행량도 저장한다. 현재 데이터 구조만 검증하며, 저장 버전 관리와 이전 구조의 자동 변환은 하지 않는다.

첫 버전은 작업 순서와 직접 계량, 단순 도형을 사용한다. 실제 장비·컵·세척 절차의 완전한 재현은 후속 작업이다. 자동 테스트 코드는 사용자 요청에 따라 추가하지 않았다.
