import '../globals.css'

import { LOCALE_LANGUAGE_TAGS, Locale } from '@sobok/domain/locale'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import BottomNav from '@/components/BottomNav'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { ADSENSE_ACCOUNT, ORIGIN, SITE_NAME, THEME_COLOR } from '@/constants'
import { getLocale } from '@/i18n/server'
import Analytics from '@/lib/analytics/Analytics'
import JsonLd, { siteGraph } from '@/lib/JsonLd'

export function generateStaticParams() {
  return Object.values(Locale).map((locale) => ({ locale }))
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
      <head>
        <Script id="google-consent-default" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});gtag('set','ads_data_redaction',true);`}
        </Script>
      </head>
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
          <Header locale={locale} localeLabel={t('localeSwitcher')} />
          <div className="flex flex-1 flex-col min-h-dvh pt-[calc(var(--spacing-header)+var(--safe-area-top))]">
            {children}
          </div>
          <BottomNav locale={locale} />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
