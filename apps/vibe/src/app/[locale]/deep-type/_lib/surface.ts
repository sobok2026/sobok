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
export const CARD_CLASS_NAME = 'rounded-3xl border border-page-border bg-page-surface p-4 sm:rounded-4xl sm:p-6'

/**
 * The container for rows that would otherwise each be a card. Pair with a `sm:grid` and a `sm:gap-*` from the
 * caller, because how the boxes lay out from `sm` up is the caller's business and where the rules go is not.
 */
export const GROUPED_LIST_CLASS_NAME =
  'divide-page-border divide-y border-page-border border-y sm:divide-y-0 sm:border-0'

/**
 * One row of a `GROUPED_LIST_CLASS_NAME`. Vertical padding only at compact width so the row inherits the
 * card's horizontal padding rather than adding its own, then a boxed inset from `sm` up.
 *
 * `sm:rounded-2xl` for every nested box, including the two that used to be `rounded-3xl`. Concentric corners
 * want the inner radius to be the outer radius minus the padding between them — 32px minus 24px at `sm` — and
 * 16px is the closest step down the scale offers.
 */
export const GROUPED_ROW_CLASS_NAME = 'py-4 sm:rounded-2xl sm:border sm:border-page-border sm:bg-white sm:p-4'
