import { getLocale } from '@sobok/site-i18n/server'
import JsonLd from '@sobok/site-seo/json-ld'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import FaqSection from '@/components/FaqSection'
import { FAQ } from '@/content/faq'
import { buildMetadata, faqPageGraph, webApplicationGraph } from '@/lib/seo'
import ZwdsHome from './ZwdsHome'

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Zwds.meta' })

  return buildMetadata({ locale, title: t('title'), description: t('description') })
}

export default async function ZwdsPage({ params }: PageProps<'/[locale]'>) {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Zwds.meta' })

  return (
    <>
      <JsonLd data={webApplicationGraph(locale, t('description'))} />
      <JsonLd data={faqPageGraph(FAQ[locale].items)} />
      <ZwdsHome />
      <FaqSection locale={locale} />
    </>
  )
}
