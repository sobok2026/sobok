import { LOCALES } from '@sobok/domain/locale'
import { env } from '@sobok/env/client'
import type { MetadataRoute } from 'next'

import { getPathname } from '@/i18n/navigation'

const { NEXT_PUBLIC_APP_ORIGIN } = env

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...localizedSitemapEntries('/', 'monthly', 1),
    ...localizedSitemapEntries('/@', 'monthly', 0.5),
    ...localizedSitemapEntries('/posts/recommend', 'monthly', 0.4),
    ...localizedSitemapEntries('/privacy', 'yearly', 0.2),
    ...localizedSitemapEntries('/terms', 'yearly', 0.2),
    ...localizedSitemapEntries('/auth/login', 'yearly', 0.1),
    ...localizedSitemapEntries('/auth/signup', 'yearly', 0.1),
  ]
}

function localizedSitemapEntries(
  path: string,
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>,
  priority: number,
): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: new URL(getPathname({ href: path, locale }), NEXT_PUBLIC_APP_ORIGIN).toString(),
    changeFrequency,
    priority,
  }))
}
