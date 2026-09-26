import { formatDecimal } from '@sobok/std/format/number'
import { useState } from 'react'
import { money } from '../../shared/format'
import { Button } from '../../shared/ui/Button'
import {
  PanelEmpty,
  PanelNow,
  PanelRow,
  PanelSearch,
  PanelSection,
  PanelTabs,
  RowButton,
} from '../../shared/ui/PanelControls'
import { HoldAction } from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import type { Objective, Subject } from '../../simulation/guidance'
import type { Batch, GameState } from '../../simulation/state'
import { currentTicket } from '../service/orders'
import { batchHome, isSealed, materialHome } from './batches'
import { CUP_NAMES, CUP_SUPPLY, cupKindFor, type DisposableCupKind, disposableCupKinds } from './cups'
import { inventorySummary } from './summary'
import { SUPPLIES, SUPPLY_CAPACITY, SUPPLY_PACK, SUPPLY_PRICE, type SupplyId, supplyIds } from './supplies'

type Place = 'fridge' | 'stock'
type Tab = 'materials' | 'cups' | 'supplies'
type Item = ReturnType<typeof inventorySummary>[number]
type Act = (action: Action) => void
type MaterialTask =
  | { kind: 'discard'; batch: Batch }
  | { kind: 'label'; batch: Batch }
  | { kind: 'open'; batch: Batch; sealed: number }
  | { kind: 'buy' }

const EPSILON = 0.0001
const searchName = (value: string) => value.toLocaleLowerCase('ko-KR').replace(/\s+/g, '')

function initialTab(subject: Subject | undefined): Tab {
  if (subject && 'cup' in subject) {
    return 'cups'
  }
  return subject && 'supply' in subject ? 'supplies' : 'materials'
}

/** The fridge holds only chilled goods; the storeroom also keeps cup and condiment backstock and takes deliveries. */
export default function StoragePanel({
  state,
  act,
  goal,
  place,
}: {
  state: GameState
  act: Act
  goal: Objective
  place: Place
}) {
  const subject = goal.station === place ? (goal.blocker?.subject ?? goal.subject) : undefined
  const [tab, setTab] = useState<Tab>(initialTab(subject))
  const all = inventorySummary(state)
  const focus = promoted(state, all, place, subject)
  const items = all.filter((item) => materialHome(item.id) === place)
  const attention = items.filter((item) => item.shortage > EPSILON || waiting(state, item, place)).length

  return (
    <>
      <StorageNow state={state} act={act} all={all} place={place} subject={subject} />
      {place === 'stock' && (
        <PanelTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'materials', label: '재료', badge: attention },
            {
              id: 'cups',
              label: '컵',
              badge: disposableCupKinds.filter((kind) => !state.disposableCups[kind].reserve).length,
            },
            { id: 'supplies', label: '소모품', badge: supplyIds.filter((id) => state.supplies[id].bar <= 5).length },
          ]}
        />
      )}
      {tab === 'materials' && <Materials state={state} act={act} all={all} items={items} place={place} focus={focus} />}
      {tab === 'cups' && <CupStock state={state} act={act} focus={focus} />}
      {tab === 'supplies' && <SupplyStock state={state} act={act} focus={focus} />}
    </>
  )
}

/** The item the "지금" card is showing; the lists below leave it out so it appears once. */
function promoted(state: GameState, all: Item[], place: Place, subject: Subject | undefined) {
  if (!subject) {
    return undefined
  }
  if ('cup' in subject) {
    return subject.cup
  }
  if ('supply' in subject) {
    return subject.supply
  }
  const item = all.find((entry) => entry.id === subject.ingredient)

  return item && materialTask(state, item, place) ? item.id : undefined
}

function materialTask(state: GameState, item: Item, place: Place): MaterialTask | null {
  const expired = expiredHere(state, item, place)
  if (expired) {
    return { kind: 'discard', batch: expired }
  }
  const unlabelled = item.batches.find((batch) => !isSealed(batch) && !batch.labelled && batch.location === place)
  if (unlabelled) {
    return { kind: 'label', batch: unlabelled }
  }
  const sealed = item.sealed.filter((batch) => batch.location === place)
  if (sealed.length) {
    return { kind: 'open', batch: sealed[0], sealed: sealed.length }
  }
  return place === 'stock' && !item.definition.prepared ? { kind: 'buy' } : null
}

