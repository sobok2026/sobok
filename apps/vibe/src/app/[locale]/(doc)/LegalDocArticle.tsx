import DocArticle from '@sobok/site-chrome/doc-article'
import LegalContact from '@sobok/site-chrome/legal-contact'

import type { LegalContent, LegalDoc } from '@/content/legal'

type Props = {
  doc: LegalDoc
  meta: LegalContent
}

// Only vibe's documents carry an effective date, a version and a table of contents — they are contracts a
// buyer may have to cite a specific revision of, which the other sites' documents are not. So this wrapper
// stays here rather than in @sobok/site-chrome, and hands the shared shell its own meta lines and intro.
//
// No archived-version banner and no previous-versions list. Both existed for `/[locale]/legal/[version]/…`,
// and that route cannot exist while the archive is empty: `output: export` treats a `generateStaticParams()`
// that returns nothing as a missing one and fails the build. They come back with the first superseded
// document, which is the commit that gives the route its first params.
export default function LegalDocArticle({ doc, meta }: Props) {
  const sections = doc.sections.map((section, index) => ({
    ...section,
    id: section.id ?? `section-${index + 1}`,
  }))

  return (
    <DocArticle
      className="bg-background"
      description={doc.description}
      footer={<LegalContact heading={meta.contactLabel} />}
      intro={
        <nav aria-label={meta.contentsLabel} className="mt-8 rounded-3xl border border-border bg-surface p-5">
          <h2 className="font-semibold text-foreground">{meta.contentsLabel}</h2>
          <ol className="mt-3 grid gap-2 text-sm text-foreground-secondary">
            {sections.map((section, index) => (
              <li key={section.heading}>
                <a className="underline-offset-2 hover:text-foreground hover:underline" href={`#${section.id}`}>
                  {index + 1}. {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      }
      metaLines={[
        `${meta.updatedLabel}: ${doc.updatedDate}`,
        `${meta.effectiveLabel}: ${doc.effectiveDate ?? doc.updatedDate} · ${meta.versionLabel}: ${doc.version ?? '1.0'}`,
      ]}
      sections={sections}
      title={doc.title}
    />
  )
}
