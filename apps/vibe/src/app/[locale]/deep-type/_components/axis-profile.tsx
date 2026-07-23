import { AXIS_POLES, type AxisId, type AxisScore } from '@deep-type/model'

import type { DeepTypeContent } from '../_lib/types'

type AxisProfileProps<TAxis extends AxisId> = {
  axisIds: readonly TAxis[]
  content: DeepTypeContent
  scores: Record<TAxis, AxisScore>
  title: string
}

export function AxisProfile<TAxis extends AxisId>({ axisIds, content, scores, title }: AxisProfileProps<TAxis>) {
  return (
    <section className="rounded-4xl border border-page-border bg-page-surface p-4 sm:p-6">
      <h2 className="font-black text-lg">{title}</h2>
      <div className="mt-5 grid gap-6">
        {axisIds.map((axis) => {
          const score = scores[axis]
          const copy = content.axes[axis]
          const [firstPole, secondPole] = AXIS_POLES[axis]
          const selected = score.pole === firstPole ? copy.first : copy.second

          return (
            <div key={axis}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black text-sm">{copy.name}</p>
                  <p className="mt-1 text-page-ink/56 text-xs leading-5">{selected.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-page-soft px-3 py-1 font-black text-page-accent text-xs">
                  {score.pole} · {selected.label}
                </span>
              </div>
              <div
                aria-label={`${copy.name}: ${copy.first.label} ${score.firstShare}%, ${copy.second.label} ${score.secondShare}%`}
                className="mt-3 flex h-3 overflow-hidden rounded-full bg-page-soft"
                role="img"
              >
                <span className="bg-page-accent" style={{ width: `${score.firstShare}%` }} />
                <span className="bg-page-ink/18" style={{ width: `${score.secondShare}%` }} />
              </div>
              <div className="mt-2 flex justify-between gap-3 text-page-ink/52 text-xs">
                <span>
                  {firstPole} {copy.first.label} {score.firstShare}%
                </span>
                <span className="text-right">
                  {score.secondShare}% {copy.second.label} {secondPole}
                </span>
              </div>
              <p className="mt-2 text-page-ink/42 text-xs">
                {content.ui.clarityLabel} {score.clarity}% · n={score.answered}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
