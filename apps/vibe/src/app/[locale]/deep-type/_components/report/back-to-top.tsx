'use client'

import { ChevronUp } from '@mynaui/icons-react'
import { useEffect, useState } from 'react'

import { cn } from '@/utils/cn'

import { FOCUS_CLASS_NAME } from '../../../../../components/focus'

/**
 * The way back up a twenty-four-screen document.
 *
 * It appears only once the contents list has been scrolled past, so a reader who has not left the top is not
 * offered a control that would do nothing. The threshold is one viewport rather than a pixel count, because
 * that is the point where the header is gone and there is no other route back.
 *
 * `sm:bottom-6` and the taller compact offset: the bottom island floats over the document at phone width, so
 * the button has to clear it or the two overlap in the same corner.
 */
export function BackToTop({ label }: { label: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) {
    return null
  }

  return (
    <a
      className={cn(
        'fixed right-4 bottom-[calc(var(--spacing-bottom-nav)+0.5rem)] z-30 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface/94 pr-4 pl-3 font-bold text-foreground-secondary text-sm shadow-[0_10px_30px_rgba(36,22,23,0.12)] backdrop-blur transition-colors hover:text-foreground sm:bottom-6 print:hidden',
        FOCUS_CLASS_NAME,
      )}
      href="#report-top"
    >
      <ChevronUp aria-hidden="true" className="h-4 w-4" stroke={2} />
      {label}
    </a>
  )
}
