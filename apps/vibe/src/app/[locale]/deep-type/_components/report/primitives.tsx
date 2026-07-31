import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

import type { DetailedFacet } from '../../_lib/api'
import { CARD_CLASS_NAME, GROUPED_LIST_CLASS_NAME, GROUPED_ROW_CLASS_NAME, REPORT_TYPE } from '../../_lib/surface'

// The pieces every report section is built from. They exist so that twelve sections can look like one report:
// a numbered heading, a deck, the section's own shape, and — where the narrator is switched on — the model's
// paragraph under a rule at the bottom.
//
// The narration carries no badge of its own. It reads as one more paragraph of the section it was written
// over, which is what it is.

export interface SectionShellProps {
  /** Rendered between the deck and the body, for sections that open on a picture. */
  art?: ReactNode
  children: ReactNode
  /** Anchor target for the contents list. Also what the heading's `id` is derived from. */
  id: string
  intro: string
  /** Model text written over this section, or null where the engine's section stands alone. */
  narrative?: string | null
  /** Position in the document, 1-based. Printed, because a reader who jumps needs to know where they landed. */
  number: number
  title: string
}

export function SectionShell({ art, children, id, intro, narrative, number, title }: SectionShellProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      // The header is `fixed`, so an anchor jump would otherwise park the heading underneath it.
      className={cn(CARD_CLASS_NAME, 'scroll-mt-[calc(var(--spacing-header)+var(--safe-area-top)+0.75rem)]')}
      id={id}
    >
      <header className="border-page-border border-b pb-4">
        {/* The numeral is decorative: the contents list and the heading below already name the section, and a
            screen reader announcing '03' before every title would add twelve words that mean nothing. */}
        <p aria-hidden="true" className="font-black text-page-accent-strong text-sm tabular-nums">
          {String(number).padStart(2, '0')}
        </p>
        <h2 className={cn('mt-1', REPORT_TYPE.title)} id={`${id}-title`}>
          {title}
        </h2>
        <p className={cn('mt-2', REPORT_TYPE.deck)}>{intro}</p>
      </header>
      {art ? <div className="mt-5">{art}</div> : null}
      <div className="mt-6">{children}</div>
      {narrative ? (
        <div className="mt-7 border-page-border border-t pt-5">
          <p className={cn('whitespace-pre-line', REPORT_TYPE.body)}>{narrative}</p>
        </div>
      ) : null}
    </section>
  )
}

/**
 * The report's labelled row, as a description list.
 *
 * It used to be one paragraph reading `label — value` with the VALUE in bold, which put the heaviest weight in
 * a section on its metadata: on a quest day the words after '오늘의 질문' came out darker than the task the day
 * is actually about. Label and value now differ by tone and position instead of by weight, and the pair is
 * `dt`/`dd` rather than two spans and an em dash that had to be hidden from screen readers.
 */
export function FieldList({ children }: { children: ReactNode }) {
  return <dl className="grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-4">{children}</dl>
}

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 sm:col-span-2 sm:grid-cols-subgrid">
      <dt className="break-keep text-page-ink-muted text-sm leading-6 sm:max-w-32">{label}</dt>
      <dd className={REPORT_TYPE.copy}>{value}</dd>
    </div>
  )
}

/** A short label above a paragraph. The composed reading's kicker, and the strength groups' heading. */
export function Kicker({ children }: { children: ReactNode }) {
  return <p className="font-black text-page-accent-strong text-sm tracking-wide">{children}</p>
}

const CONFIDENCE_TONE = {
  sufficient: 'bg-page-success/10 text-page-success',
  needsCheck: 'bg-page-accent/12 text-page-accent-strong',
  needsMoreInput: 'bg-page-soft text-page-ink-muted',
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
 * A work facet as the report shows it: the name, what the condition looks like, the same condition from the
 * other side, and the one reversible choice it suggests.
 *
 * The four fields used to be four paragraphs at four descending opacities, so the choice — the only line a
 * reader can act on — was the faintest thing in the card. The contrast now sits behind a rule as the aside it
 * is, and the choice is labelled and boxed, which is what separates advice from one more description.
 */
export function FacetCard({ actionLabel, facet }: { actionLabel: string; facet: DetailedFacet }) {
  return (
    <li className={GROUPED_ROW_CLASS_NAME}>
      <p className="break-keep font-black text-base text-page-ink leading-6">{facet.label}</p>
      <p className={cn('mt-2', REPORT_TYPE.copy)}>{facet.detail}</p>
      <p className={cn('mt-3 border-page-border border-l-2 pl-3', REPORT_TYPE.meta)}>{facet.contrast}</p>
      <div className="mt-3 rounded-2xl bg-page-soft/70 px-3 py-2">
        <p className="font-black text-page-accent-strong text-xs tracking-wide">{actionLabel}</p>
        <p className={cn('mt-1', REPORT_TYPE.meta)}>{facet.action}</p>
      </div>
    </li>
  )
}

export function FacetList({ actionLabel, facets }: { actionLabel: string; facets: readonly DetailedFacet[] }) {
  if (facets.length === 0) {
    return null
  }
  return (
    <ul className={cn(GROUPED_LIST_CLASS_NAME, 'sm:grid sm:gap-3')}>
      {facets.map((facet) => (
        <FacetCard actionLabel={actionLabel} facet={facet} key={facet.id} />
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
          className="rounded-full border border-page-border bg-white px-3 py-1 font-bold text-page-ink-soft text-sm"
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
  return <h3 className="break-keep font-black text-base text-page-ink">{children}</h3>
}

/** The quiet closing line several sections end on, set off by a rule so it reads as the end of the section. */
export function ClosingNote({ children }: { children: ReactNode }) {
  return <p className={cn('mt-6 border-page-border border-t pt-4', REPORT_TYPE.meta)}>{children}</p>
}
