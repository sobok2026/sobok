import clsx from 'clsx'
import { DRINK_SIZES } from '../content/drink-sizes'
import { RECIPES, recipeFor } from '../content/recipes'
import { STATIONS } from '../content/stations'
import { SERVICE_NAMES } from '../features/inventory/cups'
import { currentTicket, itemCustomizations } from '../features/service/orders'
import type { Objective } from '../simulation/guidance'
import type { GameState, Job, OrderLine } from '../simulation/state'

export default function OrderRail({
  state,
  goal,
  now,
  openLabel,
}: {
  state: GameState
  goal: Objective
  now: boolean
  openLabel: () => void
}) {
  const ticket = currentTicket(state)
  const waiting = ticket ? state.sale!.lines.reduce((sum, line) => sum + line.quantity - line.served, 0) - 1 : 0
  const jobs = state.jobs.filter((job) => job.kind === 'production' && job.cupId && job.cupId === state.cup?.id)
  if (now && !ticket && !jobs.length) return null

  return (
    <aside
      className={clsx(
        'pointer-events-none absolute top-6 left-6 z-6 w-86',
        'rounded-panel border border-white/60 bg-surface/95 px-5 py-4 shadow-hud',
        'max-tablet:top-4 max-tablet:left-4 max-tablet:w-72',
        'touch:top-3 touch:left-3 touch:w-[min(21.5rem,calc(100%-10rem))] touch:px-3 touch:py-2.5',
      )}
      aria-label="주문과 다음 할 일"
    >
      {ticket && <ActiveDrink state={state} line={ticket} compact={now} openLabel={openLabel} />}
      {jobs.map((job) => (
        <JobChip key={job.id} job={job} time={state.time} />
      ))}
      {!now && <ObjectiveLine goal={goal} />}
      {!now && waiting > 0 && (
        <p className="mt-3.5 border-t border-line pt-3.5 text-sm text-muted tabular-nums">대기 {waiting}잔</p>
      )}
    </aside>
  )
}

function ActiveDrink({
  state,
  line,
  compact,
  openLabel,
}: {
  state: GameState
  line: OrderLine
  compact: boolean
  openLabel: () => void
}) {
  const recipe = RECIPES[line.recipe]
  const extras = itemCustomizations(line)
  const total = recipeFor(line.recipe, line.size, line.service, line.customizations).steps.length
  const cup = state.cup?.orderLineId === line.id ? state.cup : null
  const done = cup ? cup.craft.cursor : 0
  const variant = variantName(line)

  return (
    <div className="mb-3 touch:mb-1.5">
      <div className="flex items-start gap-3 touch:flex-wrap touch:gap-1">
        <h2 className="line-clamp-2 min-w-0 flex-1 text-lg leading-snug font-semibold tracking-tight">
          {recipe.shortName}
        </h2>
        <button
          type="button"
          className={clsx(
            'pointer-events-auto flex shrink-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-muted',
            'touch:min-h-11',
          )}
          aria-haspopup="dialog"
          aria-keyshortcuts="L"
          onClick={openLabel}
        >
          <kbd className="rounded border border-line px-1 text-xs">L</kbd>
          라벨 보기
        </button>
      </div>
      {!compact && (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-muted touch:hidden">
          <TemperatureChip line={line} />
          {variant && <span>{variant}</span>}
          <span>
            {DRINK_SIZES[line.size].name} · {SERVICE_NAMES[line.service]}
          </span>
          {extras.length > 0 && <span>커스텀 {extras.length}개</span>}
        </p>
      )}
      <ol className="mt-3.5 flex gap-0.75 touch:mt-1.5" aria-label={`제조 ${done}/${total}단계`}>
        {Array.from({ length: total }, (_, index) => (
          <li
            key={index}
            className={clsx(
              'h-1.25 flex-1 rounded-full bg-control-line',
              'data-[state=done]:bg-brand data-[state=now]:bg-focus',
            )}
            data-state={stepState(index, done, !!cup)}
          />
        ))}
      </ol>
    </div>
  )
}

function JobChip({ job, time }: { job: Job; time: number }) {
  const ratio = Math.min(1, (time - job.startedAt) / Math.max(1e-9, job.endsAt - job.startedAt))

  return (
    <p className="mb-3 flex items-center gap-2.5 rounded-full bg-focus/15 py-1 pr-3 pl-3.5 text-body" role="status">
      <span className="font-medium">{job.label} 중</span>
      <span className="relative h-1.25 w-14 overflow-hidden rounded-full bg-focus/25" aria-hidden="true">
        <i className="absolute inset-y-0 left-0 bg-focus" style={{ width: `${ratio * 100}%` }} />
      </span>
      <span className="ml-auto text-muted tabular-nums">{Math.max(0, Math.ceil(job.endsAt - time))}초</span>
    </p>
  )
}

function stepState(index: number, done: number, started: boolean) {
  if (index < done) {
    return 'done'
  }
  return index === done && started ? 'now' : 'todo'
}

function ObjectiveLine({ goal }: { goal: Objective }) {
  const place = goal.station && STATIONS[goal.station].name

  if (goal.blocker) {
    return (
      <p className="flex gap-2.5 text-body data-[fault=true]:text-danger" data-fault={!!goal.blocker.fault}>
        <span className="shrink-0 font-semibold">{goal.blocker.fault ? '막힘' : '먼저'}</span>
        <span>
          {goal.blocker.reason} → <b className="font-semibold">{place}</b>
        </span>
      </p>
    )
  }

  return (
    <p className="flex gap-2.5 text-body">
      <span className="shrink-0 text-muted">다음</span>
      {place ? (
        <span>
          <b className="font-semibold">{place}</b>
          {goal.particle} {goal.task}
        </span>
      ) : (
        <span>{goal.task}</span>
      )}
    </p>
  )
}

function TemperatureChip({ line }: { line: OrderLine }) {
  const temperature = RECIPES[line.recipe].temperature

  return (
    <span
      className={clsx(
        'rounded-full px-2 text-sm leading-5.5 font-bold tracking-wide text-white',
        'data-[temperature=hot]:bg-hot data-[temperature=iced]:bg-iced',
      )}
      data-temperature={temperature}
    >
      {temperature.toUpperCase()}
    </span>
  )
}

function variantName(line: OrderLine) {
  const recipe = RECIPES[line.recipe]
  const temperature = recipe.temperature.toUpperCase()

  return recipe.variant === temperature ? null : recipe.variant.replace(`${temperature} · `, '')
}
