import type { Locale } from '@sobok/domain/locale'
import SiteFooter from '@sobok/site-chrome/footer'
import { LEGAL } from '@/content/legal'
import { PAGES } from '@/content/pages'

export default function Footer({ locale }: { locale: Locale }) {
  const { nav } = LEGAL[locale]
  const { nav: pageNav } = PAGES[locale]

  return (
    <SiteFooter
      links={[
        { path: '', label: pageNav.home },
        { path: '/about', label: pageNav.about },
        { path: '/contact', label: pageNav.contact },
        { path: '/terms', label: nav.terms },
        { path: '/privacy', label: nav.privacy },
      ]}
      locale={locale}
      service="zwds"
    />
  )
}
