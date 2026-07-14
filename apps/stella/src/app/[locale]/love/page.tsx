import { LOCALE_OPEN_GRAPH_TAGS } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { SITE_NAME } from '@/constants'
import { getLocale } from '@/i18n/server'
import JsonLd, { faqPageGraph, subPageGraph } from '@/lib/JsonLd'
import FaqSection from '../FaqSection'
import { FAQ } from '../faq'
import LoveFlow from './LoveFlow'

export async function generateMetadata({ params }: PageProps<'/[locale]/love'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Love.meta' })
  const title = t('title')
  const description = t('description')
  const canonical = `/${locale}/love`

  const images = [
    {
      url: '/og-love.webp',
      width: 1200,
      height: 630,
      alt: `${SITE_NAME[locale]} — ${title}`,
      type: 'image/webp',
    },
  ]

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images,
      locale: LOCALE_OPEN_GRAPH_TAGS[locale],
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

export default async function LovePage({ params }: PageProps<'/[locale]/love'>) {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Love' })

  return (
    <>
      <JsonLd
        data={subPageGraph(locale, {
          path: 'love',
          name: t('hero.title'),
          description: t('meta.description'),
          image: '/og-love.webp',
        })}
      />
      <JsonLd data={faqPageGraph(FAQ[locale].love)} />
      <LoveFlow />
      <FaqSection locale={locale} page="love" />
    </>
  )
}
