'use client'

import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { SITE_NAME } from '@/constants'
import { PRIMARY_NAV } from './nav'

export default function BottomNav({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const home = `/${locale}`

  const items = [
    { href: home, label: SITE_NAME[locale] },
    ...PRIMARY_NAV[locale].map((item) => ({ href: `${home}/${item.segment}`, label: item.label })),
  ]

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,var(--safe-area-bottom))] sm:hidden"
    >
      <div className="mx-auto flex max-w-xs items-center justify-around gap-1 rounded-full border border-page-border bg-page-bg/92 px-2 py-1.5 shadow-[0_16px_40px_rgba(36,22,23,0.14)] backdrop-blur-md">
        {items.map((item) => {
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              aria-current={active ? 'page' : undefined}
              className={`relative rounded-full px-4 py-1.5 text-xs transition-colors before:absolute before:-inset-x-2 before:-inset-y-1.5 before:content-[''] ${
                active ? 'bg-page-soft font-semibold text-page-ink' : 'text-page-ink/62 hover:text-page-ink'
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
