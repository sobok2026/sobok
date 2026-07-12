import '../globals.css'

import { Locale } from '@sobok/domain/locale'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Toaster } from 'sonner'

import { ORIGIN, SITE_NAME, THEME_COLOR } from '@/constants'
import { getLocale } from '@/i18n/server'
import Analytics from '@/lib/analytics/Analytics'
import LocaleSwitcher from './LocaleSwitcher'

const PretendardVariable = localFont({
  src: '../../fonts/PretendardVariable.400-700.3713.woff2',
  display: 'swap',
  weight: '400 700',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'system-ui',
    'Roboto',
    'Helvetica Neue',
    'Segoe UI',
    'Apple SD Gothic Neo',
    'Noto Sans KR',
    'Malgun Gothic',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'sans-serif',
  ],
})

export function generateStaticParams() {
  return Object.values(Locale).map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Constellation.meta' })

  return {
    metadataBase: new URL(ORIGIN),
    title: {
      default: `${t('title')} - ${SITE_NAME}`,
      template: `%s - ${SITE_NAME}`,
    },
    description: t('description'),
    applicationName: SITE_NAME,
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
    <html lang={locale}>
      <body className={`${PretendardVariable.className} antialiased`}>
        <NextIntlClientProvider>
          <LocaleSwitcher label={t('localeSwitcher')} locale={locale} />
          {children}
          <Toaster position="top-center" richColors theme="dark" />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
