import type { Locale } from '@sobok/domain/locale'
import SiteFooter from '@sobok/site-chrome/footer'
import { LEGAL } from '@/content/legal'
import { PAGES } from '@/content/pages'

export default function Footer({ locale }: { locale: Locale }) {
  const { nav } = LEGAL[locale]
  const { nav: pageNav } = PAGES[locale]

  return (
    <SiteFooter
      // The bottom nav floats over the page below `sm`, so the footer reserves its band there.
      className="pb-[calc(5rem+var(--safe-area-bottom))] sm:pb-8"
      links={[
        { path: '', label: pageNav.home },
        { path: '/about', label: pageNav.about },
        { path: '/contact', label: pageNav.contact },
        { path: '/terms', label: nav.terms },
        { path: '/privacy', label: nav.privacy },
      ]}
      locale={locale}
      service="stella"
    />
  )
}
