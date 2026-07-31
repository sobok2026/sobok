import '../globals.css'

import GTMLoader from '@sobok/analytics/gtm-loader'
import { APP_METADATA, THEME_COLOR } from '@sobok/domain/app/metadata'
import { LOCALES } from '@sobok/domain/locale'
import { env } from '@sobok/env/client'
import FontStylesheets from '@sobok/typography/stylesheets'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import CapacitorNativeEffects from '@/components/CapacitorNativeEffects'
import SEOText from '@/components/SEOText'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import OverlayHost from '@/components/ui/OverlayHost'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'
import QueryProvider from '@/lib/react-query/QueryProvider'
import { THEMES } from '@/store/theme'

const { NEXT_PUBLIC_APP_ORIGIN, NEXT_PUBLIC_GTM_ID } = env

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.app' })
  const appMetadata = APP_METADATA[locale]
  const description = t('description')

  return {
    metadataBase: new URL(NEXT_PUBLIC_APP_ORIGIN),
    title: {
      default: appMetadata.applicationName,
      template: `%s - ${appMetadata.shortName}`,
    },
    description,
    applicationName: appMetadata.shortName,
    keywords: 'sobok, 소복, sobok.cc',
    referrer: 'same-origin',
    robots: {
      index: true,
      follow: true,
    },
    ...generateLocalizedMetadata({ pathname: '/', locale, description }),
    verification: { google: '...' },
  }
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_COLOR.light },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLOR.dark },
  ],
  colorScheme: 'light dark',
}

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function RootLayout({ children, params }: Props) {
  const locale = await getLocaleFromParams(params)
  const appMetadata = APP_METADATA[locale]

  return (
    <html className="h-full" lang={locale} suppressHydrationWarning>
      <head>
        <meta content={appMetadata.shortName} name="apple-mobile-web-app-title" />
      </head>
      <FontStylesheets locale={locale} />
      <body className="antialiased h-full">
        <ThemeProvider disableTransitionOnChange themes={THEMES}>
          <CapacitorNativeEffects />
          <NextIntlClientProvider>
            <OverlayHost>
              <Toaster
                className="pointer-events-auto notranslate"
                mobileOffset={{ top: 'calc(1rem + var(--safe-area-top))' }}
                position="top-center"
                theme="system"
              />
            </OverlayHost>
            <QueryProvider>{children}</QueryProvider>
          </NextIntlClientProvider>
          <ServiceWorkerRegistrar />
          <GTMLoader containerId={NEXT_PUBLIC_GTM_ID} productionOrigin={NEXT_PUBLIC_APP_ORIGIN} />
          <p className="h-0 overflow-hidden tracking-widest invisible">
            <SEOText />
          </p>
        </ThemeProvider>
      </body>
    </html>
  )
}
