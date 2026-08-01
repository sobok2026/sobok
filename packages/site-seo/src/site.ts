import { ADSENSE_ACCOUNT, SOBOK_ORIGIN, SOBOK_X_HANDLE, SOBOK_X_URL } from '@sobok/brand/identity'
import {
  DEFAULT_LOCALE,
  LOCALE_HREFLANG_TAGS,
  LOCALE_LANGUAGE_TAGS,
  LOCALE_OPEN_GRAPH_TAGS,
  LOCALES,
  type Locale,
} from '@sobok/domain/locale'
import type { Metadata, MetadataRoute, Viewport } from 'next'

export type OgImage = {
  url: string
  width: number
  height: number
  type: string
}

export type SiteSeoConfig = {
  /** Production origin, no trailing slash — e.g. `https://stella.sobok.cc`. */
  origin: string
  siteName: Record<Locale, string>
  /** Default social preview image, as a path relative to `origin`. */
  ogImage: OgImage
  /** Separates a page title from the site name in the title template. */
  titleSeparator: string
  /** `background_color`/`theme_color` for the manifest and the viewport theme color. */
  themeColor: string
  colorScheme: 'dark' | 'light'
  /**
   * Currency the free-offer JSON-LD prices in. Zero either way — schema.org requires a currency alongside a
   * price, and the sites picked different ones before this was shared.
   */
  priceCurrency: string
}

const CONTEXT = 'https://schema.org'

// Brand-wide, and the same node on every site. It used to be `${origin}/#organization`, which minted a
// separate Organization per subdomain: three nodes claiming the same name and url, none of them the one the
// others' `publisher` pointed at. The `@id` is what makes them one entity, so it hangs off the apex.
const ORGANIZATION_ID = `${SOBOK_ORIGIN}/#organization`

export type SitemapRoute = {
  path: string
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
  /** Priority for the non-default locales. Defaults to 85% of `priority`. */
  altPriority?: number
}

type BuildMetadataInput = {
  locale: Locale
  /** Path after the locale segment: '' for the locale root, '/today', '/deep-type/test', … */
  path?: string
  title: string
  description: string
  /** A path (reusing the default image's dimensions and type) or a complete image descriptor. */
  image?: string | OgImage
  /** Keep the page out of the index but let its links be followed. */
  noindex?: boolean
}

type RootMetadataInput = {
  locale: Locale
  title: string
  description: string
}

type ToolPage = {
  path: string
  name: string
  description: string
}

type SubPage = ToolPage & {
  image: string
}

/**
 * Everything a sobok static site says about itself to a crawler, bound to one site's identity.
 *
 * It is a factory rather than a set of free functions because every builder needs the same three facts —
 * origin, site name, default image — and threading those through ~30 call sites is how the per-app copies
 * drifted in the first place. Each app creates one of these in `src/lib/seo.ts` and re-exports the pieces,
 * so call sites keep the shape they already had.
 */
