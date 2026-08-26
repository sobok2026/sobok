import type { TutorialStep } from './game-model'
import { TUTORIAL_ORDER } from './game-model'

type TutorialCopyView = {
  kicker: string
  title: string
  description: string
}

type TutorialObjectiveView = {
  goal: string
  status: string
  ready: boolean
}

type TutorialCoachProps = {
  step: TutorialStep
  copy: TutorialCopyView
  stepIndex: number
  objective: TutorialObjectiveView | null
  actionLabel: string
  onSkip: () => void
  onFocusTarget: () => void
}

export function TutorialCoach({
  step,
  copy,
  stepIndex,
  objective,
  actionLabel,
  onSkip,
  onFocusTarget,
}: TutorialCoachProps) {
  return (
    <aside className="tutorial-coach" aria-live="polite" data-step={step}>
      <header>
        <span>{copy.kicker}</span>
        <p>
          현장 훈련 <b>{stepIndex}</b> / {TUTORIAL_ORDER.length}
        </p>
        <button type="button" onClick={onSkip} aria-label="현장 훈련 건너뛰기">
          건너뛰기
        </button>
      </header>
      <div>
        <span className="tutorial-sigil" aria-hidden="true">
          {step === 'merge' ? 'Ⅱ' : step === 'deploy' ? '◆' : step === 'orders' ? '⌘' : step === 'focus' ? '✦' : '⚔'}
        </span>
        <div>
          <strong>{copy.title}</strong>
          <p>{copy.description}</p>
          {objective ? (
            <span className="tutorial-objective" data-ready={objective.ready ? 'true' : 'false'}>
              <i aria-hidden="true">{objective.ready ? '✓' : '○'}</i>
              <span>
                <small>통과 조건</small>
                <b>{objective.goal}</b>
              </span>
              <em>{objective.status}</em>
            </span>
          ) : null}
        </div>
      </div>
      <footer>
        <i>
          <b style={{ width: `${(stepIndex / TUTORIAL_ORDER.length) * 100}%` }} />
        </i>
        <button type="button" onClick={onFocusTarget}>
          {actionLabel} <span aria-hidden="true">›</span>
        </button>
      </footer>
    </aside>
  )
}
