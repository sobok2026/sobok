import { COLD_BREW_HOURS, formatAmount, isCupSurface, money, STATIONS } from '../game/catalog'
import { cupSurface } from '../game/cleaning'
import { COLD_BREW_BEANS, COLD_BREW_COST, COLD_BREW_WATER } from '../game/cold-brew'
import { CUP_NAMES, cleanCupCount, cupCount, cupKindFor, isReusableCup } from '../game/cups'
import { available } from '../game/inventory'
import { PREPARATIONS, preparationIds } from '../game/preparation'
import { nextStep } from '../game/progress'
import { WASH_NAMES, washItems, washStock } from '../game/washing'
import BatchLabel from './BatchLabel'
import { Button, TextButton } from './Button'
import CupInventory from './CupInventory'
import InventoryPanel from './InventoryPanel'
import PosPanel from './PosPanel'
import SupplyPanel from './SupplyPanel'

import type { CafeSession } from './use-cafe-session'

export default function StationPanel({
  state,
  panel,
  act,
  closePanel,
}: Pick<CafeSession, 'state' | 'panel' | 'act' | 'closePanel'>) {
  if (!panel) return null
  const step = nextStep(state)
  const actionJob = state.jobs.find((job) => job.station === panel)
  const selectedCupKind = state.ticket ? cupKindFor(state.ticket.recipe, state.ticket.service) : null
  const shelfBatches = state.batches.filter(
    (batch) => batch.ingredient === 'mocha' && batch.location === 'bar' && batch.amount > 0,
  )
  const washingQueue = washItems
    .map((item) => ({ item, ...washStock(state, item) }))
    .filter((stock) => stock.dirty > 0 || stock.washed > 0)

  return (
    <div className="pointer-events-none absolute inset-0 z-8 bg-[linear-gradient(90deg,#263c281f,transparent_70%)]">
      <section className="pointer-events-auto absolute top-21 bottom-6 left-6 w-90 [scrollbar-width:thin] [scrollbar-color:#c6cdb9_transparent] overflow-auto rounded-2xl border border-white/60 bg-surface p-6 shadow-panel compact:top-20 compact:p-5 max-wide:left-5 max-tablet:top-21 max-tablet:bottom-4 max-tablet:left-3 max-tablet:max-w-[calc(100vw-1.5rem)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="m-0 text-[1.4375rem] font-medium tracking-[-0.04em]">{STATIONS[panel].name}</h2>
          </div>
          <button
            type="button"
            className="pointer-events-auto grid size-10 shrink-0 place-items-center rounded-full border-0 border-line bg-transparent text-[1.625rem] text-[#8e9881]"
            onClick={closePanel}
            aria-label="작업대 닫기"
          >
            ×
          </button>
        </div>
        <div className="h-5" />
        {actionJob ? (
          <div className="mb-5 flex flex-col gap-1.75 rounded-sm bg-[#e1e8d5] p-4.25 text-xs">
            <span>{actionJob.label}</span>
            <strong className="text-stat font-medium">{Math.ceil(actionJob.endsAt - state.time)}초 남음</strong>
          </div>
        ) : null}
        {panel === 'pos' ? <PosPanel state={state} act={act} /> : null}
        {panel === 'cups' ? (
          <>
            {selectedCupKind ? (
              <Button
                disabled={!!state.cup || !cleanCupCount(state, selectedCupKind)}
                onClick={() => act({ type: 'take-cup' })}
              >
                {CUP_NAMES[selectedCupKind]} 집기
              </Button>
            ) : null}
            <CupInventory state={state} act={act} />
          </>
        ) : null}
        {['espresso', 'steam', 'brew', 'water', 'ice', 'sauce', 'mix', 'topping'].includes(panel) ? (
          <p className="py-4 text-sm text-muted">
            {state.cup
              ? `컵 위치 · ${state.cup.craft.location === 'hand' ? '손' : STATIONS[state.cup.craft.location].name}`
              : state.ticket
                ? '컵 보관대에서 컵 준비'
                : 'POS에서 주문 접수'}
          </p>
        ) : null}
        {panel === 'pickup' ? (
          <>
            <div className="my-5.5 h-px bg-line" />
            <Button
              disabled={!state.cup || !!step || state.customer?.stage !== 'pickup'}
              onClick={() => act({ type: 'serve' })}
            >
              음료 전달
            </Button>
          </>
        ) : null}
        {panel === 'prep' ? (
          <div className="divide-y divide-line">
            {preparationIds.map((id) => (
              <div key={id} className="py-4 first:pt-0">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold">{PREPARATIONS[id].name}</h3>
                  <span className="text-xs text-muted tabular-nums">{formatAmount(available(state, id))}ml</span>
                </div>
                <Button
                  variant="secondary"
                  disabled={!!actionJob}
                  aria-label={`${PREPARATIONS[id].name} 준비 시작`}
                  onClick={() => act({ type: 'start-preparation', recipe: id })}
                >
                  준비 시작
                </Button>
              </div>
            ))}
          </div>
        ) : null}
        {panel === 'cold-prep' ? (
          <>
            <dl className="mb-5 grid grid-cols-3 gap-3 text-xs">
              <div>
                <dt className="text-muted">원두</dt>
                <dd className="mt-2 text-base">{COLD_BREW_BEANS}lb</dd>
              </div>
              <div>
                <dt className="text-muted">정수</dt>
                <dd className="mt-2 text-base">{COLD_BREW_WATER}L</dd>
              </div>
              <div>
                <dt className="text-muted">추출</dt>
                <dd className="mt-2 text-base">{COLD_BREW_HOURS}시간</dd>
              </div>
            </dl>
            <Button
              disabled={!!state.coldBrew || state.cash < COLD_BREW_COST}
              onClick={() => act({ type: 'start-cold-brew' })}
            >
              추출 준비 <span>{money(COLD_BREW_COST)}</span>
            </Button>
          </>
        ) : null}
        {panel === 'shelf' ? (
          <>
            {!shelfBatches.length ? <p className="text-sm text-muted">보관된 배합 없음</p> : null}
            {shelfBatches.map((batch) => (
              <BatchLabel key={batch.id} batch={batch} time={state.time} act={act} station="shelf" />
            ))}
          </>
        ) : null}
        {panel === 'wash' ? (
          <div className="divide-y divide-line">
            {washingQueue.length === 0 ? <p className="text-sm text-muted">세척할 용기 없음</p> : null}
            {washingQueue.map(({ item, dirty, washed }) => {
              return (
                <section key={item} className="py-3" aria-label={`${WASH_NAMES[item]} 세척 재고`}>
                  <p className="mb-3 flex justify-between gap-3 text-sm">
                    <span>{WASH_NAMES[item]}</span>
                    <span className="text-muted">{dirty > 0 ? `세척 대기 ${dirty}개` : `세척 완료 ${washed}개`}</span>
                  </p>
                  {dirty > 0 ? (
                    <Button disabled={!!state.washing} onClick={() => act({ type: 'wash', item })}>
                      {WASH_NAMES[item]} 세척 시작
                    </Button>
                  ) : null}
                  {washed > 0 ? (
                    <Button
                      variant={dirty > 0 ? 'secondary' : 'primary'}
                      disabled={!!state.washing}
                      onClick={() => act({ type: 'take-washed', item })}
                    >
                      씻은 {WASH_NAMES[item]} 집기
                    </Button>
                  ) : null}
                </section>
              )
            })}
          </div>
        ) : null}
        {panel === 'rack' ? (
          <p className="text-sm text-muted">
            깨끗한 피처 <strong className="ml-2 text-lg font-medium text-ink">{state.tools.clean}개</strong>
          </p>
        ) : null}
        {isCupSurface(panel) ? (
          <>
            <div className="my-5 text-[1.75rem] leading-[1.2] font-normal text-[#536f4b]">
              {cupCount(cupSurface(state, panel).cups)}
              <small className="mt-2 block text-xs text-muted">개 회수 대기</small>
            </div>
            <p className="mb-4 text-sm leading-[1.9] text-muted">
              {cupSurface(state, panel).dirty
                ? '얼룩 있음'
                : cupCount(cupSurface(state, panel).cups)
                  ? '컵 회수 필요'
                  : '정리 완료'}
            </p>
            <Button
              disabled={!cupSurface(state, panel).dirty && !cupCount(cupSurface(state, panel).cups)}
              onClick={() => act({ type: 'start-cleaning', station: panel })}
            >
              정리 시작
            </Button>
          </>
        ) : null}
        {panel === 'condiment' ? <SupplyPanel state={state} act={act} location="bar" /> : null}
        {panel === 'mix' ? (
          <Button
            variant="secondary"
            disabled={!state.dirtyBar || !!actionJob}
            onClick={() => act({ type: 'start-cleaning', station: 'mix' })}
          >
            작업대 닦기
          </Button>
        ) : null}
        {panel === 'trash' ? (
          <>
            <div className="my-5 text-[1.75rem] leading-[1.2] font-normal text-[#536f4b]">
              {state.trash}
              <small className="mt-2 block text-xs text-muted">개</small>
            </div>
            <Button disabled={!state.trash} onClick={() => act({ type: 'start-cleaning', station: 'trash' })}>
              분리수거 시작
            </Button>
          </>
        ) : null}
        {panel === 'stock' ? <InventoryPanel state={state} act={act} /> : null}
        {state.cup ? (
          <details className="mt-6 border-t border-line pt-4 text-sm">
            <summary className="mb-3 cursor-pointer text-muted">현재 컵 관리</summary>
            <TextButton danger onClick={() => act({ type: 'discard-cup' })}>
              {isReusableCup(state.cup.craft.kind) ? '내용물 비우고 컵을 세척 대기로' : '현재 컵 폐기하기'}
            </TextButton>
          </details>
        ) : null}
      </section>
    </div>
  )
}
