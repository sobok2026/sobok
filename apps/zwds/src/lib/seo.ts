import { createSiteSeo } from '@sobok/site-seo/site'

import { ORIGIN, SITE_NAME, THEME_COLOR } from '@/constants'

// Destructured so every call site keeps the shape it had when these builders lived in this app.
export const {
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
} = createSiteSeo({
  origin: ORIGIN,
  siteName: SITE_NAME,
  ogImage: { url: '/og-image.png', width: 1200, height: 630, type: 'image/png' },
  titleSeparator: ' - ',
  themeColor: THEME_COLOR,
  colorScheme: 'dark',
  priceCurrency: 'USD',
})
