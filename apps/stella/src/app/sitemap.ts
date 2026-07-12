import { DEFAULT_LOCALE, Locale } from '@sobok/domain/locale'
import type { MetadataRoute } from 'next'

import { ORIGIN } from '@/constants'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = {
    ...Object.fromEntries(Object.values(Locale).map((locale) => [locale, `${ORIGIN}/${locale}/`])),
    'x-default': `${ORIGIN}/`,
  }

  const todayLanguages = {
    ...Object.fromEntries(Object.values(Locale).map((locale) => [locale, `${ORIGIN}/${locale}/today/`])),
    'x-default': `${ORIGIN}/today/`,
  }

  const loveLanguages = {
    ...Object.fromEntries(Object.values(Locale).map((locale) => [locale, `${ORIGIN}/${locale}/love/`])),
    'x-default': `${ORIGIN}/love/`,
  }

  return [
    ...Object.values(Locale).map((locale) => ({
      url: `${ORIGIN}/${locale}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: locale === DEFAULT_LOCALE ? 1 : 0.8,
      alternates: { languages },
    })),
    ...Object.values(Locale).map((locale) => ({
      url: `${ORIGIN}/${locale}/today/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: locale === DEFAULT_LOCALE ? 0.9 : 0.7,
      alternates: { languages: todayLanguages },
    })),
    ...Object.values(Locale).map((locale) => ({
      url: `${ORIGIN}/${locale}/love/`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: locale === DEFAULT_LOCALE ? 0.8 : 0.6,
      alternates: { languages: loveLanguages },
    })),
  ]
}
