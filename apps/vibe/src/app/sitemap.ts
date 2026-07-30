import { DEFAULT_LOCALE, LOCALES } from '@sobok/domain/locale'
import type { MetadataRoute } from 'next'

import { ORIGIN } from '@/constants'

export const dynamic = 'force-static'

const ROUTES = [
  {
    path: '',
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    path: 'couple-gyeol',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    path: 'couple-type',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    path: 'deep-type',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    path: 'deep-type/methodology',
    changeFrequency: 'monthly',
    priority: 0.55,
  },
  {
    path: 'about',
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    path: 'contact',
    changeFrequency: 'yearly',
    priority: 0.4,
  },
  {
    path: 'terms',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    path: 'privacy',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    path: 'refund',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    path: 'business',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.flatMap(({ path, changeFrequency, priority }) => {
    const suffix = path ? `/${path}` : ''

    const languages = {
      ...Object.fromEntries(LOCALES.map((locale) => [locale, `${ORIGIN}/${locale}${suffix}`])),
      'x-default': `${ORIGIN}${suffix}`,
    }

    return LOCALES.map((locale) => ({
      url: `${ORIGIN}/${locale}${suffix}`,
      lastModified: new Date(),
      changeFrequency,
      priority: locale === DEFAULT_LOCALE ? priority : priority * 0.85,
      alternates: { languages },
    }))
  })
}
