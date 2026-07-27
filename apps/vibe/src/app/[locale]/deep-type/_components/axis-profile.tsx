import {
  AXIS_POLES,
  type AxisId,
  type ClarityBand,
  type FreeAxisScore,
  type RefinedAxisScore,
  type TentativeBand,
} from '@deep-type/model'

import type { DeepTypeContent } from '../_lib/types'

type ProfileAxisScore = FreeAxisScore | RefinedAxisScore

// `pole` is frozen at the free pass and `firstShare` is recomputed over all five items, so on a split axis the
// bar and the letter disagree by construction. The bar keeps the cumulative number — hiding the added evidence
// to protect the label would be the dishonest fix, and §8.2 already tells every reader the letter cannot move —
// and the disagreement is named instead. `splitNotice` is required rather than optional so that a caller
// handing over refined scores cannot render the contradiction without the sentence that explains it.
//
// `evidenceSplit?: never` on the free member is the discriminant and is load-bearing. `RefinedAxisScore` is
// structurally a `FreeAxisScore` with extra fields, so without it refined scores also satisfy the free member
// and the required `splitNotice` quietly becomes optional. Declaring the field absent is what makes a refined
// `scores` fail that member and fall through to the one that demands the sentence.
type ScoresProps<TAxis extends AxisId> =
  | { scores: Record<TAxis, FreeAxisScore & { evidenceSplit?: never }>; splitNotice?: never }
  | { scores: Record<TAxis, RefinedAxisScore>; splitNotice: string }

type AxisProfileProps<TAxis extends AxisId> = {
  axisIds: readonly TAxis[]
  content: DeepTypeContent
  title: string
} & ScoresProps<TAxis>

type ClarityBandKey = keyof DeepTypeContent['ui']['clarityBands']

// The free and paid rulers cut at different numbers, so this is a lookup and never a threshold. Scoring is the
// only place allowed to know where a band starts; the screen just names the band it was handed.
const BAND_KEY = {
  distinct3: 'clear',
  moderate3: 'moderate',
  faint3: 'slight',
  distinct: 'clear',
  moderate: 'moderate',
  faint: 'slight',
  tie: 'slight',
} as const satisfies Record<TentativeBand | ClarityBand, ClarityBandKey>

/** The paid pass reports the settled ruler; the free pass only has the provisional one. */
function bandKeyOf(score: ProfileAxisScore): ClarityBandKey {
  return BAND_KEY['band5' in score ? score.band5 : score.band3]
}

function isSplit(score: ProfileAxisScore): boolean {
  return 'evidenceSplit' in score && score.evidenceSplit
}

export function AxisProfile<TAxis extends AxisId>({
  axisIds,
  content,
  scores,
  splitNotice,
  title,
}: AxisProfileProps<TAxis>) {
  return (
    <section className="rounded-3xl sm:rounded-4xl border border-page-border bg-page-surface p-4 sm:p-6">
      <h2 className="font-black text-lg">{title}</h2>
      <div className="mt-5 grid gap-6">
        {axisIds.map((axis) => {
          const score: ProfileAxisScore = scores[axis]
          const copy = content.axes[axis]
          const [firstPole, secondPole] = AXIS_POLES[axis]
          const selected = score.pole === firstPole ? copy.first : copy.second
          const firstShare = Math.round(score.firstShare)
          const secondShare = 100 - firstShare
          const clarityBand = content.ui.clarityBands[bandKeyOf(score)]

          return (
            <div key={axis}>
              <div className="flex items-start justify-between gap-4">
                <p className="font-black text-sm">{copy.name}</p>
                <span className="shrink-0 rounded-full bg-page-soft px-3 py-1 font-black text-page-accent text-xs">
                  {score.pole ? `${score.pole} · ` : ''}
                  {selected.label}
                </span>
              </div>
              <p className="mt-1 text-page-ink/56 text-xs leading-5">{selected.description}</p>
              <div
                aria-label={`${copy.name}: ${copy.first.label} ${firstShare}%, ${copy.second.label} ${secondShare}%`}
                className="mt-3 flex h-3 overflow-hidden rounded-full bg-page-soft"
                role="img"
              >
                <span className="bg-page-accent" style={{ width: `${firstShare}%` }} />
                <span className="bg-page-ink/18" style={{ width: `${secondShare}%` }} />
              </div>
              <div className="mt-2 flex justify-between gap-3 text-page-ink/52 text-xs">
                <span>
                  {firstPole} {copy.first.label} {firstShare}%
                </span>
                <span className="text-right">
                  {secondShare}% {copy.second.label} {secondPole}
                </span>
              </div>
              <p className="mt-2 text-page-ink/42 text-xs">
                {content.ui.clarityLabel} · {clarityBand}
              </p>
              {isSplit(score) && splitNotice ? (
                <p className="mt-2 rounded-2xl bg-page-soft px-3 py-2 text-page-ink/60 text-xs leading-5">
                  {splitNotice}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
