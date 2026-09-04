import { getLocale } from '@sobok/site-i18n/server'
import FunnelHeader from '@/components/FunnelHeader'

// Checkout and access recovery stay outside the ad-bearing site layout. They still keep a small header so the
// buyer can leave safely, but no automatic ad placement can appear beside payment or recovery controls.
export default async function CommerceLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale(params)
  return (
    <>
      <FunnelHeader locale={locale} />
      {children}
    </>
  )
}
