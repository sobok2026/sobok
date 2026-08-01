import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import { LEGAL } from '@/content/legal'
import { buildMetadata } from '@/lib/seo'
import LegalDocArticle from '../LegalDocArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/refund'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = LEGAL[locale].refund

  return buildMetadata({
    description: doc.description,
    locale,
    path: '/refund',
    title: doc.title,
  })
}

export default async function RefundPage({ params }: PageProps<'/[locale]/refund'>) {
  const locale = await getLocale(params)
  const meta = LEGAL[locale]

  return <LegalDocArticle doc={meta.refund} meta={meta} />
}
