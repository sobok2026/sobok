/**
 * The visible focus ring, and the one place it is written.
 *
 * It was declared as a local `const focusClassName` in twenty files with the same three utilities in the same
 * order. Twenty copies of a focus indicator is twenty chances for one screen to end up with a thinner ring,
 * a smaller offset, or none — and WCAG 2.4.11/1.4.11 are exactly about the ring being there and being visible,
 * so a drifted copy is an accessibility regression that looks like a style tweak in review.
 *
 * `outline` rather than a ring utility so it follows the element's border radius and survives `overflow: hidden`.
 */
export const FOCUS_CLASS_NAME =
  'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'
