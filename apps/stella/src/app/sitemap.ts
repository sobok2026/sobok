import { DEFAULT_LOCALE, LOCALE_HREFLANG_TAGS, LOCALES } from '@sobok/domain/locale'
import type { MetadataRoute } from 'next'

import { ORIGIN } from '@/constants'
import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'
import { buildSitemap } from '@/lib/seo'

export const dynamic = 'force-static'

// tomorrow is intentionally absent: it is noindex (derived from /today).
export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = buildSitemap([
    { path: '', changeFrequency: 'weekly', priority: 1, altPriority: 0.8 },
    { path: '/today', changeFrequency: 'daily', priority: 0.9, altPriority: 0.7 },
    { path: '/love', changeFrequency: 'weekly', priority: 0.8, altPriority: 0.6 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.5, altPriority: 0.4 },
    { path: '/contact', changeFrequency: 'yearly', priority: 0.4, altPriority: 0.4 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3, altPriority: 0.3 },
    { path: '/refund', changeFrequency: 'yearly', priority: 0.3, altPriority: 0.3 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3, altPriority: 0.3 },
    { path: '/business', changeFrequency: 'yearly', priority: 0.3, altPriority: 0.3 },
  ])
  const guardianReportLocales = LOCALES.filter((locale) => GUARDIAN_REPORT_UI[locale].published)
  const guardianReportLanguages = {
    ...Object.fromEntries(
      guardianReportLocales.map((locale) => [LOCALE_HREFLANG_TAGS[locale], `${ORIGIN}/${locale}/guardian-report`]),
    ),
    'x-default': `${ORIGIN}/${DEFAULT_LOCALE}/guardian-report`,
  }

  return [
    ...publicRoutes,
    ...guardianReportLocales.map((locale) => ({
      url: `${ORIGIN}/${locale}/guardian-report`,
      changeFrequency: 'weekly' as const,
      priority: locale === DEFAULT_LOCALE ? 0.8 : 0.65,
      alternates: { languages: guardianReportLanguages },
    })),
  ]
}