function StorageNow({
  state,
  act,
  all,
  place,
  subject,
}: {
  state: GameState
  act: Act
  all: Item[]
  place: Place
  subject: Subject | undefined
}) {
  if (!subject) {
    return null
  }
  if ('supply' in subject) {
    return <SupplyNow state={state} act={act} supply={subject.supply} />
  }
  if ('cup' in subject) {
    return <CupNow state={state} act={act} kind={subject.cup as DisposableCupKind} />
  }
  const item = all.find((entry) => entry.id === subject.ingredient)

  return item ? <MaterialNow state={state} act={act} item={item} place={place} /> : null
}

function MaterialNow({ state, act, item, place }: { state: GameState; act: Act; item: Item; place: Place }) {
  const name = item.definition.name
  const shortage = item.shortage > EPSILON ? `${formatDecimal(item.shortage)}${item.definition.unit} 부족` : undefined
  const task = materialTask(state, item, place)
  const steps = (done: number) =>
    ['입고', '보관', '개봉', '라벨'].map((label, index) => ({ label, done: index < done }))

  if (!task) {
    return null
  }

  if (task.kind === 'discard') {
    return (
      <PanelNow blocked title={`${name} 기한 만료`} detail="폐기하고 새로 준비하세요.">
        <HoldAction
          shortcut={false}
          onConfirm={() => act({ type: 'discard-batch', id: task.batch.id, station: place })}
        >
          폐기
        </HoldAction>
      </PanelNow>
    )
  }

  if (task.kind === 'label') {
    return (
      <PanelNow title={`${name} 라벨 붙이기`} detail={shortage} steps={steps(3)}>
        <Button onClick={() => act({ type: 'label-batch', id: task.batch.id, station: place })}>라벨 붙이기</Button>
      </PanelNow>
    )
  }

  if (task.kind === 'open') {
    return (
      <PanelNow
        blocked
        title={`${name} 원팩 개봉`}
        detail={`${shortage ?? '필요'} · 미개봉 ${task.sealed}팩`}
        steps={steps(2)}
      >
        <Button onClick={() => act({ type: 'open-batch', id: task.batch.id })}>원팩 개봉</Button>
      </PanelNow>
    )
  }
  const affordable = state.cash >= item.definition.price

  return (
    <PanelNow
      blocked
      title={`${name} 원팩 입고`}
      detail={affordable ? `${shortage ?? '필요'} · 입고한 원팩은 알맞은 곳에 넣어요` : '운영비가 부족해요'}
      steps={steps(0)}
    >
      {affordable && (
        <Button onClick={() => act({ type: 'buy', ingredient: item.id })}>
          원팩 입고 <span>{money(item.definition.price)}</span>
        </Button>
      )}
    </PanelNow>
  )
}

function CupNow({ state, act, kind }: { state: GameState; act: Act; kind: DisposableCupKind }) {
  const affordable = state.cash >= CUP_SUPPLY.price

  return (
    <PanelNow
      blocked
      title={`${CUP_NAMES[kind]} 입고`}
      detail={affordable ? '후방 재고가 없어요' : '운영비가 부족해요'}
    >
      {affordable && (
        <Button onClick={() => act({ type: 'buy-cups', kind })}>
          {CUP_SUPPLY.pack}개 입고 <span>{money(CUP_SUPPLY.price)}</span>
        </Button>
      )}
    </PanelNow>
  )
}

