'use client'

import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { SITE_NAME } from '@/constants'
import LocaleSwitcher from './LocaleSwitcher'
import { PRIMARY_NAV } from './nav'

type Props = {
  locale: Locale
  localeLabel: string
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export default function Header({ locale, localeLabel }: Props) {
  const pathname = usePathname()
  const home = `/${locale}`

  return (
    <header className="sticky top-0 z-40 border-page-border/70 border-b bg-page-bg/88 px-safe pt-safe backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between gap-4 px-4">
        <Link className={`shrink-0 font-black text-page-ink tracking-tight ${focusClassName}`} href={home}>
          {SITE_NAME[locale]}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
          {PRIMARY_NAV[locale].map((item) => {
            const href = `${home}/${item.segment}`
            const active = pathname === href

            return (
              <Link
                key={item.segment}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-3 py-1.5 font-semibold text-sm transition-colors ${focusClassName} ${
                  active ? 'bg-page-soft text-page-ink' : 'text-page-ink/62 hover:text-page-ink'
                }`}
                href={href}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <LocaleSwitcher label={localeLabel} locale={locale} />
      </div>
    </header>
  )
}
