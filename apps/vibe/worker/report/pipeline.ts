import type { AssessmentProfile, PersonaCode } from '@deep-type/model'
import type { Locale } from '@sobok/domain/locale'

import { buildReportProfile, type ReportProfile } from './profile'
import { generateEngineReport, mergeDrainSittings } from './rules'
import type { ReportSection } from './section-data'

// The two-pass contract, expressed as pure functions so the route is glue. Everything that decides whether a
// report may be delivered, cached or stamped lives here: a Hono handler cannot be exercised without a
// Hyperdrive socket, and these are the decisions that must not drift.

/** Mirrors the `report_status` enum. Declared here so this module stays free of drizzle. */
export type ReportPassStatus = 'done' | 'failed' | 'generating' | 'pending'

/**
 * The engine wrote the body, so the model column names the engine. `'sample'` used to appear here when the
 * killswitch was on and the row still said `done`; there is no placeholder body any more, and a rules-only
 * report is the normal shape of a report whose narrator is off.
 */
export const ENGINE_MODEL = 'rules-only'

/** Recorded on `narrative_error` when the narrator was never asked. Failure of the pass, not of the report. */
export const NARRATIVE_DISABLED_REASON = 'llm disabled'

/**
 * The narration switch IS the destination, exactly as GA4's is (`DEEPTYPE_GA4_MEASUREMENT_ID`): a deployment
 * with no model id has nowhere to send the pass and skips it, and the shared Anthropic credential stays bound
 * and unspent. No in-code default model — a fallback id here would be a second copy of what wrangler already
 * pins, free to drift from it. Absent and "" both mean off; the report itself never depends on this.
 */
export function narrativeModelOf(value: string | undefined): string | null {
  return value || null
}

/**
 * D4 = A. The narrative pass is over only when it reached a terminal state; until then the buyer reads the
 * engine report with their withdrawal right intact. An exhausted retry budget on a `generating` row is
 * deliberately NOT settled: a live worker may still be holding that lease, and stamping mid-write would both
 * cache a half-written row and take away a refund the buyer is still owed.
 */
export function isReportSettled(narrativeStatus: ReportPassStatus): boolean {
  return narrativeStatus === 'done' || narrativeStatus === 'failed'
}

export interface ReportDeliveryPlan {
  /** The CACHED Hyperdrive may only serve a row nothing will write to again. */
  readCached: boolean
  /** `viewed_at` closes the withdrawal window, so it may only be stamped on a fully-delivered report. */
  stamp: boolean
}

/**
 * One condition, two consumers. Split into two expressions they drift, and the first drift caches a row whose
 * narrative has not landed — `queries/report.ts` reads the CACHED binding on the premise that a done row is
 * immutable.
 */
export function reportDelivery(narrativeStatus: ReportPassStatus): ReportDeliveryPlan {
  const settled = isReportSettled(narrativeStatus)
  return { readCached: settled, stamp: settled }
}

/** Exactly the columns the two passes read. Assembled by `queries/result.ts`, consumed only here. */
export interface ReportSourceRow {
  declaredPersona: PersonaCode | null
  freeProfile: AssessmentProfile
  freeWorkAnswersAt: Date | null
  locale: Locale
  /** When the paid block landed. Null on rows that never took it. */
  refinedAt: Date | null
  refinedProfile: AssessmentProfile | null
}

export interface EngineCommit {
  model: typeof ENGINE_MODEL
  sections: readonly ReportSection[]
}

export interface ReportPassPlan {
  engine: EngineCommit
  /** What the narrator is allowed to see. Built here so a route cannot assemble a wider one. */
  profile: ReportProfile
}

/**
 * Null when the row cannot feed the engine — no paid sitting, or a stored profile whose tier contradicts the
 * column it came out of. Null rather than a throw: the caller marks the report failed either way, and a
 * generation path that distinguishes "unusable input" from "the engine broke" needs both to be values.
 */
export function planReportPasses(source: ReportSourceRow): ReportPassPlan | null {
  const { freeProfile, refinedProfile } = source
  if (freeProfile.tier !== 'free' || refinedProfile === null || refinedProfile.tier !== 'refined') {
    return null
  }

  const document = generateEngineReport({
    declaredPersona: source.declaredPersona,
    free: freeProfile,
    locale: source.locale,
    mergedDrainWindow: mergeDrainSittings(source.freeWorkAnswersAt, source.refinedAt),
    refined: refinedProfile,
  })

  return {
    engine: {
      model: ENGINE_MODEL,
      sections: document.sections,
    },
    profile: buildReportProfile(source.locale, refinedProfile),
  }
}
