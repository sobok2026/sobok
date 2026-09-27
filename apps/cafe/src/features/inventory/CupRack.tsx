import clsx from 'clsx'
import { Fragment, type ReactNode, useState } from 'react'
import { DRINK_SIZES, type DrinkSize, drinkSizeIds, drinkSizeModelScale } from '../../content/drink-sizes'
import { RECIPES } from '../../content/recipes'
import { josa } from '../../shared/format'
import type { Action } from '../../simulation/actions'
import type { GameState, OrderLine } from '../../simulation/state'
import { currentTicket } from '../service/orders'
import {
  CUP_NAMES,
  type CupAttribute,
  type CupKind,
  type CupStyle,
  cleanCupCount,
  cupKindFor,
  cupKinds,
  cupMismatch,
  cupStyle,
  isReusableCup,
  SERVICE_NAMES,
} from './cups'
import { cupRestockAction } from './help'

type Act = (action: Action) => void
/** A rejected pick: the attributes it got wrong, or none when the right cup has run out. */
type Verdict = { kind: CupKind; wrong: CupAttribute[]; attempt: number }

const GROUPS = [
  { name: '매장', note: '다회용', styles: ['hot-mug', 'iced-glass'] },
  { name: '포장', note: '일회용', styles: ['hot-paper', 'iced-plastic'] },
] as const
const TYPE_NAMES: Record<CupStyle, string> = {
  'hot-mug': '머그',
  'iced-glass': '유리잔',
  'hot-paper': '종이컵',
  'iced-plastic': '일회용 컵',
}
const ATTRIBUTE_NAMES: Record<CupAttribute, string> = { service: '매장·포장', temperature: '온도', size: '사이즈' }
const sizeName = (size: DrinkSize) => (size === 'single' ? '단일' : DRINK_SIZES[size].name)

/**
 * Choosing the cup is the player's call: the sheet shows the ticket and the rack, never the answer, and judges the
 * pick in a bubble over the tile that was pressed. Counts only matter when there is no order, so they show then.
 */
