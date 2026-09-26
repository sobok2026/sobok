import { STATIONS, type StationId } from '../../content/stations'
import { TextButton } from '../../shared/ui/Button'
import { WorkButton, WorkHud, WorkMeter, WorkTitle } from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import { craftingHandsBusy } from '../../simulation/hands'
import type { GameState } from '../../simulation/state'
import { cupCount } from '../inventory/cups'
import { WASH_NAMES, WASH_STEPS, washDestination } from './rules'

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
  )
    return null
  const destination = washDestination(washing.item)
  const name = WASH_NAMES[washing.item]
  const step = washing.stage === 'scrub' || washing.stage === 'rinse' ? WASH_STEPS[washing.stage] : null
  const occupied = craftingHandsBusy(state)
  const ratio = step ? washing.progress / step.seconds : 1
  const ready = ratio >= 1
  const canUse = !occupied && (washing.stage === 'rinse' || washing.spongeHeld)
  return (
    <WorkHud aria-label="용기 세척·정리">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted compact:mb-1.5">
        <span>{name} 세척</span>
        <span>{washing.stage === 'scrub' ? '1 / 3' : washing.stage === 'rinse' ? '2 / 3' : '3 / 3'}</span>
      </div>
      {washing.stage === 'carrying' ? (
        <>
          <WorkTitle>
            {target === destination ? STATIONS[destination].name : `${STATIONS[destination].name}로 이동`}
          </WorkTitle>
          <WorkButton
            shortcut="E"
            primary={target === destination}
            onUse={() =>
              act(target === destination ? { type: 'store-washed', station: destination } : { type: 'leave-wash' })
            }
          >
            {target === destination ? `${name} 정리하기` : '세척대에 다시 놓기'}
          </WorkButton>
        </>
      ) : washing.stage === 'ready' ? (
        <>
          <WorkTitle>세척 완료</WorkTitle>
          {occupied ? (
            <p className="my-2.5 text-sm leading-[1.65] text-danger">컵과 제조 도구를 먼저 내려놓으세요.</p>
          ) : null}
          <WorkButton
            shortcut="E"
            primary
            disabled={occupied}
            onUse={() => act({ type: 'take-washed', item: washing.item })}
          >
            {name} 집기
          </WorkButton>
          <TextButton onClick={() => act({ type: 'leave-wash' })}>세척대에 두기</TextButton>
        </>
      ) : step ? (
        <>
          <WorkTitle>{step.label}</WorkTitle>
          <WorkMeter label={step.label} ratio={ratio} value={`${Math.floor(ratio * 100)}%`} />
          {occupied ? (
            <p className="my-2.5 text-sm leading-[1.65] text-danger">컵과 제조 도구를 먼저 내려놓으세요.</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {washing.stage === 'scrub' ? (
              <WorkButton
                shortcut="G"
                primary={!washing.spongeHeld || ready}
                disabled={occupied}
                onUse={() => act({ type: 'wash-tool' })}
              >
                {washing.spongeHeld ? '스펀지 놓기' : '스펀지 집기'}
              </WorkButton>
            ) : null}
            {canUse ? (
              <WorkButton shortcut="Space" primary={!ready} hold onUse={() => act({ type: 'wash-use' })} onStop={stop}>
                {washing.stage === 'scrub' ? '누르고 문지르기' : '누르고 헹구기'}
              </WorkButton>
            ) : null}
            {ready && !washing.spongeHeld ? (
              <WorkButton shortcut="F" primary disabled={occupied} onUse={() => act({ type: 'wash-confirm' })}>
                {washing.stage === 'scrub' ? '헹구기 시작' : '세척 마치기'}
              </WorkButton>
            ) : null}
          </div>
          <details
            className={[
              'mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-xs text-muted',
              'open:basis-full compact:mt-1.5',
            ].join(' ')}
          >
            <summary className="cursor-pointer py-1.5">작업 관리</summary>

            <TextButton danger onClick={() => act({ type: 'leave-wash' })}>
              세척 취소 · 진행 초기화
            </TextButton>
          </details>
        </>
      ) : null}
    </WorkHud>
  )
}
