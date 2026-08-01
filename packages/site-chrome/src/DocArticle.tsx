import type { ReactNode } from 'react'

import Paragraph from './Paragraph'

export type DocSection = {
  /** Anchor id. Present only where a document links to its own sections. */
  id?: string
  heading: string
  body: readonly string[]
}

type Props = {
  /**
   * Classes for the outer `<main>`, and in practice the page background: each site paints one with its own
   * gradient utility, which is a site-owned decoration rather than a shared token.
   */
  className?: string
  title: string
  description: string
  /** Dated/versioned lines under the lede — "최종 업데이트: …", effective date, document version. */
  metaLines?: readonly string[]
  /** Between the meta lines and the first section. vibe puts its table of contents here. */
  intro?: ReactNode
  sections: readonly DocSection[]
  /** Trailing block: the legal contact, or the contact page's channel list. */
  footer?: ReactNode
}

/**
 * The shell every legal and informational page renders into — about, contact, terms, privacy, refund,
 * business. One component rather than the `InfoArticle`/`LegalArticle` pair the sites used to keep, because
 * the two only ever differed in what came after the sections, and that is now the `footer` slot.
 */
export default function DocArticle({ className, description, footer, intro, metaLines, sections, title }: Props) {
  return (
    <main
      className={`min-h-dvh px-4 pb-24 pt-[calc(4.5rem+var(--safe-area-top))] text-foreground sm:px-6 sm:pt-[calc(5rem+var(--safe-area-top))] ${className ?? ''}`}
    >
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-foreground-secondary">{description}</p>

        {metaLines?.map((line, i) => (
          <p className={`${i === 0 ? 'mt-2' : 'mt-1'} text-sm text-foreground-muted`} key={line}>
            {line}
          </p>
        ))}

        {intro}

        {sections.map((section) => (
          // `scroll-mt` only matters where an id exists to jump to, but it costs nothing where none does.
          <section className="mt-10 scroll-mt-24" id={section.id} key={section.heading}>
            <h2 className="mb-3 text-xl font-semibold text-foreground">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <Paragraph key={i} text={paragraph} />
            ))}
          </section>
        ))}

        {footer && <section className="mt-10">{footer}</section>}
      </article>
    </main>
  )
}
