import type { Locale } from '@sobok/domain/locale'
import BusinessInfo from '@sobok/site-chrome/business-info'
import SiteFooter from '@sobok/site-chrome/footer'
import { LEGAL } from '@/content/legal'
import { PAGES } from '@/content/pages'

/** `className` carries the bottom padding, which differs with what each route group floats over the page. */
export default function Footer({ className, locale }: { className?: string; locale: Locale }) {
  const { nav } = LEGAL[locale]
  const { nav: pageNav } = PAGES[locale]

  return (
    <SiteFooter
      className={className}
      // 전자상거래법 §10 asks for the seller identity on the storefront, not only on a page a buyer has to go
      // looking for. So it rides every footer, and /business carries the same table at readable size.
      extra={<BusinessInfo className="mx-auto mt-6 max-w-xl text-[11px] leading-5" locale={locale} />}
      links={[
        { path: '', label: pageNav.home },
        { path: '/about', label: pageNav.about },
        { path: '/contact', label: pageNav.contact },
        { path: '/terms', label: nav.terms },
        { path: '/refund', label: nav.refund },
        { path: '/privacy', label: nav.privacy },
        { path: '/business', label: nav.business },
      ]}
      locale={locale}
      service="stella"
    />
  )
}