export default function CupRack({ state, act }: { state: GameState; act: Act }) {
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const ticket = currentTicket(state)
  const picking = !!ticket && !state.cup

  const choose = (kind: CupKind) => {
    if (!ticket || !picking) {
      if (!isReusableCup(kind)) {
        act({ type: 'cups', kind })
      }
      return
    }
    const wrong = cupMismatch(kind, cupKindFor(ticket.recipe, ticket.service, ticket.size))
    if (wrong.length || !cleanCupCount(state, kind)) {
      setVerdict({ kind, wrong, attempt: (verdict?.attempt ?? 0) + 1 })
      return
    }
    setVerdict(null)
    act({ type: 'take-cup', kind })
  }

  return (
    <div className="grid gap-4">
      {ticket && picking && <TicketLine line={ticket} wrong={verdict?.wrong ?? []} />}
      <div className="grid grid-cols-[5.5rem_repeat(6,minmax(0,1fr))] items-center gap-1.5">
        <span />
        {drinkSizeIds.map((size) => (
          <span key={size} className="text-center text-sm font-medium text-muted" aria-hidden="true">
            {sizeName(size)}
          </span>
        ))}
        {GROUPS.map((group) => (
          <Fragment key={group.name}>
            <p className="col-span-full mt-2 flex items-baseline gap-2">
              <b className="text-base font-bold">{group.name}</b>
              <span className="text-sm text-muted">{group.note}</span>
            </p>
            {group.styles.map((style) => (
              <Fragment key={style}>
                <p className="grid leading-tight">
                  <span className="text-body font-medium">{TYPE_NAMES[style]}</span>
                  <span
                    className="text-sm font-bold tracking-wide data-[hot=true]:text-hot data-[hot=false]:text-iced"
                    data-hot={style.startsWith('hot')}
                  >
                    {style.startsWith('hot') ? 'HOT' : 'ICED'}
                  </span>
                </p>
                {drinkSizeIds.map((size) => {
                  const kind = `${style}-${size}` as CupKind

                  return (
                    <CupTile
                      key={size}
                      state={state}
                      act={act}
                      kind={kind}
                      picking={picking}
                      verdict={verdict?.kind === kind ? verdict : null}
                      onChoose={choose}
                      onRestocked={() => setVerdict(null)}
                    />
                  )
                })}
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function TicketLine({ line, wrong }: { line: OrderLine; wrong: CupAttribute[] }) {
  const temperature = RECIPES[line.recipe].temperature
  const mark = 'rounded data-[wrong=true]:outline-2 data-[wrong=true]:outline-offset-2 data-[wrong=true]:outline-danger'

  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-xl bg-control px-3.5 py-2.5 text-body">
      <span className="text-sm font-semibold text-muted">주문</span>
      <b className="font-semibold">{RECIPES[line.recipe].shortName}</b>
      <span className={mark} data-wrong={wrong.includes('temperature')}>
        <span
          className={clsx(
            'block rounded-full px-2 text-sm leading-5.5 font-bold tracking-wide text-white',
            'data-[temperature=hot]:bg-hot data-[temperature=iced]:bg-iced',
          )}
          data-temperature={temperature}
        >
          {temperature.toUpperCase()}
        </span>
      </span>
      <span className={mark} data-wrong={wrong.includes('size')}>
        {DRINK_SIZES[line.size].name}
      </span>
      <span className={mark} data-wrong={wrong.includes('service')}>
        {SERVICE_NAMES[line.service]}
      </span>
    </p>
  )
}

/** While picking, a tile shows only the cup and a 0 when it is empty; with no order it shows the count instead. */
function CupTile({
  state,
  act,
  kind,
  picking,
  verdict,
  onChoose,
  onRestocked,
}: {
  state: GameState
  act: Act
  kind: CupKind
  picking: boolean
  verdict: Verdict | null
  onChoose: (kind: CupKind) => void
  onRestocked: () => void
}) {
  if (!cupKinds.includes(kind)) {
    return <span />
  }
  const count = cleanCupCount(state, kind)
  const restockable = !picking && !isReusableCup(kind) && !count && state.disposableCups[kind].reserve > 0
  const tile = clsx(
    'relative grid h-16 w-full items-end rounded-xl bg-control pb-1.5',
    'group-data-[empty=true]/tile:[&_svg]:opacity-30',
  )

  return (
    <div className="group/tile relative" data-empty={!count}>
      {picking || restockable ? (
        <button
          key={verdict?.attempt}
          type="button"
          className={clsx(
            tile,
            'hover:bg-surface hover:ring-2 hover:ring-focus',
            'data-[verdict=empty]:bg-surface data-[verdict=empty]:ring-2 data-[verdict=empty]:ring-focus',
            'data-[verdict=wrong]:animate-nudge data-[verdict=wrong]:bg-surface data-[verdict=wrong]:ring-2',
            'data-[verdict=wrong]:ring-danger data-[restock=true]:bg-surface data-[restock=true]:ring-1',
            'data-[restock=true]:ring-control-line motion-reduce:animate-none',
          )}
          data-verdict={verdictState(verdict)}
          data-restock={restockable}
          aria-label={restockable ? `${CUP_NAMES[kind]} 보충` : CUP_NAMES[kind]}
          onClick={() => onChoose(kind)}
        >
          <TileContent kind={kind} count={count} picking={picking} restockable={restockable} />
        </button>
      ) : (
        <div className={tile} role="img" aria-label={`${CUP_NAMES[kind]} ${count}개`}>
          <TileContent kind={kind} count={count} picking={picking} restockable={false} />
        </div>
      )}
      {verdict && <Bubble state={state} act={act} verdict={verdict} onRestocked={onRestocked} />}
    </div>
  )
}

function TileContent({
  kind,
  count,
  picking,
  restockable,
}: {
  kind: CupKind
  count: number
  picking: boolean
  restockable: boolean
}) {
  if (picking) {
    return (
      <>
        <CupShape kind={kind} />
        {!count && <span className="absolute top-1 right-2 text-sm font-semibold text-danger tabular-nums">0</span>}
      </>
    )
  }

  return (
    <>
      <CupShape kind={kind} small />
      <span
        className={clsx(
          'block text-center text-body leading-tight font-semibold tabular-nums',
          'data-[tone=empty]:text-danger data-[tone=restock]:text-sm data-[tone=restock]:text-brand',
        )}
        data-tone={countTone(count, restockable)}
      >
        {restockable ? '보충' : count}
      </span>
    </>
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
function Bubble({
  state,
  act,
  verdict,
  onRestocked,
}: {
  state: GameState
  act: Act
  verdict: Verdict
  onRestocked: () => void
}) {
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
        <EmptyCup state={state} act={act} kind={kind} onRestocked={onRestocked} />
      )}
    </div>
  )
}

function EmptyCup({
  state,
  act,
  kind,
  onRestocked,
}: {
  state: GameState
  act: Act
  kind: CupKind
  onRestocked: () => void
}) {
  const note = (text: ReactNode) => <span className="text-white/75">{text}</span>

  if (isReusableCup(kind)) {
    return (
      <>
        <b className="font-semibold">비었어요</b>
        {note(cupRestockAction(state, kind))}
      </>
    )
  }
  const reserve = state.disposableCups[kind].reserve

  return (
    <>
      <b className="font-semibold">비었어요</b>
      {note(reserve ? `후방에 ${reserve}개 있어요.` : '후방 재고도 없어요. 창고에서 입고해주세요.')}
      {reserve > 0 && (
        <button
          type="button"
          className="justify-self-start rounded-md bg-surface px-2.5 py-1 font-semibold text-ink"
          onClick={() => {
            act({ type: 'cups', kind })
            onRestocked()
          }}
        >
          보충
        </button>
      )}
    </>
  )
}

/** Drawn to the same volume ratio as the 3D cups, so size reads from the shape as well as the column. */
function CupShape({ kind, small = false }: { kind: CupKind; small?: boolean }) {
  const style = cupStyle(kind)
  const scale = drinkSizeModelScale(kind.slice(kind.lastIndexOf('-') + 1) as DrinkSize)
  const height = 30 * scale
  const top = 20 * scale
  const bottom = top * TAPER[style]
  const center = style === 'hot-mug' ? 18 : 20
  const y = 44 - height
  const body = `${center - top / 2},${y} ${center + top / 2},${y} ${center + bottom / 2},44 ${center - bottom / 2},44`

  return (
    <svg
      className="mx-auto block h-11 w-10 data-[small=true]:h-8 data-[small=true]:w-7"
      data-small={small}
      viewBox="0 0 40 45"
      aria-hidden="true"
    >
      <polygon
        points={body}
        strokeWidth="1.4"
        strokeLinejoin="round"
        className={clsx(
          'data-[style=hot-mug]:fill-surface data-[style=hot-mug]:stroke-hot',
          'data-[style=hot-paper]:fill-surface data-[style=hot-paper]:stroke-hot',
          'data-[style=iced-glass]:fill-iced/20 data-[style=iced-glass]:stroke-iced',
          'data-[style=iced-plastic]:fill-iced/8 data-[style=iced-plastic]:stroke-iced',
        )}
        data-style={style}
      />
      {style === 'hot-mug' && (
        <path
          d={`M${center + top / 2 - 1} ${y + height * 0.25} q${8 * scale} 0 ${8 * scale} ${height * 0.25} t-${8 * scale} ${height * 0.25}`}
          fill="none"
          strokeWidth="1.4"
          className="stroke-hot"
        />
      )}
      {style === 'hot-paper' && (
        <rect
          x={center - top * 0.43}
          y={y + height * 0.36}
          width={top * 0.86}
          height={height * 0.28}
          className="fill-hot/35"
        />
      )}
      {style === 'iced-plastic' && (
        <line
          x1={center - top * 0.36}
          x2={center + top * 0.36}
          y1={y + height * 0.3}
          y2={y + height * 0.3}
          strokeWidth="1"
          className="stroke-iced/60"
        />
      )}
    </svg>
  )
}

const TAPER: Record<CupStyle, number> = { 'hot-mug': 0.94, 'iced-glass': 0.86, 'hot-paper': 0.7, 'iced-plastic': 0.7 }

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
