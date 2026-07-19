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

const ISLAND = 'h-9 rounded-full border border-border bg-background/70 px-4 shadow-lg shadow-black/20 backdrop-blur-md'

export default function Header({ locale, localeLabel }: Props) {
  const pathname = usePathname()
  const home = `/${locale}`

  return (
    <header className="absolute inset-x-0 top-0 z-40 pt-[calc(0.5rem+var(--safe-area-top))] pl-[max(0.5rem,var(--safe-area-left))] pr-[max(0.5rem,var(--safe-area-right))] sm:fixed">
      <div className="mx-auto flex items-center justify-between gap-3">
        <div className={`flex items-center gap-2 ${ISLAND}`}>
          <Link
            className="relative shrink-0 text-sm font-semibold tracking-tight text-foreground before:absolute before:-inset-x-1 before:-inset-y-2 before:content-['']"
            href={home}
          >
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
                  className={`relative rounded-full px-3 py-1.5 text-xs transition-colors before:absolute before:-inset-x-0.5 before:-inset-y-1 before:content-[''] ${
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
