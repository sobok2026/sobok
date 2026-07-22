import { type AssessmentProfile, AXIS_POLES, CONTEXT_AXES, type ContextAxisId } from '@deep-type/model'

import type { DeepTypeContent } from '../_lib/types'

type ContextComparisonProps = {
  content: DeepTypeContent
  profile: AssessmentProfile
}

export function ContextComparison({ content, profile }: ContextComparisonProps) {
  return (
    <section className="rounded-4xl border border-page-border bg-page-surface p-6 sm:p-7">
      <h2 className="font-black text-lg">{content.ui.contextTitle}</h2>
      <p className="mt-2 text-page-ink/60 text-sm leading-6">{content.ui.contextBody}</p>
      <div className="mt-5 grid gap-4">
        {CONTEXT_AXES.map((axis) => (
          <ComparisonRow axis={axis} content={content} key={axis} profile={profile} />
        ))}
      </div>
    </section>
  )
}

function ComparisonRow({ axis, content, profile }: ContextComparisonProps & { axis: ContextAxisId }) {
  const copy = content.axes[axis]
  const persona = profile.persona.axes[axis]
  const inner = profile.inner.axes[axis]
  const firstPole = AXIS_POLES[axis][0]

  return (
    <div className="rounded-3xl border border-page-border bg-white p-4">
      <p className="font-black text-sm">{copy.name}</p>
      <div className="mt-3 grid gap-3">
        <ContextBar
          firstShare={persona.firstShare}
          label={content.ui.layerPersona}
          poleLabel={persona.pole === firstPole ? copy.first.label : copy.second.label}
        />
        <ContextBar
          firstShare={inner.firstShare}
          label={content.ui.layerInner}
          poleLabel={inner.pole === firstPole ? copy.first.label : copy.second.label}
        />
      </div>
    </div>
  )
}

function ContextBar({ firstShare, label, poleLabel }: { firstShare: number; label: string; poleLabel: string }) {
  return (
    <div>
      <div className="flex justify-between gap-3 text-xs">
        <span className="font-bold text-page-ink/52">{label}</span>
        <span className="font-bold text-page-ink/70">{poleLabel}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-page-ink/14">
        <div className="h-full bg-page-accent" style={{ width: `${firstShare}%` }} />
      </div>
    </div>
  )
}
