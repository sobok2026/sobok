import clsx from 'clsx'
import { type ComponentProps, type ReactNode, useEffect, useEffectEvent, useState } from 'react'

const HOLD_MS = 800

export function WorkHud({ children, ...props }: Omit<ComponentProps<'section'>, 'className'>) {
  return (
    <section
      {...props}
      className={clsx(
        'absolute bottom-8 left-1/2 z-6 -translate-x-1/2',
        'max-h-[calc(100dvh-12rem)] w-140 max-w-[calc(100%-2rem)] overflow-y-auto [scrollbar-width:thin]',
        'rounded-panel border border-white/70 bg-surface/97 px-6 py-5 shadow-hud',
        'compact:bottom-4 compact:px-5 compact:py-4',
      )}
    >
      {children}
    </section>
  )
}

export function WorkHeader({ title, value }: { title: ReactNode; value?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4 compact:mb-2">
      <h2 className="text-lg leading-snug font-semibold tracking-tight">{title}</h2>
      {value !== undefined && <p className="shrink-0 text-lg font-semibold tabular-nums">{value}</p>}
    </div>
  )
}

export function WorkNote({ children }: { children: ReactNode }) {
  return <p className="-mt-1 mb-3 text-body text-muted compact:mb-2">{children}</p>
}

export function WorkBlocker({ reason, fix }: { reason: string; fix: string }) {
  return (
    <div className="mb-3 rounded-xl bg-danger/8 px-4 py-3 text-body compact:mb-2" role="status">
      <strong className="block font-semibold text-danger">{reason}</strong>
      <span className="text-ink/80">{fix}</span>
    </div>
  )
}

export function WorkActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}

export function WorkLinks({ children }: { children: ReactNode }) {
  return <div className="mt-2 flex flex-wrap items-center justify-between gap-x-5 compact:mt-1">{children}</div>
}

export function WorkLink({ shortcut, children, onUse }: { shortcut?: string; children: ReactNode; onUse: () => void }) {
  return (
    <button type="button" className="flex min-h-9 items-center gap-2 text-sm text-muted" onClick={onUse}>
      {shortcut && <kbd className="rounded border border-current/40 px-1.5 text-sm">{shortcut}</kbd>}
      {children}
    </button>
  )
}

/**
 * Destructive actions sit behind a hold so they never share a key with confirmation. Panels with several of them
 * turn the Q shortcut off so one key press cannot reach every row.
 */
export function HoldAction({
  children,
  onConfirm,
  shortcut = true,
}: {
  children: ReactNode
  onConfirm: () => void
  shortcut?: boolean
}) {
  const [holding, setHolding] = useState(false)
  const confirm = useEffectEvent(onConfirm)

  useEffect(() => {
    if (!holding) {
      return
    }
    const timeout = window.setTimeout(() => {
      setHolding(false)
      confirm()
    }, HOLD_MS)

    return () => window.clearTimeout(timeout)
  }, [holding])

  useEffect(() => {
    if (!shortcut) {
      return
    }
    const press = (event: KeyboardEvent) => {
      if (event.code !== 'KeyQ' || event.repeat || event.defaultPrevented || event.target instanceof HTMLInputElement) {
        return
      }
      event.preventDefault()
      setHolding(true)
    }
    const lift = (event: KeyboardEvent) => {
      if (event.code === 'KeyQ') {
        setHolding(false)
      }
    }
    const release = () => setHolding(false)

    window.addEventListener('keydown', press)
    window.addEventListener('keyup', lift)
    window.addEventListener('blur', release)

    return () => {
      window.removeEventListener('keydown', press)
      window.removeEventListener('keyup', lift)
      window.removeEventListener('blur', release)
    }
  }, [shortcut])

  return (
    <button
      type="button"
      className="group/hold relative flex min-h-9 touch-none items-center gap-2 text-sm text-danger select-none"
      data-holding={holding}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return
        }
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        setHolding(true)
      }}
      onPointerUp={() => setHolding(false)}
      onPointerCancel={() => setHolding(false)}
      onLostPointerCapture={() => setHolding(false)}
      onBlur={() => setHolding(false)}
      onKeyDown={(event) => {
        if (['Space', 'Enter'].includes(event.code)) {
          event.preventDefault()
          if (!event.repeat) {
            setHolding(true)
          }
        }
      }}
      onKeyUp={(event) => {
        if (['Space', 'Enter'].includes(event.code)) {
          setHolding(false)
        }
      }}
    >
      {shortcut && <kbd className="rounded border border-current/40 px-1.5 text-sm">Q</kbd>}
      <span>길게 눌러 {children}</span>
      <span
        className={clsx(
          'absolute inset-x-0 bottom-1 h-0.5 origin-left scale-x-0 bg-danger',
          'group-data-[holding=true]/hold:scale-x-100 group-data-[holding=true]/hold:transition-transform',
          'group-data-[holding=true]/hold:duration-800 group-data-[holding=true]/hold:ease-linear',
        )}
        aria-hidden="true"
      />
    </button>
  )
}

