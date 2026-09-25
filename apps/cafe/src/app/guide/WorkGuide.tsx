import type { StationId } from '../../content/stations'
import { CraftingGuide, RecipeGuide } from '../../features/crafting/Guide'
import { PreparationGuide, PreparationRecipeGuide } from '../../features/preparation/Guide'
import ServiceGuide from '../../features/service/Guide'
import ShiftGuide from '../../features/shift/Guide'
import type { GameState } from '../../simulation/state'

import { currentTip } from './current-tip'

const controls = [
  ['W A S D', '이동'],
  ['마우스 / 방향키', '시점'],
  ['E', '컵·용기 집기 / 놓기 · 작업대 열기'],
  ['G', '도구 집기 / 놓기'],
  ['클릭 / Space', '누르고 붓기·젓기 · 한 번씩 펌핑·흔들기'],
  ['F', '계량 확인 · 음료 전달'],
  ['H', '도움말'],
  ['M', '매장 현황'],
  ['Esc', '닫기 / 일시정지'],
]

export default function WorkGuide({
  state,
  station,
  started,
}: {
  state: GameState
  station: StationId | null
  started: boolean
}) {
  const tip = currentTip(state, station)
  return (
    <div className="text-sm leading-relaxed">
      {started ? (
        <section className="mb-6 rounded-xl bg-control p-4" aria-label="현재 작업 도움말">
          <h3 className="font-semibold data-[fault=true]:text-danger" data-fault={!!tip.fault}>
            {tip.title}
          </h3>
          <p className="mt-2">{tip.action}</p>
          <p className="mt-2 text-xs text-muted">{tip.reason}</p>
        </section>
      ) : null}
      <details className="border-t border-line py-4" open={!started}>
        <summary className="font-medium">조작법</summary>
        <dl className="mt-3 divide-y divide-line">
          {controls.map(([key, action]) => (
            <div key={key} className="flex items-center justify-between gap-5 py-2.5">
              <dt>
                <kbd className="font-sans text-xs text-muted">{key}</kbd>
              </dt>
              <dd className="text-right text-xs">{action}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">
          마우스 고정이 지원되지 않으면 화면을 누른 채 드래그하거나 방향키를 사용하세요.
        </p>
      </details>
      <RecipeGuide state={state} />
      <PreparationRecipeGuide state={state} />
      <CraftingGuide />
      <PreparationGuide />
      <ServiceGuide />
      <ShiftGuide />
    </div>
  )
}
