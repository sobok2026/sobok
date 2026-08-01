import '../globals.css'

import GTMLoader from '@sobok/analytics/gtm-loader'
import { ADSENSE_ACCOUNT, GTM_ID } from '@sobok/brand/identity'
import { LOCALE_LANGUAGE_TAGS, LOCALES } from '@sobok/domain/locale'
import { getLocale } from '@sobok/site-i18n/server'
import JsonLd from '@sobok/site-seo/json-ld'
import FontStylesheets from '@sobok/typography/stylesheets'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import BirthProfileProvider from '@/components/BirthProfileProvider'
import Footer from '@/components/Footer'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import { ORIGIN } from '@/constants'
import { buildRootMetadata, buildViewport, siteGraph } from '@/lib/seo'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Zwds.meta' })

  return buildRootMetadata({ locale, title: t('title'), description: t('description') })
}

export const viewport: Viewport = buildViewport()

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Zwds' })

  return (
    <html lang={LOCALE_LANGUAGE_TAGS[locale]}>
      <FontStylesheets locale={locale} />
      <body className="antialiased">
        <JsonLd data={siteGraph(locale)} />
        <NextIntlClientProvider>
          <header className="absolute inset-x-0 top-0 z-40 px-2 pt-[calc(0.5rem+var(--safe-area-top))] sm:fixed">
            <div className="mx-auto flex items-center justify-end">
              <div className="flex h-9 items-center rounded-full border border-border bg-background/70 px-4 shadow-lg shadow-black/20 backdrop-blur-md">
                <LocaleSwitcher label={t('localeSwitcher')} locale={locale} />
              </div>
            </div>
          </header>
          <BirthProfileProvider key={locale}>{children}</BirthProfileProvider>
          <Footer locale={locale} />
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
