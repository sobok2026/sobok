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

const ISLAND =
  'sm:h-9 sm:rounded-full sm:border sm:border-border sm:bg-background/70 sm:px-4 sm:shadow-lg sm:shadow-black/20 sm:backdrop-blur-md'

export default function Header({ locale, localeLabel }: Props) {
  const pathname = usePathname()
  const home = `/${locale}`

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-[calc(0.5rem+var(--safe-area-top))]">
      <div className="mx-auto flex h-9 max-w-3xl items-center justify-between gap-3 rounded-full border border-border bg-background/70 px-4 shadow-lg shadow-black/20 backdrop-blur-md sm:h-auto sm:max-w-none sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
        <div className={`flex items-center gap-2 ${ISLAND}`}>
          <Link className="shrink-0 text-sm font-semibold tracking-tight text-foreground" href={home}>
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
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? 'bg-surface-2 font-semibold text-foreground'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                  href={href}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className={`flex items-center ${ISLAND}`}>
          <LocaleSwitcher label={localeLabel} locale={locale} />
        </div>
      </div>
    </header>
  )
}
