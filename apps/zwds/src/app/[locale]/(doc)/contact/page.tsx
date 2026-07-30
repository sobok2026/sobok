import { LOCALE_OPEN_GRAPH_TAGS, LOCALES } from '@sobok/domain/locale'
import type { Metadata } from 'next'

import { SITE_NAME } from '@/constants'
import { PAGES } from '@/content/pages'
import { getLocale } from '@/i18n/server'
import InfoArticle from '../InfoArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = PAGES[locale].contact
  const canonical = `/${locale}/contact`

  return {
    title: doc.title,
    description: doc.description,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(LOCALES.map((entry) => [entry, `/${entry}/contact`])),
        'x-default': '/contact',
      },
    },
    openGraph: {
      title: doc.title,
      description: doc.description,
      url: canonical,
      siteName: SITE_NAME[locale],
      locale: LOCALE_OPEN_GRAPH_TAGS[locale],
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, type: 'image/png' }],
    },
  }
}

export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const locale = await getLocale(params)
  const doc = PAGES[locale].contact

  return <InfoArticle channels={doc.channels} channelsHeading={doc.channelsHeading} page={doc} />
}
