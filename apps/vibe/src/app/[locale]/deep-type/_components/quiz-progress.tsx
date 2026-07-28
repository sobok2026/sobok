import { cn } from '@/utils/cn'

export type ProgressSegment = {
  count: number
  label: string
}

type QuizProgressProps = {
  answered: number
  segments: readonly ProgressSegment[]
}

// One bar for the whole run, split into labelled stretches. The alternative — a bar per block, reset at each
// boundary — is what makes a long questionnaire feel like three questionnaires, and the free run is deliberately
// one screen from the first item to the last.
//
// The segment widths come from the item counts, so a stretch of three does not get the same third of the bar as
// a stretch of twelve. Only the current stretch shows its label: three labels at 11px are noise, and the one
// that matters is the one being answered.
export function QuizProgress({ answered, segments }: QuizProgressProps) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0)
  let consumed = 0

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-bold text-page-ink/56 text-xs">{currentLabel(answered, segments)}</p>
        <p className="text-page-ink/40 text-xs tabular-nums">
          {Math.min(answered + 1, total)} / {total}
        </p>
      </div>
      <div
        aria-label={currentLabel(answered, segments)}
        aria-valuemax={total}
        aria-valuemin={0}
        aria-valuenow={answered}
        className="mt-2 flex gap-1"
        role="progressbar"
      >
        {segments.map((segment) => {
          const start = consumed
          consumed += segment.count
          const filled = Math.min(Math.max(answered - start, 0), segment.count)

          return (
            <div
              className={cn('h-2 overflow-hidden rounded-full bg-page-soft')}
              key={segment.label}
              style={{ flexGrow: segment.count }}
            >
              <div
                className="h-full rounded-full bg-page-accent transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${(filled / segment.count) * 100}%` }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function currentLabel(answered: number, segments: readonly ProgressSegment[]): string {
  let consumed = 0
  for (const segment of segments) {
    consumed += segment.count
    if (answered < consumed) {
      return segment.label
    }
  }
  return segments.at(-1)?.label ?? ''
}
