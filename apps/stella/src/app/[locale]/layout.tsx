import '../globals.css'

import { PUBLIC_LOCALES } from '@sobok/domain/locale'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Toaster } from 'sonner'

import { getMessages } from '@/i18n/messages'
import { getLocaleFromParams } from '@/i18n/server'

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

export const metadata: Metadata = {
  metadataBase: new URL('https://stella.sobok.cc'),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0618',
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
      </body>
    </html>
  )
}
