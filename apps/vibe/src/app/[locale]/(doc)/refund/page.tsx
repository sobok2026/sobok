import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import { LEGAL } from '@/content/legal'
import { buildLocalizedMetadata } from '@/i18n/metadata'
import LegalArticle from '../LegalArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/refund'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = LEGAL[locale].refund

  return buildLocalizedMetadata({
    description: doc.description,
    locale,
    pathname: '/refund',
    title: doc.title,
  })
}

export default async function RefundPage({ params }: PageProps<'/[locale]/refund'>) {
  const locale = await getLocale(params)
  const meta = LEGAL[locale]

  return <LegalArticle doc={meta.refund} meta={meta} />
}
