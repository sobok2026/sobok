import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import FaqSection from '@/components/FaqSection'
import { FAQ } from '@/content/faq'
import { getLocale } from '@/i18n/server'
import JsonLd, { faqPageGraph, subPageGraph } from '@/lib/JsonLd'
import { buildMetadata } from '@/lib/metadata'
import TodayFlow from './TodayFlow'

export async function generateMetadata({ params }: PageProps<'/[locale]/today'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Today.meta' })

  return buildMetadata({
    locale,
    path: '/today',
    title: t('title'),
    description: t('description'),
    image: '/og-today.webp',
  })
}

export default async function TodayPage({ params }: PageProps<'/[locale]/today'>) {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Today' })

  return (
    <>
      <JsonLd
        data={subPageGraph(locale, {
          path: 'today',
          name: t('hero.title'),
          description: t('meta.description'),
          image: '/og-today.webp',
        })}
      />
      <JsonLd data={faqPageGraph(FAQ[locale].today)} />
      <TodayFlow />
      <FaqSection locale={locale} page="today" />
    </>
  )
}
