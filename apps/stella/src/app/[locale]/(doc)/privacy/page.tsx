import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import { LEGAL } from '@/content/legal'
import { buildMetadata } from '@/lib/seo'
import DocArticle from '../DocArticle'
import LegalContact from '../LegalContact'

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = LEGAL[locale].privacy

  return buildMetadata({ locale, path: '/privacy', title: doc.title, description: doc.description })
}

export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  const locale = await getLocale(params)
  const meta = LEGAL[locale]
  const doc = meta.privacy

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
