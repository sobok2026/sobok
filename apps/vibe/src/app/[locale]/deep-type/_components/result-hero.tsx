import { type AssessmentProfile, AXIS_POLES, GEM_AXES } from '@deep-type/model'

import { cn } from '@/utils/cn'

import type { DeepTypeContent } from '../_lib/types'
import { GemArtwork } from './gem-artwork'

type ResultHeroProps = {
  content: DeepTypeContent
  profile: AssessmentProfile
  refined?: boolean
}

export function ResultHero({ content, profile, refined = false }: ResultHeroProps) {
  const gemName = content.gemNames[profile.gem.code]
  const motiveLabels = GEM_AXES.map((axis) => {
    const firstPole = AXIS_POLES[axis][0]
    return profile.gem.axes[axis].pole === firstPole ? content.axes[axis].first.label : content.axes[axis].second.label
  })

  return (
    <header className="rounded-3xl sm:rounded-4xl border border-page-border bg-page-surface p-4 text-center shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
      <GemArtwork gemCode={profile.gem.code} />

      {refined ? (
        <p className="mx-auto mt-5 w-fit rounded-full bg-page-accent/10 px-3 py-1 font-bold text-page-accent text-xs">
          {content.ui.refinedLabel}
        </p>
      ) : null}
      <h1 className={cn('break-keep font-black text-3xl sm:text-4xl', refined ? 'mt-3' : 'mt-6')}>{gemName}</h1>
      <p className="mt-2 text-page-ink/58 text-sm">{motiveLabels.join(' · ')}</p>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <CodeChip label={content.ui.layerInner} value={profile.inner.code} />
        <CodeChip accent label={content.ui.layerGem} value={profile.gem.code} />
      </div>

      <p className="mt-6 px-2 text-left text-page-ink/72 leading-8 sm:px-0">
        {content.ui.summaryTemplate
          .replace('{inner}', profile.inner.code)
          .replace('{gem}', `${gemName} (${profile.gem.code})`)}
      </p>
    </header>
  )
}

function CodeChip({ accent, label, value }: { accent?: boolean; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-page-border bg-white p-3 text-center">
      <p className="text-page-ink/48 text-xs">{label}</p>
      <p className={cn('mt-1 font-black text-sm', accent ? 'text-page-accent' : 'text-page-ink')}>{value}</p>
    </div>
  )
}
