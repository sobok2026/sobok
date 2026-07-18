import '../globals.css'

import { LOCALE_LANGUAGE_TAGS, Locale } from '@sobok/domain/locale'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import BirthProfileProvider from '@/components/BirthProfileProvider'
import Footer from '@/components/Footer'
import LocaleSwitcher from '@/components/LocaleSwitcher'
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
  const t = await getTranslations({ locale, namespace: 'Zwds' })

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
      </body>
    </html>
  )
}
