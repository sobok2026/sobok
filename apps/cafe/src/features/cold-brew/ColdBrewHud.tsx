import { INGREDIENTS } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import { batchDate, formatQuantity } from '../../shared/format'
import {
  HoldAction,
  WorkActions,
  WorkBlocker,
  WorkButton,
  WorkHeader,
  WorkHoldStatus,
  WorkHud,
  WorkLinks,
  WorkMeter,
  WorkNote,
} from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import { craftingHandsBusy } from '../../simulation/hands'
import type { ColdBrew, GameState } from '../../simulation/state'
import BatchWork from '../inventory/BatchWork'
import { COLD_BREW_TOOL_NAMES, coldBrewStep } from './rules'

const handsBusy = { reason: '손이 비어 있지 않아요', fix: '컵과 다른 도구를 먼저 내려놓으세요.' }

export default function ColdBrewHud({
  state,
  active,
  act,
  stop,
}: {
  state: GameState
  active: boolean
  act: (action: Action) => void
  stop: () => void
}) {
  const brew = state.coldBrew
  if (!brew) {
    return null
  }

  return (
    <WorkHud aria-label="콜드 브루 직접 준비">
      <ColdBrewWork state={state} brew={brew} active={active} act={act} stop={stop} />
    </WorkHud>
  )
}

function ColdBrewWork({
  state,
  brew,
  active,
  act,
  stop,
}: {
  state: GameState
  brew: ColdBrew
  active: boolean
  act: (action: Action) => void
  stop: () => void
}) {
  const step = coldBrewStep(brew)
  const job = state.jobs.find((item) => item.kind === 'cold-brew' && item.preparationId === brew.id)
  const batch = state.batches.find((item) => item.id === brew.batchId)
  const started = brew.progress > 1e-9
  const expired =
    brew.completedAt !== null && expiryAt(brew.completedAt, INGREDIENTS['cold-brew'].lifetime) <= state.time
  const handsFull = craftingHandsBusy(state)
  const discard = (label: string) => (
    <WorkLinks>
      <HoldAction onConfirm={() => act({ type: 'discard-cold-brew' })}>{label}</HoldAction>
    </WorkLinks>
  )

  if (brew.fault) {
    return (
      <>
        <WorkHeader title={step.label} value={formatQuantity(brew.progress, step.unit)} />
        <WorkBlocker reason="다시 준비해야 해요" fix={brew.fault} fault />
        {discard('배치 폐기')}
      </>
    )
  }

  if (brew.stage === 'ready' && batch) {
    return <BatchWork batch={batch} time={state.time} act={act} station="cold-prep" />
  }

  if (brew.stage === 'finished' && expired) {
    return (
      <>
        <WorkHeader title="추출액 기한 만료" />
        <WorkBlocker reason="사용할 수 없어요" fix="회수하거나 라벨을 써도 기한은 늘어나지 않아요." />
        {discard('추출액 폐기')}
      </>
    )
  }

  if (brew.stage === 'finished') {
    return (
      <>
        <WorkHeader title="추출 완료" />
        <WorkNote>완료 {batchDate(brew.completedAt)}</WorkNote>
        {handsFull ? (
          <WorkBlocker {...handsBusy} />
        ) : (
          <WorkActions>
            <WorkButton shortcut="E" primary onUse={() => act({ type: 'collect-cold-brew' })}>
              용기에 회수
            </WorkButton>
          </WorkActions>
        )}
      </>
    )
  }

  if (brew.stage === 'extracting' && job) {
    const minutes = Math.max(0, Math.ceil((job.endsAt - state.time) / 60))
    const value = `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`

    return (
      <>
        <WorkHeader title="콜드 브루 추출 중" value={value} />
        <WorkMeter
          label="추출 진행"
          ratio={(state.time - job.startedAt) / (job.endsAt - job.startedAt)}
          valueText={`${value} 남음`}
        />
        {discard('추출 중단 · 원두와 준비비 소모')}
      </>
    )
  }

  const holding = brew.tool === step.tool
  const measuring = brew.step < 2
  // The bag and the jug read what went in so far; the recipe amount stays in the help.
  const value = measuring ? formatQuantity(brew.progress, step.unit) : undefined

  return (
    <>
      <WorkHeader title={step.label} value={value} />
      {handsFull && <WorkBlocker {...handsBusy} />}
      {!handsFull && holding && measuring && <WorkHoldStatus active={active} started={started} pouring />}
      {!handsFull && (
        <WorkActions>
          {(step.tool || brew.tool) && (
            <WorkButton shortcut="G" primary={!brew.tool} onUse={() => act({ type: 'cold-tool' })}>
              {brew.tool ? `${COLD_BREW_TOOL_NAMES[brew.tool]} 놓기` : `${COLD_BREW_TOOL_NAMES[step.tool!]} 집기`}
            </WorkButton>
          )}
          {holding && !measuring && (
            <WorkButton shortcut="Space" primary onUse={() => act({ type: 'cold-use' })}>
              추출 시작
            </WorkButton>
          )}
          {holding && measuring && (
            <WorkButton
              shortcut="Space"
              hold
              primary
              active={active}
              onUse={() => act({ type: 'cold-use' })}
              onStop={stop}
            >
              누르고 {brew.step === 0 ? '원두 담기' : '물 붓기'}
            </WorkButton>
          )}
          {measuring && started && !brew.tool && (
            <WorkButton shortcut="F" primary onUse={() => act({ type: 'cold-confirm' })}>
              확인
            </WorkButton>
          )}
        </WorkActions>
      )}
      {discard('준비 중단 · 원두와 준비비 소모')}
    </>
  )
}
