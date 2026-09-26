import { isCupSurface } from '../../content/stations'
import { Button } from '../../shared/ui/Button'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { cupCount } from '../inventory/cups'
import type { CleaningStation } from './rules'
import { cupSurface } from './rules'

export default function CleaningPanel({
  state,
  station: panel,
  act,
}: {
  state: GameState
  station: CleaningStation
  act: (action: Action) => void
}) {
  const actionJob = state.jobs.find((job) => job.station === panel)

  return (
    <>
      {isCupSurface(panel) && (
        <>
          <div className="my-5 text-[1.75rem] leading-[1.2] font-normal text-[#536f4b]">
            {cupCount(cupSurface(state, panel).cups)}
            <small className="mt-2 block text-xs text-muted">개 회수 대기</small>
          </div>
          <p className="mb-4 text-sm leading-[1.9] text-muted">{surfaceStatus(cupSurface(state, panel))}</p>
          <Button
            disabled={!cupSurface(state, panel).dirty && !cupCount(cupSurface(state, panel).cups)}
            onClick={() => act({ type: 'start-cleaning', station: panel })}
          >
            정리 시작
          </Button>
        </>
      )}
      {panel === 'mix' && (
        <Button
          variant="secondary"
          disabled={!state.dirtyBar || !!actionJob}
          onClick={() => act({ type: 'start-cleaning', station: 'mix' })}
        >
          작업대 닦기
        </Button>
      )}
      {panel === 'trash' && (
        <>
          <div className="my-5 text-[1.75rem] leading-[1.2] font-normal text-[#536f4b]">
            {state.trash}
            <small className="mt-2 block text-xs text-muted">개</small>
          </div>
          <Button disabled={!state.trash} onClick={() => act({ type: 'start-cleaning', station: 'trash' })}>
            분리수거 시작
          </Button>
        </>
      )}
    </>
  )
}

function surfaceStatus(surface: ReturnType<typeof cupSurface>) {
  if (surface.dirty) {
    return '얼룩 있음'
  }
  return cupCount(surface.cups) ? '컵 회수 필요' : '정리 완료'
}
