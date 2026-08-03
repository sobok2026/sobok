import { getLocale } from '@sobok/site-i18n/server'
import JsonLd from '@sobok/site-seo/json-ld'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import FaqSection from '@/components/FaqSection'
import { FAQ } from '@/content/faq'
import { buildMetadata, faqPageGraph, subPageGraph } from '@/lib/seo'
import LoveFlow from './LoveFlow'

export async function generateMetadata({ params }: PageProps<'/[locale]/love'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Love.meta' })

  return buildMetadata({
    locale,
    path: '/love',
    title: t('title'),
    description: t('description'),
    image: '/og-love.webp',
  })
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
