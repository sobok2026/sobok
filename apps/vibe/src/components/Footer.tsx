import { otherServices } from '@sobok/brand/services'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { SITE_NAME } from '@/constants'
import { LEGAL } from '@/content/legal'
import { PAGES } from '@/content/pages'
import BusinessInfo from './BusinessInfo'

export default function Footer({ locale }: { locale: Locale }) {
  const { nav } = LEGAL[locale]
  const { nav: pageNav } = PAGES[locale]

  return (
    <footer className="border-page-border border-t px-4 pt-8 pb-[calc(5rem+var(--safe-area-bottom))] text-center text-page-ink-muted text-xs sm:pb-8">
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <Link className="hover:text-page-ink" href={`/${locale}`}>
          {pageNav.home}
        </Link>
        <Link className="hover:text-page-ink" href={`/${locale}/about`}>
          {pageNav.about}
        </Link>
        <Link className="hover:text-page-ink" href={`/${locale}/contact`}>
          {pageNav.contact}
        </Link>
        <Link className="hover:text-page-ink" href={`/${locale}/terms`}>
          {nav.terms}
        </Link>
        <Link className="hover:text-page-ink" href={`/${locale}/privacy`}>
          {nav.privacy}
        </Link>
        <Link className="hover:text-page-ink" href={`/${locale}/refund`}>
          {nav.refund}
        </Link>
      </nav>

      <BusinessInfo
        className="mx-auto mt-6 max-w-xl text-left text-[0.6875rem] leading-5"
        locale={locale}
        showHeading={false}
      />

      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-page-ink-muted">
        {otherServices('vibe').map((service) => (
          <a className="hover:text-page-ink" href={`${service.href}/${locale}`} key={service.href}>
            {service.name[locale]}
          </a>
        ))}
      </p>

      <p className="mt-2 text-page-ink-muted">© 2026 {SITE_NAME[locale]} · vibe.sobok.cc</p>
    </footer>
  )
}
