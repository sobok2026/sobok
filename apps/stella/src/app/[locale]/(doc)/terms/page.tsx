import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import { LEGAL } from '@/content/legal'
import { buildMetadata } from '@/lib/seo'
import DocArticle from '../DocArticle'
import LegalContact from '../LegalContact'

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
      description={doc.description}
      sections={doc.sections}
      title={doc.title}
      updatedDate={doc.updatedDate}
      updatedLabel={meta.updatedLabel}
      footer={<LegalContact heading={meta.contactLabel} />}
    />
  )
}
