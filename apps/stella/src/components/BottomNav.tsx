'use client'

import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PAGES } from '@/content/pages'
import { PRIMARY_NAV } from './nav'

/** Ignore sub-pixel jitter and iOS rubber-band, which would otherwise flicker the pill. */
const SCROLL_DELTA = 4

/** Near the top a downward flick is just the page starting to move, so stay at rest. */
const REST_ZONE = 24

function useScrollingDown() {
  const [scrollingDown, setScrollingDown] = useState(false)

  useEffect(() => {
    let previous = Math.max(window.scrollY, 0)

    // Browsers already coalesce scroll to one event per frame, and scrollY inside a
    // passive listener is a cached read, so this needs no rAF throttle of its own.
    const onScroll = () => {
      const current = Math.max(window.scrollY, 0)
      const delta = current - previous

      // Leave `previous` alone below the threshold so slow drags still accumulate.
      if (Math.abs(delta) < SCROLL_DELTA) return

      previous = current
      setScrollingDown(delta > 0 && current > REST_ZONE)
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return scrollingDown
}

export default function BottomNav({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const scrollingDown = useScrollingDown()
  const home = `/${locale}`

  const items = [
    { href: home, label: PAGES[locale].nav.home },
    ...PRIMARY_NAV[locale].map((item) => ({ href: `${home}/${item.segment}`, label: item.label })),
  ]

  // iOS 26 Safari tints its bottom "chin" from any position:fixed element within
  // ~3px of the bottom edge; a transparent one falls back to black (color-scheme:
  // dark). Offsetting via `bottom` (not padding down to bottom-0) keeps this
  // island out of that sample zone, so Safari uses the body background instead.
  // The pill's on-screen position is unchanged.
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-[max(0.5rem,var(--safe-area-bottom))] z-40 px-3 sm:hidden"
    >
      {/* The shadow must not reach past the pill into the safe-area band, and the gap
          above it is only 0.5rem. A layer reaches `offset + spread + blur / 2` below
          the pill, so shadow-lg bled ~14.5px and shadow-md still reaches 6px, leaving
          almost nothing; plain shadow reaches 2.5px. Scale and opacity ride on the
          pill rather than the fixed <nav>, keeping the positioning box untransformed. */}
      <div
        className={`mx-auto flex max-w-xs items-center justify-around gap-1 rounded-full border border-border bg-background/70 px-2 py-1.5 shadow shadow-black/30 backdrop-blur-md transition-[opacity,scale] duration-200 ease-out motion-reduce:scale-100 ${
          scrollingDown ? 'scale-[0.98] opacity-30' : 'scale-100 opacity-100'
        }`}
      >
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
