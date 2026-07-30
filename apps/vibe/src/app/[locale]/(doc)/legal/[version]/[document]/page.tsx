import { LOCALES } from '@sobok/domain/locale'
import { notFound } from 'next/navigation'

import {
  ARCHIVE_NOTICE,
  ARCHIVED_DOCUMENTS,
  type ArchivedDocument,
  findArchived,
  LEGAL_ARCHIVE,
} from '@/content/legal-archive'
import { getLocale } from '@/i18n/server'

import LegalArticle from '../../../LegalArticle'

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    LEGAL_ARCHIVE.flatMap((entry) =>
      ARCHIVED_DOCUMENTS.map((document) => ({ locale, version: entry.segment, document })),
    ),
  )
}

function resolve(version: string, document: string) {
  const entry = findArchived(version)

  if (!entry || !ARCHIVED_DOCUMENTS.includes(document as ArchivedDocument)) {
    notFound()
  }

  return { document: document as ArchivedDocument, entry }
}

export async function generateMetadata({ params }: PageProps<'/[locale]/legal/[version]/[document]'>) {
  const locale = await getLocale(params)
  const { document: requested, version } = await params
  const { document, entry } = resolve(version, requested)

  // Superseded text, deliberately kept reachable and deliberately kept out of search. No canonical and no
  // hreflang either: an archived document has no live counterpart to be the canonical of, and pointing one at
  // the current version would invite a crawler to treat the two as the same page.
  return {
    title: `${entry.content[locale][document].title} v${entry.version}`,
    description: entry.content[locale][document].description,
    robots: { follow: false, index: false },
  }
}

export default async function ArchivedLegalPage({ params }: PageProps<'/[locale]/legal/[version]/[document]'>) {
  const locale = await getLocale(params)
  const { document: requested, version } = await params
  const { document, entry } = resolve(version, requested)
  const meta = entry.content[locale]

  return (
    <LegalArticle
      archived={{ ...ARCHIVE_NOTICE[locale], href: `/${locale}/${document}`, version: entry.version }}
      doc={meta[document]}
      meta={meta}
    />
  )
}
