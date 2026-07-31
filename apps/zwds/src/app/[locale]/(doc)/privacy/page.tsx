import { LOCALE_OPEN_GRAPH_TAGS, LOCALES } from '@sobok/domain/locale'
import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import { SITE_NAME } from '@/constants'
import { LEGAL } from '@/content/legal'
import LegalArticle from '../LegalArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = LEGAL[locale].privacy
  const canonical = `/${locale}/privacy`

  return {
    title: doc.title,
    description: doc.description,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(LOCALES.map((entry) => [entry, `/${entry}/privacy`])),
        'x-default': '/privacy',
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

export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  const locale = await getLocale(params)
  const meta = LEGAL[locale]

  return <LegalArticle doc={meta.privacy} meta={meta} />
}
