import '../globals.css'

import GTMLoader from '@sobok/analytics/gtm-loader'
import { GTM_ID } from '@sobok/brand/identity'
import { LOCALE_LANGUAGE_TAGS, LOCALES } from '@sobok/domain/locale'
import { getLocale } from '@sobok/site-i18n/server'
import JsonLd from '@sobok/site-seo/json-ld'
import FontStylesheets from '@sobok/typography/stylesheets'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'
import PageBody from '@/components/PageBody'
import { ORIGIN } from '@/constants'
import AdSense from '@/lib/ads/AdSense'
import { buildRootMetadata, buildViewport, siteGraph } from '@/lib/seo'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Common.meta' })

  return buildRootMetadata({ locale, title: t('title'), description: t('description') })
}

export const viewport: Viewport = buildViewport()

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Common' })

  return (
    <html lang={LOCALE_LANGUAGE_TAGS[locale]}>
      {/* Consent Mode defaults are NOT set here. They live in the container, on the Consent Initialization
          trigger — the one hook GTM guarantees runs before every other tag, and therefore the only place the
          defaults are ordered correctly relative to the tags they gate. Duplicating them page-side would give
          two sources of truth for a legal control. See infra/gtm/sobok.cc/GTM-MH37D28N.json in sobok-ops. */}
      <FontStylesheets locale={locale} />
      <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
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
