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

/** A fault is a mistake to undo and reads red. Work that must come first reads as a plain next task. */
export function WorkBlocker({ reason, fix, fault = false }: { reason: string; fix: string; fault?: boolean }) {
  return (
    <div
      className={clsx('mb-3 rounded-xl bg-control px-4 py-3 text-body compact:mb-2', 'data-[fault=true]:bg-danger/8')}
      data-fault={fault}
      role="status"
    >
      <strong className="block font-semibold data-[fault=true]:text-danger" data-fault={fault}>
        {reason}
      </strong>
      <span className="text-ink/80">{fix}</span>
    </div>
  )
}

export type GaugeTick = { at: number; label: string | null; minor?: boolean }

/**
 * Liquid height in the vessel, from the bottom to the rim. The end of the bar is the rim, never the target, and
 * nothing changes when the target is reached: the ticks are the lines the vessel really carries and reading them
 * is the player's job.
 */
export function WorkGauge({ label, fill, ticks }: { label: string; fill: number; ticks: GaugeTick[] }) {
  const level = Math.round(Math.min(1, Math.max(0, fill)) * 1000) / 10

  return (
    <div className="mb-4 compact:mb-3">
      <meter className="sr-only" min={0} max={100} value={level} aria-label={label}>
        바닥에서 테두리까지 중 {level}% 높이
      </meter>
      <div className="relative pt-6" aria-hidden="true">
        <div className="relative h-3 overflow-hidden rounded-md bg-control shadow-[inset_0_0_0_1px_var(--color-control-line)]">
          <i
            className="absolute inset-y-0 left-0 bg-brand/55 transition-[width] duration-90 ease-linear motion-reduce:transition-none"
            style={{ width: `${level}%` }}
          />
        </div>
        {ticks.map((tick) => (
          <span
            key={`${tick.label}:${tick.at}`}
            className={clsx(
              'absolute top-5 bottom-0 w-0.5 -translate-x-1/2 bg-ink/75',
              'data-[minor=true]:top-7 data-[minor=true]:w-px data-[minor=true]:bg-ink/50',
            )}
            style={{ left: `${tick.at * 100}%` }}
            data-minor={!!tick.minor}
          >
            {tick.label && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 text-sm leading-5 text-muted tabular-nums">
                {tick.label}
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-sm text-muted" aria-hidden="true">
        <span>바닥</span>
        <span>테두리</span>
      </div>
    </div>
  )
}

export type WorkChoiceGroup = {
  key: string
  label: string
  options: { value: string; label: string }[]
  picked: string | undefined
}

/**
 * Settings the recipe fixes, such as the steam temperature or the lid. Every option looks the same until picked;
 * the card never marks the answer. Number keys pick options in reading order.
 */
export function WorkChoices({
  groups,
  locked,
  onPick,
}: {
  groups: WorkChoiceGroup[]
  locked: boolean
  onPick: (key: string, value: string) => void
}) {
  const flat = groups.flatMap((group) => group.options.map((option) => ({ key: group.key, value: option.value })))
  const pick = useEffectEvent((index: number) => {
    const option = flat[index]
    if (option && !locked) {
      onPick(option.key, option.value)
    }
  })

  useEffect(() => {
    const press = (event: KeyboardEvent) => {
      const digit = /^Digit([1-9])$/.exec(event.code)
      if (!digit || event.repeat || event.target instanceof HTMLInputElement) {
        return
      }
      event.preventDefault()
      pick(Number(digit[1]) - 1)
    }

    window.addEventListener('keydown', press)
    return () => window.removeEventListener('keydown', press)
  }, [])

  let index = 0

  return (
    <div className="mb-4 grid gap-3 compact:mb-3">
      {groups.map((group) => (
        <fieldset key={group.key} className="grid gap-1.5" disabled={locked}>
          <legend className="mb-1.5 text-body text-muted">{group.label}</legend>
          <div className="flex flex-wrap gap-1.5">
            {group.options.map((option) => {
              index++
              return (
                <button
                  key={option.value}
                  type="button"
                  className={clsx(
                    'flex min-h-10 items-center gap-2 rounded-lg border border-control-line bg-control px-3 text-body',
                    'aria-pressed:border-brand aria-pressed:bg-brand/10 aria-pressed:font-semibold',
                    'disabled:opacity-60',
                  )}
                  aria-pressed={group.picked === option.value}
                  onClick={() => onPick(group.key, option.value)}
                >
                  {index <= 9 && <kbd className="text-sm text-muted">{index}</kbd>}
                  {option.label}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}
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

/** Progress of work the game times, such as scrubbing or a running machine. Not for measured amounts. */
export function WorkMeter({ label, ratio, valueText }: { label: string; ratio: number; valueText: string }) {
  return (
    <div className="group/meter mb-4 compact:mb-3" data-reached={ratio >= 1}>
      <div
        className="relative h-2.5 overflow-hidden rounded bg-control"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(1, ratio) * 100)}
        aria-valuetext={valueText}
      >
        <i
          className={clsx(
            'absolute inset-y-0 left-0 bg-brand/65 transition-[width] duration-90 ease-linear',
            'group-data-[reached=true]/meter:bg-success',
            'motion-reduce:transition-none',
          )}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div>
    </div>
  )
}
