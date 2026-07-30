import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

import type { DetailedFacet } from '../../_lib/api'
import { CARD_CLASS_NAME, GROUPED_LIST_CLASS_NAME, GROUPED_ROW_CLASS_NAME } from '../../_lib/surface'

// The pieces every report section is built from. They exist so that twelve sections can look like one report:
// a heading, an intro, the section's own shape, and — where the narrator is switched on — the model's
// paragraph under a rule at the bottom.
//
// The narration carries no badge of its own. It reads as one more paragraph of the section it was written
// over, which is what it is.

export interface SectionShellProps {
  /** Rendered between the intro and the body, for sections that open on a picture. */
  art?: ReactNode
  children: ReactNode
  intro: string
  /** Model text written over this section, or null where the engine's section stands alone. */
  narrative?: string | null
  title: string
}

export function SectionShell({ art, children, intro, narrative, title }: SectionShellProps) {
  return (
    <section className={CARD_CLASS_NAME}>
      <h2 className="break-keep font-black text-lg">{title}</h2>
      <p className="mt-1.5 break-keep text-page-ink/56 text-sm leading-6">{intro}</p>
      {art ? <div className="mt-4">{art}</div> : null}
      <div className="mt-5">{children}</div>
      {narrative ? (
        <div className="mt-6 border-page-border border-t pt-4">
          <p className="whitespace-pre-line break-keep text-page-ink/68 leading-8">{narrative}</p>
        </div>
      ) : null}
    </section>
  )
}

/** `label — value`, the report's one-line field. Never composed with a particle; see the engine's own note. */
export function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="break-keep text-page-ink/64 text-sm leading-6">
      <span className="text-page-ink/40">{label}</span>
      <span aria-hidden="true"> — </span>
      <span className="font-bold text-page-ink/76">{value}</span>
    </p>
  )
}

/** A short label above a paragraph. The composed reading's kicker, and the strength groups' heading. */
export function Kicker({ children }: { children: ReactNode }) {
  return <p className="font-black text-page-accent text-xs tracking-wide">{children}</p>
}

const CONFIDENCE_TONE = {
  sufficient: 'bg-page-success/10 text-page-success',
  needsCheck: 'bg-page-accent/10 text-page-accent',
  needsMoreInput: 'bg-page-soft text-page-ink/56',
} as const

/**
 * The three-rung confidence ladder, §6.3's whole vocabulary. Colour distinguishes the rungs, and the label is
 * always present beside it: a colour-only signal would be a percentage by another means for anyone who reads
 * the palette and not the word.
 */
export function ConfidenceBadge({ label, level }: { label: string; level: keyof typeof CONFIDENCE_TONE }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-black text-xs',
        CONFIDENCE_TONE[level],
      )}
    >
      {label}
    </span>
  )
}

/**
 * A work facet as the report shows it: the name, the authored paragraph, and the one reversible choice it
 * suggests. The three used to be a bullet, a missing middle and another bullet.
 */
export function FacetCard({ facet }: { facet: DetailedFacet }) {
  return (
    <li className={GROUPED_ROW_CLASS_NAME}>
      <p className="break-keep font-black text-sm">{facet.label}</p>
      <p className="mt-1.5 break-keep text-page-ink/68 text-sm leading-6">{facet.detail}</p>
      <p className="mt-2 break-keep text-page-ink/48 text-xs leading-5">{facet.action}</p>
    </li>
  )
}

export function FacetList({ facets }: { facets: readonly DetailedFacet[] }) {
  if (facets.length === 0) {
    return null
  }
  return (
    <ul className={cn(GROUPED_LIST_CLASS_NAME, 'sm:grid sm:gap-3')}>
      {facets.map((facet) => (
        <FacetCard facet={facet} key={facet.id} />
      ))}
    </ul>
  )
}

/** Name-only chips, for the places a list is context rather than content. */
export function FacetChips({ facets }: { facets: readonly DetailedFacet[] }) {
  if (facets.length === 0) {
    return null
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {facets.map((facet) => (
        <li
          className="rounded-full border border-page-border bg-white px-3 py-1 font-bold text-page-ink/68 text-xs"
          key={facet.id}
        >
          {facet.label}
        </li>
      ))}
    </ul>
  )
}

/** A heading for a block inside a section — one step below the section title, one above a row. */
export function BlockHeading({ children }: { children: ReactNode }) {
  return <h3 className="break-keep font-black text-page-ink/76 text-sm">{children}</h3>
}

/** The quiet closing line several sections end on. */
export function ClosingNote({ children }: { children: ReactNode }) {
  return <p className="mt-5 break-keep text-page-ink/48 text-xs leading-5">{children}</p>
}
