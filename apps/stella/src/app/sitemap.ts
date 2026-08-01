import type { MetadataRoute } from 'next'

import { buildSitemap } from '@/lib/seo'

export const dynamic = 'force-static'

// tomorrow is intentionally absent: it is noindex (derived from /today).
export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap([
    { path: '', changeFrequency: 'weekly', priority: 1, altPriority: 0.8 },
    { path: '/today', changeFrequency: 'daily', priority: 0.9, altPriority: 0.7 },
    { path: '/love', changeFrequency: 'weekly', priority: 0.8, altPriority: 0.6 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.5, altPriority: 0.4 },
    { path: '/contact', changeFrequency: 'yearly', priority: 0.4, altPriority: 0.4 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3, altPriority: 0.3 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3, altPriority: 0.3 },
  ])
}
