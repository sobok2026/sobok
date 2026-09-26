import clsx from 'clsx'
import { isCupSurface, STATIONS, type StationId } from '../../content/stations'
import { TextButton } from '../../shared/ui/Button'
import { WorkButton, WorkHud, WorkMeter, WorkTitle } from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import { craftingHandsBusy } from '../../simulation/hands'
import type { Cleaning, GameState } from '../../simulation/state'
import { cupCount } from '../inventory/cups'
import { washingHandsBusy } from '../washing/rules'
import { CLEANING_SECONDS, cupSurface } from './rules'

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
  if (!cleaning || (target !== cleaning.station && !(target === 'wash' && cupCount(cleaning.heldCups)))) {
    return null
  }
  const table = isCupSurface(cleaning.station) ? cupSurface(state, cleaning.station) : null
  const occupied = !!(state.supplyDelivery || craftingHandsBusy(state) || washingHandsBusy(state.washing))

  return (
    <WorkHud aria-label="청소·정리">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted compact:mb-1.5">
        <span>{STATIONS[target ?? cleaning.station].name}</span>
        <span>{STAGE_NAMES[cleaning.stage]}</span>
      </div>
      <CleaningWork
        cleaning={cleaning}
        target={target}
        tableCups={cupCount(table?.cups)}
        occupied={occupied}
        act={act}
        stop={stop}
      />
      {occupied && (
        <p className="my-2.5 text-sm leading-[1.65] text-danger">들고 있는 컵·도구·보충품을 먼저 내려놓으세요.</p>
      )}
      <details
        className={clsx(
          'mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-xs text-muted',
          'open:basis-full compact:mt-1.5',
        )}
      >
        <summary className="cursor-pointer py-1.5">작업 관리</summary>
        <TextButton
          danger
          disabled={cleaning.clothHeld || cupCount(cleaning.heldCups) > 0}
          onClick={() => act({ type: 'leave-cleaning' })}
        >
          청소 취소 · 진행 초기화
        </TextButton>
      </details>
    </WorkHud>
  )
}

const STAGE_NAMES = { collect: '컵 회수', bag: '분리수거', wipe: '닦기' } as const

function CleaningWork({
  cleaning,
  target,
  tableCups,
  occupied,
  act,
  stop,
}: {
  cleaning: Cleaning
  target: StationId | null
  tableCups: number
  occupied: boolean
  act: (action: Action) => void
  stop: () => void
}) {
  const heldCups = cupCount(cleaning.heldCups)
  if (heldCups > 0) {
    return (
      <>
        <WorkTitle>사용한 컵 {heldCups}개</WorkTitle>
        {target === 'wash' ? (
          <WorkButton shortcut="E" primary onUse={() => act({ type: 'drop-used-cups' })}>
            세척대에 컵 내려놓기
          </WorkButton>
        ) : (
          <>
            <p className="my-2.5 text-sm leading-[1.65] text-muted">세척대로 이동</p>
            {tableCups > 0 && (
              <WorkButton shortcut="E" primary onUse={() => act({ type: 'collect-cup' })}>
                남은 컵 집기 · {tableCups}개
              </WorkButton>
            )}
          </>
        )}
      </>
    )
  }

  if (cleaning.stage === 'collect') {
    return (
      <>
        <WorkTitle>컵 회수</WorkTitle>
        <WorkButton shortcut="E" primary disabled={occupied} onUse={() => act({ type: 'collect-cup' })}>
          사용한 컵 집기 · {tableCups}개
        </WorkButton>
      </>
    )
  }

  const ratio = cleaning.progress / CLEANING_SECONDS[cleaning.stage]
  const ready = ratio >= 1
  const label = cleaning.stage === 'bag' ? '쓰레기 모아 봉투 묶기' : '천으로 닦기'

  return (
    <>
      <WorkTitle>{label}</WorkTitle>
      <WorkMeter label={label} ratio={ratio} value={`${Math.floor(ratio * 100)}%`} />
      <div className="flex flex-wrap gap-2">
        {cleaning.stage === 'wipe' && (
          <WorkButton
            shortcut="G"
            primary={!cleaning.clothHeld || ready}
            disabled={occupied}
            onUse={() => act({ type: 'clean-tool' })}
          >
            {cleaning.clothHeld ? '천 놓기' : '청소용 천 집기'}
          </WorkButton>
        )}
        {(cleaning.stage === 'bag' || cleaning.clothHeld) && (
          <WorkButton
            shortcut="Space"
            primary={!ready}
            hold
            disabled={occupied}
            onUse={() => act({ type: 'clean-use' })}
            onStop={stop}
          >
            {cleaning.stage === 'bag' ? '누르고 묶기' : '누르고 닦기'}
          </WorkButton>
        )}
        {ready && !cleaning.clothHeld && (
          <WorkButton shortcut="F" primary disabled={occupied} onUse={() => act({ type: 'clean-confirm' })}>
            {cleaning.stage === 'bag' ? '봉투 비우기' : '청소 마치기'}
          </WorkButton>
        )}
      </div>
    </>
  )
}
