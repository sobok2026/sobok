import { Fragment } from 'react'

import { LEGAL_CONTACT_EMAIL, type LegalContent, type LegalDoc } from './legal'

const URL_PATTERN = /(https?:\/\/[^\s]+?)(?=[.,)]?(?:\s|$))/g

// Renders a paragraph, turning bare http(s) URLs into real links. Content is
// authored by us in legal.ts, so there is no untrusted input here.
function Paragraph({ text }: { text: string }) {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0

  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0]
    const start = match.index

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start))
    }

    nodes.push(
      <a
        className="text-accent underline underline-offset-2 hover:text-brand"
        href={url}
        key={start}
        rel="noopener noreferrer"
        target="_blank"
      >
        {url}
      </a>,
    )
    lastIndex = start + url.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return (
    <p className="mb-4 leading-relaxed text-foreground-secondary">
      {nodes.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </p>
  )
}

type Props = {
  doc: LegalDoc
  meta: LegalContent
}

export default function LegalArticle({ doc, meta }: Props) {
  return (
    <main className="min-h-dvh bg-night-sky px-4 pb-24 pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-6">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
        <p className="mt-3 text-foreground-muted">{doc.description}</p>
        <p className="mt-2 text-sm text-foreground-faint">
          {meta.updatedLabel}: {meta.updatedDate}
        </p>

        {doc.sections.map((section) => (
          <section className="mt-10" key={section.heading}>
            <h2 className="mb-3 text-xl font-semibold text-foreground">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <Paragraph key={i} text={paragraph} />
            ))}
          </section>
        ))}

        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-foreground">{meta.contactLabel}</h2>
          <p className="leading-relaxed text-foreground-secondary">
            <a
              className="text-accent underline underline-offset-2 hover:text-brand"
              href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
          </p>
        </section>
      </article>
    </main>
  )
}
