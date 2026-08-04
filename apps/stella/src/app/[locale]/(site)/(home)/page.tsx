import { getLocale } from '@sobok/site-i18n/server'
import JsonLd from '@sobok/site-seo/json-ld'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import FaqSection from '@/components/FaqSection'
import { FAQ } from '@/content/faq'
import { buildMetadata, faqPageGraph, webApplicationGraph } from '@/lib/seo'
import Constellation from './Constellation'

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Constellation.meta' })

  return buildMetadata({ locale, title: t('title'), description: t('description') })
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
