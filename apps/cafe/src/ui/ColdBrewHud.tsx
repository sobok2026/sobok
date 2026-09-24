import { COLD_BREW_HOURS, formatAmount, INGREDIENTS } from '../game/catalog'
import { COLD_BREW_TOOL_NAMES, coldBrewStep } from '../game/cold-brew'
import { batchDate } from '../game/preparation'
import { expiryAt } from '../game/quality'
import type { GameState } from '../game/state'
import type { Action } from '../game/store'
import BatchLabel from './BatchLabel'
import { TextButton } from './Button'
import { WorkButton, WorkHud, WorkMeter, WorkTitle } from './WorkControls'

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
  const ready = brew.progress + 0.0001 >= step.target * (1 - step.tolerance)
  const expired = brew.completedAt !== null && expiryAt(brew.completedAt, INGREDIENTS.coldBrew.lifetime) <= state.time
  const minutes = job ? Math.max(0, Math.ceil((job.endsAt - state.time) / 60)) : 0
  const handsFull =
    !!state.preparation?.tool || !!(state.cup && (state.cup.craft.location === 'hand' || state.cup.craft.tool))
  return (
    <WorkHud aria-label="콜드 브루 직접 준비" data-fault={!!brew.fault}>
      <div className="mb-2 flex justify-between gap-3 text-xs text-muted">
        <span>콜드 브루 준비</span>
        <span>
          {brew.stage === 'measuring'
            ? `${brew.step + 1} / 3 단계`
            : brew.stage === 'extracting'
              ? '추출 중'
              : '회수 · 보관'}
        </span>
      </div>
      {brew.fault ? (
        <>
          <WorkTitle>콜드 브루를 다시 준비해주세요</WorkTitle>
          <p className="mb-3 text-sm text-danger">{brew.fault}</p>
          <WorkButton shortcut="F" primary onUse={() => act({ type: 'discard-cold-brew' })}>
            한 배치분 폐기하기
          </WorkButton>
        </>
      ) : brew.stage === 'ready' && batch ? (
        <>
          <WorkTitle>
            {expired
              ? '기한이 지난 추출액을 폐기해주세요'
              : batch.labelled
                ? '용기를 냉장고로 옮기세요'
                : '추출 완료 시각으로 라벨을 붙이세요'}
          </WorkTitle>
          <BatchLabel batch={batch} time={state.time} act={act} station="cold-prep" />
        </>
      ) : brew.stage === 'finished' ? (
        <>
          <WorkTitle>{expired ? '추출액의 기한이 지났어요' : '추출액을 용기에 회수하세요'}</WorkTitle>
          <p className="mb-3 text-sm text-muted">
            추출 완료 · {batchDate(brew.completedAt)}
            <br />
            기한은 회수 시각이 아닌 추출 완료 시각부터 계산해요.
          </p>
          <WorkButton
            shortcut={expired ? 'F' : 'E'}
            primary
            disabled={handsFull}
            onUse={() => act({ type: expired ? 'discard-cold-brew' : 'collect-cold-brew' })}
          >
            {expired ? '추출액 폐기하기' : '추출액 용기에 회수'}
          </WorkButton>
        </>
      ) : brew.stage === 'extracting' && job ? (
        <>
          <WorkTitle>콜드 브루를 추출하고 있어요</WorkTitle>
          <WorkMeter
            label="추출 진행"
            ratio={(state.time - job.startedAt) / (job.endsAt - job.startedAt)}
            value={`${Math.floor(minutes / 60)}시간 ${minutes % 60}분 남음`}
            hint="추출 중에는 마감하고 다음 날로 넘어갈 수 있어요"
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
              hint={
                ready
                  ? brew.tool
                    ? '도구를 놓고 확인하세요'
                    : '계량을 확인하세요'
                  : brew.step === 0
                    ? '원두 한 봉이 모두 들어갈 때까지 누르세요'
                    : '초록 구간에서 멈추세요'
              }
              tolerance={step.tolerance || undefined}
            />
          ) : (
            <p className="mb-3 text-sm text-muted">
              원두 {formatAmount(brew.beans)}lb · 정수 {formatAmount(brew.water)}L<br />
              {COLD_BREW_HOURS}시간 추출 후 직접 회수하고 냉장 보관해요.
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
          <summary className="cursor-pointer py-1">준비 · 중단 안내</summary>
          <p className="my-2">
            원두 한 배치분은 시작할 때 확보해요. 중단하면 한 배치분을 폐기하고 준비비는 반환되지 않아요.
          </p>
          <TextButton danger onClick={() => act({ type: 'discard-cold-brew' })}>
            콜드 브루 준비 중단 · 폐기
          </TextButton>
        </details>
      ) : null}
    </WorkHud>
  )
}
