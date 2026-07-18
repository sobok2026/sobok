import '../globals.css'

import { LOCALE_LANGUAGE_TAGS, Locale } from '@sobok/domain/locale'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import BirthProfileProvider from '@/components/BirthProfileProvider'
import { ORIGIN, SITE_NAME, THEME_COLOR } from '@/constants'
import { getLocale } from '@/i18n/server'

export function generateStaticParams() {
  return Object.values(Locale).map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Zwds.meta' })
  const siteName = SITE_NAME[locale]

  return {
    metadataBase: new URL(ORIGIN),
    title: {
      default: `${t('title')} - ${siteName}`,
      template: `%s - ${siteName}`,
    },
    description: t('description'),
    applicationName: siteName,
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

  return (
    <html lang={LOCALE_LANGUAGE_TAGS[locale]}>
      {locale !== Locale.ZH && (
        <link
          href="/fonts/pretendard-jp/1.3.9/variable/pretendardvariable-jp-dynamic-subset.css"
          precedence="font"
          rel="stylesheet"
        />
      )}
      <body className="antialiased">
        <NextIntlClientProvider>
          <BirthProfileProvider key={locale}>{children}</BirthProfileProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
