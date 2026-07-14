import { LOCALE_OPEN_GRAPH_TAGS, Locale } from '@sobok/domain/locale'
import type { Metadata } from 'next'

import { SITE_NAME } from '@/constants'
import { getLocale } from '@/i18n/server'
import LegalArticle from '../../LegalArticle'
import { LEGAL } from '../../legal'

export async function generateMetadata({ params }: PageProps<'/[locale]/terms'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = LEGAL[locale].terms
  const canonical = `/${locale}/terms/`

  return {
    title: doc.title,
    description: doc.description,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(Object.values(Locale).map((entry) => [entry, `/${entry}/terms/`])),
        'x-default': '/terms/',
      },
    },
    openGraph: {
      title: doc.title,
      description: doc.description,
      url: canonical,
      siteName: SITE_NAME[locale],
      locale: LOCALE_OPEN_GRAPH_TAGS[locale],
      type: 'website',
      images: [{ url: '/og-image.webp', width: 1200, height: 630, type: 'image/webp' }],
    },
  }
}

export default async function TermsPage({ params }: PageProps<'/[locale]/terms'>) {
  const locale = await getLocale(params)
  const meta = LEGAL[locale]

  return <LegalArticle doc={meta.terms} meta={meta} />
}
