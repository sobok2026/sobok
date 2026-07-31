import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import { LEGAL } from '@/content/legal'
import { buildLocalizedMetadata } from '@/i18n/metadata'
import LegalArticle from '../LegalArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/terms'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = LEGAL[locale].terms

  return buildLocalizedMetadata({
    description: doc.description,
    locale,
    pathname: '/terms',
    title: doc.title,
  })
}

export default async function TermsPage({ params }: PageProps<'/[locale]/terms'>) {
  const locale = await getLocale(params)
  const meta = LEGAL[locale]

  return <LegalArticle doc={meta.terms} meta={meta} />
}
