import { formatDecimal } from '@sobok/std/format/number'
import { useState } from 'react'
import { josa, money } from '../../shared/format'
import { Button } from '../../shared/ui/Button'
import {
  PanelEmpty,
  PanelNow,
  PanelRow,
  PanelSearch,
  PanelSection,
  PanelTabs,
  RowButton,
  StatusChip,
} from '../../shared/ui/PanelControls'
import { HoldAction } from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import type { Objective, Subject } from '../../simulation/guidance'
import type { Batch, GameState } from '../../simulation/state'
import { currentTicket } from '../service/orders'
import { batchHome, isSealed, materialHome } from './batches'
import { CUP_NAMES, CUP_SUPPLY, cupKindFor, disposableCupKinds } from './cups'
import LabelWriter from './LabelWriter'
import { labelText } from './labels'
import { inventorySummary } from './summary'
import { SUPPLIES, SUPPLY_CAPACITY, SUPPLY_PRICE, type SupplyId, supplyIds } from './supplies'

type Place = 'fridge' | 'stock'
type Tab = 'materials' | 'cups' | 'supplies'
type Item = ReturnType<typeof inventorySummary>[number]
type Act = (action: Action) => void
type MaterialTask =
  | { kind: 'discard'; batch: Batch }
  | { kind: 'label'; batch: Batch }
  | { kind: 'open'; batch: Batch }
  | { kind: 'buy' }

const EPSILON = 0.0001
const searchName = (value: string) => value.toLocaleLowerCase('ko-KR').replace(/\s+/g, '')

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
  const [tab, setTab] = useState<Tab>(subject && 'supply' in subject ? 'supplies' : 'materials')
  const [labelling, setLabelling] = useState<string | null>(null)
  const all = inventorySummary(state)
  const writing = state.batches.find((batch) => batch.id === labelling && !batch.labelled && batch.amount > 0)
  const focus = writing?.ingredient ?? promoted(state, all, place, subject)
  const items = all.filter((item) => materialHome(item.id) === place)
  const attention = items.filter((item) => item.shortage > EPSILON || waiting(state, item, place)).length

  return (
    <>
      {writing ? (
        <LabelNow batch={writing} act={act} place={place} />
      ) : (
        <StorageNow state={state} act={act} all={all} place={place} subject={subject} />
      )}
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
      {tab === 'materials' && (
        <Materials state={state} act={act} all={all} items={items} place={place} focus={focus} onLabel={setLabelling} />
      )}
      {tab === 'cups' && <CupStock state={state} act={act} />}
      {tab === 'supplies' && (
        <SupplyStock state={state} act={act} focus={subject && 'supply' in subject ? subject.supply : undefined} />
      )}
    </>
  )
}

/** The item the "지금" card is showing; the lists below leave it out so it appears once. */
function promoted(state: GameState, all: Item[], place: Place, subject: Subject | undefined) {
  if (!subject || !('ingredient' in subject)) {
    return undefined
  }
  const item = all.find((entry) => entry.id === subject.ingredient)

  return item && materialTask(state, item, place) ? item.id : undefined
}

