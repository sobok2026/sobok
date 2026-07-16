'use client'

import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PAGES } from '@/content/pages'
import { PRIMARY_NAV } from './nav'

export default function BottomNav({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const home = `/${locale}`

  const items = [
    { href: home, label: PAGES[locale].nav.home },
    ...PRIMARY_NAV[locale].map((item) => ({ href: `${home}/${item.segment}`, label: item.label })),
  ]

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,var(--safe-area-bottom))] sm:hidden"
    >
      <div className="mx-auto flex max-w-xs items-center justify-around gap-1 rounded-full border border-border bg-background/70 px-2 py-1.5 shadow-lg shadow-black/30 backdrop-blur-md">
        {items.map((item) => {
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              aria-current={active ? 'page' : undefined}
              className={`relative rounded-full px-4 py-1.5 text-xs transition-colors before:absolute before:-inset-x-2 before:-inset-y-1.5 before:content-[''] ${
                active ? 'bg-surface-2 font-semibold text-foreground' : 'text-foreground-muted hover:text-foreground'
              }`}
              href={item.href}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