type WorkButtonProps = {
  shortcut: string
  children: ReactNode
  primary?: boolean
  disabled?: boolean
  onUse: () => void
} & ({ hold: true; onStop: () => void } | { hold?: false; onStop?: never })

export function WorkButton(props: WorkButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        'flex min-h-12 w-full min-w-0 grow basis-36 touch-none items-center justify-center gap-2.5 select-none',
        'rounded-xl border border-control-line bg-control px-3 py-2.5 text-left text-base font-medium text-ink',
        'data-[primary=true]:border-brand data-[primary=true]:bg-brand data-[primary=true]:text-on-brand',
      )}
      data-primary={props.primary && !props.disabled}
      disabled={props.disabled}
      onClick={props.hold ? undefined : props.onUse}
      onPointerDown={
        props.hold
          ? (event) => {
              if (event.button !== 0) {
                return
              }
              event.preventDefault()
              event.currentTarget.setPointerCapture(event.pointerId)
              props.onUse()
            }
          : undefined
      }
      onPointerUp={props.onStop}
      onPointerCancel={props.onStop}
      onLostPointerCapture={props.onStop}
      onBlur={props.onStop}
      onKeyDown={
        props.hold
          ? (event) => {
              if (['Space', 'Enter'].includes(event.code)) {
                event.preventDefault()
                if (!event.repeat) {
                  props.onUse()
                }
              }
            }
          : undefined
      }
      onKeyUp={
        props.hold
          ? (event) => {
              if (['Space', 'Enter'].includes(event.code)) {
                props.onStop()
              }
            }
          : undefined
      }
    >
      <kbd className="shrink-0 rounded border border-current/30 px-1.5 py-0.5 text-sm">{props.shortcut}</kbd>
      <span>{props.children}</span>
    </button>
  )
}

export function WorkMeter({
  label,
  ratio,
  valueText,
  tolerance,
  caption,
}: {
  label: string
  ratio: number
  valueText: string
  tolerance?: number
  caption?: string | null
}) {
  const scale = tolerance === undefined ? 1 : 1.3
  const reached = tolerance === undefined ? ratio >= 1 : ratio >= 1 - tolerance && ratio <= 1 + tolerance

  return (
    <div className="group/meter mb-4 compact:mb-3" data-reached={reached}>
      <div
        className="relative h-2.5 overflow-hidden rounded bg-control"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(1, ratio) * 100)}
        aria-valuetext={`${valueText}${tolerance !== undefined ? `, 목표 100%, 허용 오차 ${Math.round(tolerance * 100)}%` : ''}`}
      >
        {tolerance !== undefined && (
          <>
            <span
              className="absolute inset-y-0 z-2 bg-[#4e865999]"
              style={{
                left: `${((1 - tolerance) / scale) * 100}%`,
                width: `${(Math.max(0.025, tolerance * 2) / scale) * 100}%`,
              }}
            />
            <b className="absolute inset-y-0 z-3 w-0.5 bg-brand" style={{ left: `${100 / scale}%` }} />
          </>
        )}
        <i
          className={clsx(
            'absolute inset-y-0 left-0 bg-brand/65 transition-[width] duration-90 ease-linear',
            'group-data-[reached=true]/meter:bg-success',
            'motion-reduce:transition-none',
          )}
          style={{ width: `${Math.min(100, (ratio / scale) * 100)}%` }}
        />
      </div>
      {caption && <p className="mt-2 text-sm text-muted">{caption}</p>}
    </div>
  )
}
