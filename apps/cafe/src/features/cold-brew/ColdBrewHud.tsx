import { INGREDIENTS } from '../../content/ingredients'
import { expiryAt } from '../../content/lifetime'
import { batchDate, formatAmount } from '../../shared/format'
import { TextButton } from '../../shared/ui/Button'
import { WorkButton, WorkHud, WorkMeter, WorkTitle } from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import { craftingHandsBusy } from '../../simulation/hands'
import type { GameState } from '../../simulation/state'
import { COLD_BREW_HOURS } from '../cold-brew/rules'
import BatchLabel from '../inventory/BatchLabel'
import { COLD_BREW_TOOL_NAMES, coldBrewStep } from './rules'

export default function ColdBrewHud({
  state,
  act,
  stop,
}: {
  state: GameState
  act: (action: Action) => void
  stop: () => void
}) {
  const brew = state.coldBrew
  if (!brew) return null
  const step = coldBrewStep(brew)
  const job = state.jobs.find((item) => item.kind === 'cold-brew' && item.preparationId === brew.id)
  const batch = state.batches.find((item) => item.id === brew.batchId)
  const ready = brew.progress + 1e-9 >= step.target * (1 - step.tolerance)
  const expired = brew.completedAt !== null && expiryAt(brew.completedAt, INGREDIENTS.coldBrew.lifetime) <= state.time
  const minutes = job ? Math.max(0, Math.ceil((job.endsAt - state.time) / 60)) : 0
  const handsFull = craftingHandsBusy(state)
  return (
    <WorkHud aria-label="콜드 브루 직접 준비" data-fault={!!brew.fault}>
      <div className="mb-2 flex justify-between gap-3 text-xs text-muted">
        <span>콜드 브루 준비</span>
        <span>
          {brew.stage === 'measuring'
            ? `${brew.step + 1} / 3`
            : brew.stage === 'extracting'
              ? '추출 중'
              : '회수 · 보관'}
        </span>
      </div>
      {brew.fault ? (
        <>
          <WorkTitle>추출 준비 실패</WorkTitle>
          <p className="mb-3 text-sm text-danger">{brew.fault}</p>
          <WorkButton shortcut="F" primary onUse={() => act({ type: 'discard-cold-brew' })}>
            배치 폐기
          </WorkButton>
        </>
      ) : brew.stage === 'ready' && batch ? (
        <>
          <WorkTitle>{expired ? '기한 만료' : batch.labelled ? '냉장 보관 준비' : '라벨 부착'}</WorkTitle>
          <BatchLabel batch={batch} time={state.time} act={act} station="cold-prep" />
        </>
      ) : brew.stage === 'finished' ? (
        <>
          <WorkTitle>{expired ? '기한 만료' : '추출 완료'}</WorkTitle>
          <p className="mb-3 text-sm text-muted">추출 완료 · {batchDate(brew.completedAt)}</p>
          <WorkButton
            shortcut={expired ? 'F' : 'E'}
            primary
            disabled={handsFull}
            onUse={() => act({ type: expired ? 'discard-cold-brew' : 'collect-cold-brew' })}
          >
            {expired ? '추출액 폐기' : '용기에 회수'}
          </WorkButton>
        </>
      ) : brew.stage === 'extracting' && job ? (
        <>
          <WorkTitle>콜드 브루 추출 중</WorkTitle>
          <WorkMeter
            label="추출 진행"
            ratio={(state.time - job.startedAt) / (job.endsAt - job.startedAt)}
            value={`${Math.floor(minutes / 60)}시간 ${minutes % 60}분 남음`}
          />
        </>
      ) : (
        <>
          <WorkTitle>{step.label}</WorkTitle>
          {brew.step < 2 ? (
            <WorkMeter
              label={step.label}
              ratio={brew.progress / step.target}
              value={`${formatAmount(brew.progress)} / ${step.target}${step.unit}`}
              tolerance={step.tolerance || undefined}
            />
          ) : (
            <p className="mb-3 text-sm text-muted">
              원두 {formatAmount(brew.beans)}lb · 정수 {formatAmount(brew.water)}L<br />
              추출 {COLD_BREW_HOURS}시간
            </p>
          )}
          {handsFull ? <p className="mb-3 text-sm text-danger">컵과 다른 도구를 먼저 내려놓아주세요.</p> : null}
          <div className="flex flex-wrap gap-2">
            {step.tool || brew.tool ? (
              <WorkButton
                shortcut="G"
                disabled={handsFull}
                primary={!brew.tool || ready}
                onUse={() => act({ type: 'cold-tool' })}
              >
                {brew.tool ? `${COLD_BREW_TOOL_NAMES[brew.tool]} 놓기` : `${COLD_BREW_TOOL_NAMES[step.tool!]} 집기`}
              </WorkButton>
            ) : null}
            {brew.tool === step.tool ? (
              brew.step === 2 ? (
                <WorkButton shortcut="Space" primary disabled={handsFull} onUse={() => act({ type: 'cold-use' })}>
                  추출 시작
                </WorkButton>
              ) : (
                <WorkButton
                  shortcut="Space"
                  hold
                  disabled={handsFull}
                  primary={!ready}
                  onUse={() => act({ type: 'cold-use' })}
                  onStop={stop}
                >
                  누르고 {brew.step === 0 ? '원두 담기' : '물 붓기'}
                </WorkButton>
              )
            ) : null}
            {brew.step < 2 && ready && !brew.tool ? (
              <WorkButton shortcut="F" primary disabled={handsFull} onUse={() => act({ type: 'cold-confirm' })}>
                계량 확인
              </WorkButton>
            ) : null}
          </div>
        </>
      )}
      {brew.stage !== 'ready' && !brew.fault ? (
        <details className="mt-3 text-xs text-muted">
          <summary className="cursor-pointer py-1">작업 관리</summary>
          <p className="my-2">중단 시 원두와 준비비가 소모됩니다.</p>
          <TextButton danger onClick={() => act({ type: 'discard-cold-brew' })}>
            추출 중단 · 폐기
          </TextButton>
        </details>
      ) : null}
    </WorkHud>
  )
}
