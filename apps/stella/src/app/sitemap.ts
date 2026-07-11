import { DEFAULT_LOCALE, PUBLIC_LOCALES } from '@sobok/domain/locale'
import type { MetadataRoute } from 'next'

import { ORIGIN } from '@/constants'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = {
    ...Object.fromEntries(PUBLIC_LOCALES.map((locale) => [locale, `${ORIGIN}/${locale}/`])),
    'x-default': `${ORIGIN}/`,
  }

  return PUBLIC_LOCALES.map((locale) => ({
    url: `${ORIGIN}/${locale}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: locale === DEFAULT_LOCALE ? 1 : 0.8,
    alternates: { languages },
  }))
}
