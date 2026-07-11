import '../globals.css'

import { PUBLIC_LOCALES } from '@sobok/domain/locale'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Toaster } from 'sonner'

import { ORIGIN, SITE_NAME, THEME_COLOR } from '@/constants'
import { getMessages } from '@/i18n/messages'
import { getLocaleFromParams } from '@/i18n/server'
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
  return PUBLIC_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
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
  const locale = await getLocaleFromParams(params)
  const messages = getMessages(locale)
  const t = await getTranslations({ locale, namespace: 'Constellation' })

  return (
    <html lang={locale}>
      <body className={`${PretendardVariable.className} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LocaleSwitcher label={t('localeSwitcher')} locale={locale} />
          {children}
          <Toaster position="top-center" richColors theme="dark" />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
