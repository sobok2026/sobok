import { DEFAULT_LOCALE, Locale } from '@sobok/domain/locale'
import type { MetadataRoute } from 'next'

import { ORIGIN } from '@/constants'

export const dynamic = 'force-static'

const ROUTES = [
  { path: '', changeFrequency: 'weekly' as const, priority: 1 },
  { path: 'about', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: 'contact', changeFrequency: 'yearly' as const, priority: 0.4 },
  { path: 'terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: 'privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.flatMap(({ path, changeFrequency, priority }) => {
    const suffix = path ? `/${path}` : ''
    const languages = {
      ...Object.fromEntries(Object.values(Locale).map((locale) => [locale, `${ORIGIN}/${locale}${suffix}`])),
      'x-default': `${ORIGIN}${suffix}`,
    }

    return Object.values(Locale).map((locale) => ({
      url: `${ORIGIN}/${locale}${suffix}`,
      lastModified: new Date(),
      changeFrequency,
      priority: locale === DEFAULT_LOCALE ? priority : priority * 0.85,
      alternates: { languages },
    }))
  })
}
