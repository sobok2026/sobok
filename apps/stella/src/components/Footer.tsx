import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { SITE_NAME } from '@/constants'
import { LEGAL } from '@/content/legal'
import { PAGES } from '@/content/pages'

const SOURCE_URL = 'https://github.com/sobok2026/sobok'

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
        <a className="hover:text-foreground" href={SOURCE_URL} rel="noreferrer" target="_blank">
          {pageNav.source}
        </a>
        <a className="hover:text-foreground" href="/licenses/swiss-ephemeris.txt">
          {pageNav.licenses}
        </a>
      </nav>
      <p className="mt-4 text-foreground-faint">© 2026 {SITE_NAME[locale]} · stella.sobok.cc</p>
    </footer>
  )
}
