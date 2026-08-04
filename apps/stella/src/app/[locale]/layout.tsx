import '../globals.css'

import GtmLoader from '@sobok/analytics/gtm-loader'
import { GTM_ID } from '@sobok/brand/identity'
import { LOCALE_LANGUAGE_TAGS, LOCALES } from '@sobok/domain/locale'
import { getLocale } from '@sobok/site-i18n/server'
import JsonLd from '@sobok/site-seo/json-ld'
import FontStylesheets from '@sobok/typography/stylesheets'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Toaster } from 'sonner'
import BirthProfileProvider from '@/components/BirthProfileProvider'
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

// The document and everything that is true of every route: fonts, providers, the site's Organization graph
// and the tag loader. Visible chrome lives one level down, because the paid funnel and the free site do not
// agree on any of it — see `(site)/layout.tsx` and `(funnel)/layout.tsx`.
export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale(params)

  return (
    <html lang={LOCALE_LANGUAGE_TAGS[locale]}>
      <FontStylesheets locale={locale} />
      <body className="antialiased">
        <JsonLd data={siteGraph(locale)} />
        <NextIntlClientProvider>
          <QueryProvider>
            <BirthProfileProvider key={locale}>{children}</BirthProfileProvider>
            <Toaster position="top-center" richColors theme="dark" />
          </QueryProvider>
        </NextIntlClientProvider>
        <GtmLoader containerId={GTM_ID} productionOrigin={ORIGIN} />
      </body>
    </html>
  )
}
