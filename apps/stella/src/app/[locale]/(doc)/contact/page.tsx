import type { Metadata } from 'next'

import { PAGES } from '@/content/pages'
import { getLocale } from '@/i18n/server'
import { buildMetadata } from '@/lib/metadata'
import InfoArticle from '../InfoArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = PAGES[locale].contact

  return buildMetadata({ locale, path: '/contact', title: doc.title, description: doc.description })
}

export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const locale = await getLocale(params)
  const doc = PAGES[locale].contact

  return <InfoArticle channels={doc.channels} channelsHeading={doc.channelsHeading} page={doc} />
}
