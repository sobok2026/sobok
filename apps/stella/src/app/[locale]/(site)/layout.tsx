import { ADSENSE_ACCOUNT } from '@sobok/brand/identity'
import { getLocale } from '@sobok/site-i18n/server'
import Script from 'next/script'
import { getTranslations } from 'next-intl/server'
import BottomNav from '@/components/BottomNav'
import Footer from '@/components/Footer'
import Header from '@/components/Header'

/**
 * Everything outside the paid funnel: the free tools and the legal documents. The chrome that used to live in
 * `[locale]/layout.tsx` belongs here rather than one level up, because none of it may appear beside an offer.
 *
 * The ad script is the reason this split exists. Auto ads are placement-side, so a page inherits them from
 * nothing more than this tag being present — which would put a competitor's ad next to a ₩3,900 checkout. The
 * bottom nav is the second reason: three fixed escape routes under a buyer's thumb for the whole funnel.
 */
export default async function SiteLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Constellation' })

  return (
    <>
      <Header locale={locale} localeLabel={t('localeSwitcher')} />
      {children}
      <Footer locale={locale} />
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
