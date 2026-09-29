import clsx from 'clsx'
import { type ReactNode, useEffect, useId, useRef } from 'react'

export default function GameDialog({
  title,
  children,
  onClose,
  wide = false,
  scrollBody = false,
}: {
  title: string
  children: ReactNode
  onClose?: () => void
  wide?: boolean
  scrollBody?: boolean
}) {
  const titleId = useId()
  const surface = useRef<HTMLElement>(null)

  useEffect(() => {
    const previous = document.activeElement
    surface.current?.focus()

    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus({ preventScroll: true })
      }
    }
  }, [])

  return (
    <div
      className={clsx(
        'pointer-events-auto absolute inset-0 z-20 flex items-center justify-center p-6',
        'max-tablet:p-4',
        'touch:p-3',
      )}
    >
      <div
        className={clsx(
          'pointer-events-none absolute -top-safe-top -right-safe-right -bottom-safe-bottom -left-safe-left',
          'bg-ink/35 backdrop-blur-sm',
        )}
        aria-hidden="true"
      />
      <section
        ref={surface}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={clsx(
          'relative max-h-full w-full [scrollbar-width:thin]',
          'rounded-2xl bg-surface p-7 shadow-dialog outline-none',
          'touch:p-5',
          scrollBody ? 'flex flex-col overflow-hidden' : 'overflow-y-auto',
          wide ? 'max-w-140' : 'max-w-100',
        )}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onClose?.()
          }

          if (event.key !== 'Tab') {
            return
          }
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), summary, input:not(:disabled), select:not(:disabled), [tabindex="0"]',
            ),
          ).filter((element) => element.checkVisibility())
          const first = controls[0]
          const last = controls.at(-1)

          if (event.shiftKey && (document.activeElement === first || document.activeElement === surface.current)) {
            event.preventDefault()
            last?.focus()
          } else if (
            !event.shiftKey &&
            (document.activeElement === last || document.activeElement === surface.current)
          ) {
            event.preventDefault()
            first?.focus()
          }
        }}
      >
        <div className="mb-6 flex shrink-0 items-center justify-between gap-4">
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={`${title} 닫기`}
              className={clsx(
                '-mr-2 grid size-10 shrink-0 place-items-center rounded-full text-xl text-muted',
                'hover:bg-control touch:size-11',
              )}
            >
              ×
            </button>
          )}
        </div>
        {scrollBody ? (
          <section
            className="min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin]"
            aria-labelledby={titleId}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard focus lets players scroll with arrow and page keys.
            tabIndex={0}
          >
            {children}
          </section>
        ) : (
          children
        )}
      </section>
    </div>
  )
}
