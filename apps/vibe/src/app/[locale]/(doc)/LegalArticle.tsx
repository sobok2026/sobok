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
        <p className="mt-1 text-page-ink/46 text-sm">
          {meta.effectiveLabel}: {doc.effectiveDate ?? doc.updatedDate} · {meta.versionLabel}: {doc.version ?? '1.0'}
        </p>

        <nav aria-label={meta.contentsLabel} className="mt-8 rounded-3xl border border-page-border bg-page-surface p-5">
          <h2 className="font-semibold text-page-ink">{meta.contentsLabel}</h2>
          <ol className="mt-3 grid gap-2 text-page-ink/62 text-sm">
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
          <p className="text-page-ink/62 leading-relaxed">
            <a
              className="text-page-accent underline underline-offset-2 hover:text-page-ink"
              href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
          </p>
        </section>

        <section className="mt-10 border-page-border border-t pt-8">
          <h2 className="mb-3 font-semibold text-page-ink text-xl">{meta.previousVersionsLabel}</h2>
          {doc.previousVersions?.length ? (
            <ul className="grid gap-2 text-page-ink/62">
              {doc.previousVersions.map((version) => (
                <li key={version.href}>
                  <a className="underline underline-offset-2 hover:text-page-ink" href={version.href}>
                    {version.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-page-ink/52 text-sm">{meta.noPreviousVersions}</p>
          )}
        </section>
      </article>
    </main>
  )
}

function sectionId(section: LegalDoc['sections'][number], index: number) {
  return section.id ?? `section-${index + 1}`
}
