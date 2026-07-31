import '../globals.css'

import GTMLoader from '@sobok/analytics/gtm-loader'
import { LOCALE_LANGUAGE_TAGS, LOCALES } from '@sobok/domain/locale'
import FontStylesheets from '@sobok/typography/stylesheets'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Toaster } from 'sonner'
import BirthProfileProvider from '@/components/BirthProfileProvider'
import BottomNav from '@/components/BottomNav'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import QueryProvider from '@/components/QueryProvider'
import { ADSENSE_ACCOUNT, GTM_ID, ORIGIN, SITE_NAME, THEME_COLOR } from '@/constants'
import { getLocale } from '@/i18n/server'
import JsonLd, { siteGraph } from '@/lib/JsonLd'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
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
      <FontStylesheets locale={locale} />
      <body className="antialiased">
        <JsonLd data={siteGraph(locale)} />
        <NextIntlClientProvider>
          <QueryProvider>
            <Header locale={locale} localeLabel={t('localeSwitcher')} />
            <BirthProfileProvider key={locale}>{children}</BirthProfileProvider>
            <Footer locale={locale} />
            <BottomNav locale={locale} />
            <Toaster position="top-center" richColors theme="dark" />
          </QueryProvider>
        </NextIntlClientProvider>
        <GTMLoader containerId={GTM_ID} productionOrigin={ORIGIN} />
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
