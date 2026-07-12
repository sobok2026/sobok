import { LOCALE_LANGUAGE_TAGS, LOCALE_OPEN_GRAPH_TAGS, PUBLIC_LOCALES } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ORIGIN, SITE_NAME } from '@/constants'
import { getLocaleFromParams } from '@/i18n/server'

import Constellation from './Constellation'

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
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
      alt: `${SITE_NAME} — ${title}`,
      type: 'image/webp',
    },
  ]

  return {
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(PUBLIC_LOCALES.map((entry) => [entry, `/${entry}/`])),
        'x-default': '/',
      },
    },
    openGraph: {
      title,
      description,
      images,
      locale: openGraphLocale,
      alternateLocale: PUBLIC_LOCALES.map((entry) => LOCALE_OPEN_GRAPH_TAGS[entry]).filter(
        (entry) => entry !== openGraphLocale,
      ),
      siteName: SITE_NAME,
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
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Constellation.meta' })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: t('title'),
    description: t('description'),
    url: `${ORIGIN}/${locale}/`,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web',
    inLanguage: LOCALE_LANGUAGE_TAGS[locale],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: 'sobok' },
  }

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD built from our own translation strings, with `<` escaped
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll('<', '\\u003c') }}
      />
      <Constellation />
    </>
  )
}
