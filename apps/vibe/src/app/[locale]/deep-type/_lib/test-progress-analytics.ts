'use client'

import { FREE_ITEM_COUNT } from '@deep-type/questionnaire'
import { track } from '@sobok/analytics/browser'
import type { Locale } from '@sobok/domain/locale'

// N1 raised the free run from nineteen items to twenty-seven. Whether that was right is a question about
// where people stop answering, and nothing else in the funnel can answer it: `view_item` fires on the paywall,
// which only the finishers reach, so today a drop at item twenty and a drop at item two look identical.
//
// Buckets rather than one event per answer. Twenty-seven events per visitor buys resolution nobody reads and
// costs a data-layer push on every tap; five checkpoints separate "opened it" from "gave up in the middle"
// from "finished", which is the whole decision.
const PROGRESS_FRACTIONS = [0.25, 0.5, 0.75, 1] as const

/**
 * Answered-count checkpoints, derived from the instrument. The first item is its own bucket: it is the
 * difference between a visitor who bounced off the picker and one who started answering, and no fraction of a
 * 27-item run lands on 1.
 */
export const FREE_PROGRESS_CHECKPOINTS: readonly number[] = [
  1,
  ...PROGRESS_FRACTIONS.map((fraction) => Math.round(FREE_ITEM_COUNT * fraction)),
]

const CHECKPOINTS = new Set(FREE_PROGRESS_CHECKPOINTS)

export type FreeSegment = 'core' | 'drain' | 'type'

/**
 * Fires once per checkpoint, on the answer that reaches it. `answered` counts every free item — Likert and
 * forced-choice alike — because the question being asked is where the run is abandoned, and a visitor who
 * quits does not care which block they were in.
 */
export function trackFreeProgress(answered: number, segment: FreeSegment, locale: Locale): void {
  if (!CHECKPOINTS.has(answered)) {
    return
  }

  track('deeptype_free_progress', {
    answered,
    locale,
    percent: Math.round((answered / FREE_ITEM_COUNT) * 100),
    segment,
    total: FREE_ITEM_COUNT,
  })
}

/** The picker is the first thing after the landing CTA, so its own drop-off is the funnel's first step. */
export function trackFreeDeclaration(personaSource: 'declared' | 'unknown', locale: Locale): void {
  track('deeptype_free_declared', { locale, persona_source: personaSource })
}
