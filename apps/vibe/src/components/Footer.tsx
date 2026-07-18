import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'

import { SITE_NAME } from '@/constants'
import { LEGAL } from '@/content/legal'
import { PAGES } from '@/content/pages'

export default function Footer({ locale }: { locale: Locale }) {
  const { nav } = LEGAL[locale]
  const { nav: pageNav } = PAGES[locale]

  return (
    <footer className="border-page-border border-t px-4 pt-8 pb-[calc(5rem+var(--safe-area-bottom))] text-center text-page-ink/52 text-xs sm:pb-8">
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
      </nav>
      <p className="mt-4 text-page-ink/40">© 2026 {SITE_NAME[locale]} · vibe.sobok.cc</p>
    </footer>
  )
}
