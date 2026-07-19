import type { Metadata } from 'next'

import { LEGAL } from '@/content/legal'
import { buildLocalizedMetadata } from '@/i18n/metadata'
import { getLocale } from '@/i18n/server'
import LegalArticle from '../LegalArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = LEGAL[locale].privacy

  return buildLocalizedMetadata({
    description: doc.description,
    locale,
    pathname: '/privacy',
    title: doc.title,
  })
}

export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  const locale = await getLocale(params)
  const meta = LEGAL[locale]

  return <LegalArticle doc={meta.privacy} meta={meta} />
}
