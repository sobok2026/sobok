import { getLocale } from '@sobok/site-i18n/server'
import FunnelHeader from '@/components/FunnelHeader'

/**
 * The paid funnel: the guardian report offer, its free preview, checkout and everything downstream of a
 * payment. What it leaves out is the point — no ad script, no bottom nav, no cross-links to the free tools.
 *
 * The footer is offer-side rather than funnel-wide: routes that present a purchase add the full footer themselves,
 * while assessments, paid questions, results and recovery stay focused on the task at hand.
 */
export default async function FunnelLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale(params)

  return (
    <>
      <FunnelHeader locale={locale} />
      {children}
    </>
  )
}
