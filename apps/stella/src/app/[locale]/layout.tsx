import '../globals.css'

import { LOCALE_LANGUAGE_TAGS, Locale } from '@sobok/domain/locale'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Toaster } from 'sonner'

import { ADSENSE_ACCOUNT, ORIGIN, SITE_NAME, THEME_COLOR } from '@/constants'
import { getLocale } from '@/i18n/server'
import Analytics from '@/lib/analytics/Analytics'
import JsonLd, { siteGraph } from '@/lib/JsonLd'
import BirthProfileProvider from './BirthProfileProvider'
import Footer from './Footer'
import LocaleSwitcher from './LocaleSwitcher'

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
      {locale !== Locale.ZH && (
        <link
          href="/fonts/pretendard-jp/1.3.9/variable/pretendardvariable-jp-dynamic-subset.css"
          precedence="font"
          rel="stylesheet"
        />
      )}
      <body className="antialiased">
        <JsonLd data={siteGraph(locale)} />
        <NextIntlClientProvider>
          <LocaleSwitcher label={t('localeSwitcher')} locale={locale} />
          <BirthProfileProvider>{children}</BirthProfileProvider>
          <Footer locale={locale} />
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
