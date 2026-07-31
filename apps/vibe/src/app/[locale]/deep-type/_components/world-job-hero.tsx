import { resolveWorldJob } from '@deep-type/content/world-job'
import type { GemCode, InnerCode } from '@deep-type/model'

import { cn } from '@/utils/cn'

import type { DeepTypeContent } from '../_lib/types'

type WorldJobHeroProps = {
  content: DeepTypeContent
  gem: GemCode
  inner: InnerCode
}

/**
 * The world job is the headline (O3). What a reader takes away from a career test is a role they can picture
 * themselves in, and the eight letters are how it was derived — so the job name is the h1 and the two codes sit
 * under it as chips. The core artwork moved down into the core block, where it illustrates a section instead of
 * standing in for the result.
 *
 * The name is looked up whole from the 256-entry table rather than composed from a core lead and a role noun.
 * Composition is what the origin shipped and it produced 256 strings that read the same.
 */
export function WorldJobHero({ content, gem, inner }: WorldJobHeroProps) {
  const worldJob = resolveWorldJob(inner, gem)

  return (
    <header className="rounded-3xl border border-page-border bg-page-surface p-6 text-center shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:rounded-4xl sm:p-8">
      <h1 className="break-keep font-black text-3xl leading-tight sm:text-4xl">{worldJob.name}</h1>
      <p className="mx-auto mt-3 max-w-md break-keep text-page-ink-soft leading-8">{worldJob.family.method}</p>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <CodeChip label={content.ui.layerInner} value={inner} />
        <CodeChip accent label={content.ui.layerGem} value={gem} />
      </div>
    </header>
  )
}

function CodeChip({ accent, label, value }: { accent?: boolean; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-page-border bg-white p-3 text-center">
      <p className="text-page-ink-muted text-xs">{label}</p>
      <p className={cn('mt-1 font-black text-sm tracking-wide', accent ? 'text-page-accent-strong' : 'text-page-ink')}>
        {value}
      </p>
    </div>
  )
}
