import clsx from 'clsx'
import { useState } from 'react'
import { STATIONS } from '../../content/stations'
import { money } from '../../shared/format'
import GameDialog from '../../shared/ui/GameDialog'
import { PanelTabs } from '../../shared/ui/PanelControls'
import { objective } from '../../simulation/guidance'
import type { GameState } from '../../simulation/state'
import { SUPPLIES, supplyIds } from '../inventory/supplies'
import { CUSTOMER_STATUS } from '../service/customer'
import { type ShiftTask, shiftTasks } from './rules'
import ShiftLedger from './ShiftLedger'

type Tab = 'work' | 'ledger'

/** The whole shop at a glance: the current objective first, then every remaining job by place. */
export default function ShiftOverview({ state, onClose }: { state: GameState; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('work')

  return (
    <GameDialog title={`${state.day}일차 매장 현황`} onClose={onClose} wide>
      <PanelTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'work', label: '할 일' },
          { id: 'ledger', label: '운영 기록' },
        ]}
      />
      {tab === 'work' ? <Tasks state={state} /> : <Ledger state={state} />}
    </GameDialog>
  )
}

function Tasks({ state }: { state: GameState }) {
  const goal = objective(state)
  const now: ShiftTask = {
    place: goal.station ? STATIONS[goal.station].name : '들고 있는 원팩',
    task: goal.blocker ? `${goal.blocker.reason} · ${goal.blocker.fix}` : goal.task,
  }
  const low = supplyIds.filter((id) => state.supplies[id].bar <= 5)
  const tasks = [
    ...shiftTasks(state),
    ...(state.phase === 'open' && low.length
      ? [{ place: STATIONS.condiment.name, task: `${low.map((id) => SUPPLIES[id].name).join(' · ')} 보충` }]
      : []),
  ]

  return (
    <>
      <TaskRow task={now} current />
      {tasks.map((task) => (
        <TaskRow key={`${task.place}:${task.task}`} task={task} />
      ))}
      {!tasks.length && <p className="py-4 text-body text-muted">남은 정리가 없어요.</p>}
      {state.customer && <p className="mt-4 text-body text-muted">손님 · {CUSTOMER_STATUS[state.customer.stage]}</p>}
    </>
  )
}

function TaskRow({ task, current = false }: { task: ShiftTask; current?: boolean }) {
  return (
    <div
      className={clsx(
        'grid grid-cols-[8rem_1fr_auto] items-baseline gap-3 border-b border-line py-3 text-base',
        'data-[current=true]:-mx-3 data-[current=true]:rounded-xl data-[current=true]:border-0',
        'data-[current=true]:bg-brand/8 data-[current=true]:px-3',
      )}
      data-current={current}
    >
      <span className="font-semibold">
        {current && <span className="mr-1.5 text-sm text-brand">지금</span>}
        {task.place}
      </span>
      <span>{task.task}</span>
      <span className="text-body text-muted tabular-nums">{task.count}</span>
    </div>
  )
}

function Ledger({ state }: { state: GameState }) {
  return (
    <>
      <dl className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-muted">판매액</dt>
          <dd className="mt-2 text-2xl font-semibold tabular-nums">{money(state.totals.revenue)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">전달 음료</dt>
          <dd className="mt-2 text-2xl font-semibold tabular-nums">
            {state.totals.served}
            <span className="ml-1 text-body font-normal text-muted">잔</span>
          </dd>
        </div>
      </dl>
      <ShiftLedger state={state} />
    </>
  )
}
