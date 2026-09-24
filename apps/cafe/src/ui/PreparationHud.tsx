import { formatAmount, type StationId } from '../game/catalog'
import { continuousPreparation, PREP_TOOL_NAMES, PREPARATIONS, preparationStep } from '../game/preparation'
import type { GameState } from '../game/state'
import type { Action } from '../game/store'
import BatchLabel from './BatchLabel'

type Props = { state: GameState; target: StationId | null; act: (action: Action) => void; stop: () => void }
export default function PreparationHud({ state, target, act, stop }: Props) {
  const prep = state.preparation
  if (!prep) return null
  const definition = PREPARATIONS[prep.recipe]
  const step = preparationStep(prep)
  const job = state.jobs.find((job) => job.preparationId === prep.id)
  const batch = state.batches.find((batch) => batch.id === prep.batchId)
  const atBench = target === 'prep'
  const ratio = job ? (state.time - job.startedAt) / (job.endsAt - job.startedAt) : prep.progress / step.target
  const handsFull = !!state.cup && (state.cup.craft.location === 'hand' || !!state.cup.craft.tool)
  const ready = prep.progress + 0.0001 >= step.target * (1 - step.tolerance)
  const canUse = !handsFull && prep.stage === 'measuring' && prep.tool === step.tool
  return (
    <section
      className={`craft-hud preparation-hud ${atBench ? 'at-bench' : 'travelling'}`}
      aria-label="부재료 직접 준비"
    >
      <div className="craft-heading">
        <span className="eyebrow">PREP / {prep.recipe === 'foam' ? 'COLD FOAM' : 'MOCHA'}</span>
        <span className="craft-location">{definition.name}</span>
      </div>
      {!atBench ? (
        <>
          <h2>준비대에서 이어가세요.</h2>
          <p>
            {prep.stage === 'ready'
              ? '제조가 끝났어요. 라벨을 붙이고 보관해주세요.'
              : prep.stage === 'processing'
                ? '블렌딩 중이에요. 기다리는 동안 다른 일을 할 수 있어요.'
                : `${step.label} 단계가 남아 있어요.`}
          </p>
        </>
      ) : prep.fault ? (
        <>
          <h2>배합을 다시 준비해주세요.</h2>
          <p>{prep.fault}</p>
          <button type="button" className="secondary-button" onClick={() => act({ type: 'discard-preparation' })}>
            F · 배합 폐기
          </button>
        </>
      ) : prep.stage === 'ready' && batch ? (
        <>
          <h2>라벨을 붙여 보관하세요.</h2>
          <p>{definition.storageNote}</p>
          <BatchLabel batch={batch} time={state.time} act={act} />
        </>
      ) : (
        <>
          <h2>{prep.stage === 'processing' ? '블렌딩 중이에요.' : step.label}</h2>
          <ol className="prep-step-list" aria-label="준비 순서">
            {definition.steps.map((item, index) => (
              <li key={item.label} className={index === prep.step ? 'current' : index < prep.step ? 'complete' : ''}>
                {index < prep.step ? '✓' : index + 1} {item.label}
              </li>
            ))}
          </ol>
          <div className="craft-meter-label">
            <span>
              {job
                ? `${Math.max(0, Math.ceil(job.endsAt - state.time))}초 남음`
                : `${formatAmount(prep.progress)} / ${step.target}${step.unit}`}
            </span>
            <span>{step.kind === 'pump' || step.kind === 'pack' ? '클릭 횟수를 맞춰요' : '초록 구간에서 멈춰요'}</span>
          </div>
          <div
            className="craft-meter"
            role="progressbar"
            aria-label={step.label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(1, ratio) * 100)}
          >
            <span
              className="craft-target-band"
              style={{
                left: `${((1 - step.tolerance) / 1.3) * 100}%`,
                width: `${(Math.max(0.025, step.tolerance * 2) / 1.3) * 100}%`,
              }}
            />
            <i style={{ width: `${Math.min(100, (ratio / 1.3) * 100)}%` }} />
            <b style={{ left: `${100 / 1.3}%` }} />
          </div>
          <p>{step.instruction}</p>
          {handsFull ? <p className="error-text">음료 컵과 도구를 바에 내려놓아주세요.</p> : null}
          {prep.stage === 'measuring' ? (
            <div className="craft-controls">
              {step.tool || prep.tool ? (
                <button type="button" disabled={handsFull} onClick={() => act({ type: 'prep-tool' })}>
                  <kbd>G</kbd>
                  {prep.tool ? `${PREP_TOOL_NAMES[prep.tool]} 놓기` : `${PREP_TOOL_NAMES[step.tool!]} 집기`}
                </button>
              ) : null}
              {continuousPreparation(step) ? (
                <button
                  type="button"
                  className="craft-use"
                  disabled={!canUse}
                  onPointerDown={(event) => {
                    if (event.button !== 0) return
                    event.preventDefault()
                    event.currentTarget.setPointerCapture(event.pointerId)
                    act({ type: 'prep-use' })
                  }}
                  onPointerUp={stop}
                  onPointerCancel={stop}
                  onLostPointerCapture={stop}
                  onBlur={stop}
                  onKeyDown={(event) => {
                    if (['Space', 'Enter'].includes(event.code) && !event.repeat) {
                      event.preventDefault()
                      act({ type: 'prep-use' })
                    }
                  }}
                  onKeyUp={stop}
                >
                  <kbd>Space</kbd>누르고 {step.kind === 'stir' ? '젓기' : '붓기'}
                </button>
              ) : (
                <button
                  type="button"
                  className="craft-use"
                  disabled={!canUse}
                  onClick={() => act({ type: 'prep-use' })}
                >
                  <kbd>Space</kbd>
                  {step.kind === 'machine'
                    ? '3번 버튼 · 블렌딩 시작'
                    : step.kind === 'pump'
                      ? '한 번 펌핑'
                      : '원팩 한 봉 넣기'}
                </button>
              )}
              {step.kind !== 'machine' ? (
                <button
                  type="button"
                  className="craft-confirm"
                  disabled={!ready || !!prep.tool || handsFull}
                  onClick={() => act({ type: 'prep-confirm' })}
                >
                  <kbd>F</kbd>계량 확인
                </button>
              ) : null}
            </div>
          ) : (
            <p>완료 시각부터 품질 기한이 시작됩니다.</p>
          )}
          <details className="craft-recipe-note">
            <summary>자료 근거</summary>
            <p>
              {step.source}
              <br />
              {definition.marking} · {definition.storageNote}
            </p>
          </details>
          <button type="button" className="text-button danger" onClick={() => act({ type: 'discard-preparation' })}>
            준비 중단 · 투입한 재료 폐기
          </button>
        </>
      )}
    </section>
  )
}
