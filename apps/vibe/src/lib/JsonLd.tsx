import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'

import { ORIGIN, SITE_NAME } from '@/constants'

const CONTEXT = 'https://schema.org'
const ORGANIZATION_ID = `${ORIGIN}/#organization`
const WEBSITE_ID = `${ORIGIN}/#website`

// Organization + WebSite. Emitted once per page from the root layout so every
// page carries the brand entity that page-level nodes reference by `@id`.
export function siteGraph(locale: Locale) {
  return {
    '@context': CONTEXT,
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: 'sobok',
        url: 'https://sobok.cc',
        logo: `${ORIGIN}/web-app-manifest-512x512.png`,
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        name: SITE_NAME[locale],
        url: `${ORIGIN}/${locale}`,
        inLanguage: LOCALE_LANGUAGE_TAGS[locale],
        publisher: { '@id': ORGANIZATION_ID },
      },
    ],
  }
}

type ToolPage = {
  path: string
  name: string
  description: string
}

// WebApplication + BreadcrumbList for a test tool page. Each test is a free,
// self-contained interactive app, so it carries its own WebApplication entity
// plus a breadcrumb back to the site root for breadcrumb rich results.
export function webApplicationGraph(locale: Locale, { path, name, description }: ToolPage) {
  const url = `${ORIGIN}/${locale}/${path}`
  return {
    '@context': CONTEXT,
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${url}#webapp`,
        name,
        description,
        url,
        applicationCategory: 'EntertainmentApplication',
        operatingSystem: 'Web',
        inLanguage: LOCALE_LANGUAGE_TAGS[locale],
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
        isPartOf: { '@id': WEBSITE_ID },
        publisher: { '@id': ORGANIZATION_ID },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME[locale], item: `${ORIGIN}/${locale}` },
          { '@type': 'ListItem', position: 2, name, item: url },
        ],
      },
    ],
  }
}

export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD built from our own strings, with `<` escaped
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll('<', '\\u003c') }}
    />
  )
}
