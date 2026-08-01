import '../globals.css'

import GtmLoader from '@sobok/analytics/gtm-loader'
import { ADSENSE_ACCOUNT, GTM_ID } from '@sobok/brand/identity'
import { LOCALE_LANGUAGE_TAGS, LOCALES } from '@sobok/domain/locale'
import { getLocale } from '@sobok/site-i18n/server'
import JsonLd from '@sobok/site-seo/json-ld'
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
import { ORIGIN } from '@/constants'
import { buildRootMetadata, buildViewport, siteGraph } from '@/lib/seo'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Constellation.meta' })

  return buildRootMetadata({ locale, title: t('title'), description: t('description') })
}

export const viewport: Viewport = buildViewport()

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
        <GtmLoader containerId={GTM_ID} productionOrigin={ORIGIN} />
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
