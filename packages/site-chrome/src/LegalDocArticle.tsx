import DocArticle from './DocArticle'
import LegalContact from './LegalContact'

export type LegalSection = {
  /** Anchor id. Defaults to a positional `section-N`, which is what the table of contents links to. */
  id?: string
  heading: string
  body: string[]
}

export type LegalDoc = {
  title: string
  description: string
  /** The date this revision takes effect. Distinct from `updatedDate`: a change is published before it binds. */
  effectiveDate?: string
  updatedDate: string
  version?: string
  sections: LegalSection[]
}

/** The chrome around any legal document: the labels its meta lines and table of contents are built from. */
export type LegalDocLabels = {
  updatedLabel: string
  effectiveLabel: string
  versionLabel: string
  contentsLabel: string
  contactLabel: string
}

/**
 * A legal document rendered as a citable revision: dated, versioned, and with every section addressable by
 * anchor. Any site that takes money needs this — a buyer disputing a charge has to be able to point at the
 * clause and the revision that was in force — so it lives here rather than in one app.
 *
 * No archived-version banner and no previous-versions list. Both belong to a `/legal/[version]/…` route, and
 * that route cannot exist while the archive is empty: `output: export` treats a `generateStaticParams()` that
 * returns nothing as a missing one and fails the build. They arrive with the first superseded document.
 */
export default function LegalDocArticle({
  className,
  doc,
  labels,
}: {
  /** Page background, which each site paints with its own gradient utility. */
  className?: string
  doc: LegalDoc
  labels: LegalDocLabels
}) {
  const sections = doc.sections.map((section, index) => ({
    ...section,
    id: section.id ?? `section-${index + 1}`,
  }))

  return (
    <DocArticle
      className={className}
      description={doc.description}
      footer={<LegalContact heading={labels.contactLabel} />}
      intro={
        <nav aria-label={labels.contentsLabel} className="mt-8 rounded-3xl border border-border bg-surface p-5">
          <h2 className="font-semibold text-foreground">{labels.contentsLabel}</h2>
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
        `${labels.updatedLabel}: ${doc.updatedDate}`,
        `${labels.effectiveLabel}: ${doc.effectiveDate ?? doc.updatedDate} · ${labels.versionLabel}: ${doc.version ?? '1.0'}`,
      ]}
      sections={sections}
      title={doc.title}
    />
  )
}