function SupplyNow({ state, act, supply }: { state: GameState; act: Act; supply: SupplyId }) {
  const definition = SUPPLIES[supply]
  const stock = state.supplies[supply]
  const amount = Math.min(SUPPLY_CAPACITY - stock.bar, stock.stock)

  return (
    <PanelNow
      blocked
      title={`${definition.name} 보충`}
      detail={amount ? '컨디먼트 바에 가져가 채워요' : '후방 재고가 없어 입고해야 해요'}
    >
      {amount > 0 && (
        <Button onClick={() => act({ type: 'take-supply', supply })}>
          {definition.name} {amount}
          {definition.unit} 꺼내기
        </Button>
      )}
    </PanelNow>
  )
}

function Materials({
  state,
  act,
  all,
  items,
  place,
  focus,
}: {
  state: GameState
  act: Act
  all: Item[]
  items: Item[]
  place: Place
  focus: string | undefined
}) {
  const [query, setQuery] = useState('')
  const needle = searchName(query)
  const buying = place === 'stock'
  const searchable = buying ? all.filter((item) => !item.definition.prepared) : items
  const matches = searchable.filter((item) => searchName(item.definition.name).includes(needle)).slice(0, 30)
  const ticket = !!currentTicket(state)
  const needed = items.filter((item) => item.needed > EPSILON).sort((a, b) => b.shortage - a.shortage)
  const neededRest = needed.filter((item) => item.id !== focus)
  const waitingItems = items.filter(
    (item) => item.id !== focus && item.needed <= EPSILON && waiting(state, item, place),
  )
  const row = (item: Item, purchase = false) => (
    <MaterialRow key={item.id} state={state} act={act} item={item} place={place} purchase={purchase} />
  )

  return (
    <>
      {needle ? (
        <PanelSection title={`검색 결과 ${matches.length}개`}>
          {matches.length ? matches.map((item) => row(item, buying)) : <PanelEmpty>찾는 재료가 없어요.</PanelEmpty>}
        </PanelSection>
      ) : (
        <>
          {ticket && neededRest.length > 0 && (
            <PanelSection title={focus ? '이 주문에 필요한 다른 재료' : '이 주문에 필요한 재료'}>
              {neededRest.map((item) => row(item))}
            </PanelSection>
          )}
          {ticket && !needed.length && <PanelEmpty>이 주문에 필요한 재료는 여기 없어요.</PanelEmpty>}
          {waitingItems.length > 0 && (
            <PanelSection title="확인할 재료">{waitingItems.map((item) => row(item))}</PanelSection>
          )}
          {!ticket && !focus && !waitingItems.length && <PanelEmpty>지금 확인할 재료가 없어요.</PanelEmpty>}
        </>
      )}
      <PanelSearch label={buying ? '재료 찾아 입고' : '냉장 재료 찾기'} value={query} onChange={setQuery} />
    </>
  )
}

function MaterialRow({
  state,
  act,
  item,
  place,
  purchase,
}: {
  state: GameState
  act: Act
  item: Item
  place: Place
  purchase: boolean
}) {
  const unit = item.definition.unit
  const expired = expiredHere(state, item, place)
  const unlabelled = item.batches.find((batch) => !isSealed(batch) && !batch.labelled && batch.location === place)
  const sealedHere = item.sealed.filter((batch) => batch.location === place)
  const canBuy = !item.definition.prepared && item.sealed.length < 3 && state.cash >= item.definition.price

  return (
    <PanelRow
      title={item.definition.name}
      note={materialNote(item, {
        expired: !!expired,
        unlabelled: !!unlabelled,
        sealedHere: sealedHere.length,
        purchase,
      })}
      alert={!!expired || item.shortage > EPSILON}
      value={`${formatDecimal(item.amount)}${unit}`}
    >
      {expired && (
        <HoldAction shortcut={false} onConfirm={() => act({ type: 'discard-batch', id: expired.id, station: place })}>
          폐기
        </HoldAction>
      )}
      {!expired && unlabelled && (
        <RowButton onClick={() => act({ type: 'label-batch', id: unlabelled.id, station: place })}>라벨</RowButton>
      )}
      {!expired && !unlabelled && sealedHere.length > 0 && item.shortage > EPSILON && (
        <RowButton onClick={() => act({ type: 'open-batch', id: sealedHere[0].id })}>개봉</RowButton>
      )}
      {purchase && canBuy && <RowButton onClick={() => act({ type: 'buy', ingredient: item.id })}>입고</RowButton>}
    </PanelRow>
  )
}

