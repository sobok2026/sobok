import type { WorkDimension } from '@deep-type/model'
import { PAID_LIKERT_PRESENTATION, PAID_WORK_PRESENTATION } from '@deep-type/presentation'

/**
 * One refinement sitting as the screen walks it: sixteen Likert items and then twenty-one forced-choice items.
 * The work items carry their dimension because the block is presented one dimension at a time — six questions
 * about what work pulls you in read as one question asked six ways, and the heading is what tells the reader
 * that rather than leaving them to notice.
 */
export type PaidStep = { id: string; kind: 'likert' } | { dimension: WorkDimension; id: string; kind: 'work' }

export const PAID_RUN: readonly PaidStep[] = [
  ...PAID_LIKERT_PRESENTATION.map((item): PaidStep => ({ id: item.id, kind: 'likert' })),
  ...PAID_WORK_PRESENTATION.map((item): PaidStep => ({ dimension: item.dimension, id: item.id, kind: 'work' })),
]

export type PaidSegment = { count: number; kind: 'likert' } | { count: number; dimension: WorkDimension }

/**
 * The progress bar's stretches, measured off the run. One for the Likert block and one per work dimension, in
 * presentation order, so the bar's boundaries and the headings can never disagree.
 */
export const PAID_SEGMENTS: readonly PaidSegment[] = buildSegments()

function buildSegments(): PaidSegment[] {
  const segments: PaidSegment[] = []

  for (const step of PAID_RUN) {
    const last = segments.at(-1)
    const continues =
      last && (step.kind === 'likert' ? 'kind' in last : 'dimension' in last && last.dimension === step.dimension)

    if (last && continues) {
      last.count += 1
    } else {
      segments.push(step.kind === 'likert' ? { count: 1, kind: 'likert' } : { count: 1, dimension: step.dimension })
    }
  }

  return segments
}
