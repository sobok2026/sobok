/**
 * Everything under /deep-type carries the career product's accent.
 *
 * It sits on a layout rather than on each screen because the accent has to hold across the run — the landing,
 * the quiz, the free result, the checkout and the report are five routes of one product, and a screen that
 * missed the class would flash the couple-quiz pink at whichever step the reader happened to reload on.
 */
export default function DeepTypeLayout({ children }: LayoutProps<'/[locale]/deep-type'>) {
  return <div className="deep-type-theme flex flex-1 flex-col">{children}</div>
}
