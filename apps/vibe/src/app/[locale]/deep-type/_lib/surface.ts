/**
 * The surfaces every deep-type screen is built from, and the rule that stops them from stacking.
 *
 * `CARD_CLASS_NAME` is the only horizontal inset allowed under the page gutter. `px-safe` already spends
 * `max(16px, safe-inset)` a side and the card spends 16 more, which is the 16 + 16 that Material's compact
 * window margins and the HIG's compact layout margins both land on. A third inset — a bordered card inside a
 * card — takes 48px a side out of a 375px screen and leaves 279px of body, and once artwork sits beside that
 * body it leaves 183px. Korean at `text-sm` is ~14px a glyph there, so a 13-glyph line against the 40-glyph
 * ceiling WCAG 1.4.8 sets for CJK.
 *
 * So sub-blocks are a grouped list instead: rules between rows at compact width where the space is not there
 * to spend, and the boxed look restored from `sm` up where `max-w-xl` caps the measure anyway and the inset
 * costs nothing. The paid report reached the same answer first with a bare `border-t` divider.
 */
export const CARD_CLASS_NAME = 'rounded-3xl border border-border bg-surface p-4 sm:rounded-4xl sm:p-6'

/**
 * The lift under a page-level panel. Written once because three screens had the same literal and the paywall's
 * copy had already drifted a hundredth in the alpha — a difference nobody can see and nobody can keep aligned
 * by hand.
 */
export const PANEL_SHADOW_CLASS_NAME = 'shadow-[0_24px_90px_rgba(36,22,23,0.08)]'

/**
 * A screen that is one panel and nothing else: the checkout return, the re-open request, every terminal state
 * of both. Wider padding than `CARD_CLASS_NAME` because nothing nests inside it, and `max-w-lg` rather than
 * `max-w-xl` because its body is a paragraph and not a report.
 */
export const PANEL_CLASS_NAME = 'w-full max-w-lg rounded-3xl border border-border bg-surface p-6 sm:rounded-4xl sm:p-8'

/**
 * The container for rows that would otherwise each be a card. Pair with a `sm:grid` and a `sm:gap-*` from the
 * caller, because how the boxes lay out from `sm` up is the caller's business and where the rules go is not.
 */
export const GROUPED_LIST_CLASS_NAME = 'divide-border divide-y border-border border-y sm:divide-y-0 sm:border-0'

/**
 * One row of a `GROUPED_LIST_CLASS_NAME`. Vertical padding only at compact width so the row inherits the
 * card's horizontal padding rather than adding its own, then a boxed inset from `sm` up.
 *
 * `sm:rounded-2xl` for every nested box, including the two that used to be `rounded-3xl`. Concentric corners
 * want the inner radius to be the outer radius minus the padding between them — 32px minus 24px at `sm` — and
 * 16px is the closest step down the scale offers.
 */
export const GROUPED_ROW_CLASS_NAME = 'py-4 sm:rounded-2xl sm:border sm:border-border sm:bg-white sm:p-4'

/**
 * THE REPORT'S TYPE SCALE.
 *
 * Five roles, in the order a section uses them, and nothing between them. The screens used to size and tone
 * text at each call site, which produced twenty-odd inline combinations of `text-sm` against ten alpha steps
 * of one ink; a section's third paragraph was quieter than its second for no reason anybody could state, and
 * the quietest steps did not clear WCAG 4.5:1 at all.
 *
 * Sizes, not opacity, carry the hierarchy. Every tone here is one of the three opaque steps from
 * `globals.css`, so any of them may sit on any of our surfaces and still pass.
 *
 * Body is 16px with 2rem leading. It was 14px, which is below what both the HIG (17px) and Material (16px)
 * set for body copy, and this is a document somebody reads for twenty minutes rather than a form label.
 *
 * ONLY THE THREE READING ROLES SAY ANYTHING ABOUT BREAKING, AND THEY SAY IT ONCE.
 *
 * `@sobok/typography` sets the document's language policy in `@layer base`, so a title, a label, and a chip are
 * already right in every locale with nothing declared here. Prose is the exception a selector cannot infer — no
 * rule can tell a two-line label from a two-hundred-word reading — so `break-prose` rides on the three roles
 * that are prose by definition, and no call site writes it. Measured at the 311px a phone gives this document,
 * that exception is worth having: the display rule left up to 52px of the line unused in a body paragraph and
 * spent a fifth line on a three-syllable widow.
 *
 * The free screens do not take this scale — they size text at each call site — so their paragraphs still name
 * `break-prose` by hand. Folding them into a scale of their own is the way that ends.
 */
export const REPORT_TYPE = {
  /** A section's h2. */
  title: 'font-black text-foreground text-xl leading-snug sm:text-2xl',
  /** The authored line under a section title. A deck, so it is sized between the title and the body. */
  deck: 'text-base text-foreground-muted leading-7',
  /** Reading copy: the openings, the readings, anything written to be read in sentences. */
  body: 'break-prose text-base text-foreground-secondary leading-8',
  /** Copy inside a card or a row, where the measure is already narrow. */
  copy: 'break-prose text-[0.9375rem] text-foreground-secondary leading-7',
  /** Captions, asides, and the closing note. The quietest step that still clears 4.5:1. */
  meta: 'break-prose text-sm text-foreground-muted leading-6',
} as const
