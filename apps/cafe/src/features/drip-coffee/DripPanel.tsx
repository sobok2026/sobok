import { formatDecimal } from '@sobok/std/format/number'
import { useState } from 'react'
import { batchDate } from '../../shared/format'
import { Button } from '../../shared/ui/Button'
import {
  HoldAction,
  WorkActions,
  WorkBlocker,
  WorkButton,
  WorkHeader,
  WorkMeter,
  WorkNote,
} from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import type { DripBrew, GameState } from '../../simulation/state'
import BatchWork from '../inventory/BatchWork'
import { available } from '../inventory/inventory'
import { currentTicket } from '../service/orders'
import {
  DRIP,
  DRIP_BEANS,
  type DripBean,
  type DripTemperature,
  dripBeanIds,
  dripBeanIngredient,
  dripDose,
  dripHandsBusy,
  dripMenuTemperature,
  dripRemaining,
} from './rules'

export default function DripPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const ticket = currentTicket(state)
  const [temperature, setTemperature] = useState<DripTemperature>(dripMenuTemperature(ticket?.recipe ?? '') ?? 'hot')
  const [bean, setBean] = useState<DripBean>(ticket?.dripBean ?? state.cow[temperature])
  const brew = state.drip[temperature]

  function select(next: DripTemperature) {
    act({ type: 'drip-stop' })
    setTemperature(next)
    setBean(dripMenuTemperature(ticket?.recipe ?? '') === next ? ticket!.dripBean! : state.cow[next])
  }

  return (
    <div className="grid gap-4">
      <fieldset className="grid grid-cols-2 gap-2" aria-label="URN 선택">
        {(['hot', 'iced'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={temperature === value}
            disabled={dripHandsBusy(state)}
            className="rounded-lg border border-control-line bg-control p-3 aria-pressed:bg-brand aria-pressed:text-on-brand disabled:opacity-60"
            onClick={() => select(value)}
          >
            {value.toUpperCase()} URN
            {state.drip[value]?.stage === 'extracting' && <span className="ml-2 text-sm">추출 중</span>}
          </button>
        ))}
      </fieldset>
      <WorkNote>COW · {DRIP_BEANS[state.cow[temperature]]}</WorkNote>
      {!brew && (
        <>
          <label className="grid gap-2 text-body">
            추출할 원두
            <select
              aria-label="추출할 원두"
              value={bean}
              onChange={(event) => setBean(event.target.value as DripBean)}
              className="min-h-11 rounded-lg border border-control-line bg-control px-3"
            >
              {dripBeanIds.map((id) => (
                <option key={id} value={id}>
                  {DRIP_BEANS[id]}
                </option>
              ))}
            </select>
          </label>
          <WorkNote>접수한 주문에 다른 원두가 표시되면 해당 원두로 추출하세요.</WorkNote>
          <details className="text-body">
            <summary>제조 기준</summary>
            <p className="mt-2">
              원두 {dripDose(temperature)}g · {DRIP.batchSetting} 설정 · 급수 {DRIP.waterMilliliters}ml · 추출 5분
            </p>
            <p>
              {temperature === 'hot'
                ? '추출 완료 후 URN 보온 1시간'
                : `추출 후 얼음 ${DRIP.icedIceGrams}g · 혼합 · 라벨 · 실온 4시간 또는 냉장 8시간`}
            </p>
          </details>
          <Button onClick={() => act({ type: 'drip-prepare', temperature, bean })}>배치 준비</Button>
        </>
      )}
      {brew && <DripWork key={brew.id} state={state} brew={brew} temperature={temperature} act={act} />}
    </div>
  )
}

