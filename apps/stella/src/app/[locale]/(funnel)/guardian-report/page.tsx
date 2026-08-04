import {
  DEFAULT_LOCALE,
  LOCALE_HREFLANG_TAGS,
  LOCALE_OPEN_GRAPH_TAGS,
  LOCALES,
  type Locale,
} from '@sobok/domain/locale'
import { getLocale } from '@sobok/site-i18n/server'
import JsonLd from '@sobok/site-seo/json-ld'
import type { Metadata } from 'next'

import FaqSection from '@/components/FaqSection'
import { ORIGIN } from '@/constants'
import { FAQ } from '@/content/faq'
import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'
import {
  GUARDIAN_CURRENCY,
  GUARDIAN_REPORT_NAME,
  GUARDIAN_REPORT_PRICE,
  GUARDIAN_REPORT_SKU,
} from '@/lib/guardian-paid'
import { buildMetadata, faqPageGraph, subPageGraph } from '@/lib/seo'

import GuardianReportLanding from './GuardianReportLanding'

const OG_IMAGE = '/og-guardian-report.webp'

export async function generateMetadata({ params }: PageProps<'/[locale]/guardian-report'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const content = GUARDIAN_REPORT_UI[locale]
  const metadata = buildMetadata({
    locale,
    path: '/guardian-report',
    title: content.meta.title,
    description: content.meta.description,
    image: OG_IMAGE,
    noindex: !content.published,
  })
  const publishedLocales = LOCALES.filter((candidate) => GUARDIAN_REPORT_UI[candidate].published)

  return {
    ...metadata,
    alternates: {
      canonical: `/${locale}/guardian-report`,
      languages: {
        ...Object.fromEntries(
          publishedLocales.map((candidate) => [LOCALE_HREFLANG_TAGS[candidate], `/${candidate}/guardian-report`]),
        ),
        'x-default': `/${DEFAULT_LOCALE}/guardian-report`,
      },
    },
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          alternateLocale: publishedLocales
            .map((candidate) => LOCALE_OPEN_GRAPH_TAGS[candidate])
            .filter((candidate) => candidate !== LOCALE_OPEN_GRAPH_TAGS[locale]),
        }
      : undefined,
  }
}

/**
 * Product/Offer — the one page here that sells something is the one page that emits it. The price is a
 * build-time constant read from the manifest, so what a crawler reads and what the buyer is charged are the
 * same number by construction. `priceValidUntil` is deliberately absent: the offer has no end date, and a
 * stale one makes Google drop the offer rather than show it.
 */
function productGraph(locale: Locale, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: GUARDIAN_REPORT_NAME.ko,
    description,
    image: `${ORIGIN}${OG_IMAGE}`,
    sku: GUARDIAN_REPORT_SKU,
    brand: { '@type': 'Brand', name: 'Stella' },
    offers: {
      '@type': 'Offer',
      url: `${ORIGIN}/${locale}/guardian-report`,
      price: GUARDIAN_REPORT_PRICE,
      priceCurrency: GUARDIAN_CURRENCY,
      availability: 'https://schema.org/InStock',
      category: 'https://schema.org/DigitalDocument',
    },
  }
}

export default async function GuardianReportPage({ params }: PageProps<'/[locale]/guardian-report'>) {
  const locale = await getLocale(params)
  const content = GUARDIAN_REPORT_UI[locale]

  return (
    <>
      <JsonLd
        data={subPageGraph(locale, {
          path: 'guardian-report',
          name: content.meta.title,
          description: content.meta.description,
          image: OG_IMAGE,
        })}
      />
      <JsonLd data={productGraph(locale, content.meta.description)} />
      <JsonLd data={faqPageGraph(FAQ[locale].guardianReport)} />
      <GuardianReportLanding locale={locale} />
      <FaqSection locale={locale} page="guardianReport" />
    </>
  )
}
