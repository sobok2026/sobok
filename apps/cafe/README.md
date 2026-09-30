# Cafe · 소복다방

1인칭 카페 매장 운영 게임. PC 키보드·마우스와 모바일 터치를 지원하며 WebGL 2가 필요하다. 모바일은 세로·가로 모두 플레이할 수 있고 가로 화면을 권장한다.

매장은 스타벅스 더북한산점 사진을 기준으로 구성했다. 1층 주문 바, 2층 라운지, 루프탑을 계단으로 오갈 수 있으며 49·138·66석을 표현한다. 전면의 두 에스프레소 머신에서 각각 추출·스팀 작업을 할 수 있다. 메뉴판 가격은 게임의 판매 데이터와 연결된다. 백룸은 일반 매장 사진을 참고한 세척·준비·보관 공간이며, 후드형 세척기와 제빙·얼음통 운반을 지원한다. 실측 도면이 없는 구역은 게임용 구성이다. [재현 근거와 남은 기자재](../../docs/cafe/graphics.md#더북한산점-기자재-배치)

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

모바일에서는 왼손 스틱으로 이동하고 빈 화면을 밀어 시점을 돌린다. 스틱을 조금 밀면 천천히 걷고 위로 더 밀면 달린다. 작업대와 도구는 화면 버튼으로 조작하며 도움말·매장 현황·설정은 상단 메뉴에서 연다.

## 배포

운영 주소는 `https://cafe.sobok.cc`다. GitHub Actions의 **Cafe Deploy**를 `main`에서 실행하고
`confirmation`에 `DEPLOY CAFE`를 입력하면 카페만 빌드·배포한다. **Production Deploy**의 전체 운영 배포에도 포함된다.

Worker는 이 repo의 `wrangler.jsonc`, custom domain은 `sobok-ops`의 `account-workers` HCP Terraform workspace가 소유한다.
최초 배포는 GitHub Actions에서 `cafe` Worker를 생성한 뒤 Terraform으로 도메인을 연결한다. 스테이징은 구성하지 않는다.

## 문서

- [아키텍처와 저장 정책](../../docs/cafe/architecture.md)
- [게임 설계](../../docs/cafe/design.md)
- [화면 정보 설계](../../docs/cafe/hud.md)
- [모바일 화면과 조작](../../docs/cafe/mobile-controls.md)
- [POS 결정과 옵션 가격 근거](../../docs/cafe/pos.md)
- [주문 라벨 참고 자료](../../docs/cafe/order-stickers.md)
- [월드 공간과 보충 동선](../../docs/cafe/world-layout-proposal.md)
- [백룸·후드형 세척기·제빙과 운반](../../docs/cafe/backroom.md)
- [장비 그래픽 참고 자료](../../docs/cafe/graphics.md)
- [제조 자료 작성과 월간 갱신](../../docs/cafe/recipe-data.md)
- [자료 근거와 게임용 규칙](../../docs/cafe/prototype-rules.md)
- [메뉴 가격 근거](../../docs/cafe/menu-prices.md)
- [URN Digital 제조 기준](../../docs/cafe/digital-urn-proposal.md)
- [부재료 제조표 대조](../../docs/cafe/preparation-source-comparison.md)
- [성능 측정 기록](../../docs/cafe/implementation.md)
- [후속 작업](../../docs/cafe/next-steps.md)
