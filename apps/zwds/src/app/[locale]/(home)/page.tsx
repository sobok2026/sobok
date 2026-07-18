import { LOCALE_OPEN_GRAPH_TAGS, Locale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SITE_NAME } from '@/constants'
import { getLocale } from '@/i18n/server'
import ZwdsHome from './ZwdsHome'

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Zwds.meta' })
  const title = t('title')
  const description = t('description')
  const canonical = `/${locale}`
  const openGraphLocale = LOCALE_OPEN_GRAPH_TAGS[locale]

  return {
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(Object.values(Locale).map((entry) => [entry, `/${entry}`])),
        'x-default': '/',
      },
    },
    openGraph: {
      title,
      description,
      locale: openGraphLocale,
      alternateLocale: Object.values(Locale)
        .map((entry) => LOCALE_OPEN_GRAPH_TAGS[entry])
        .filter((entry) => entry !== openGraphLocale),
      siteName: SITE_NAME[locale],
      type: 'website',
      url: canonical,
    },
  }
}

export default async function ZwdsPage({ params }: PageProps<'/[locale]'>) {
  await getLocale(params)
  return <ZwdsHome />
}
