import { isCupSurface, STATIONS, type StationId } from '../game/catalog'
import { CLEANING_SECONDS, cupSurface } from '../game/cleaning'
import type { GameState } from '../game/state'
import type { Action } from '../game/store'
import { washingHandsBusy } from '../game/washing'
import { TextButton } from './Button'
import { WorkButton, WorkHud, WorkMeter, WorkTitle } from './WorkControls'

export default function CleaningHud({
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
  const cleaning = state.cleaning
  if (!cleaning || (target !== cleaning.station && !(target === 'trash' && cleaning.heldCups))) return null
  const table = isCupSurface(cleaning.station) ? cupSurface(state, cleaning.station) : null
  const occupied = !!(
    state.supplyDelivery ||
    (state.cup && (state.cup.craft.location === 'hand' || state.cup.craft.tool)) ||
    state.preparation?.tool ||
    washingHandsBusy(state.washing)
  )
  const ratio = cleaning.stage === 'collect' ? 0 : cleaning.progress / CLEANING_SECONDS[cleaning.stage]
  const ready = ratio >= 1
  const label = cleaning.stage === 'bag' ? '쓰레기 모아 봉투 묶기' : '천으로 닦기'
  return (
    <WorkHud aria-label="청소·정리">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted compact:mb-1.5">
        <span>{STATIONS[cleaning.station].name}</span>
        <span>{cleaning.stage === 'collect' ? '컵 회수' : cleaning.stage === 'bag' ? '분리수거' : '닦기'}</span>
      </div>
      {cleaning.heldCups > 0 ? (
        <>
          <WorkTitle>사용한 컵 {cleaning.heldCups}개를 들고 있어요</WorkTitle>
          {target === 'trash' ? (
            <WorkButton shortcut="E" primary onUse={() => act({ type: 'drop-used-cups' })}>
              분리수거함에 컵 넣기
            </WorkButton>
          ) : (
            <>
              <p className="my-2.5 text-sm leading-[1.65] text-muted">분리수거함에 가져가 E로 넣고 돌아오세요.</p>
              {table && table.cups > 0 ? (
                <WorkButton shortcut="E" primary onUse={() => act({ type: 'collect-cup' })}>
                  남은 컵 집기 · {table.cups}개
                </WorkButton>
              ) : null}
            </>
          )}
        </>
      ) : cleaning.stage === 'collect' ? (
        <>
          <WorkTitle>사용한 컵을 회수하세요</WorkTitle>
          <WorkButton shortcut="E" primary disabled={occupied} onUse={() => act({ type: 'collect-cup' })}>
            사용한 컵 집기 · {table?.cups ?? 0}개
          </WorkButton>
        </>
      ) : (
        <>
          <WorkTitle>{label}</WorkTitle>
          <WorkMeter
            label={label}
            ratio={ratio}
            value={`${Math.round(ratio * 100)}%`}
            hint={ready ? (cleaning.clothHeld ? '천을 놓고 확인하세요' : 'F로 정리를 마치세요') : '손을 떼면 멈춰요'}
          />
          <div className="flex flex-wrap gap-2">
            {cleaning.stage === 'wipe' ? (
              <WorkButton
                shortcut="G"
                primary={!cleaning.clothHeld || ready}
                disabled={occupied}
                onUse={() => act({ type: 'clean-tool' })}
              >
                {cleaning.clothHeld ? '천 놓기' : '청소용 천 집기'}
              </WorkButton>
            ) : null}
            {cleaning.stage === 'bag' || cleaning.clothHeld ? (
              <WorkButton
                shortcut="Space"
                primary={!ready}
                hold
                disabled={occupied}
                onUse={() => act({ type: 'clean-use' })}
                onStop={stop}
              >
                {cleaning.stage === 'bag' ? '누르고 모아 묶기' : '누르고 닦기'}
              </WorkButton>
            ) : null}
            {ready && !cleaning.clothHeld ? (
              <WorkButton shortcut="F" primary disabled={occupied} onUse={() => act({ type: 'clean-confirm' })}>
                {cleaning.stage === 'bag' ? '봉투 비우기' : '청소 마치기'}
              </WorkButton>
            ) : null}
          </div>
        </>
      )}
      {occupied ? (
        <p className="my-2.5 text-sm leading-[1.65] text-danger">들고 있는 컵·도구·보충품을 먼저 내려놓으세요.</p>
      ) : null}
      <details className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-xs text-muted open:basis-full compact:mt-1.5">
        <summary className="cursor-pointer py-1.5">작업 안내 · 취소</summary>
        <p className="my-2.5 text-sm leading-[1.65] whitespace-pre-line text-muted">
          컵은 분리수거함으로 옮기고 천으로 닦아요. 자리를 떠나도 진행량은 유지돼요.
        </p>
        <TextButton
          danger
          disabled={cleaning.clothHeld || cleaning.heldCups > 0}
          onClick={() => act({ type: 'leave-cleaning' })}
        >
          청소 취소 · 처음부터 다시 닦기
        </TextButton>
      </details>
    </WorkHud>
  )
}
