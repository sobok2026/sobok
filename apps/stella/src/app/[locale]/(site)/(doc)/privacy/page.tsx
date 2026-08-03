import LegalDocArticle from '@sobok/site-chrome/legal-doc-article'
import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import { LEGAL } from '@/content/legal'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = LEGAL[locale].privacy

  return buildMetadata({ locale, path: '/privacy', title: doc.title, description: doc.description })
}

export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  const locale = await getLocale(params)
  const meta = LEGAL[locale]

  return <LegalDocArticle className="bg-night-sky" doc={meta.privacy} labels={meta} />
}
