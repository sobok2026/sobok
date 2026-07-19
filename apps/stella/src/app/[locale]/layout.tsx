import '../globals.css'

import { LOCALE_LANGUAGE_TAGS, Locale } from '@sobok/domain/locale'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Toaster } from 'sonner'
import BirthProfileProvider from '@/components/BirthProfileProvider'
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
  const t = await getTranslations({ locale, namespace: 'Constellation.meta' })
  const siteName = SITE_NAME[locale]

  return {
    metadataBase: new URL(ORIGIN),
    title: {
      default: `${t('title')} - ${siteName}`,
      template: `%s - ${siteName}`,
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
  colorScheme: 'dark',
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Constellation' })

  return (
    <html lang={LOCALE_LANGUAGE_TAGS[locale]}>
      <link
        href="/fonts/pretendard-jp/1.3.9/variable/pretendardvariable-jp-dynamic-subset.css"
        precedence="font"
        rel="stylesheet"
      />
      <body className="antialiased">
        {/* Full-viewport night-sky backdrop. `fixed inset-0` spans the entire
            physical screen under viewport-fit=cover, so the gradient reaches the
            iOS Safari bottom safe area / home-indicator strip behind the address
            bar — which the scrolling `<main>` gradient (sized to dvh) never
            covers. In standalone the main gradient fills the screen and hides
            this, so the normal look is unchanged. */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-night-sky" />
        <JsonLd data={siteGraph(locale)} />
        <NextIntlClientProvider>
          <Header locale={locale} localeLabel={t('localeSwitcher')} />
          <BirthProfileProvider key={locale}>{children}</BirthProfileProvider>
          <Footer locale={locale} />
          <BottomNav locale={locale} />
          <Toaster position="top-center" richColors theme="dark" />
        </NextIntlClientProvider>
        <Analytics />
        <Script
          async
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ACCOUNT}`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
