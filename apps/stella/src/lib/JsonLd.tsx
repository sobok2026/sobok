import { SOBOK_X_URL } from '@sobok/brand/identity'
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
        sameAs: [SOBOK_X_URL],
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

// The interactive birth-chart tool on the home page.
export function webApplicationGraph(locale: Locale, description: string) {
  return {
    '@context': CONTEXT,
    '@type': 'WebApplication',
    '@id': `${ORIGIN}/${locale}#webapp`,
    name: SITE_NAME[locale],
    description,
    url: `${ORIGIN}/${locale}`,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web',
    inLanguage: LOCALE_LANGUAGE_TAGS[locale],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
  }
}

type SubPage = {
  path: string
  name: string
  description: string
  image: string
}

// WebPage + BreadcrumbList for the secondary tool pages (today, love).
export function subPageGraph(locale: Locale, { path, name, description, image }: SubPage) {
  const url = `${ORIGIN}/${locale}/${path}`
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
        primaryImageOfPage: `${ORIGIN}${image}`,
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

// FAQPage for the evergreen Q&A rendered by <Faq>. Same text as the visible
// accordion, which Google requires for FAQ rich results.
export function faqPageGraph(items: readonly { q: string; a: string }[]) {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
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
