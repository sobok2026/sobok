import clsx from 'clsx'
import { useState } from 'react'
import { DRINK_SIZES } from '../../content/drink-sizes'
import { RECIPES, recipeCup } from '../../content/recipes'
import { josa } from '../../shared/format'
import { CUP_PROFILES, profileHeight, profileRadius, profileRim } from '../../shared/visuals/cup-profiles'
import type { Action } from '../../simulation/actions'
import type { GameState, OrderLine } from '../../simulation/state'
import { currentTicket } from '../service/orders'
import {
  CUP_NAMES,
  type CupAttribute,
  type CupKind,
  type CupRow,
  cleanCupCount,
  cupBody,
  cupLabel,
  cupMismatch,
  cupStyle,
  cupTemperature,
  isReusableCup,
  rowCupKinds,
  SERVICE_NAMES,
} from './cups'
import { cupRestockAction } from './help'

type Act = (action: Action) => void
/** A rejected pick: the attributes it got wrong, or none when the right cup has run out. */
type Verdict = { kind: CupKind; wrong: CupAttribute[]; attempt: number }

// Columns follow the first call on a ticket, dine-in or takeout; rows follow the second, HOT or ICED.
const SERVICES = [
  { name: '매장', note: '다회용' },
  { name: '포장', note: '일회용' },
] as const
const ROWS = [
  ['hot-mug', 'hot-paper'],
  ['iced-glass', 'iced-plastic'],
  ['dine-in-vessel', 'takeout-vessel'],
] as const satisfies readonly (readonly [CupRow, CupRow])[]
const ROW_NAMES: Record<CupRow, string> = {
  'hot-mug': '머그',
  'iced-glass': '유리잔',
  'dine-in-vessel': '전용 잔',
  'hot-paper': '종이컵',
  'iced-plastic': '일회용 컵',
  'takeout-vessel': '전용 컵',
}
const ATTRIBUTE_NAMES: Record<CupAttribute, string> = {
  service: '매장·포장',
  temperature: '온도',
  size: '사이즈',
  vessel: '잔 종류',
}

/**
 * Choosing the cup is the player's call: the sheet shows the ticket and the rack, never the answer, and judges the
 * pick in a bubble over the cup that was pressed. Counts only matter when there is no order, so they show then.
 */
