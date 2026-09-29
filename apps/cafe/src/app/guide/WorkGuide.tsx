import { lazy, Suspense, useState } from 'react'
import type { StationId } from '../../content/stations'
import { CraftingGuide, RecipeGuide } from '../../features/crafting/Guide'
import { PreparationGuide, PreparationRecipeGuide } from '../../features/preparation/Guide'
import ServiceGuide from '../../features/service/Guide'
import ShiftGuide from '../../features/shift/Guide'
import { PanelTabs } from '../../shared/ui/PanelControls'
import type { GameState } from '../../simulation/state'
import { currentTip } from './current-tip'

const RecipeLibrary = lazy(() => import('../../features/recipe-library/RecipeLibrary'))

const controls = [
  ['W A S D', '이동'],
  ['Shift (누르는 동안)', '달리기 · 이동 속도 2배'],
  ['마우스 / 방향키', '시점'],
  ['E', '집기 · 놓기 · 작업대 열기 · 스티커 붙이기'],
  ['G', '도구 집기 · 놓기'],
  ['1–9', '장비 설정 고르기'],
  ['클릭 / Space', '누르고 붓기 · 한 번씩 펌핑 · 장비 작동'],
  ['F', '확인 · 라벨 붙이기 · 음료 전달'],
  ['Q (길게)', '폐기 · 작업 취소'],
  ['L', '주문 라벨 보기 · 닫기'],
  ['H', '도움말'],
  ['M', '매장 현황'],
  ['Esc', '닫기 · 일시정지'],
]

type Tab = 'now' | 'recipe' | 'manual' | 'controls' | 'library'

export default function WorkGuide({
  state,
  station,
  started,
}: {
  state: GameState
  station: StationId | null
  started: boolean
}) {
  const [tab, setTab] = useState<Tab>(started ? 'now' : 'manual')
  const tip = currentTip(state, station)

  return (
    <div className="text-body leading-relaxed">
      <PanelTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'now', label: '지금' },
          { id: 'recipe', label: '이 음료' },
          { id: 'manual', label: '업무 안내' },
          { id: 'controls', label: '조작법' },
          { id: 'library', label: '제조법 검색' },
        ]}
      />
      {tab === 'now' && (
        <section className="rounded-xl bg-control p-4" aria-label="현재 작업 도움말">
          <h3 className="font-semibold data-[fault=true]:text-danger" data-fault={!!tip.fault}>
            {tip.title}
          </h3>
          <p className="mt-2">{tip.action}</p>
          <p className="mt-2 text-muted">{tip.reason}</p>
        </section>
      )}
      {tab === 'controls' && (
        <>
          <div className="hidden touch:block">
            <p className="mb-3 font-semibold">가로로 돌리면 매장을 더 넓게 볼 수 있어요.</p>
            <dl className="divide-y divide-line">
              {[
                ['왼손 스틱', '밀어서 이동 · 조금 밀면 천천히'],
                ['스틱을 위로 더 밀기', '누르는 동안 달리기'],
                ['빈 화면 드래그', '둘러보기 · 이동과 동시에 가능'],
                ['작업 버튼', '집기 · 놓기 · 작업대 열기'],
                ['작업 카드', '도구 선택 · 누르고 붓기 · 확인'],
                ['길게 누르기', '폐기 · 작업 취소'],
                ['상단 메뉴', '일시정지 · 도움말 · 매장 현황'],
              ].map(([gesture, action]) => (
                <div key={gesture} className="grid grid-cols-[1fr_1.5fr] gap-3 py-3">
                  <dt className="font-medium">{gesture}</dt>
                  <dd className="text-muted">{action}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm text-muted">
              붓는 동안은 시점이 고정됩니다. 작업 버튼에서 손을 떼면 멈추고, 이동해도 작업이 멈춥니다.
            </p>
          </div>
          <dl className="divide-y divide-line touch:hidden">
            {controls.map(([key, action]) => (
              <div key={key} className="flex items-center justify-between gap-5 py-2.5">
                <dt>
                  <kbd className="text-muted">{key}</kbd>
                </dt>
                <dd className="text-right">{action}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-muted touch:hidden">
            마우스 고정이 지원되지 않으면 화면을 누른 채 드래그하거나 방향키를 사용하세요.
          </p>
        </>
      )}
      {tab === 'recipe' && (
        <>
          <RecipeGuide state={state} />
          <PreparationRecipeGuide state={state} />
        </>
      )}
      {tab === 'manual' && (
        <>
          <CraftingGuide />
          <PreparationGuide />
          <ServiceGuide />
          <ShiftGuide />
        </>
      )}
      {tab === 'library' && (
        <Suspense fallback={<p className="py-4 text-muted">제조법 불러오는 중…</p>}>
          <RecipeLibrary />
        </Suspense>
      )}
    </div>
  )
}
