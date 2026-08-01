import type { MetadataRoute } from 'next'

import { buildSitemap } from '@/lib/seo'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap([
    { path: '', changeFrequency: 'weekly', priority: 1 },
    { path: '/couple-gyeol', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/couple-type', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/deep-type', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/deep-type/methodology', changeFrequency: 'monthly', priority: 0.55 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/contact', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/refund', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/business', changeFrequency: 'yearly', priority: 0.3 },
  ])
}