export default function CupRack({ state, act }: { state: GameState; act: Act }) {
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const ticket = currentTicket(state)
  const picking = !!ticket && !state.cup

  const choose = (kind: CupKind) => {
    if (!ticket || !picking) {
      if (!isReusableCup(kind)) {
        setVerdict({ kind, wrong: [], attempt: (verdict?.attempt ?? 0) + 1 })
      }
      return
    }
    const wrong = cupMismatch(kind, recipeCup(ticket.recipe, ticket.size, ticket.service))
    if (wrong.length || !cleanCupCount(state, kind)) {
      setVerdict({ kind, wrong, attempt: (verdict?.attempt ?? 0) + 1 })
      return
    }
    setVerdict(null)
    act({ type: 'take-cup', kind })
  }

  return (
    <div className="grid gap-5">
      {ticket && picking && <TicketLine line={ticket} wrong={verdict?.wrong ?? []} />}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        {SERVICES.map((service) => (
          <p key={service.name} className="flex items-baseline gap-1.5 px-3">
            <b className="text-base font-bold">{service.name}</b>
            <span className="text-sm text-muted">{service.note}</span>
          </p>
        ))}
        {ROWS.flat().map((row) => (
          <section
            key={row}
            className="grid content-start gap-2 rounded-2xl bg-control p-2"
            aria-label={ROW_NAMES[row]}
          >
            <RowTitle row={row} />
            <div className="grid grid-cols-4 gap-1.5">
              {rowCupKinds(row).map((kind) => (
                <CupTile
                  key={kind}
                  state={state}
                  kind={kind}
                  picking={picking}
                  verdict={verdict?.kind === kind ? verdict : null}
                  onChoose={choose}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

/** Standard lines carry their temperature in the title; a drink's own vessels are told apart by name. */
function RowTitle({ row }: { row: CupRow }) {
  const first = rowCupKinds(row)[0]

  return (
    <h3 className="flex items-baseline gap-1.5 px-1 pt-0.5 text-body font-medium">
      {ROW_NAMES[row]}
      {cupStyle(first) && (
        <span
          className="text-sm font-bold tracking-wide data-[temperature=hot]:text-hot data-[temperature=iced]:text-iced"
          data-temperature={cupTemperature(first)}
        >
          {cupTemperature(first).toUpperCase()}
        </span>
      )}
    </h3>
  )
}

/** One chip per call the cup is judged on, in the order rail's order, so a wrong pick outlines just what it missed. */
function TicketLine({ line, wrong }: { line: OrderLine; wrong: CupAttribute[] }) {
  const temperature = RECIPES[line.recipe].temperature
  const chip = clsx(
    'rounded-full px-2.5 text-sm leading-6.5',
    'data-[wrong=true]:outline-2 data-[wrong=true]:outline-offset-1 data-[wrong=true]:outline-danger',
  )

  return (
    <div
      className={clsx(
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-2',
        'rounded-2xl border border-line px-4 py-3',
      )}
    >
      <p className="flex min-w-0 items-baseline gap-2.5">
        <span className="shrink-0 text-sm text-muted">주문</span>
        <b className="text-lg leading-snug font-semibold tracking-tight">{RECIPES[line.recipe].shortName}</b>
      </p>
      <p className="flex shrink-0 items-center gap-2">
        <span
          className={clsx(
            chip,
            'font-bold tracking-wide text-white',
            'data-[temperature=hot]:bg-hot data-[temperature=iced]:bg-iced',
          )}
          data-temperature={temperature}
          data-wrong={wrong.includes('temperature')}
        >
          {temperature.toUpperCase()}
        </span>
        <span
          className={clsx(chip, 'bg-control font-semibold')}
          data-wrong={wrong.includes('size') || wrong.includes('vessel')}
        >
          {DRINK_SIZES[line.size].name}
        </span>
        <span className={clsx(chip, 'bg-control font-semibold')} data-wrong={wrong.includes('service')}>
          {SERVICE_NAMES[line.service]}
        </span>
      </p>
    </div>
  )
}

/**
 * Every cup shows its silhouette and name, with the count on a line below: always without an order, only an empty
 * 0 while picking. Only a tile that can be pressed looks like one, so the rack at rest is flat but for `보충`.
 */
function CupTile({
  state,
  kind,
  picking,
  verdict,
  onChoose,
}: {
  state: GameState
  kind: CupKind
  picking: boolean
  verdict: Verdict | null
  onChoose: (kind: CupKind) => void
}) {
  const count = cleanCupCount(state, kind)
  const restockable = !picking && !isReusableCup(kind) && !count && state.disposableCups[kind].reserve > 0
  const tile = clsx(
    'grid size-full content-start justify-items-center rounded-lg px-0.5 py-2',
    'group-data-[empty=true]/tile:[&_svg]:opacity-30',
  )
  const content = (
    <>
      <CupIcon kind={kind} />
      <span className="mt-1 text-sm leading-5 font-medium whitespace-nowrap">{cupLabel(kind)}</span>
      {(!picking || !count) && (
        <span
          className={clsx(
            'text-sm leading-5 text-muted tabular-nums',
            'data-[tone=empty]:font-semibold data-[tone=empty]:text-danger',
            'data-[tone=restock]:font-semibold data-[tone=restock]:text-brand',
          )}
          data-tone={countTone(count, restockable)}
        >
          {restockable ? '보충 안내' : `${count}개`}
        </span>
      )}
    </>
  )

  return (
    <div className="group/tile relative" data-empty={!count}>
      {picking || restockable ? (
        <button
          key={verdict?.attempt}
          type="button"
          className={clsx(
            tile,
            'bg-surface',
            'hover:ring-2 hover:ring-focus',
            'data-[verdict=empty]:ring-2 data-[verdict=empty]:ring-focus',
            'data-[verdict=wrong]:animate-nudge data-[verdict=wrong]:ring-2 data-[verdict=wrong]:ring-danger',
            'data-[restock=true]:ring-1 data-[restock=true]:ring-brand/40',
            'motion-reduce:animate-none',
          )}
          data-verdict={verdictState(verdict)}
          data-restock={restockable}
          aria-label={restockable ? `${CUP_NAMES[kind]} 보충 안내` : CUP_NAMES[kind]}
          onClick={() => onChoose(kind)}
        >
          {content}
        </button>
      ) : (
        <div className={tile} role="img" aria-label={`${CUP_NAMES[kind]} ${count}개`}>
          {content}
        </div>
      )}
      {verdict && <Bubble state={state} verdict={verdict} />}
    </div>
  )
}

/** A wrong pick shakes red; the right cup that has run out only stays selected while the bubble says how to refill it. */
function verdictState(verdict: Verdict | null) {
  if (!verdict) {
    return undefined
  }
  return verdict.wrong.length ? 'wrong' : 'empty'
}

function countTone(count: number, restockable: boolean) {
  if (restockable) {
    return 'restock'
  }
  return count ? 'stock' : 'empty'
}

/** The verdict sits over the tile that was pressed, so the eye moves only between the tile and the ticket. */
function Bubble({ state, verdict }: { state: GameState; verdict: Verdict }) {
  const { kind, wrong } = verdict

  return (
    <div
      className={clsx(
        'absolute bottom-full left-1/2 z-10 mb-2.5 grid w-max max-w-52 -translate-x-1/2 gap-1.5',
        'rounded-lg bg-ink px-3 py-2 text-sm leading-snug text-white shadow-toast',
        'after:absolute after:top-full after:left-1/2 after:-translate-x-1/2',
        "after:border-6 after:border-transparent after:border-t-ink after:content-['']",
      )}
      role="status"
    >
      {wrong.length > 0 ? (
        <b className="font-semibold">{mismatchTitle(wrong)}</b>
      ) : (
        <EmptyCup state={state} kind={kind} />
      )}
    </div>
  )
}

function EmptyCup({ state, kind }: { state: GameState; kind: CupKind }) {
  return (
    <>
      <b className="font-semibold">비었어요</b>
      <span className="text-white/75">{cupRestockAction(state, kind)}</span>
    </>
  )
}

// Rack icons draw the shared cup outline at 100px per scene unit, standing on the bottom of the view box.
const ICON_SCALE = 100
const ICON_BASE = 49

/**
 * The same outline as the 3D cup, so size and shape read from the silhouette. The outline colour is the temperature;
 * the fill and details are the material.
 */
function CupIcon({ kind }: { kind: CupKind }) {
  const profile = CUP_PROFILES[kind]
  const body = cupBody(kind)
  const temperature = cupTemperature(kind)
  const center = body === 'ceramic' ? 19 : 22
  const x = (radius: number, side: number) => center + side * radius * ICON_SCALE
  const y = (height: number) => ICON_BASE - height * ICON_SCALE
  const point = (height: number, side: number) => `${x(profileRadius(profile, height), side)},${y(height)}`
  const edge = (side: number) => profile.outline.map(([radius, height]) => `${x(radius, side)},${y(height)}`)
  const base = profile.outline[0][1]
  const height = profileHeight(profile)
  const at = (share: number) => base + (height - base) * share
  const stroke = 'data-[temperature=hot]:stroke-hot data-[temperature=iced]:stroke-iced'
  const fill = clsx(
    'data-[body=ceramic]:fill-surface data-[body=glass]:fill-iced/20 data-[body=paper]:fill-surface',
    'data-[body=plastic]:fill-iced/8',
  )
  const handle = (height - base) * ICON_SCALE

  return (
    <svg className="block h-11 w-10" viewBox="0 0 44 50" aria-hidden="true">
      {profile.saucer && (
        <rect
          x={x(profile.saucer, -1)}
          y={y(base) + 0.5}
          width={profile.saucer * 2 * ICON_SCALE}
          height={ICON_BASE - y(base) - 0.5}
          rx="1"
          strokeWidth="1.2"
          className={clsx(fill, stroke)}
          data-body={body}
          data-temperature={temperature}
        />
      )}
      <polygon
        points={[...edge(1), ...edge(-1).reverse()].join(' ')}
        strokeWidth="1.4"
        strokeLinejoin="round"
        className={clsx(fill, stroke)}
        data-body={body}
        data-temperature={temperature}
      />
      {profile.innerWall && (
        <polyline
          points={[
            `${x(profileRim(profile) - 0.012, -1)},${y(height - 0.006)}`,
            `${x(profileRadius(profile, profile.floor) - 0.014, -1)},${y(profile.floor)}`,
            `${x(profileRadius(profile, profile.floor) - 0.014, 1)},${y(profile.floor)}`,
            `${x(profileRim(profile) - 0.012, 1)},${y(height - 0.006)}`,
          ].join(' ')}
          fill="none"
          strokeWidth="1"
          className={clsx('opacity-60', stroke)}
          data-temperature={temperature}
        />
      )}
      {body === 'ceramic' && (
        <path
          d={`M${x(profileRadius(profile, at(0.75)), 1) - 1} ${y(at(0.75))} q${handle * 0.27} 0 ${handle * 0.27} ${handle * 0.25} t-${handle * 0.27} ${handle * 0.25}`}
          fill="none"
          strokeWidth="1.4"
          className={stroke}
          data-temperature={temperature}
        />
      )}
      {body === 'paper' && (
        <polygon
          points={[point(at(0.64), -1), point(at(0.64), 1), point(at(0.36), 1), point(at(0.36), -1)].join(' ')}
          className="fill-hot/35"
        />
      )}
      {body === 'plastic' && (
        <line
          x1={x(profileRadius(profile, at(0.7)) * 0.72, -1)}
          x2={x(profileRadius(profile, at(0.7)) * 0.72, 1)}
          y1={y(at(0.7))}
          y2={y(at(0.7))}
          strokeWidth="1"
          className="stroke-iced/60"
        />
      )}
    </svg>
  )
}

function mismatchTitle(attributes: CupAttribute[]) {
  const names = attributes.map((attribute) => ATTRIBUTE_NAMES[attribute])
  if (names.length > 2) {
    return `${names.join(', ')}가 모두 달라요`
  }
  if (names.length === 2) {
    return `${josa(names[0], '과', '와')} ${josa(names[1], '이', '가')} 달라요`
  }
  return `${josa(names[0], '이', '가')} 달라요`
}
