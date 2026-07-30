'use client'

import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'
import { useBottomNavVisible } from './flow-focus'

/**
 * The page column, and the clearance it owes the floating chrome above and below it.
 *
 * The header is `fixed` and the island is `fixed`, so neither takes part in layout and the column has to reserve
 * their space itself. The top offset is unconditional because the header is always there. The bottom one follows
 * the island, and it is padding on a `min-h-dvh` box rather than a spacer element so a short page does not gain
 * a pill's worth of scroll it has no content for.
 */
export default function PageBody({ children }: { children: ReactNode }) {
  const bottomNavVisible = useBottomNavVisible()

  return (
    <div
      className={cn(
        'flex min-h-dvh flex-1 flex-col pt-[calc(var(--spacing-header)+var(--safe-area-top))]',
        bottomNavVisible && 'pb-bottom-nav sm:pb-0',
      )}
    >
      {children}
    </div>
  )
}
