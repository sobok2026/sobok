# 카페 코드 아키텍처

2026-09-25 사용자 합의로 적용한 업무 중심 구조다. 한 업무의 규칙·행동·화면·도움말·3D 표현을 같은 기능 폴더에서 찾고, 전체 게임 상태와 실행 순서는 한 곳에서 조정한다.

Vite·React·Three.js·Tailwind·IndexedDB를 사용한다. 플레이 규칙, 저장 필드와 검증 조건, 단일 탭 정책은 기존 설계를 따른다. 제품 요구는 [게임 설계](./design.md), 화면의 정보 노출 기준은 [HUD 설계](./hud.md), 미확정 수치는 [임시 규칙](./prototype-rules.md)을 참조한다.

## 디렉터리와 책임

```text
apps/cafe/src/
├── app/                 앱 시작과 화면·브라우저 자원 연결
│   ├── session/         모드 전환, 작업대 입력, 3D 연결, 사용자 설정
│   ├── persistence/     IndexedDB·JSON 백업·탭 잠금
│   ├── audio/           녹음 로딩·재생·작업음 선택
│   └── guide/           도움말 우선순위와 업무별 안내 조합
├── simulation/          전체 상태·행동·게임 시간과 상태 발행
├── features/
│   ├── service/         손님 이동·주문 접수·음료 전달·POS
│   ├── crafting/        음료 제조·계량·도구·컵 내용물
│   ├── preparation/     부재료 배합·가공·완성
│   ├── cold-brew/       콜드 브루 계량·추출·회수
│   ├── inventory/       원재료·배치·컵·소모품의 재고와 운반
│   ├── washing/         용기 세척·운반·보관대 반납
│   ├── cleaning/        표면 청소·사용한 컵 회수·쓰레기
│   └── shift/           접수 마감·결산·다음 날·운영 기록
├── world/               전체 3D 장면·매장·플레이어 이동
├── content/             작업대·재료·레시피 정의와 원본 자료 연결
└── shared/              실제로 반복 사용하는 UI·3D 자산과 작은 값 처리
    ├── ui/
    └── visuals/
```

`main.tsx`는 앱을 시작하고, `style.css`는 Tailwind 테마와 기본 스타일을 정의한다. 기능별 스타일은 해당 JSX에 둔다. 모든 기능에 같은 파일 목록을 만들거나 폴더 깊이를 맞추지는 않는다.

세척은 [rules.ts](../../apps/cafe/src/features/washing/rules.ts), [actions.ts](../../apps/cafe/src/features/washing/actions.ts), [WashingHud.tsx](../../apps/cafe/src/features/washing/WashingHud.tsx), [WashingPanel.tsx](../../apps/cafe/src/features/washing/WashingPanel.tsx), [help.ts](../../apps/cafe/src/features/washing/help.ts), [visuals.ts](../../apps/cafe/src/features/washing/visuals.ts)에서 함께 찾는다. 입력·화면 조합이나 공통 컵 재고를 바꾸는 경우에만 해당 소유 모듈까지 확인한다.

## 상태의 소유와 갱신

[simulation/state.ts](../../apps/cafe/src/simulation/state.ts)의 Zod 스키마가 영속 상태와 추론 타입의 단일 정의다. 컵 수량 보존, 한 번에 들 수 있는 물건, 배합 용기와 작업의 연결처럼 여러 업무를 가로지르는 검증도 여기에 둔다. 기능마다 별도의 저장소나 동일 상태의 복사본을 만들지 않는다.

[simulation/store.ts](../../apps/cafe/src/simulation/store.ts)가 상태 복사와 snapshot 발행을 담당한다. 업무의 `actions.ts`는 전달받은 `WorkContext.state` 복사본만 수정한다. 재료 소비는 `inventory/inventory.ts`의 `consume`을 사용하며, UI와 3D 표현은 상태를 직접 변경하지 않는다. 화면에서는 전달받은 행동 콜백을 호출한다.

한 행동으로 여러 영역이 바뀔 수 있다. 음료 전달은 주문·컵·손님·매출을 함께 변경하고, 세척은 진행 상태와 용기 재고를 함께 변경한다. 업무 함수의 처리가 끝난 뒤 저장소가 한 번 상태를 발행하므로 중간 상태가 화면에 노출되지 않는다.

지속 입력은 `WorkContext.input`에, 메뉴·도움말·패널 상태는 `app/session`에, 프레임별 카메라와 입력 상태는 `world`에 둔다. 저장 시에는 장면의 현재 위치를 게임 snapshot에 합친다. 사용자 설정은 기존처럼 게임 저장과 별도 키로 관리한다.

## 시간과 행동 처리 순서

