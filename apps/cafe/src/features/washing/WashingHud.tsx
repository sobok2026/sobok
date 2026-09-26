import { STATIONS, type StationId } from '../../content/stations'
import {
  HoldAction,
  WorkActions,
  WorkBlocker,
  WorkButton,
  WorkHeader,
  WorkHud,
  WorkLink,
  WorkLinks,
  WorkMeter,
} from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import { craftingHandsBusy } from '../../simulation/hands'
import type { GameState, Washing } from '../../simulation/state'
import { cupCount } from '../inventory/cups'
import { WASH_NAMES, WASH_STEPS, washDestination } from './rules'

const handsBusy = { reason: '손이 비어 있지 않아요', fix: '컵과 제조 도구를 먼저 내려놓으세요.' }

export default function WashingHud({
  state,
  target,
  act,
  stop,
}: {
  state: GameState
  target: StationId | null
  act: (action: Action) => void
  stop: () => void
}) {
  const washing = state.washing
  if (
    !washing ||
    cupCount(state.cleaning?.heldCups) ||
    (target !== 'wash' && !(target === washDestination(washing.item) && washing.stage === 'carrying'))
  ) {
    return null
  }

  return (
    <WorkHud aria-label="용기 세척·정리">
      <WashingWork state={state} washing={washing} target={target} act={act} stop={stop} />
    </WorkHud>
  )
}

function WashingWork({
  state,
  washing,
  target,
  act,
  stop,
}: {
  state: GameState
  washing: Washing
  target: StationId | null
  act: (action: Action) => void
  stop: () => void
}) {
  const destination = washDestination(washing.item)
  const name = WASH_NAMES[washing.item]
  const occupied = craftingHandsBusy(state)

  if (washing.stage === 'carrying') {
    const arrived = target === destination

    return (
      <>
        <WorkHeader title={arrived ? `씻은 ${name} 정리` : `다음 · ${STATIONS[destination].name}`} />
        <WorkActions>
          <WorkButton
            shortcut="E"
            primary={arrived}
            onUse={() => act(arrived ? { type: 'store-washed', station: destination } : { type: 'leave-wash' })}
          >
            {arrived ? '제자리에 놓기' : '세척대에 다시 놓기'}
          </WorkButton>
        </WorkActions>
      </>
    )
  }

  if (washing.stage === 'ready') {
    return (
      <>
        <WorkHeader title="세척 완료" />
        {occupied ? (
          <WorkBlocker {...handsBusy} />
        ) : (
          <WorkActions>
            <WorkButton shortcut="E" primary onUse={() => act({ type: 'take-washed', item: washing.item })}>
              {name} 집기
            </WorkButton>
          </WorkActions>
        )}
        <WorkLinks>
          <WorkLink onUse={() => act({ type: 'leave-wash' })}>세척대에 두기</WorkLink>
        </WorkLinks>
      </>
    )
  }

  const step = WASH_STEPS[washing.stage]
  const ratio = washing.progress / step.seconds
  const ready = ratio >= 1
  const value = `${Math.floor(Math.min(1, ratio) * 100)}%`
  const title = `${name} ${step.label}`

  return (
    <>
      <WorkHeader title={title} value={value} />
      {occupied ? <WorkBlocker {...handsBusy} /> : <WorkMeter label={title} ratio={ratio} valueText={value} />}
      {!occupied && (
        <WorkActions>
          {washing.stage === 'scrub' && (
            <WorkButton shortcut="G" primary={!washing.spongeHeld || ready} onUse={() => act({ type: 'wash-tool' })}>
              {washing.spongeHeld ? '스펀지 놓기' : '스펀지 집기'}
            </WorkButton>
          )}
          {(washing.stage === 'rinse' || washing.spongeHeld) && (
            <WorkButton shortcut="Space" primary={!ready} hold onUse={() => act({ type: 'wash-use' })} onStop={stop}>
              {washing.stage === 'scrub' ? '누르고 문지르기' : '누르고 헹구기'}
            </WorkButton>
          )}
          {ready && !washing.spongeHeld && (
            <WorkButton shortcut="F" primary onUse={() => act({ type: 'wash-confirm' })}>
              {washing.stage === 'scrub' ? '헹구기 시작' : '세척 마치기'}
            </WorkButton>
          )}
        </WorkActions>
      )}
      <WorkLinks>
        <HoldAction onConfirm={() => act({ type: 'leave-wash' })}>세척 취소</HoldAction>
      </WorkLinks>
    </>
  )
}
