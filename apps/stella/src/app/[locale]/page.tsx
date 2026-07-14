import { LOCALE_OPEN_GRAPH_TAGS, Locale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { SITE_NAME } from '@/constants'
import { getLocale } from '@/i18n/server'
import JsonLd, { faqPageGraph, webApplicationGraph } from '@/lib/JsonLd'

import Constellation from './Constellation'
import FaqSection from './FaqSection'
import { FAQ } from './faq'

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Constellation.meta' })
  const title = t('title')
  const description = t('description')
  const canonical = `/${locale}/`
  const openGraphLocale = LOCALE_OPEN_GRAPH_TAGS[locale]

  const images = [
    {
      url: '/og-image.webp',
      width: 1200,
      height: 630,
      alt: `${SITE_NAME[locale]} — ${title}`,
      type: 'image/webp',
    },
  ]

  return {
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(Object.values(Locale).map((entry) => [entry, `/${entry}/`])),
        'x-default': '/',
      },
    },
    openGraph: {
      title,
      description,
      images,
      locale: openGraphLocale,
      alternateLocale: Object.values(Locale)
        .map((entry) => LOCALE_OPEN_GRAPH_TAGS[entry])
        .filter((entry) => entry !== openGraphLocale),
      siteName: SITE_NAME[locale],
      type: 'website',
      url: canonical,
    },
    twitter: {
      title,
      description,
      images,
      card: 'summary_large_image',
      site: '@sobok_cc',
    },
  }
}

export default async function ConstellationPage({ params }: PageProps<'/[locale]'>) {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Constellation.meta' })

  return (
    <>
      <JsonLd data={webApplicationGraph(locale, t('description'))} />
      <JsonLd data={faqPageGraph(FAQ[locale].constellation)} />
      <Constellation />
      <FaqSection locale={locale} page="constellation" />
    </>
  )
}
