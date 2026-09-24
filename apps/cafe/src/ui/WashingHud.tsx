import type { StationId } from '../game/catalog'
import type { GameState } from '../game/state'
import type { Action } from '../game/store'
import { WASH_STEPS } from '../game/washing'
import { TextButton } from './Button'
import { WorkButton, WorkHud, WorkMeter, WorkTitle } from './WorkControls'

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
  if (!washing || (target !== 'wash' && !(target === 'rack' && washing.stage === 'carrying'))) return null
  const step = washing.stage === 'scrub' || washing.stage === 'rinse' ? WASH_STEPS[washing.stage] : null
  const occupied = !!(
    (state.cup && (state.cup.craft.location === 'hand' || state.cup.craft.tool)) ||
    state.preparation?.tool
  )
  const ratio = step ? washing.progress / step.seconds : 1
  const ready = ratio >= 1
  const canUse = !occupied && (washing.stage === 'rinse' || washing.spongeHeld)
  return (
    <WorkHud aria-label="피처 세척·정리">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted compact:mb-1.5">
        <span>피처 세척</span>
        <span>
          {washing.stage === 'scrub'
            ? '1 / 3 · 문지르기'
            : washing.stage === 'rinse'
              ? '2 / 3 · 헹구기'
              : '3 / 3 · 선반 정리'}
        </span>
      </div>
      {washing.stage === 'carrying' ? (
        <>
          <WorkTitle>{target === 'rack' ? '피처를 제자리에 놓으세요' : '도구 선반으로 가져가세요'}</WorkTitle>
          <WorkButton
            shortcut="E"
            primary={target === 'rack'}
            onUse={() => act({ type: target === 'rack' ? 'rack' : 'leave-wash' })}
          >
            {target === 'rack' ? '선반에 피처 놓기' : '세척대에 다시 놓기'}
          </WorkButton>
        </>
      ) : washing.stage === 'ready' ? (
        <>
          <WorkTitle>깨끗하게 씻었어요</WorkTitle>
          {occupied ? (
            <p className="my-2.5 text-sm leading-[1.65] text-danger">컵과 제조 도구를 먼저 내려놓으세요.</p>
          ) : null}
          <WorkButton shortcut="E" primary disabled={occupied} onUse={() => act({ type: 'take-washed' })}>
            피처 집어 선반으로 옮기기
          </WorkButton>
          <TextButton onClick={() => act({ type: 'leave-wash' })}>여기에 두고 다른 일 하기</TextButton>
        </>
      ) : step ? (
        <>
          <WorkTitle>{step.label}</WorkTitle>
          <WorkMeter
            label={step.label}
            ratio={ratio}
            value={`${Math.round(ratio * 100)}%`}
            hint={ready ? (washing.spongeHeld ? '스펀지를 놓으세요' : '다음 단계로 넘어가세요') : '손을 떼면 멈춰요'}
          />
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
                {washing.stage === 'scrub' ? '헹구기로 넘어가기' : '세척 마치기'}
              </WorkButton>
            ) : null}
          </div>
          <details className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-xs text-muted open:basis-full compact:mt-1.5">
            <summary className="cursor-pointer py-1.5">작업 안내 · 취소</summary>
            <p className="my-2.5 text-sm leading-[1.65] whitespace-pre-line text-muted">
              문지르기 → 헹구기 → 선반 정리. 자리를 떠나도 진행량은 유지돼요.
            </p>
            <TextButton danger onClick={() => act({ type: 'leave-wash' })}>
              세척 취소 · 처음부터 다시 씻기
            </TextButton>
          </details>
        </>
      ) : null}
    </WorkHud>
  )
}
