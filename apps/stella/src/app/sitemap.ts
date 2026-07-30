import { DEFAULT_LOCALE, LOCALE_HREFLANG_TAGS, LOCALES } from '@sobok/domain/locale'
import type { MetadataRoute } from 'next'

import { ORIGIN } from '@/constants'

export const dynamic = 'force-static'

type SitemapEntry = MetadataRoute.Sitemap[number]

type Route = {
  path: string
  changeFrequency: SitemapEntry['changeFrequency']
  priority: number
  altPriority: number
}

// tomorrow is intentionally absent: it is noindex (derived from /today).
const ROUTES: Route[] = [
  { path: '', changeFrequency: 'weekly', priority: 1, altPriority: 0.8 },
  { path: '/today', changeFrequency: 'daily', priority: 0.9, altPriority: 0.7 },
  { path: '/love', changeFrequency: 'weekly', priority: 0.8, altPriority: 0.6 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5, altPriority: 0.4 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.4, altPriority: 0.4 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3, altPriority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3, altPriority: 0.3 },
]

function languagesFor(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((locale) => [LOCALE_HREFLANG_TAGS[locale], `${ORIGIN}/${locale}${path}`])),
    'x-default': `${ORIGIN}/${DEFAULT_LOCALE}${path}`,
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return ROUTES.flatMap(({ path, changeFrequency, priority, altPriority }) => {
    const languages = languagesFor(path)

    return LOCALES.map((locale) => ({
      url: `${ORIGIN}/${locale}${path}`,
      lastModified,
      changeFrequency,
      priority: locale === DEFAULT_LOCALE ? priority : altPriority,
      alternates: { languages },
    }))
  })
}
