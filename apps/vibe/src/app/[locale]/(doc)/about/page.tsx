import { LOCALE_OPEN_GRAPH_TAGS, Locale } from '@sobok/domain/locale'
import type { Metadata } from 'next'

import { SITE_NAME } from '@/constants'
import { PAGES } from '@/content/pages'
import { getLocale } from '@/i18n/server'
import InfoArticle from '../InfoArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/about'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = PAGES[locale].about
  const canonical = `/${locale}/about`

  return {
    title: doc.title,
    description: doc.description,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(Object.values(Locale).map((entry) => [entry, `/${entry}/about`])),
        'x-default': '/about',
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

export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  const locale = await getLocale(params)

  return <InfoArticle page={PAGES[locale].about} />
}
