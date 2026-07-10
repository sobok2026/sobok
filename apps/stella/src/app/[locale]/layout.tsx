import '../globals.css'

import { PUBLIC_LOCALES } from '@sobok/domain/locale'
import type { Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { Toaster } from 'sonner'

import { getMessages } from '@/i18n/messages'
import { getLocaleFromParams } from '@/i18n/server'

export function generateStaticParams() {
  return PUBLIC_LOCALES.map((locale) => ({ locale }))
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

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster position="top-center" richColors theme="dark" />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
