import {
  type ClarityBand,
  type DrainFacet,
  type DrainSpread,
  type TentativeBand,
  WORK_FACETS,
  type WorkFacetId,
} from './model'

/**
 * A facet as copy names it. Three strings, and it was declared twice: once in `worker/report/profile.ts` and
 * once in `worker/report/rules.ts`, whose comment justified the copy by saying `profile.ts` imports
 * `worker/db/queries/result` and would drag drizzle into any program that type-checks it. It does not — that
 * module declared its own input type precisely to avoid the import — so the reason had outlived itself while the
 * duplicate stayed.
 */
export interface NamedFacet<Facet extends WorkFacetId = WorkFacetId> {
  /** A concrete choice that expresses the facet. Authored copy, never advice composed per reader. */
  action: string
  /**
   * Parameterised so a drain list stays a list of drain facets. Callers index dimension-specific tables with
   * this — the free engine's tests index `DRAIN_LABELS` off it — and a `WorkFacetId` here would let a purpose
   * facet be looked up in the drain table without a type error.
   */
  id: Facet
  label: string
}

/** The label-table shape both the free and the paid facet tables satisfy. */
export type FacetLabels<Facet extends WorkFacetId> = Readonly<Record<Facet, { action: string; name: string }>>

/**
 * Facet ids to named facets. Generic over the table, so it carries no copy of its own and the free bundle may
 * import it — which is the whole reason it can live here instead of once per caller. It was written out three
 * times: `nameFacets` in the paid engine, `namedFacets` in the narration profile, and inline in the free engine.
 */
export function nameFacets<Facet extends WorkFacetId>(
  facets: readonly Facet[],
  labels: FacetLabels<Facet>,
): readonly NamedFacet<Facet>[] {
  return facets.map((id) => ({ action: labels[id].action, id, label: labels[id].name }))
}

/**
 * The three numbers a forced-choice count vector yields: who is tied at the top, how far ahead the top is, and
 * the top count itself.
 *
 * One function because the arithmetic was written out three times — in `tallyFacets`, in `resolveDrainBand`, and
 * again in the paid engine's `paidOnlyDrain` — and all three had to agree for a band to mean the same thing in
 * the free result and in the report. Leaders come out in the declaration order of `facets`, which is the fixed
 * display order every screen uses.
 */
export function rankFacetCounts<Facet extends WorkFacetId>(
  facets: readonly Facet[],
  counts: Readonly<Record<Facet, number>>,
): { leaders: readonly Facet[]; separation: number; top: number } {
  const ranked = facets.map((facet) => counts[facet] ?? 0).sort((a, b) => b - a)
  const top = ranked[0] ?? 0

  return {
    leaders: facets.filter((facet) => counts[facet] === top),
    separation: top - (ranked[1] ?? 0),
    top,
  }
}

/**
 * How many drain facets the band puts on screen, and the facets themselves.
 *
 * The band is a confidence statement rather than a count of ties: at `double` there IS a top facet, but the
 * runner-up sits one pick behind, so naming both is what keeps the real leader inside the shown set. A tally's
 * `leaders` cannot serve this — it holds the tied set, which is a single facet in every reachable `double` vector
 * and in most `triple` ones, so reading it made "두 조건이 비슷하게 나왔어요" describe a list of one.
 *
 * Ties break on `WORK_FACETS.drain` declaration order, which is the fixed display order; Array#sort is stable, so
 * starting from that array is the whole tiebreak. Both engines call this — the free screen showing two or three
 * and the paid report showing one, two or three — and they used to each have their own copy with its own count
 * table, the free one silently missing the `single` row its type cannot reach.
 */
export function shownDrainFacets(
  counts: Readonly<Record<DrainFacet, number>>,
  spread: DrainSpread,
): readonly DrainFacet[] {
  return [...WORK_FACETS.drain].sort((a, b) => counts[b] - counts[a]).slice(0, DRAIN_SHOWN_COUNT[spread])
}

const DRAIN_SHOWN_COUNT = { double: 2, single: 1, triple: 3 } as const satisfies Record<DrainSpread, number>

export const BAND_RANK = {
  distinct3: 2,
  moderate3: 1,
  faint3: 0,
  distinct: 2,
  moderate: 1,
  faint: 0,
  tie: -1,
} as const satisfies Record<TentativeBand | ClarityBand, number>

/**
 * The weaker of two tentative bands. A combo card inherits `min(A, B)` — see `rules/free.ts` `comboCards`.
 *
 * Generic so the caller's narrowing survives: the strength cards have already excluded `faint3` by the time they
 * compare two parents, and a plain `TentativeBand` return would put it back.
 */
export function weakerTentativeBand<Band extends TentativeBand>(a: Band, b: Band): Band {
  return BAND_RANK[a] <= BAND_RANK[b] ? a : b
}
