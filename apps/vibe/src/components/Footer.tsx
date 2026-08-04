import type { Locale } from '@sobok/domain/locale'
import BusinessInfo from '@sobok/site-chrome/business-info'
import SiteFooter from '@sobok/site-chrome/footer'
import { LEGAL } from '@/content/legal'
import { PAGES } from '@/content/pages'

export default function Footer({ locale }: { locale: Locale }) {
  const { nav } = LEGAL[locale]
  const { nav: pageNav } = PAGES[locale]

  return (
    <SiteFooter
      // The bottom island floats over the page below `sm`, so the footer reserves its band there.
      className="pb-[calc(5rem+var(--safe-area-bottom))] sm:pb-8"
      // 전자상거래법 제10조: the seller's registration details have to be on every page, so they ride in the footer.
      extra={
        <BusinessInfo
          className="mx-auto mt-6 max-w-xl text-left text-[0.6875rem] leading-5"
          locale={locale}
          showHeading={false}
        />
      }
      links={[
        { path: '', label: pageNav.home },
        { path: '/about', label: pageNav.about },
        { path: '/contact', label: pageNav.contact },
        { path: '/terms', label: nav.terms },
        { path: '/privacy', label: nav.privacy },
        { path: '/refund', label: nav.refund },
      ]}
      locale={locale}
      service="vibe"
    />
  )
}
