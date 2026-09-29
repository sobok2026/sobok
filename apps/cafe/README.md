# Cafe · 소복다방

1인칭 카페 매장 운영 게임. PC 키보드·마우스와 WebGL 2를 대상으로 한다.

매장은 스타벅스 더북한산점 1층 사진을 기준으로 구성했다. 목재 바·디지털 메뉴판 3개·벽돌 구획·상품 진열·공용 테이블·창가 좌석을 표현하며, 메뉴판 가격은 게임의 판매 데이터와 연결된다. 실측 도면이 없는 구역과 백룸은 게임용 구성이다. [재현 근거와 범위](../../docs/cafe/graphics.md#매장-인테리어와-메뉴판)

## 로컬 실행

레포 루트에서 실행한다.

```sh
bun install
bun run --filter=@sobok/cafe dev
```

로컬 주소: `http://127.0.0.1:3018`. 원격 서버·로그인·DB 설정 없이 실행한다.

```sh
bun run --filter=@sobok/cafe type
bun run --filter=@sobok/cafe build
bun run --filter=@sobok/cafe preview
```

`build` 결과는 `apps/cafe/dist`에 생긴다. 게임 안에서 H는 도움말, M은 매장 현황, Esc는 설정·저장 관리를 연다.

## 배포

운영 주소는 `https://cafe.sobok.cc`다. GitHub Actions의 **Cafe Deploy**를 `main`에서 실행하고
`confirmation`에 `DEPLOY CAFE`를 입력하면 카페만 빌드·배포한다. **Production Deploy**의 전체 운영 배포에도 포함된다.

Worker는 이 repo의 `wrangler.jsonc`, custom domain은 `sobok-ops`의 `account-workers` HCP Terraform workspace가 소유한다.
최초 배포는 GitHub Actions에서 `cafe` Worker를 생성한 뒤 Terraform으로 도메인을 연결한다. 스테이징은 구성하지 않는다.

## 문서

- [아키텍처와 저장 정책](../../docs/cafe/architecture.md)
- [게임 설계](../../docs/cafe/design.md)
- [화면 정보 설계](../../docs/cafe/hud.md)
- [POS 결정과 옵션 가격 근거](../../docs/cafe/pos.md)
- [주문 라벨 참고 자료](../../docs/cafe/order-stickers.md)
- [월드 공간과 보충 동선](../../docs/cafe/world-layout-proposal.md)
- [장비 그래픽 참고 자료](../../docs/cafe/graphics.md)
- [제조 자료 작성과 월간 갱신](../../docs/cafe/recipe-data.md)
- [자료 근거와 게임용 규칙](../../docs/cafe/prototype-rules.md)
- [메뉴 가격 근거](../../docs/cafe/menu-prices.md)
- [URN Digital 제조 기준](../../docs/cafe/digital-urn-proposal.md)
- [부재료 제조표 대조](../../docs/cafe/preparation-source-comparison.md)
- [성능 측정 기록](../../docs/cafe/implementation.md)
- [후속 작업](../../docs/cafe/next-steps.md)
