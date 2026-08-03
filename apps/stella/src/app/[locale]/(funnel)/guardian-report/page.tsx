import { DEFAULT_LOCALE, LOCALE_HREFLANG_TAGS, LOCALE_OPEN_GRAPH_TAGS, LOCALES } from '@sobok/domain/locale'
import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'
import { buildMetadata } from '@/lib/seo'

import GuardianReportLanding from './GuardianReportLanding'

export async function generateMetadata({ params }: PageProps<'/[locale]/guardian-report'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const content = GUARDIAN_REPORT_UI[locale]
  const metadata = buildMetadata({
    locale,
    path: '/guardian-report',
    title: content.meta.title,
    description: content.meta.description,
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

export default async function GuardianReportPage({ params }: PageProps<'/[locale]/guardian-report'>) {
  const locale = await getLocale(params)

  return <GuardianReportLanding locale={locale} />
}
