import { ADSENSE_ACCOUNT } from '@sobok/brand/identity'
import { getLocale } from '@sobok/site-i18n/server'
import Script from 'next/script'
import { getTranslations } from 'next-intl/server'
import BottomNav from '@/components/BottomNav'
import Header from '@/components/Header'

/**
 * The free reading surfaces, account archive, and legal documents. Checkout and email recovery live in the
 * sibling `(commerce)` group so advertising can never appear beside payment or recovery controls.
 *
 * The ad script is the reason this split exists. Auto ads are placement-side, so a page inherits them from
 * nothing more than this tag being present. The bottom nav remains on reading surfaces but not on commerce.
 *
 * The footer is intentionally not site-wide. Home and document routes add the full footer in their own layouts;
 * tools and account surfaces omit it so their reading flows end without unrelated navigation.
 */
export default async function SiteLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Constellation' })

  return (
    <>
      <Header locale={locale} localeLabel={t('localeSwitcher')} />
      {children}
      <BottomNav locale={locale} />
      <Script
        async
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ACCOUNT}`}
        strategy="afterInteractive"
      />
    </>
  )
}
