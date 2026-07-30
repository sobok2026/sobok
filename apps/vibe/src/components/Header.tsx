'use client'

import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { SITE_NAME } from '@/constants'
import { useFocusedFlow } from './flow-focus'
import LocaleSwitcher from './LocaleSwitcher'
import { PRIMARY_NAV } from './nav'

type Props = {
  locale: Locale
  localeLabel: string
  navLabel: string
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export default function Header({ locale, localeLabel, navLabel }: Props) {
  const pathname = usePathname()
  const focusedFlow = useFocusedFlow()
  const home = `/${locale}`

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-page-border/70 border-b bg-page-bg/88 px-safe pt-safe backdrop-blur-2xl">
      <div className="mx-auto flex h-header w-full max-w-4xl items-center justify-between gap-4 px-4">
        <Link className={`shrink-0 font-black text-page-ink tracking-tight ${focusClassName}`} href={home}>
          {SITE_NAME[locale]}
        </Link>

        {/* The reduced header of a task screen. A phone loses the island and a desktop keeps a full row of
            sibling quizzes one click from an unfinished run or a payment, which is the same leak measured on
            wide viewports rather than a different problem. The logo and the locale switcher stay: the flow needs
            a deliberate exit, not no exit. */}
        {focusedFlow ? null : (
          <nav aria-label={navLabel} className="hidden items-center gap-1 sm:flex">
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
        )}

        <LocaleSwitcher label={localeLabel} locale={locale} />
      </div>
    </header>
  )
}
