import { getLocale } from '@sobok/site-i18n/server'
import Footer from '@/components/Footer'
import FunnelHeader from '@/components/FunnelHeader'

/**
 * The paid funnel: the guardian report offer, its free preview, checkout and everything downstream of a
 * payment. What it leaves out is the point — no ad script, no bottom nav, no cross-links to the free tools.
 *
 * The footer stays, and has to: 전자상거래법 §10 (seller identity) and §13 (the 거래조건 a buyer must be able to
 * read before agreeing) both want their disclosures reachable from the page that asks for the money.
 */
export default async function FunnelLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale(params)

  return (
    <>
      <FunnelHeader locale={locale} />
      {children}
      {/* Below `sm` the offer's CTA bar floats over the page, so the footer reserves its band there. */}
      <Footer className="pb-[calc(5.5rem+var(--safe-area-bottom))] sm:pb-8" locale={locale} />
    </>
  )
}