export function createSiteSeo(config: SiteSeoConfig) {
  const { colorScheme, ogImage, origin, priceCurrency, siteName, themeColor, titleSeparator } = config
  const WEBSITE_ID = `${origin}/#website`

  function resolveImage(image: string | OgImage | undefined): OgImage {
    if (!image) {
      return ogImage
    }

    return typeof image === 'string' ? { ...ogImage, url: image } : image
  }

  /**
   * Per-page canonical, hreflang, Open Graph and Twitter metadata.
   */
  function buildMetadata({ description, image, locale, noindex, path = '', title }: BuildMetadataInput): Metadata {
    const suffix = normalizePath(path)
    const canonical = `/${locale}${suffix}`
    const openGraphLocale = LOCALE_OPEN_GRAPH_TAGS[locale]
    const images = [{ ...resolveImage(image), alt: `${siteName[locale]} — ${title}` }]

    return {
      title,
      description,
      ...(noindex && { robots: { index: false, follow: true } }),
      alternates: {
        canonical,
        languages: {
          ...Object.fromEntries(LOCALES.map((entry) => [LOCALE_HREFLANG_TAGS[entry], `/${entry}${suffix}`])),
          'x-default': `/${DEFAULT_LOCALE}${suffix}`,
        },
      },
      openGraph: {
        title,
        description,
        images,
        locale: openGraphLocale,
        alternateLocale: LOCALES.map((entry) => LOCALE_OPEN_GRAPH_TAGS[entry]).filter(
          (entry) => entry !== openGraphLocale,
        ),
        siteName: siteName[locale],
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

  /**
   * The locale layout's metadata: the title template every page title is merged into, and `metadataBase`,
   * which is what lets every URL above stay relative.
   */
  function buildRootMetadata({ description, locale, title }: RootMetadataInput): Metadata {
    const name = siteName[locale]

    return {
      metadataBase: new URL(origin),
      title: {
        default: `${title}${titleSeparator}${name}`,
        template: `%s${titleSeparator}${name}`,
      },
      description,
      applicationName: name,
      verification: { other: { 'google-adsense-account': ADSENSE_ACCOUNT } },
    }
  }

  function buildViewport(): Viewport {
    return {
      width: 'device-width',
      initialScale: 1,
      viewportFit: 'cover',
      themeColor,
      colorScheme,
    }
  }

  /**
   * One sitemap entry per locale per route, cross-referencing the whole set through `alternates.languages`.
   */
  function buildSitemap(routes: readonly SitemapRoute[]): MetadataRoute.Sitemap {
    return routes.flatMap(({ altPriority, changeFrequency, path, priority }) => {
      const suffix = normalizePath(path)

      const languages = {
        ...Object.fromEntries(LOCALES.map((entry) => [LOCALE_HREFLANG_TAGS[entry], `${origin}/${entry}${suffix}`])),
        'x-default': `${origin}/${DEFAULT_LOCALE}${suffix}`,
      }

      return LOCALES.map((locale) => ({
        url: `${origin}/${locale}${suffix}`,
        changeFrequency,
        priority: locale === DEFAULT_LOCALE ? priority : (altPriority ?? priority * 0.85),
        alternates: { languages },
      }))
    })
  }

  function buildRobots(): MetadataRoute.Robots {
    return {
      rules: [{ userAgent: '*', allow: '/' }],
      sitemap: `${origin}/sitemap.xml`,
    }
  }

  type ManifestInput = {
    /** Full app name, in the default locale — the manifest is a single global file. */
    name: string
    description: string
    protocolHandlers?: NonNullable<MetadataRoute.Manifest['protocol_handlers']>
  }

  function buildManifest({ description, name, protocolHandlers }: ManifestInput): MetadataRoute.Manifest {
    return {
      name,
      short_name: siteName[DEFAULT_LOCALE],
      description,
      id: '/',
      start_url: '/',
      display: 'standalone',
      display_override: ['window-controls-overlay', 'standalone'],
      background_color: themeColor,
      theme_color: themeColor,
      lang: DEFAULT_LOCALE,
      ...(protocolHandlers && { protocol_handlers: protocolHandlers }),
      icons: [
        { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    }
  }

  /** Organization + WebSite, emitted once per page from the locale layout so page nodes can reference them. */
  function siteGraph(locale: Locale) {
    return {
      '@context': CONTEXT,
      '@graph': [
        {
          '@type': 'Organization',
          '@id': ORGANIZATION_ID,
          name: 'sobok',
          url: SOBOK_ORIGIN,
          logo: `${SOBOK_ORIGIN}/web-app-manifest-512x512.png`,
          sameAs: [SOBOK_X_URL],
        },
        {
          '@type': 'WebSite',
          '@id': WEBSITE_ID,
          name: siteName[locale],
          url: `${origin}/${locale}`,
          inLanguage: LOCALE_LANGUAGE_TAGS[locale],
          publisher: { '@id': ORGANIZATION_ID },
        },
      ],
    }
  }

  /**
   * The interactive tool on a page.
   *
   * Pass a description for the site's home tool, or a `{ path, name, description }` for a tool that lives one
   * level deeper — the latter also gets a BreadcrumbList back to the locale root, which the home tool cannot
   * have because it IS the root.
   */
  function webApplicationGraph(locale: Locale, page: string | ToolPage) {
    const offer = {
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'Web',
      inLanguage: LOCALE_LANGUAGE_TAGS[locale],
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency },
      isPartOf: { '@id': WEBSITE_ID },
      publisher: { '@id': ORGANIZATION_ID },
    }

    if (typeof page === 'string') {
      return {
        '@context': CONTEXT,
        '@type': 'WebApplication',
        '@id': `${origin}/${locale}#webapp`,
        name: siteName[locale],
        description: page,
        url: `${origin}/${locale}`,
        ...offer,
      }
    }

    const url = `${origin}/${locale}${normalizePath(page.path)}`

    return {
      '@context': CONTEXT,
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': `${url}#webapp`,
          name: page.name,
          description: page.description,
          url,
          ...offer,
        },
        breadcrumb(locale, url, page.name),
      ],
    }
  }

  /** WebPage + BreadcrumbList for a secondary content page (as opposed to a tool). */
  function subPageGraph(locale: Locale, { description, image, name, path }: SubPage) {
    const url = `${origin}/${locale}${normalizePath(path)}`

    return {
      '@context': CONTEXT,
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${url}#webpage`,
          name,
          description,
          url,
          inLanguage: LOCALE_LANGUAGE_TAGS[locale],
          isPartOf: { '@id': WEBSITE_ID },
          primaryImageOfPage: `${origin}${image}`,
        },
        breadcrumb(locale, url, name),
      ],
    }
  }

  function breadcrumb(locale: Locale, url: string, name: string) {
    return {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: siteName[locale], item: `${origin}/${locale}` },
        { '@type': 'ListItem', position: 2, name, item: url },
      ],
    }
  }

  return {
    buildManifest,
    buildMetadata,
    buildRobots,
    buildRootMetadata,
    buildSitemap,
    buildViewport,
    faqPageGraph,
    siteGraph,
    subPageGraph,
    webApplicationGraph,
  }
}

/**
 * FAQPage for the Q&A a page renders. Site-independent — the nodes carry no site identity — but returned from
 * the factory too so call sites import every graph builder from one place.
 *
 * The text must be the same text the visible accordion shows; Google treats a mismatch as cloaking.
 */
export function faqPageGraph(items: readonly { q: string; a: string }[]) {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map(({ a, q }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

/** '' and '/' both mean the locale root; everything else keeps a leading slash and drops a trailing one. */
function normalizePath(path: string): string {
  if (!path || path === '/') {
    return ''
  }

  const withLeading = path.startsWith('/') ? path : `/${path}`
  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading
}