function DripWork({
  state,
  brew,
  temperature,
  act,
}: {
  state: GameState
  brew: DripBrew
  temperature: DripTemperature
  act: (action: Action) => void
}) {
  const batch = state.batches.find((batch) => batch.id === brew.batchId)
  const seconds = dripRemaining(state, temperature)
  const remaining = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  const measuring = brew.stage === 'beans' || brew.stage === 'ice'
  const amount = brew.stage === 'beans' ? brew.beans : brew.ice
  const tool = brew.stage === 'beans' ? '분쇄 원두 용기' : '얼음 스쿱'
  const shortage = brew.stage === 'beans' && available(state, dripBeanIngredient(brew.bean)) <= 0

  return (
    <>
      <WorkHeader title={`${temperature.toUpperCase()} · ${DRIP_BEANS[brew.bean]}`} />
      {brew.bean !== state.cow[temperature] && (
        <WorkNote>현재 COW와 다른 원두예요. 배치의 원두는 변경되지 않아요.</WorkNote>
      )}
      {brew.fault && <WorkBlocker reason="배치를 다시 준비해주세요" fix={brew.fault} fault />}
      {!brew.fault && brew.stage === 'filter' && (
        <Button onClick={() => act({ type: 'drip-filter', temperature })}>새 필터 넣기</Button>
      )}
      {!brew.fault && measuring && (
        <>
          <WorkHeader
            title={brew.stage === 'beans' ? '분쇄 원두 계량' : '얼음 계량'}
            value={`${formatDecimal(amount)}g`}
          />
          {shortage && (
            <WorkBlocker
              reason="사용할 원두가 없어요"
              fix="백룸 창고에서 원두를 개봉·라벨 처리하고 바 실온 선반에 보충하세요."
            />
          )}
          <WorkActions>
            <Button onClick={() => act({ type: 'drip-tool', temperature })}>
              {tool} {brew.tool ? '놓기' : '집기'}
            </Button>
            {brew.tool && (
              <WorkButton
                shortcut="Space"
                hold
                primary
                disabled={shortage}
                onUse={() => act({ type: 'drip-use', temperature })}
                onStop={() => act({ type: 'drip-stop' })}
              >
                누르고 {brew.stage === 'beans' ? '원두 담기' : '얼음 넣기'}
              </WorkButton>
            )}
            {!brew.tool && amount > 0 && (
              <Button onClick={() => act({ type: 'drip-confirm', temperature })}>계량 확인</Button>
            )}
          </WorkActions>
          <details className="text-body">
            <summary>제조 기준</summary>
            <p className="mt-2">{brew.stage === 'beans' ? dripDose(temperature) : DRIP.icedIceGrams}g</p>
          </details>
        </>
      )}
      {!brew.fault && brew.stage === 'loaded' && (
        <Button onClick={() => act({ type: 'drip-brew', temperature })}>깔때기 장착 · 5분 추출 시작</Button>
      )}
      {!brew.fault && brew.stage === 'extracting' && (
        <>
          <WorkMeter label="URN 추출 진행" ratio={1 - seconds / DRIP.brewSeconds} valueText={`${remaining} 남음`} />
          <WorkNote>{remaining} 남음 · 패널을 닫고 다른 일을 할 수 있어요.</WorkNote>
        </>
      )}
      {!brew.fault && brew.stage === 'mix' && (
        <Button onClick={() => act({ type: 'drip-mix', temperature })}>얼음과 커피 혼합 완료</Button>
      )}
      {brew.stage === 'ready' && batch && temperature === 'iced' && (
        <BatchWork batch={batch} time={state.time} act={act} station="urn" />
      )}
      {brew.stage === 'ready' && batch && temperature === 'hot' && (
        <>
          <WorkHeader
            title={batch.expiresAt! <= state.time ? '보온 기한 만료' : 'HOT 제공 가능'}
            value={`${formatDecimal(batch.amount)}ml`}
          />
          <WorkNote>
            추출 완료 {batchDate(batch.openedAt)} · 보온 기한 {batchDate(batch.expiresAt)}
          </WorkNote>
          {batch.expiresAt! <= state.time && (
            <WorkBlocker reason="새 배치를 추출해주세요" fix="기한이 지난 커피는 제공할 수 없어요." fault />
          )}
          {batch.expiresAt! > state.time && <WorkNote>컵을 들고 돌아오면 URN 추출구에 놓을 수 있어요.</WorkNote>}
        </>
      )}
      {!(brew.stage === 'ready' && temperature === 'iced') && (
        <HoldAction shortcut={false} onConfirm={() => act({ type: 'drip-discard', temperature })}>
          배치 폐기
        </HoldAction>
      )}
    </>
  )
}
