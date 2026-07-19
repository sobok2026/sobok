import type { Metadata } from 'next'

import { PAGES } from '@/content/pages'
import { buildLocalizedMetadata } from '@/i18n/metadata'
import { getLocale } from '@/i18n/server'
import InfoArticle from '../InfoArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = PAGES[locale].contact

  return buildLocalizedMetadata({
    description: doc.description,
    locale,
    pathname: '/contact',
    title: doc.title,
  })
}

export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const locale = await getLocale(params)
  const doc = PAGES[locale].contact

  return <InfoArticle channels={doc.channels} channelsHeading={doc.channelsHeading} page={doc} />
}
