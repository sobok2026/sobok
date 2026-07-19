import { cn } from '@/utils/cn'

import type { ConfidenceBar } from '../_lib/types'

type ConfidenceBarsProps = {
  bars: readonly ConfidenceBar[]
  borderlineLabel: string
  title: string
}

// One labeled group of per-axis confidence bars — shared by the final report and the midpoint Inner
// reveal. A borderline axis renders a muted bar + "거의 반반" instead of a confident percentage.
export function ConfidenceBars({ bars, borderlineLabel, title }: ConfidenceBarsProps) {
  return (
    <div className="mt-5">
      <p className="font-bold text-page-ink/48 text-xs">{title}</p>
      <div className="mt-2 grid gap-2.5">
        {bars.map((bar) => (
          <div key={bar.axisId}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-page-ink/56">{bar.axisName}</span>
              <span className="font-bold">
                {bar.poleLabel}
                <span className="ml-1 font-normal text-page-ink/44 text-xs">
                  {bar.borderline ? borderlineLabel : `${bar.confidence}%`}
                </span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-page-soft">
              <div
                className={cn('h-full rounded-full', bar.borderline ? 'bg-page-ink/25' : 'bg-page-accent')}
                style={{ width: `${Math.max(bar.confidence, 6)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
