import { isCupSurface, type StationId } from '../../content/stations'
import {
  HoldAction,
  WorkActions,
  WorkBlocker,
  WorkButton,
  WorkHeader,
  WorkHud,
  WorkLinks,
  WorkMeter,
  WorkNote,
} from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import { craftingHandsBusy } from '../../simulation/hands'
import type { Cleaning, GameState } from '../../simulation/state'
import { cupCount } from '../inventory/cups'
import { washingHandsBusy } from '../washing/rules'
import { CLEANING_SECONDS, cupSurface } from './rules'

const handsBusy = { reason: '손이 비어 있지 않아요', fix: '들고 있는 컵·도구·보충품을 먼저 내려놓으세요.' }

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
      <CleaningWork
        cleaning={cleaning}
        target={target}
        tableCups={cupCount(table?.cups)}
        occupied={occupied}
        act={act}
        stop={stop}
      />
      {!cleaning.clothHeld && !cupCount(cleaning.heldCups) && (
        <WorkLinks>
          <HoldAction onConfirm={() => act({ type: 'leave-cleaning' })}>청소 취소</HoldAction>
        </WorkLinks>
      )}
    </WorkHud>
  )
}

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
        <WorkHeader title={`사용한 컵 ${heldCups}개`} />
        {target === 'wash' && (
          <WorkActions>
            <WorkButton shortcut="E" primary onUse={() => act({ type: 'drop-used-cups' })}>
              세척대에 내려놓기
            </WorkButton>
          </WorkActions>
        )}
        {target !== 'wash' && <WorkNote>세척대에 내려놓으세요.</WorkNote>}
        {target !== 'wash' && tableCups > 0 && (
          <WorkActions>
            <WorkButton shortcut="E" primary onUse={() => act({ type: 'collect-cup' })}>
              남은 컵 집기 · {tableCups}개
            </WorkButton>
          </WorkActions>
        )}
      </>
    )
  }

  if (cleaning.stage === 'collect') {
    return (
      <>
        <WorkHeader title="컵 회수" value={`${tableCups}개`} />
        {occupied ? (
          <WorkBlocker {...handsBusy} />
        ) : (
          <WorkActions>
            <WorkButton shortcut="E" primary onUse={() => act({ type: 'collect-cup' })}>
              사용한 컵 집기
            </WorkButton>
          </WorkActions>
        )}
      </>
    )
  }

  const ratio = cleaning.progress / CLEANING_SECONDS[cleaning.stage]
  const ready = ratio >= 1
  const label = cleaning.stage === 'bag' ? '쓰레기 모아 봉투 묶기' : '천으로 닦기'
  const value = `${Math.floor(Math.min(1, ratio) * 100)}%`

  return (
    <>
      <WorkHeader title={label} value={value} />
      {occupied ? <WorkBlocker {...handsBusy} /> : <WorkMeter label={label} ratio={ratio} valueText={value} />}
      {!occupied && (
        <WorkActions>
          {cleaning.stage === 'wipe' && (
            <WorkButton shortcut="G" primary={!cleaning.clothHeld || ready} onUse={() => act({ type: 'clean-tool' })}>
              {cleaning.clothHeld ? '천 놓기' : '청소용 천 집기'}
            </WorkButton>
          )}
          {(cleaning.stage === 'bag' || cleaning.clothHeld) && (
            <WorkButton shortcut="Space" primary={!ready} hold onUse={() => act({ type: 'clean-use' })} onStop={stop}>
              {cleaning.stage === 'bag' ? '누르고 묶기' : '누르고 닦기'}
            </WorkButton>
          )}
          {ready && !cleaning.clothHeld && (
            <WorkButton shortcut="F" primary onUse={() => act({ type: 'clean-confirm' })}>
              {cleaning.stage === 'bag' ? '봉투 비우기' : '청소 마치기'}
            </WorkButton>
          )}
        </WorkActions>
      )}
    </>
  )
}
