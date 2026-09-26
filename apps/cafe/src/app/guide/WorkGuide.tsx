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
  ['마우스 / 방향키', '시점'],
  ['E', '집기 · 놓기 · 작업대 열기'],
  ['G', '도구 집기 · 놓기'],
  ['클릭 / Space', '누르고 붓기 · 한 번씩 펌핑'],
  ['F', '계량 확인 · 라벨 · 음료 전달'],
  ['Q (길게)', '폐기 · 작업 취소'],
  ['H', '도움말'],
  ['M', '매장 현황'],
  ['Esc', '닫기 · 일시정지'],
]

type Tab = 'now' | 'recipe' | 'manual' | 'library'

/** A reference, not a tutorial: the order rail already says what to do, so this explains why and how. */
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
          { id: 'library', label: '제조법 검색' },
        ]}
      />
      {tab === 'now' && (
        <>
          <section className="rounded-xl bg-control p-4" aria-label="현재 작업 도움말">
            <h3 className="font-semibold data-[fault=true]:text-danger" data-fault={!!tip.fault}>
              {tip.title}
            </h3>
            <p className="mt-2">{tip.action}</p>
            <p className="mt-2 text-muted">{tip.reason}</p>
          </section>
          <dl className="mt-4 divide-y divide-line">
            {controls.map(([key, action]) => (
              <div key={key} className="flex items-center justify-between gap-5 py-2.5">
                <dt>
                  <kbd className="text-muted">{key}</kbd>
                </dt>
                <dd className="text-right">{action}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-muted">
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
