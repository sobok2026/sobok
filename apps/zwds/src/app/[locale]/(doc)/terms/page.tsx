import DocArticle from '@sobok/site-chrome/doc-article'
import LegalContact from '@sobok/site-chrome/legal-contact'
import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import { LEGAL } from '@/content/legal'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: PageProps<'/[locale]/terms'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = LEGAL[locale].terms

  return buildMetadata({ locale, path: '/terms', title: doc.title, description: doc.description })
}

export default async function TermsPage({ params }: PageProps<'/[locale]/terms'>) {
  const locale = await getLocale(params)
  const meta = LEGAL[locale]
  const doc = meta.terms

  return (
    <DocArticle
      className="bg-night-palace"
      description={doc.description}
      footer={<LegalContact heading={meta.contactLabel} />}
      metaLines={[`${meta.updatedLabel}: ${doc.updatedDate}`]}
      sections={doc.sections}
      title={doc.title}
    />
  )
}
