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

- WASD 이동, 마우스 또는 방향키로 시점 조작, E로 작업대 열기. 마우스 고정이 지원되지 않으면 화면을 누른 채 드래그해 둘러본다.
- POS에서 주문 입력 → 컵 보관대 → 주문표의 제조 단계 → 픽업대.
- 사용한 피처는 세척대에서 씻고 도구 선반에서 정리한다.
- 바 뒤 준비대에서 글레이즈드 폼과 바모카를 만든다. 양옆 통로로 접근한다.
- 냉장고·창고에서 배치의 잔량·기한을 확인하고 개봉·보충·입고한다.
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

첫 버전은 단계별 제조와 단순 도형을 사용한다. 실제 장비·컵·세척 절차의 완전한 재현은 후속 작업이다. 자동 테스트 코드는 사용자 요청에 따라 추가하지 않았다.
