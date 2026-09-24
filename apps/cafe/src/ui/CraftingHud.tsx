import { RECIPES, STATIONS, type StationId } from '../game/catalog'
import { isContinuous, operationFor, readyToConfirm, TOOL_NAMES } from '../game/crafting'
import type { GameState } from '../game/state'

type Props = {
  state: GameState
  target: StationId | null
  onUse: (station: StationId) => void
  onStop: () => void
  onTool: (station: StationId) => void
  onConfirm: (station: StationId) => void
  onMoveCup: (station: StationId) => void
  onDiscard: () => void
}
export default function CraftingHud({ state, target, onUse, onStop, onTool, onConfirm, onMoveCup, onDiscard }: Props) {
  const cup = state.cup
  if (!cup) return null
  const c = cup.craft
  const op = operationFor(cup.recipe, cup.step, c)
  const place = c.location === 'hand' ? null : c.location
  const atBench = place !== null && place === target
  const sourceStep = RECIPES[cup.recipe].steps[cup.step]
  const nextStation = sourceStep?.station
  const job = state.jobs.find((item) => item.cupId === cup.id)
  const needsMove = op && nextStation !== place && !job
  const progress = job
    ? Math.min(1, (state.time - job.startedAt) / (job.endsAt - job.startedAt))
    : op
      ? c.progress / op.target
      : 1
  const canWork = atBench && !job && !c.fault && op && RECIPES[cup.recipe].steps[cup.step]?.station === place
  const rightTool = op?.tool === c.tool
  const counter = op && ['pump', 'sprinkle', 'ice'].includes(op.kind)
  return (
    <section
      className={`craft-hud ${atBench ? 'at-bench' : 'travelling'} ${c.fault ? 'craft-fault' : ''}`}
      aria-label="직접 제조 조작"
    >
      <div className="craft-heading">
        <span className="eyebrow">HANDS ON / TALL</span>
        <span className="craft-location">{place ? `${STATIONS[place].name}에 놓인 컵` : '컵을 들고 있어요'}</span>
      </div>
      {c.fault ? (
        <>
          <h2>계량을 초과했어요.</h2>
          <p>{c.fault}</p>
          <button type="button" className="secondary-button" onClick={onDiscard}>
            F · 컵 폐기 · 다시 만들기
          </button>
        </>
      ) : !atBench ? (
        <>
          <h2>{place ? '컵이 작업대에 있어요.' : '컵을 내려놓아주세요.'}</h2>
          <p>
            {place
              ? `${STATIONS[place].name}으로 돌아가 작업을 이어가세요.`
              : '작업대를 바라보고 E · 컵을 놓으면 직접 제조할 수 있어요.'}
          </p>
        </>
      ) : (
        <>
          <h2>{needsMove ? '다음 작업대로 이동하세요.' : (job?.label ?? op?.label ?? '음료가 완성됐어요.')}</h2>
          {needsMove ? (
            <p>
              E로 컵을 집어 가져가세요.
              <br />
              다음: {STATIONS[nextStation!].name} · {op.label}
            </p>
          ) : op ? (
            <>
              <div className="craft-meter-label">
                <span>
                  {job
                    ? '장비 작동 중'
                    : counter
                      ? `${Math.round(c.progress)} / ${op.target} ${op.unit}`
                      : `${Math.round(Math.min(150, progress * 100))}%`}
                </span>
                <span>
                  {job
                    ? `${Math.max(0, Math.ceil(job.endsAt - state.time))}초`
                    : counter
                      ? '직접 횟수를 맞춰요'
                      : '초록 구간에서 멈춰요'}
                </span>
              </div>
              <div
                className="craft-meter"
                role="progressbar"
                aria-label={op.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(Math.min(1, progress) * 100)}
                aria-valuetext={
                  counter ? `${Math.round(c.progress)} / ${op.target} ${op.unit}` : `${Math.round(progress * 100)}%`
                }
              >
                <span
                  className="craft-target-band"
                  style={{
                    left: `${((1 - op.tolerance) / 1.3) * 100}%`,
                    width: `${(Math.max(0.025, op.tolerance * 2) / 1.3) * 100}%`,
                  }}
                />
                <i style={{ width: `${Math.min(100, (progress / 1.3) * 100)}%` }} />
                <b style={{ left: `${100 / 1.3}%` }} />
              </div>
              <p>{job ? '컵은 장비에 두세요. 기다리는 동안 다른 일을 할 수 있어요.' : op.cue}</p>
              {sourceStep?.instruction || sourceStep?.note ? (
                <details className="craft-recipe-note">
                  <summary>레시피 메모</summary>
                  <p>
                    {sourceStep.instruction}
                    {sourceStep.note ? (
                      <>
                        <br />
                        {sourceStep.note}
                      </>
                    ) : null}
                  </p>
                </details>
              ) : null}
              <div className="craft-controls">
                {op.tool || c.tool ? (
                  <button type="button" disabled={!atBench || !!job} onClick={() => onTool(place!)}>
                    <kbd>G</kbd>
                    <span>{c.tool ? `${TOOL_NAMES[c.tool]} 놓기` : `${TOOL_NAMES[op.tool!]} 집기`}</span>
                  </button>
                ) : null}
                {isContinuous(op) ? (
                  <button
                    type="button"
                    className="craft-use"
                    disabled={!canWork || !rightTool}
                    onPointerDown={(event) => {
                      if (event.button !== 0) return
                      event.preventDefault()
                      event.currentTarget.setPointerCapture(event.pointerId)
                      onUse(place!)
                    }}
                    onPointerUp={onStop}
                    onPointerCancel={onStop}
                    onLostPointerCapture={onStop}
                    onKeyDown={(event) => {
                      if ((event.code === 'Space' || event.code === 'Enter') && !event.repeat) {
                        event.preventDefault()
                        onUse(place!)
                      }
                    }}
                    onKeyUp={onStop}
                    onBlur={onStop}
                  >
                    <kbd>Space</kbd>
                    <span>누르고 {op.kind === 'stir' ? '젓기' : op.kind === 'drizzle' ? '두르기' : '붓기'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="craft-use"
                    disabled={!canWork || !rightTool}
                    onClick={() => onUse(place!)}
                  >
                    <kbd>Space</kbd>
                    <span>
                      {op.kind === 'machine'
                        ? '추출 버튼'
                        : op.kind === 'pump'
                          ? '한 번 펌핑'
                          : op.kind === 'sprinkle'
                            ? '한 톡 뿌리기'
                            : op.kind === 'ice'
                              ? '한 스쿱 담기'
                              : '리드 덮기'}
                    </span>
                  </button>
                )}
                {op.kind !== 'machine' ? (
                  <button
                    type="button"
                    className="craft-confirm"
                    disabled={!canWork || !!c.tool || !readyToConfirm(op, c.progress)}
                    onClick={() => onConfirm(place!)}
                  >
                    <kbd>F</kbd>
                    <span>{op.kind === 'steam' ? '스팀 시작' : '계량 확인'}</span>
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p>
                {place === 'pickup' ? '주문을 확인하고 F로 손님에게 전달하세요.' : 'E로 컵을 집어 픽업대로 가져가세요.'}
              </p>
              {place === 'pickup' ? (
                <button type="button" className="primary-button" onClick={() => onConfirm(place)}>
                  F · 손님에게 전달
                </button>
              ) : null}
            </>
          )}
          <button type="button" className="craft-pickup" disabled={!!c.tool || !!job} onClick={() => onMoveCup(place!)}>
            <kbd>E</kbd> 컵 집기
          </button>
        </>
      )}
    </section>
  )
}
