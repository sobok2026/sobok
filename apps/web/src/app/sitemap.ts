import { Locale } from '@sobok/domain/locale'
import { env } from '@sobok/env/client'
import type { MetadataRoute } from 'next'

import { getPathname } from '@/i18n/navigation'

const { NEXT_PUBLIC_APP_ORIGIN } = env

const PRIORITY_LEVELS = {
  HOME: 1.0,
  MAIN_SECTIONS: 0.9,
  MANGA_DETAIL: 0.8,
  RANKING: 0.7,
  SEARCH: 0.6,
  LIBRARY: 0.5,
  USER_PAGES: 0.4,
  POSTS: 0.3,
  LEGAL: 0.2,
  AUTH: 0.1,
} as const

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...localizedSitemapEntries('/new', 'daily', PRIORITY_LEVELS.MAIN_SECTIONS),
    ...localizedSitemapEntries('/', 'monthly', PRIORITY_LEVELS.HOME),
    ...localizedSitemapEntries('/@', 'monthly', PRIORITY_LEVELS.USER_PAGES),
    ...localizedSitemapEntries('/posts/recommend', 'monthly', PRIORITY_LEVELS.POSTS),
    ...localizedSitemapEntries('/doc/privacy', 'yearly', PRIORITY_LEVELS.LEGAL),
    ...localizedSitemapEntries('/doc/terms', 'yearly', PRIORITY_LEVELS.LEGAL),
    ...localizedSitemapEntries('/doc/youth-protection', 'yearly', PRIORITY_LEVELS.LEGAL),
    ...localizedSitemapEntries('/doc/2257', 'yearly', PRIORITY_LEVELS.LEGAL),
    ...localizedSitemapEntries('/doc/dmca', 'yearly', PRIORITY_LEVELS.LEGAL),
    ...localizedSitemapEntries('/deterrence', 'yearly', PRIORITY_LEVELS.LEGAL),
    ...localizedSitemapEntries('/auth/login', 'yearly', PRIORITY_LEVELS.AUTH),
    ...localizedSitemapEntries('/auth/signup', 'yearly', PRIORITY_LEVELS.AUTH),
  ]
}

function localizedSitemapEntries(
  path: string,
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>,
  priority: number,
): MetadataRoute.Sitemap {
  return Object.values(Locale).map((locale) => ({
    url: new URL(getPathname({ href: path, locale }), NEXT_PUBLIC_APP_ORIGIN).toString(),
    changeFrequency,
    priority,
  }))
}