function materialNote(
  item: Item,
  {
    expired,
    unlabelled,
    sealedHere,
    purchase,
  }: { expired: boolean; unlabelled: boolean; sealedHere: number; purchase: boolean },
) {
  if (purchase) {
    return `${money(item.definition.price)} · 미개봉 ${item.sealed.length}팩`
  }
  if (expired) {
    return '기한 만료'
  }
  if (unlabelled) {
    return '라벨 필요'
  }
  if (item.shortage <= EPSILON) {
    return sealedHere ? `충분 · 미개봉 ${sealedHere}팩` : '충분'
  }
  const shortage = `${formatDecimal(item.shortage)}${item.definition.unit} 부족`
  if (item.definition.prepared) {
    return `${shortage} · 준비대에서 만들기`
  }
  return sealedHere ? `${shortage} · 미개봉 ${sealedHere}팩` : `${shortage} · 입고 필요`
}

function CupStock({ state, act, focus }: { state: GameState; act: Act; focus: string | undefined }) {
  const ticket = currentTicket(state)
  const needed = ticket ? cupKindFor(ticket.recipe, ticket.service, ticket.size) : null
  const kinds = disposableCupKinds
    .filter((kind) => kind !== focus)
    .sort(
      (a, b) =>
        Number(b === needed) - Number(a === needed) ||
        state.disposableCups[a].reserve - state.disposableCups[b].reserve,
    )

  return (
    <PanelSection title={`일회용 컵 후방 재고 · 입고 ${CUP_SUPPLY.pack}개 ${money(CUP_SUPPLY.price)}`}>
      {kinds.map((kind) => {
        const stock = state.disposableCups[kind]

        return (
          <PanelRow
            key={kind}
            title={CUP_NAMES[kind]}
            note={`후방 ${stock.reserve}개 · 보관대 ${stock.bar}개`}
            alert={!stock.reserve}
          >
            {stock.reserve < CUP_SUPPLY.reserveLimit && state.cash >= CUP_SUPPLY.price && (
              <RowButton onClick={() => act({ type: 'buy-cups', kind })}>입고</RowButton>
            )}
          </PanelRow>
        )
      })}
    </PanelSection>
  )
}

function SupplyStock({ state, act, focus }: { state: GameState; act: Act; focus: string | undefined }) {
  return (
    <PanelSection title={`컨디먼트 바 소모품 · 입고 ${SUPPLY_PACK}개 ${money(SUPPLY_PRICE)}`}>
      {supplyIds
        .filter((id) => id !== focus)
        .map((id) => {
          const definition = SUPPLIES[id]
          const supply = state.supplies[id]
          const amount = Math.min(SUPPLY_CAPACITY - supply.bar, supply.stock)

          return (
            <PanelRow
              key={id}
              title={definition.name}
              note={`진열 ${supply.bar}/${SUPPLY_CAPACITY} · 후방 ${supply.stock}${definition.unit}`}
              alert={supply.bar <= 5}
            >
              {amount > 0 && !state.supplyDelivery && (
                <RowButton primary={supply.bar <= 5} onClick={() => act({ type: 'take-supply', supply: id })}>
                  꺼내기
                </RowButton>
              )}
              {state.cash >= SUPPLY_PRICE && !state.supplyDelivery && (
                <RowButton onClick={() => act({ type: 'buy-supply', supply: id })}>입고</RowButton>
              )}
            </PanelRow>
          )
        })}
    </PanelSection>
  )
}

function expiredHere(state: GameState, item: Item, place: Place) {
  return item.batches.find(
    (batch) => batch.expiresAt !== null && batch.expiresAt <= state.time && batchHome(batch) === place,
  )
}

function waiting(state: GameState, item: Item, place: Place) {
  return (
    !!expiredHere(state, item, place) ||
    item.batches.some((batch) => !isSealed(batch) && !batch.labelled && batch.location === place)
  )
}
