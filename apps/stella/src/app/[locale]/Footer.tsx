import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'

import { LEGAL } from './legal'

export default function Footer({ locale }: { locale: Locale }) {
  const { nav } = LEGAL[locale]

  return (
    <footer className="border-t border-border px-4 py-8 text-center text-sm text-foreground-subtle">
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <Link className="hover:text-foreground" href={`/${locale}/`}>
          {nav.home}
        </Link>
        <Link className="hover:text-foreground" href={`/${locale}/terms/`}>
          {nav.terms}
        </Link>
        <Link className="hover:text-foreground" href={`/${locale}/privacy/`}>
          {nav.privacy}
        </Link>
      </nav>
      <p className="mt-4 text-foreground-faint">© 2026 소복 · sobok.cc</p>
    </footer>
  )
}
