import { LEGAL_CONTACT_EMAIL, type LegalContent, type LegalDoc } from '@/content/legal'
import Paragraph from './Paragraph'

type Props = {
  doc: LegalDoc
  meta: LegalContent
}

// No archived-version banner and no previous-versions list. Both existed for `/[locale]/legal/[version]/…`, and
// that route cannot exist while the archive is empty: `output: export` treats a `generateStaticParams()` that
// returns nothing as a missing one and fails the build. They come back with the first superseded document, which
// is the commit that gives the route its first params.
export default function LegalArticle({ doc, meta }: Props) {
  return (
    <main className="min-h-dvh bg-page-bg px-4 pt-[calc(4.5rem+var(--safe-area-top))] pb-24 text-page-ink sm:px-6 sm:pt-[calc(5rem+var(--safe-area-top))]">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-bold text-3xl tracking-tight">{doc.title}</h1>
        <p className="mt-3 text-page-ink-soft">{doc.description}</p>
        <p className="mt-2 text-page-ink-muted text-sm">
          {meta.updatedLabel}: {doc.updatedDate}
        </p>
        <p className="mt-1 text-page-ink-muted text-sm">
          {meta.effectiveLabel}: {doc.effectiveDate ?? doc.updatedDate} · {meta.versionLabel}: {doc.version ?? '1.0'}
        </p>

        <nav aria-label={meta.contentsLabel} className="mt-8 rounded-3xl border border-page-border bg-page-surface p-5">
          <h2 className="font-semibold text-page-ink">{meta.contentsLabel}</h2>
          <ol className="mt-3 grid gap-2 text-page-ink-soft text-sm">
            {doc.sections.map((section, index) => (
              <li key={section.heading}>
                <a
                  className="underline-offset-2 hover:text-page-ink hover:underline"
                  href={`#${sectionId(section, index)}`}
                >
                  {index + 1}. {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {doc.sections.map((section, index) => (
          <section className="mt-10 scroll-mt-24" id={sectionId(section, index)} key={section.heading}>
            <h2 className="mb-3 font-semibold text-page-ink text-xl">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <Paragraph key={i} text={paragraph} />
            ))}
          </section>
        ))}

        <section className="mt-10">
          <h2 className="mb-3 font-semibold text-page-ink text-xl">{meta.contactLabel}</h2>
          <p className="text-page-ink-soft leading-relaxed">
            <a
              className="text-page-accent-strong underline underline-offset-2 hover:text-page-ink"
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

function sectionId(section: LegalDoc['sections'][number], index: number) {
  return section.id ?? `section-${index + 1}`
}
