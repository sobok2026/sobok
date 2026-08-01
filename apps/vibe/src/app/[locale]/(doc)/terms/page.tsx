import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import { LEGAL } from '@/content/legal'
import { buildMetadata } from '@/lib/seo'
import LegalDocArticle from '../LegalDocArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/terms'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = LEGAL[locale].terms

  return buildMetadata({
    description: doc.description,
    locale,
    path: '/terms',
    title: doc.title,
  })
}

export default async function TermsPage({ params }: PageProps<'/[locale]/terms'>) {
  const locale = await getLocale(params)
  const meta = LEGAL[locale]

  return <LegalDocArticle doc={meta.terms} meta={meta} />
}
