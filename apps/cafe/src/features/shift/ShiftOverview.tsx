import clsx from 'clsx'
import { useState } from 'react'
import { STATIONS, tableIds } from '../../content/stations'
import { money } from '../../shared/format'
import GameDialog from '../../shared/ui/GameDialog'
import type { GameState, Washing } from '../../simulation/state'
import CupInventory from '../inventory/CupInventory'
import { cupCount } from '../inventory/cups'
import { SUPPLIES, supplyIds } from '../inventory/supplies'
import { PREPARATIONS } from '../preparation/rules'
import { CUSTOMER_STATUS } from '../service/customer'
import { WASH_NAMES, washDestination, washItems, washStock } from '../washing/rules'
import { closingTasks } from './rules'
import ShiftLedger from './ShiftLedger'

const TABS = [
  { id: 'work', label: '할 일' },
  { id: 'ledger', label: '운영 기록' },
] as const

export default function ShiftOverview({ state, onClose }: { state: GameState; onClose: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('work')

  const expired = state.batches.filter(
    (batch) => batch.amount > 0 && batch.expiresAt !== null && batch.expiresAt <= state.time,
  ).length
  const tasks = [
    cupCount(state.condiment.cups) || state.condiment.dirty
      ? `컨디먼트 바 · 반납 컵 ${cupCount(state.condiment.cups)}개${state.condiment.dirty ? ' · 닦기 필요' : ''}`
      : '',
    ...supplyIds
      .filter((id) => state.supplies[id].bar <= 5)
      .map(
        (id) =>
          `${SUPPLIES[id].name} 보충 · 진열 ${state.supplies[id].bar}${SUPPLIES[id].unit}, 창고 ${
            state.supplies[id].stock
          }${SUPPLIES[id].unit}`,
      ),
    state.supplyDelivery ? `들고 있는 ${SUPPLIES[state.supplyDelivery.supply].name} 보충품 정리` : '',
    ...tableIds
      .filter((id) => state.tables[id].dirty || cupCount(state.tables[id].cups))
      .map(
        (id) =>
          `${STATIONS[id].name} · 컵 ${cupCount(state.tables[id].cups)}개${state.tables[id].dirty ? ' · 닦기 필요' : ''}`,
      ),
    state.dirtyBar ? '작업대 닦기' : '',
    state.cleaning
      ? `${STATIONS[state.cleaning.station].name} 청소 중${
          cupCount(state.cleaning.heldCups) ? ` · 들고 있는 컵 ${cupCount(state.cleaning.heldCups)}개` : ''
        }`
      : '',
    ...washItems.flatMap((item) => {
      const stock = washStock(state, item)

      return [
        stock.dirty ? `${WASH_NAMES[item]} 세척 ${stock.dirty}개` : '',
        stock.washed ? `씻은 ${WASH_NAMES[item]} 정리 ${stock.washed}개` : '',
      ]
    }),
    state.trash ? `분리수거 ${state.trash}개` : '',
    expired ? `기한이 지난 배치 ${expired}개` : '',
    washingTask(state.washing),
    state.preparation && state.preparation.stage !== 'processing'
      ? `${PREPARATIONS[state.preparation.recipe].name} 준비 중`
      : '',
    state.coldBrew && state.coldBrew.stage !== 'extracting' ? '콜드 브루 회수·보관' : '',
  ].filter(Boolean)
  const remaining = state.phase === 'closing' ? closingTasks(state) : tasks

  return (
    <GameDialog title="매장 현황" onClose={onClose} wide>
      <fieldset className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-control p-1" aria-label="현황 보기">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            className={clsx(
              'rounded-lg py-2.5 text-sm text-muted',
              'aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-sm',
            )}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </fieldset>
      {tab === 'work' ? (
        <>
          {state.customer && <p className="mb-5 text-sm text-muted">손님 · {CUSTOMER_STATUS[state.customer.stage]}</p>}
          {remaining.length ? (
            <ul className="divide-y divide-line text-sm">
              {remaining.map((task) => (
                <li key={task} className="flex gap-3 py-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted/40" aria-hidden="true" />
                  {task}
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted">남은 정리 없음</p>
          )}
          {state.jobs.length > 0 && (
            <section className="mt-6 border-t border-line pt-4" aria-label="진행 중인 작업">
              <h3 className="mb-3 text-xs text-muted">진행 중</h3>
              {state.jobs.map((job) => (
                <div key={job.id} className="flex justify-between gap-4 py-2 text-sm">
                  <span>{job.label}</span>
                  <span className="tabular-nums text-muted">
                    {job.endsAt - state.time > 3600
                      ? `${Math.ceil((job.endsAt - state.time) / 3600)}시간`
                      : `${Math.max(0, Math.ceil(job.endsAt - state.time))}초`}
                  </span>
                </div>
              ))}
            </section>
          )}
          <details className="mt-5 border-t border-line pt-4 text-sm">
            <summary>비품 수량</summary>
            <dl className="mt-3 space-y-3 text-xs text-muted">
              <div className="flex justify-between">
                <dt>깨끗한 피처</dt>
                <dd>{state.tools.clean}개</dd>
              </div>
            </dl>
            <CupInventory state={state} />
          </details>
        </>
      ) : (
        <>
          <dl className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-muted">판매액</dt>
              <dd className="mt-2 text-2xl font-semibold tabular-nums">{money(state.totals.revenue)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">전달 음료</dt>
              <dd className="mt-2 text-2xl font-semibold tabular-nums">
                {state.totals.served}
                <span className="ml-1 text-sm font-normal text-muted">잔</span>
              </dd>
            </div>
          </dl>
          <ShiftLedger state={state} />
        </>
      )}
    </GameDialog>
  )
}

function washingTask(washing: Washing | null) {
  if (!washing) {
    return ''
  }
  if (washing.stage === 'carrying') {
    return `씻은 ${WASH_NAMES[washing.item]}를 ${STATIONS[washDestination(washing.item)].name}에 정리`
  }
  return `${WASH_NAMES[washing.item]} 세척 중`
}
