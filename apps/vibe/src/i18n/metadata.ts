import { DEFAULT_LOCALE, LOCALE_OPEN_GRAPH_TAGS, Locale } from '@sobok/domain/locale'
import type { Metadata } from 'next'

import { SITE_NAME } from '@/constants'
import { SOBOK_X_HANDLE } from '@/content/pages'

import { getLocalizedPath } from './pathnames'

type OgImage = {
  url: string
  width: number
  height: number
  type: string
}

// Shared social-preview image. WebP is served as-is (images: { unoptimized: true }).
const DEFAULT_OG_IMAGE: OgImage = {
  url: '/og-image.webp',
  width: 1200,
  height: 630,
  type: 'image/webp',
}

type Options = {
  description: string
  image?: OgImage
  locale: Locale
  pathname: string
  title: string
}

// Single source of truth for per-page metadata: title + description, canonical +
// hreflang alternates (with an unprefixed x-default), OpenGraph, and Twitter card.
// URLs are relative and resolve against `metadataBase` set in the root layout.
export function buildLocalizedMetadata({
  description,
  image = DEFAULT_OG_IMAGE,
  locale,
  pathname,
  title,
}: Options): Metadata {
  const canonical = getLocalizedPath(locale, pathname)
  const openGraphLocale = LOCALE_OPEN_GRAPH_TAGS[locale]
  const images = [{ ...image, alt: `${SITE_NAME[locale]} — ${title}` }]

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(Object.values(Locale).map((entry) => [entry, getLocalizedPath(entry, pathname)])),
        'x-default': pathname,
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
      site: SOBOK_X_HANDLE,
    },
  }
}
