import { LOCALE_OPEN_GRAPH_TAGS, PUBLIC_LOCALES } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { SITE_NAME } from '@/constants'
import { getLocale } from '@/i18n/server'

import TodayFlow from './TodayFlow'

export async function generateMetadata({ params }: PageProps<'/[locale]/today'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Today.meta' })
  const title = t('title')
  const description = t('description')
  const canonical = `/${locale}/today/`
  const openGraphLocale = LOCALE_OPEN_GRAPH_TAGS[locale]

  const images = [
    {
      url: '/og-today.webp',
      width: 1200,
      height: 630,
      alt: `${SITE_NAME} — ${title}`,
      type: 'image/webp',
    },
  ]

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(PUBLIC_LOCALES.map((entry) => [entry, `/${entry}/today/`])),
        'x-default': '/today/',
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

export default async function TodayPage({ params }: PageProps<'/[locale]/today'>) {
  await getLocale(params)
  return <TodayFlow />
}
