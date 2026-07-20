import { DEFAULT_LOCALE, LOCALE_HREFLANG_TAGS, LOCALE_OPEN_GRAPH_TAGS, Locale } from '@sobok/domain/locale'
import type { Metadata } from 'next'

import { SITE_NAME } from '@/constants'

const DEFAULT_OG_IMAGE = '/og-image.webp'

type BuildMetadataInput = {
  locale: Locale
  // Path after the locale segment: '' for home, '/today', '/love', …
  path?: string
  title: string
  description: string
  image?: string
  noindex?: boolean
}

// Single source of truth for per-page canonical, hreflang, Open Graph, and
// Twitter metadata. `metadataBase`, the title template, and app-wide fields
// come from the locale layout and are merged by Next on top of this.
export function buildMetadata({
  locale,
  path = '',
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  noindex,
}: BuildMetadataInput): Metadata {
  const canonical = `/${locale}${path}`
  const openGraphLocale = LOCALE_OPEN_GRAPH_TAGS[locale]

  const images = [
    {
      url: image,
      width: 1200,
      height: 630,
      alt: `${SITE_NAME[locale]} — ${title}`,
      type: 'image/webp',
    },
  ]

  return {
    title,
    description,
    ...(noindex && { robots: { index: false, follow: true } }),
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(Object.values(Locale).map((entry) => [LOCALE_HREFLANG_TAGS[entry], `/${entry}${path}`])),
        // No language-neutral page exists (localePrefix: 'always'), so x-default
        // points at the default locale rather than a bare, unrouted path.
        'x-default': `/${DEFAULT_LOCALE}${path}`,
      },
    },
    openGraph: {
      title,
      description,
      images,
      locale: openGraphLocale,
      alternateLocale: Object.values(Locale)
        .map((entry) => LOCALE_OPEN_GRAPH_TAGS[entry])
        .filter((entry) => entry !== openGraphLocale),
      siteName: SITE_NAME[locale],
      type: 'website',
      url: canonical,
    },
    twitter: {
      title,
      description,
      images,
      card: 'summary_large_image',
      site: '@sobok_cc',
    },
  }
}