function materialTask(state: GameState, item: Item, place: Place): MaterialTask | null {
  const expired = expiredHere(state, item, place)
  if (expired) {
    return { kind: 'discard', batch: expired }
  }
  const unlabelled = unlabelledHere(item, place)
  if (unlabelled) {
    return { kind: 'label', batch: unlabelled }
  }
  const sealed = item.sealed.find((batch) => batch.location === place)
  if (sealed) {
    return { kind: 'open', batch: sealed }
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
  const item = all.find((entry) => entry.id === subject.ingredient)

  return item ? <MaterialNow state={state} act={act} item={item} place={place} /> : null
}

function MaterialNow({ state, act, item, place }: { state: GameState; act: Act; item: Item; place: Place }) {
  const name = item.definition.name
  const task = materialTask(state, item, place)

  if (!task) {
    return null
  }

  if (task.kind === 'discard') {
    return (
      <PanelNow blocked title={`${name} 기한이 지났어요`}>
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
    return <LabelNow batch={task.batch} act={act} place={place} />
  }

  if (task.kind === 'open') {
    return (
      <PanelNow
        blocked
        title={item.shortage > EPSILON ? `${josa(name, '이', '가')} 부족해요` : `${name} 원팩을 열어야 해요`}
      >
        <Button onClick={() => act({ type: 'open-batch', id: task.batch.id })}>원팩 개봉</Button>
      </PanelNow>
    )
  }
  const affordable = state.cash >= item.definition.price

  return (
    <PanelNow blocked title={`${name} 원팩이 없어요`} detail={affordable ? undefined : '운영비가 부족해요.'}>
      {affordable && (
        <Button onClick={() => act({ type: 'buy', ingredient: item.id })}>
          원팩 입고 <span>{money(item.definition.price)}</span>
        </Button>
      )}
    </PanelNow>
  )
}

function LabelNow({ batch, act, place }: { batch: Batch; act: Act; place: Place }) {
  return (
    <PanelNow title="라벨을 써야 쓸 수 있어요">
      <LabelWriter
        key={batch.id}
        batch={batch}
        onAttach={(until) => act({ type: 'label-batch', id: batch.id, station: place, until })}
      />
    </PanelNow>
  )
}

function SupplyNow({ state, act, supply }: { state: GameState; act: Act; supply: SupplyId }) {
  const definition = SUPPLIES[supply]
  const stock = state.supplies[supply]
  const amount = Math.min(SUPPLY_CAPACITY - stock.bar, stock.stock)

  if (amount > 0) {
    return (
      <PanelNow blocked title={`컨디먼트 바에 ${josa(definition.name, '이', '가')} 없어요`}>
        <Button onClick={() => act({ type: 'take-supply', supply })}>
          {definition.name} {amount}
          {definition.unit} 집기
        </Button>
      </PanelNow>
    )
  }

  return (
    <PanelNow
      blocked
      title={`${definition.name} 후방 재고가 없어요`}
      detail={state.cash < SUPPLY_PRICE ? '운영비가 부족해요.' : undefined}
    >
      {state.cash >= SUPPLY_PRICE && (
        <Button onClick={() => act({ type: 'buy-supply', supply })}>
          입고 <span>{money(SUPPLY_PRICE)}</span>
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
  onLabel,
}: {
  state: GameState
  act: Act
  all: Item[]
  items: Item[]
  place: Place
  focus: string | undefined
  onLabel: (batchId: string) => void
}) {
  const [query, setQuery] = useState('')
  const needle = searchName(query)
  const buying = place === 'stock'
  const searchable = buying ? all.filter((item) => !item.definition.prepared) : items
  const matches = searchable
    .filter((item) => item.id !== focus && searchName(item.definition.name).includes(needle))
    .slice(0, 30)
  const ticket = !!currentTicket(state)
  const needed = items.filter((item) => item.needed > EPSILON).sort((a, b) => b.shortage - a.shortage)
  const neededRest = needed.filter((item) => item.id !== focus)
  const waitingItems = items.filter(
    (item) => item.id !== focus && item.needed <= EPSILON && waiting(state, item, place),
  )
  const row = (item: Item, purchase = false) => (
    <MaterialRow
      key={item.id}
      state={state}
      act={act}
      item={item}
      place={place}
      purchase={purchase}
      onLabel={onLabel}
    />
  )

  return (
    <>
      <PanelSearch label={buying ? '재료 찾아 입고' : '냉장 재료 찾기'} value={query} onChange={setQuery} />
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
    </>
  )
}

/** Each row carries one state and at most one action, so the list reads as a to-do list rather than a ledger. */
function MaterialRow({
  state,
  act,
  item,
  place,
  purchase,
  onLabel,
}: {
  state: GameState
  act: Act
  item: Item
  place: Place
  purchase: boolean
  onLabel: (batchId: string) => void
}) {
  const expired = expiredHere(state, item, place)
  const unlabelled = unlabelledHere(item, place)
  const sealedHere = item.sealed.filter((batch) => batch.location === place)
  const short = item.shortage > EPSILON
  const canBuy = !item.definition.prepared && item.sealed.length < 3 && state.cash >= item.definition.price

  return (
    <PanelRow
      title={item.definition.name}
      note={`${formatDecimal(item.amount)}${item.definition.unit}`}
      status={<MaterialStatus state={state} item={item} place={place} purchase={purchase} />}
    >
      {expired && (
        <HoldAction shortcut={false} onConfirm={() => act({ type: 'discard-batch', id: expired.id, station: place })}>
          폐기
        </HoldAction>
      )}
      {!expired && unlabelled && <RowButton onClick={() => onLabel(unlabelled.id)}>라벨 쓰기</RowButton>}
      {!expired && !unlabelled && sealedHere.length > 0 && short && !purchase && (
        <RowButton onClick={() => act({ type: 'open-batch', id: sealedHere[0].id })}>개봉</RowButton>
      )}
      {purchase && canBuy && (
        <RowButton onClick={() => act({ type: 'buy', ingredient: item.id })}>
          입고 {money(item.definition.price)}
        </RowButton>
      )}
    </PanelRow>
  )
}

function MaterialStatus({
  state,
  item,
  place,
  purchase,
}: {
  state: GameState
  item: Item
  place: Place
  purchase: boolean
}) {
  if (expiredHere(state, item, place)) {
    return <StatusChip tone="alert">기한 지남</StatusChip>
  }
  if (unlabelledHere(item, place)) {
    return <StatusChip tone="alert">라벨 전</StatusChip>
  }
  if (!purchase && item.shortage > EPSILON) {
    return <StatusChip tone="alert">부족</StatusChip>
  }
  const inUse = item.batches
    .filter((batch) => batch.location === 'bar' && batch.labelled && (batch.expiresAt ?? Infinity) > state.time)
    .sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity))[0]
  if (!purchase && inUse?.expiresAt) {
    return <StatusChip tone="label">{labelText(inUse)}</StatusChip>
  }
  const sealed = purchase ? item.sealed.length : item.sealed.filter((batch) => batch.location === place).length

  return sealed ? <StatusChip>미개봉 {sealed}</StatusChip> : null
}

function CupStock({ state, act }: { state: GameState; act: Act }) {
  const ticket = currentTicket(state)
  const needed = ticket ? cupKindFor(ticket.recipe, ticket.service, ticket.size) : null
  const kinds = [...disposableCupKinds].sort(
    (a, b) =>
      Number(b === needed) - Number(a === needed) || state.disposableCups[a].reserve - state.disposableCups[b].reserve,
  )

  return (
    <PanelSection title="일회용 컵 후방 재고">
      {kinds.map((kind) => {
        const stock = state.disposableCups[kind]

        return (
          <PanelRow
            key={kind}
            title={CUP_NAMES[kind]}
            note={`진열 ${stock.bar}개 · 후방 ${stock.reserve}개`}
            alert={!stock.reserve}
          >
            {stock.reserve < CUP_SUPPLY.reserveLimit && state.cash >= CUP_SUPPLY.price && (
              <RowButton onClick={() => act({ type: 'buy-cups', kind })}>
                {CUP_SUPPLY.pack}개 입고 {money(CUP_SUPPLY.price)}
              </RowButton>
            )}
          </PanelRow>
        )
      })}
    </PanelSection>
  )
}

function SupplyStock({ state, act, focus }: { state: GameState; act: Act; focus: string | undefined }) {
  return (
    <PanelSection title="컨디먼트 바 소모품">
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
                  집기
                </RowButton>
              )}
              {state.cash >= SUPPLY_PRICE && !state.supplyDelivery && (
                <RowButton onClick={() => act({ type: 'buy-supply', supply: id })}>
                  입고 {money(SUPPLY_PRICE)}
                </RowButton>
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

function unlabelledHere(item: Item, place: Place) {
  return item.batches.find((batch) => !isSealed(batch) && !batch.labelled && batch.location === place)
}

function waiting(state: GameState, item: Item, place: Place) {
  return !!expiredHere(state, item, place) || !!unlabelledHere(item, place)
}
