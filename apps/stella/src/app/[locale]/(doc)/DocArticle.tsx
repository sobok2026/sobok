import type { ReactNode } from 'react'

import Paragraph from './Paragraph'

type Props = {
  title: string
  description: string
  updatedLabel: string
  updatedDate: string
  sections: readonly { heading: string; body: readonly string[] }[]
  footer?: ReactNode
}

export default function DocArticle({ title, description, updatedLabel, updatedDate, sections, footer }: Props) {
  return (
    <main className="min-h-dvh bg-night-sky px-4 pb-24 pt-[calc(4.5rem+var(--safe-area-top))] text-foreground sm:px-6 sm:pt-[calc(5rem+var(--safe-area-top))]">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-foreground-muted">{description}</p>
        <p className="mt-2 text-sm text-foreground-faint">
          {updatedLabel}: {updatedDate}
        </p>

        {sections.map((section) => (
          <section className="mt-10" key={section.heading}>
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
