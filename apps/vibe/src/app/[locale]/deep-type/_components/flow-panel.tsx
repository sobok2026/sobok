'use client'

import type { Icon } from '@mynaui/icons-react'
import { type ReactNode, useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'
import { FOCUS_CLASS_NAME } from '../../../../components/focus'

import { PANEL_CLASS_NAME, PANEL_SHADOW_CLASS_NAME } from '../_lib/surface'

/**
 * The single-panel screens of the deep-type flow — the checkout return and the e-mail re-open — and the parts
 * they are assembled from.
 *
 * These two screens were written twice. The same spinner panel existed with two paddings, two heading sizes
 * and two ink alphas; the same card shell existed with two class strings; one had `motion-reduce` and the
 * other did not. None of that was a decision, so it lives here once.
 */

/** Which of the three semantic colours a terminal state carries. `accent` is "recoverable, act on it". */
export type FlowTone = 'accent' | 'danger' | 'success'

// Tint from the brand pink, glyph from the strong accent: `--page-accent` is a surface colour and does not
// clear 4.5:1 as a foreground, which is the split `globals.css` makes and the reason there are two.
const MARK_CLASS_NAME: Record<FlowTone, string> = {
  accent: 'bg-page-accent/12 text-page-accent-strong',
  danger: 'bg-page-danger/10 text-page-danger',
  success: 'bg-page-success/10 text-page-success',
}

export function FlowPanel({ children, eyebrow }: { children: ReactNode; eyebrow: string }) {
  return (
    <main className="flex flex-1 items-center justify-center bg-page-bg px-safe py-12 text-page-ink" id="main-content">
      <section className={cn(PANEL_CLASS_NAME, PANEL_SHADOW_CLASS_NAME)}>
        {/* Quiet, and deliberately so. This is a label saying which product the screen belongs to; the accent
            belongs to the state mark and the primary action, which are what the reader has to find. */}
        <p className="text-center font-bold text-page-ink-muted text-xs tracking-[0.14em]">{eyebrow}</p>
        {children}
      </section>
    </main>
  )
}

/**
 * The in-progress panel. `role="status"` rather than `aria-live` on a wrapper that unmounts: this element and
 * the text it announces come and go together, which is the only arrangement a screen reader can follow.
 *
 * `hint` is the "still going" line. It is a child of the same live region on purpose — appearing after a few
 * seconds is exactly the kind of change the region exists to voice.
 */
export function FlowStatus({ body, hint, title }: { body: string; hint?: string; title: string }) {
  return (
    <div className="py-6 text-center" role="status">
      <div
        aria-hidden="true"
        className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-page-accent/20 border-t-page-accent motion-reduce:animate-none"
      />
      <h1 className="mt-5 font-black text-2xl leading-snug">{title}</h1>
      <p className="mt-3 break-prose text-page-ink-soft leading-7">{body}</p>
      {hint ? <p className="mt-3 break-prose text-page-ink-muted text-sm leading-6">{hint}</p> : null}
    </div>
  )
}

type FlowMessageProps = {
  body: string
  children?: ReactNode
  icon?: Icon
  /**
   * Move focus to the heading on mount. For a panel that REPLACES the screen — a verification that resolved,
   * a form that was accepted — which is a route change in everything but the URL, and the reason the outcome
   * is not announced with `role="alert"` as well: one or the other, never both, or NVDA reads it twice.
   */
  takeFocus?: boolean
  title: string
  tone?: FlowTone
}

export function FlowMessage({ body, children, icon: Mark, takeFocus, title, tone = 'accent' }: FlowMessageProps) {
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (takeFocus) {
      heading.current?.focus()
    }
  }, [takeFocus])

  return (
    <div className="text-center">
      {Mark ? (
        <span
          className={cn('mt-5 inline-flex h-14 w-14 items-center justify-center rounded-full', MARK_CLASS_NAME[tone])}
        >
          <Mark aria-hidden="true" className="h-7 w-7" stroke={1.8} />
        </span>
      ) : null}
      {/* `tabIndex={-1}` so focus can be placed here and nowhere in the tab order. `outline-none` because the
          ring on a heading nobody tabbed to reads as a rendering fault, and the announcement is the feedback. */}
      <h1
        className={cn('font-black text-2xl leading-snug outline-none', Mark ? 'mt-4' : 'mt-3')}
        ref={heading}
        tabIndex={-1}
      >
        {title}
      </h1>
      <p className="mt-3 break-prose text-page-ink-soft leading-7">{body}</p>
      {children}
    </div>
  )
}

/**
 * Where an action sits in the stack, and nothing else about it. The caller still renders its own `<button>`,
 * `<Link>` or `<a href="mailto:">` — the element is a routing decision, the weight is a design one.
 *
 * There is exactly one primary per panel, and it is the action that resolves the state the panel is reporting.
 * The re-open link used to be an outline button on the one screen where it was the only thing left to do.
 */
export type FlowActionEmphasis = 'primary' | 'secondary' | 'tertiary'

const ACTION_CLASS_NAME: Record<FlowActionEmphasis, string> = {
  primary:
    'min-h-13 bg-page-accent-strong px-6 font-black text-white shadow-[0_20px_60px_var(--page-accent-glow)] hover:bg-page-accent-strong/92',
  secondary:
    'min-h-12 border border-page-border px-6 font-bold text-page-ink-soft hover:border-page-ink/24 hover:text-page-ink',
  tertiary: 'min-h-11 px-4 font-bold text-page-ink-muted underline underline-offset-4 hover:text-page-ink',
}

export function flowActionClassName(emphasis: FlowActionEmphasis): string {
  return cn(
    'inline-flex w-full items-center justify-center gap-2 rounded-full text-sm transition-colors',
    ACTION_CLASS_NAME[emphasis],
    FOCUS_CLASS_NAME,
  )
}