- 행동 처리: 기존 지속 입력 해제 → 상태 복사 → 예정 작업 완료 → 준비 중 재료 만료 확인 → 공통 점유 조건 확인 → 업무별 행동 → 배치 정리 → 상태 발행.
- 게임 tick: 상태 복사 → 경과 시간 반영 → 예정 작업 완료 → 준비 중 재료 만료 확인 → 지속 입력 진행 → 손님 진행 → 상태 발행.
- 다음 날: `features/shift/actions.ts`에서 시계·근무·고객·집계를 갱신하고, 건너뛴 시간의 예정 작업을 완료한 뒤 기존 행동 처리 경로에서 상태를 발행한다.

예정 작업은 자신의 완료 시각으로 처리한다. 현재 시각의 만료 판정을 먼저 실행해 이미 정상 완료했어야 할 배합을 폐기하지 않는다. `features/shift`가 작업 완료 함수를 호출할 수 있지만 저장소의 `dispatch`나 `tick`을 재귀 호출하지 않는다.

## 참조 방향

1. 기능의 `rules.ts`, `actions.ts`와 상태 조회 함수는 React·Three.js·DOM·IndexedDB에 의존하지 않는다. 필요한 정의, 상태 타입, 공통 점유 조건과 다른 업무의 명시적인 계산 함수를 참조할 수 있다.
2. `simulation/state.ts`는 검증에 필요한 기능의 규칙·상수를 읽는다. 그 규칙에서 상태가 필요하면 `import type`으로만 참조해 런타임 순환을 만들지 않는다. 전체 상태 제어의 진입점은 계속 `store.ts` 하나다.
3. HUD·패널은 필요한 데이터와 콜백을 props로 명시한다. `useCafeSession` 반환 타입이나 구체적인 `CafeStore` 구현을 화면 계약으로 사용하지 않는다.
4. `app/StationPanel.tsx`, `app/PlayHud.tsx`, `app/guide`는 어느 업무를 보여줄지 선택하고 기능별 화면을 조합한다. 준비 수량·세척 대기·마감 조건 등 업무 내용은 기능 폴더에 둔다.
5. `world/scene.ts`는 각 기능의 `visuals.ts`를 조합한다. 용기 위치처럼 렌더링에만 필요한 값은 기능의 시각 표현과 함께 둔다. 공통 작업대 위치·접근 기준은 `content/stations.ts`를 사용한다.
6. 여러 기능에서 쓰는 업무 로직은 소유 기능에 남긴다. 예를 들어 재료 소비·배치 상태·컵 재고는 `inventory`가 담당한다. 공통 3D 컵 자산은 컵 종류 같은 정의를 읽을 수 있지만 업무의 행동 처리나 저장소를 호출하지 않는다.
7. 직접 import를 사용한다. 규칙·UI·3D를 한 `index.ts`에서 재노출하지 않는다. [use-cafe-scene.ts](../../apps/cafe/src/app/session/use-cafe-scene.ts)의 동적 import를 3D 실행 진입점으로 유지하고, UI에서 장면 타입이 필요하면 `import type`을 사용한다.

## 변경할 때 찾는 곳

| 바꾸는 내용                   | 주된 위치                                                           | 함께 확인할 연결                             |
| ----------------------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| 음료 종류·제조 수량·판매 가격 | `content/recipes.ts`, `content/drink-sizes.ts`, `features/crafting` | POS 선택, 원본 자료 연결                     |
| 원재료 규격·기한              | `content/ingredients.ts`, `content/lifetime.ts`                     | 재고 소비·배합의 원재료 기한                 |
| 부재료 준비·콜드 브루         | 해당 기능의 규칙·행동·HUD·시각 표현                                 | `simulation/jobs.ts`, 배치 재고              |
| 컵 회수·세척                  | `features/cleaning`, `features/washing`                             | `features/inventory/cups.ts`, 전체 수량 검증 |
| 손님·POS·음료 전달            | `features/service`                                                  | 제조 완료 판정, 공통 재고·집계               |
| 마감·다음 날·운영 기록        | `features/shift`                                                    | 전체 시계와 예정 작업 완료                   |
| 작업대 버튼·도움말            | 기능의 패널·`help.ts`·`Guide.tsx`                                   | 앱의 표시·도움말 선택 순서                   |
| 단축키·화면 전환              | `app/session`                                                       | `world/player-controls.ts`, 공통 대화상자    |
| 매장 조형물·이동·그래픽 자원  | `world`                                                             | `content/stations.ts`, 기능별 `visuals.ts`   |
| 저장·복구·탭 정책             | `app/persistence`                                                   | `simulation/state.ts`, 세션의 저장 시점      |

새 행동은 기능의 처리 함수와 `simulation/actions.ts`, `simulation/store.ts`의 라우팅을 함께 연결한다. 새 UI나 시각 표현은 필요한 앱·장면 조합부에 직접 연결한다. 범용 등록 시스템이나 기능별 저장소는 도입하지 않는다.

원본 엑셀은 `apps/cafe/references/`에, 생성 JSON은 `src/content/references.generated.json`에 둔다. 두 자료 스크립트는 `content/reference-links.ts`를 직접 사용한다. 앱에서는 `content/references.ts`가 자료를 연결하고, 레시피·재료 정의가 그 결과를 읽는다.
