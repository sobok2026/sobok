import { type ReactNode, useEffect, useId, useRef } from 'react'

export default function GameDialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose?: () => void
  wide?: boolean
}) {
  const titleId = useId()
  const surface = useRef<HTMLElement>(null)
  useEffect(() => {
    const previous = document.activeElement
    surface.current?.focus()
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/35 p-6 backdrop-blur-sm max-tablet:p-4">
      <section
        ref={surface}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`max-h-full w-full overflow-y-auto rounded-2xl bg-surface p-7 shadow-dialog outline-none [scrollbar-width:thin] ${wide ? 'max-w-140' : 'max-w-100'}`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onClose?.()
          }
          if (event.key !== 'Tab') return
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
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label={`${title} 닫기`}
              className="-mr-2 grid size-10 place-items-center rounded-full text-xl text-muted hover:bg-control"
            >
              ×
            </button>
          ) : null}
        </div>
        {children}
      </section>
    </div>
  )
}
