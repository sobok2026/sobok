import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { SITE_NAME } from '@/constants'
import { LEGAL } from '@/content/legal'
import { PAGES } from '@/content/pages'
import { OTHER_SERVICES } from '@/content/services'

export default function Footer({ locale }: { locale: Locale }) {
  const { nav } = LEGAL[locale]
  const { nav: pageNav } = PAGES[locale]

  return (
    <footer className="border-t border-border px-4 pt-8 pb-[calc(5rem+var(--safe-area-bottom))] text-center text-xs text-foreground-subtle sm:pb-8">
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <Link className="hover:text-foreground" href={`/${locale}`}>
          {pageNav.home}
        </Link>
        <Link className="hover:text-foreground" href={`/${locale}/about`}>
          {pageNav.about}
        </Link>
        <Link className="hover:text-foreground" href={`/${locale}/contact`}>
          {pageNav.contact}
        </Link>
        <Link className="hover:text-foreground" href={`/${locale}/terms`}>
          {nav.terms}
        </Link>
        <Link className="hover:text-foreground" href={`/${locale}/privacy`}>
          {nav.privacy}
        </Link>
      </nav>
      <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-foreground-faint">
        {OTHER_SERVICES.map((service) => (
          <a className="hover:text-foreground" href={`${service.href}/${locale}`} key={service.href}>
            {service.name[locale]}
          </a>
        ))}
      </p>
      <p className="mt-2 text-foreground-faint">© 2026 {SITE_NAME[locale]} · stella.sobok.cc</p>
    </footer>
  )
}
