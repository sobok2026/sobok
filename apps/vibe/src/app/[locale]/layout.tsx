import '../globals.css'

import GTMLoader from '@sobok/analytics/gtm-loader'
import { LOCALE_LANGUAGE_TAGS, LOCALES } from '@sobok/domain/locale'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'
import PageBody from '@/components/PageBody'
import { ADSENSE_ACCOUNT, GTM_ID, ORIGIN, SITE_NAME, THEME_COLOR } from '@/constants'
import { getLocale } from '@/i18n/server'
import AdSense from '@/lib/ads/AdSense'
import JsonLd, { siteGraph } from '@/lib/JsonLd'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Common.meta' })
  const siteName = SITE_NAME[locale]

  return {
    metadataBase: new URL(ORIGIN),
    title: {
      default: `${t('title')} · ${siteName}`,
      template: `%s · ${siteName}`,
    },
    description: t('description'),
    applicationName: siteName,
    verification: { other: { 'google-adsense-account': ADSENSE_ACCOUNT } },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: THEME_COLOR,
  colorScheme: 'light',
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Common' })

  return (
    <html lang={LOCALE_LANGUAGE_TAGS[locale]}>
      {/* Consent Mode defaults are NOT set here. They live in the container, on the Consent Initialization
          trigger — the one hook GTM guarantees runs before every other tag, and therefore the only place the
          defaults are ordered correctly relative to the tags they gate. Duplicating them page-side would give
          two sources of truth for a legal control. See infra/gtm/sobok.cc/GTM-MH37D28N.json in sobok-ops. */}
      {/* Korean (Hangul) — base Pretendard dynamic subset. */}
      <link
        href="/fonts/pretendard/1.3.9/variable/pretendardvariable-dynamic-subset.css"
        precedence="font"
        rel="stylesheet"
      />
      {/* Japanese (kana + JIS kanji) — Pretendard JP dynamic subset. */}
      <link
        href="/fonts/pretendard-jp/1.3.9/variable/pretendardvariable-jp-dynamic-subset.css"
        precedence="font"
        rel="stylesheet"
      />
      {/* Simplified Chinese — Noto Sans SC (Pretendard has no SC hanzi). */}
      <link href="/fonts/noto-sans-sc/5.3.0/wght.css" precedence="font" rel="stylesheet" />
      <body className="flex min-h-dvh flex-col bg-page-bg text-page-ink antialiased">
        <JsonLd data={siteGraph(locale)} />
        <NextIntlClientProvider>
          <Header locale={locale} localeLabel={t('localeSwitcher')} navLabel={t('primaryNav')} />
          <PageBody>{children}</PageBody>
          <BottomNav locale={locale} navLabel={t('primaryNav')} />
        </NextIntlClientProvider>
        <AdSense />
        <GTMLoader containerId={GTM_ID} productionOrigin={ORIGIN} />
      </body>
    </html>
  )
}
