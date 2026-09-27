import clsx from 'clsx'
import { DRINK_SIZES } from '../content/drink-sizes'
import { RECIPES, recipeFor } from '../content/recipes'
import { STATIONS } from '../content/stations'
import { SERVICE_NAMES } from '../features/inventory/cups'
import { currentTicket, itemCustomizations } from '../features/service/orders'
import type { Objective } from '../simulation/guidance'
import type { GameState, Job, OrderLine } from '../simulation/state'

/**
 * The quest tracker of a shift: every drink the current customer paid for, how far the active one is,
 * and the one thing to do next.
 */
export default function OrderRail({ state, goal, now }: { state: GameState; goal: Objective; now: boolean }) {
  const ticket = currentTicket(state)
  const others = state.sale?.paidAt != null ? state.sale.lines.filter((line) => line.id !== ticket?.id) : []
  const jobs = state.jobs.filter((job) => job.kind === 'production' && job.cupId && job.cupId === state.cup?.id)

  return (
    <aside
      className={clsx(
        'pointer-events-none absolute top-6 left-6 z-6 w-86',
        'rounded-panel border border-white/60 bg-surface/95 px-5 py-4 shadow-hud',
        'max-tablet:top-4 max-tablet:left-4 max-tablet:w-72',
      )}
      aria-label="주문과 다음 할 일"
    >
      {ticket && <ActiveDrink state={state} line={ticket} compact={now} />}
      {jobs.map((job) => (
        <JobChip key={job.id} job={job} time={state.time} />
      ))}
      {!now && <ObjectiveLine goal={goal} />}
      {!now && others.length > 0 && (
        <ul className="mt-3.5 grid gap-2.5 border-t border-line pt-3.5">
          {others.map((line) => (
            <QueuedDrink key={line.id} line={line} />
          ))}
        </ul>
      )}
    </aside>
  )
}

/**
 * The drink being made. Once the sticker is on the cup the block reads as that sticker, the paper the barista
 * works from. While the work card is up it folds to the name and the step dots.
 */
function ActiveDrink({ state, line, compact }: { state: GameState; line: OrderLine; compact: boolean }) {
  const recipe = RECIPES[line.recipe]
  const extras = itemCustomizations(line)
  const total = recipeFor(line.recipe, line.size, line.service, line.customizations).steps.length
  const cup = state.cup?.orderLineId === line.id ? state.cup : null
  const done = cup ? cup.craft.cursor : 0
  const variant = variantName(line)
  const sticker = !!cup?.craft.sticker

  return (
    <div
      className={clsx(
        'mb-3',
        'data-[sticker=true]:rounded-lg data-[sticker=true]:border data-[sticker=true]:border-line',
        'data-[sticker=true]:bg-white data-[sticker=true]:px-3 data-[sticker=true]:py-2.5',
      )}
      data-sticker={sticker}
    >
      {sticker && (
        <p className="mb-0.5 text-sm text-muted tabular-nums">
          주문 스티커 #{String(state.orderNumber).padStart(3, '0')}
        </p>
      )}
      <h2 className="text-lg leading-snug font-semibold tracking-tight">{recipe.shortName}</h2>
      {!compact && (
        <>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-muted">
            <TemperatureChip line={line} />
            {variant && <span>{variant}</span>}
            <span>
              {DRINK_SIZES[line.size].name} · {SERVICE_NAMES[line.service]}
            </span>
            {line.quantity > 1 && (
              <span className="tabular-nums">
                {line.served + 1}/{line.quantity}잔
              </span>
            )}
          </p>
          {extras.length > 0 && <p className="mt-1 text-sm text-muted">{extras.join(' · ')}</p>}
        </>
      )}
      <ol className="mt-3.5 flex gap-0.75" aria-label={`제조 ${done}/${total}단계`}>
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

/** A machine still running for this drink, such as the steam wand, so the player can work elsewhere meanwhile. */
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

function QueuedDrink({ line }: { line: OrderLine }) {
  const served = line.served === line.quantity

  return (
    <li
      className="flex items-center justify-between gap-3 text-body data-[served=true]:text-muted"
      data-served={served}
    >
      <span className="flex min-w-0 items-center gap-2">
        {served && <CheckIcon />}
        <span className="truncate">{RECIPES[line.recipe].shortName}</span>
        {line.quantity > 1 && <span className="shrink-0 text-muted tabular-nums">×{line.quantity}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-2 text-muted">
        <TemperatureChip line={line} />
        {DRINK_SIZES[line.size].name}
      </span>
    </li>
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

function CheckIcon() {
  return (
    <svg className="size-4 shrink-0 text-success" viewBox="0 0 16 16" fill="none" aria-label="전달 완료">
      <path d="m3 8.5 3.2 3L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Menu variants that are more than a temperature, such as a named version of the drink. */
function variantName(line: OrderLine) {
  const recipe = RECIPES[line.recipe]
  const temperature = recipe.temperature.toUpperCase()

  return recipe.variant === temperature ? null : recipe.variant.replace(`${temperature} · `, '')
}
