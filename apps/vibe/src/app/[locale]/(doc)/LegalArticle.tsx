import { LEGAL_CONTACT_EMAIL, type LegalContent, type LegalDoc } from '@/content/legal'
import Paragraph from './Paragraph'

type Props = {
  doc: LegalDoc
  meta: LegalContent
}

export default function LegalArticle({ doc, meta }: Props) {
  return (
    <main className="min-h-dvh bg-page-bg px-4 pt-[calc(4.5rem+var(--safe-area-top))] pb-24 text-page-ink sm:px-6 sm:pt-[calc(5rem+var(--safe-area-top))]">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-bold text-3xl tracking-tight">{doc.title}</h1>
        <p className="mt-3 text-page-ink/62">{doc.description}</p>
        <p className="mt-2 text-page-ink/46 text-sm">
          {meta.updatedLabel}: {doc.updatedDate}
        </p>

        {doc.sections.map((section) => (
          <section className="mt-10" key={section.heading}>
            <h2 className="mb-3 font-semibold text-page-ink text-xl">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <Paragraph key={i} text={paragraph} />
            ))}
          </section>
        ))}

        <section className="mt-10">
          <h2 className="mb-3 font-semibold text-page-ink text-xl">{meta.contactLabel}</h2>
          <p className="text-page-ink/62 leading-relaxed">
            <a
              className="text-page-accent underline underline-offset-2 hover:text-page-ink"
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
