import { cn } from '@/utils/cn'

import type { AxisBandMovement, DrainSignatureData, SelfReportAxis } from '../../_lib/api'

// Diagrams the report draws in code. Nothing here is a new image asset: the deep-type art budget is spent on
// the 64 webp cards under `_assets`, and these are the five places where the thing being shown is a relation
// rather than a subject — a band on a three-rung ladder, a spread narrowing to one strand, a week with a
// shape, two codes side by side, three routes leaving the same point.
//
// WHAT THESE MAY NOT DRAW. §4.3 retires the percentile family and forbids ranking axes against each other, so
// no mark here may have a length proportional to a score. The ladder has exactly three discrete rungs because
// the band has exactly three values; a bar whose width was `|lean| * 100` is the reading the band wording
// exists to prevent, and it is the reason the free screen has no bars either. Every diagram below draws a
// value the engine already settled, and every one of them carries the same value in text beside it — the
// picture is never the only place a fact appears.
//
// All decorative: `aria-hidden` throughout, with the same information in the surrounding copy for anyone who
// never sees them.

/**
 * One axis on the settled ruler. Three rungs, filled up to `step`, with the movement arrow beside it — that
 * arrow is the whole of D14 on screen, and it is why this exists as a mark rather than as another line of text
 * in a list of eight.
 */
export function BandLadder({ axis }: { axis: AxisBandMovement }) {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-1">
      {[1, 2, 3].map((rung) => (
        <span
          className={cn(
            'block h-3.5 w-1.5 rounded-full transition-colors',
            rung <= axis.step ? 'bg-page-accent' : 'bg-page-border',
          )}
          key={rung}
        />
      ))}
      <ShiftMark direction={axis.shiftDirection} />
    </span>
  )
}

const SHIFT_ROTATION = { down: 'rotate-180', same: 'rotate-90', up: '' } as const

/**
 * Up, flat or down. `same` is drawn as a sideways arrow rather than as nothing: an absent mark reads as a
 * missing value, and "the ruler landed where it already was" is a result the paid pass produced.
 */
function ShiftMark({ direction }: { direction: AxisBandMovement['shiftDirection'] }) {
  return (
    <svg
      className={cn(
        'ml-1 h-3 w-3',
        SHIFT_ROTATION[direction],
        direction === 'same' ? 'text-page-ink/28' : 'text-page-accent',
      )}
      fill="none"
      viewBox="0 0 12 12"
    >
      <path d="M6 10V2M6 2 2.5 5.5M6 2l3.5 3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  )
}

/**
 * The drain spread as strands converging on one point. One strand means the picks settled on a single
 * condition; three means they stayed spread. The count IS the finding — `DRAIN_SPREAD_PAID` says so in words
 * directly under this — so the drawing carries no length, thickness or ordering of its own.
 */
export function DrainStrands({ strands }: { strands: DrainSignatureData['strands'] }) {
  // Fixed geometry per count rather than a computed fan: three hand-placed curves read as a signature, and a
  // generated fan at n = 1 collapses into a straight line that looks like a rendering bug.
  const paths = {
    1: ['M40 4V52'],
    2: ['M18 4C18 26 40 30 40 52', 'M62 4C62 26 40 30 40 52'],
    3: ['M10 4C10 26 40 30 40 52', 'M40 4V52', 'M70 4C70 26 40 30 40 52'],
  }[strands]

  return (
    <svg aria-hidden="true" className="h-14 w-20 shrink-0 text-page-accent" fill="none" viewBox="0 0 80 56">
      <title />
      {paths.map((d) => (
        <path d={d} key={d} opacity="0.5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      ))}
      <circle cx="40" cy="52" fill="currentColor" r="3.5" />
    </svg>
  )
}

/**
 * The seven-day spine. A quest day marker: filled circle, day number, and a rule down to the next one. The
 * last day closes the line so the week reads as finite — the point of a seven-day quest is that it ends.
 */
export function QuestSpine({ day, last }: { day: number; last: boolean }) {
  return (
    <div aria-hidden="true" className="flex shrink-0 flex-col items-center self-stretch">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-page-accent font-black text-[11px] text-white tabular-nums">
        {day}
      </span>
      {last ? null : <span className="mt-1 w-px flex-1 bg-page-border" />}
    </div>
  )
}

/**
 * Two four-letter codes with their agreement marked per position. Drawn as a grid rather than as two strings
 * so that a split axis is visible without reading both codes letter by letter — which is the one thing this
 * section is for.
 *
 * A split is marked with a hollow ring and a match with a filled dot. Neither mark is a cross: D13 removed the
 * measured persona precisely so that neither code is evidence about the other, and an X would say one of them
 * failed.
 */
export function CodeCompare({ axes }: { axes: readonly SelfReportAxis[] }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-4 gap-1.5">
      {axes.map((axis) => (
        <div className="rounded-2xl border border-page-border bg-white px-1 py-3 text-center" key={axis.id}>
          <p className="font-black text-page-ink/64 text-sm">{axis.declared.code}</p>
          <span
            className={cn(
              'mx-auto my-1.5 block h-2 w-2 rounded-full border-2',
              axis.matched ? 'border-page-accent bg-page-accent' : 'border-page-ink/24 bg-transparent',
            )}
          />
          <p className={cn('font-black text-sm', axis.matched ? 'text-page-ink/64' : 'text-page-accent')}>
            {axis.measured.code}
          </p>
        </div>
      ))}
    </div>
  )
}

/** Three routes leaving one point. Same stroke on all three: the section presents them at equal weight. */
export function PathFork() {
  return (
    <svg
      aria-hidden="true"
      className="h-12 w-full text-page-accent"
      fill="none"
      viewBox="0 0 240 48"
      preserveAspectRatio="none"
    >
      <title />
      <path
        d="M8 24h40M48 24c24 0 24-16 48-16h136M48 24h184M48 24c24 0 24 16 48 16h136"
        opacity="0.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="8" cy="24" fill="currentColor" r="4" />
    </svg>
  )
}
