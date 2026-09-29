import clsx from 'clsx'
import { type ComponentProps, type ReactNode, useEffect, useEffectEvent, useRef, useState } from 'react'

const HOLD_MS = 800

export function WorkHud({ children, ...props }: Omit<ComponentProps<'section'>, 'className'>) {
  return (
    <section
      {...props}
      className={clsx(
        'pointer-events-auto absolute bottom-8 left-1/2 z-6 -translate-x-1/2',
        'max-h-[calc(100%-12rem)] w-140 max-w-[calc(100%-2rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin]',
        'rounded-panel border border-white/70 bg-surface/97 px-6 py-5 shadow-hud',
        'compact:bottom-4 compact:px-5 compact:py-4',
        'touch:right-3 touch:bottom-3 touch:left-auto touch:w-88 touch:max-w-[calc(100%-12rem)]',
        'touch:max-h-[calc(100%-5rem)] touch:translate-x-0 touch:px-4 touch:py-3',
        'touch:portrait:bottom-44 touch:portrait:left-3 touch:portrait:w-auto touch:portrait:max-w-none',
        'touch:portrait:max-h-[calc(100%-20rem)]',
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

/** Reading the vessel's real marks is the player's job, so the gauge must not reveal the recipe target. */
export function WorkGauge({
  label,
  fill,
  ticks,
  startFill,
  overview = false,
  minimum = 0,
  edgeLabels = ['바닥', '테두리'],
}: {
  label: string
  fill: number
  ticks: GaugeTick[]
  startFill?: number
  overview?: boolean
  minimum?: number
  edgeLabels?: [string, string]
}) {
  const position = (value: number) => ((value - minimum) / (1 - minimum)) * 100
  const level = Math.min(100, Math.max(0, position(fill)))
  const start = startFill !== undefined && startFill > minimum && startFill < 1 ? position(startFill) : null
  const reading = (
    <meter className="sr-only" min={0} max={100} value={Math.min(1, Math.max(0, fill)) * 100} aria-label={label}>
      바닥에서 테두리까지 중 {Math.round(fill * 1000) / 10}% 높이
    </meter>
  )

  if (overview) {
    return (
      <div className="mb-5 flex items-center gap-3 compact:mb-4">
        <span className="shrink-0 text-sm text-muted">{label}</span>
        {reading}
        <div className="relative h-1.5 grow rounded bg-control" aria-hidden="true">
          <span className="absolute inset-y-0 left-0 rounded bg-brand/55" style={{ width: `${level}%` }} />
          {start !== null && (
            <span
              className="absolute -inset-y-0.5 -translate-x-1/2 border-l-2 border-dashed border-ink/70"
              style={{ left: `${start}%` }}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4 compact:mb-3">
      <div className="mb-1 flex items-center justify-between gap-3 text-sm text-muted">
        <span>{label}</span>
        {start !== null && (
          <span className="flex items-center gap-1.5">
            <i className="h-3 border-l-2 border-dashed border-ink/70" aria-hidden="true" />
            시작 수위
          </span>
        )}
      </div>
      {reading}
      <div className={clsx('relative', ticks.length ? 'pt-6' : 'pt-1')} aria-hidden="true">
        <div
          className={clsx(
            'relative h-4 overflow-hidden rounded bg-control',
            'shadow-[inset_0_0_0_1px_var(--color-control-line)]',
          )}
        >
          <i className="absolute inset-y-0 left-0 bg-brand/55" style={{ width: `${level}%` }} />
        </div>
        {ticks
          .filter((tick) => tick.at >= minimum && tick.at <= 1)
          .map((tick) => (
            <span
              key={`${tick.label}:${tick.at}`}
              className={clsx(
                'absolute top-5 bottom-0 w-0.5 -translate-x-1/2 bg-ink/75',
                'data-[minor=true]:top-7 data-[minor=true]:w-px data-[minor=true]:bg-ink/50',
              )}
              style={{ left: `${position(tick.at)}%` }}
              data-minor={!!tick.minor}
            >
              {tick.label && (
                <span
                  className={clsx(
                    'absolute bottom-full left-1/2 -translate-x-1/2 text-sm leading-5 text-muted tabular-nums',
                    'data-[at-start=true]:left-0 data-[at-start=true]:translate-x-0',
                    'data-[at-end=true]:-translate-x-full',
                  )}
                  data-at-start={tick.at === minimum}
                  data-at-end={tick.at === 1}
                >
                  {tick.label}
                </span>
              )}
            </span>
          ))}
        {start !== null && (
          <span
            className={clsx(
              'absolute -bottom-1 -translate-x-1/2 border-l-2 border-dashed border-ink/70',
              ticks.length ? 'top-5' : 'top-0',
            )}
            style={{ left: `${start}%` }}
          />
        )}
        {fill >= minimum && (
          <span
            className={clsx(
              'absolute -bottom-1 w-0.5 -translate-x-1/2 bg-brand',
              'after:absolute after:-top-0.5 after:left-1/2 after:size-1.5 after:-translate-x-1/2',
              'after:rounded-full after:bg-brand',
              ticks.length ? 'top-5' : 'top-0',
            )}
            style={{ left: `${level}%` }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-sm text-muted" aria-hidden="true">
        <span>{edgeLabels[0]}</span>
        <span>{edgeLabels[1]}</span>
      </div>
    </div>
  )
}

export function WorkHoldStatus({
  active,
  started,
  pouring = false,
}: {
  active: boolean
  started: boolean
  pouring?: boolean
}) {
  let text = started ? '멈춤' : '조작 대기'
  if (active) text = pouring ? '붓는 중' : '진행 중'

  return (
    <p className="sr-only" role="status">
      {text}
    </p>
  )
}

export type WorkChoiceGroup = {
  key: string
  label: string
  options: { value: string; label: string }[]
  picked: string | undefined
}

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
                    'disabled:opacity-60 touch:min-h-11',
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
  return <div className="flex flex-wrap gap-3">{children}</div>
}

export function WorkLinks({ children }: { children: ReactNode }) {
  return <div className="mt-2 flex flex-wrap items-center justify-between gap-x-5 compact:mt-1">{children}</div>
}

export function WorkLink({ shortcut, children, onUse }: { shortcut?: string; children: ReactNode; onUse: () => void }) {
  return (
    <button type="button" className="flex min-h-9 items-center gap-2 text-sm text-muted touch:min-h-11" onClick={onUse}>
      {shortcut && <kbd className="rounded border border-current/40 px-1.5 text-sm">{shortcut}</kbd>}
      {children}
    </button>
  )
}

/** Panels with several hold actions disable Q so one key press cannot reach every row. */
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
  const pointerId = useRef<number | null>(null)
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
    const press = (event: KeyboardEvent) => {
      if (
        !shortcut ||
        event.code !== 'KeyQ' ||
        event.repeat ||
        event.defaultPrevented ||
        event.target instanceof HTMLInputElement
      ) {
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
    const release = () => {
      pointerId.current = null
      setHolding(false)
    }
    const hidden = () => {
      if (document.hidden) release()
    }

    window.addEventListener('keydown', press)
    window.addEventListener('keyup', lift)
    window.addEventListener('blur', release)
    window.addEventListener('resize', release)
    document.addEventListener('visibilitychange', hidden)

    return () => {
      window.removeEventListener('keydown', press)
      window.removeEventListener('keyup', lift)
      window.removeEventListener('blur', release)
      window.removeEventListener('resize', release)
      document.removeEventListener('visibilitychange', hidden)
    }
  }, [shortcut])

  return (
    <button
      type="button"
      className={clsx(
        'group/hold relative flex min-h-9 touch-none items-center gap-2 text-sm text-danger select-none',
        '[-webkit-touch-callout:none] touch:min-h-11',
      )}
      data-holding={holding}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (event.button !== 0 || pointerId.current !== null) {
          return
        }
        event.preventDefault()
        pointerId.current = event.pointerId
        event.currentTarget.setPointerCapture(event.pointerId)
        setHolding(true)
      }}
      onPointerUp={(event) => {
        if (pointerId.current === event.pointerId) {
          pointerId.current = null
          setHolding(false)
        }
      }}
      onPointerCancel={(event) => {
        if (pointerId.current === event.pointerId) {
          pointerId.current = null
          setHolding(false)
        }
      }}
      onLostPointerCapture={(event) => {
        if (pointerId.current === event.pointerId) {
          pointerId.current = null
          setHolding(false)
        }
      }}
      onBlur={() => {
        pointerId.current = null
        setHolding(false)
      }}
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
  active?: boolean
  onUse: () => void
} & ({ hold: true; onStop: () => void } | { hold?: false; onStop?: never })

export function WorkButton(props: WorkButtonProps) {
  const pointerId = useRef<number | null>(null)
  const [pressed, setPressed] = useState(false)

  function stop() {
    pointerId.current = null
    setPressed(false)
    props.onStop?.()
  }

  const stopFromWindow = useEffectEvent(stop)

  useEffect(() => {
    if (!props.hold) return
    const hidden = () => {
      if (document.hidden) stopFromWindow()
    }

    window.addEventListener('blur', stopFromWindow)
    window.addEventListener('resize', stopFromWindow)
    document.addEventListener('visibilitychange', hidden)

    return () => {
      window.removeEventListener('blur', stopFromWindow)
      window.removeEventListener('resize', stopFromWindow)
      document.removeEventListener('visibilitychange', hidden)
      if (pointerId.current !== null) stopFromWindow()
    }
  }, [props.hold])

  function release(event: { pointerId: number }) {
    if (pointerId.current !== event.pointerId) return
    stop()
  }

  return (
    <button
      type="button"
      className={clsx(
        'flex min-h-12 w-full min-w-0 grow basis-36 touch-none items-center justify-center gap-2.5 select-none',
        '[-webkit-touch-callout:none]',
        'rounded-xl border border-control-line bg-control px-3 py-2.5 text-left text-lg font-medium text-ink',
        'data-[primary=true]:border-brand data-[primary=true]:bg-brand data-[primary=true]:text-on-brand',
        'data-[active=true]:ring-2 data-[active=true]:ring-brand/40 data-[active=true]:ring-offset-2',
      )}
      data-primary={props.primary && !props.disabled}
      data-active={(props.active ?? pressed) && !props.disabled}
      aria-pressed={props.hold ? (props.active ?? pressed) : undefined}
      disabled={props.disabled}
      onContextMenu={(event) => {
        if (props.hold) event.preventDefault()
      }}
      onClick={props.hold ? undefined : props.onUse}
      onPointerDown={
        props.hold
          ? (event) => {
              if (event.button !== 0 || pointerId.current !== null) {
                return
              }
              event.preventDefault()
              pointerId.current = event.pointerId
              event.currentTarget.setPointerCapture(event.pointerId)
              setPressed(true)
              props.onUse()
            }
          : undefined
      }
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onBlur={stop}
      onKeyDown={
        props.hold
          ? (event) => {
              if (['Space', 'Enter'].includes(event.code)) {
                event.preventDefault()
                if (!event.repeat) {
                  setPressed(true)
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
                stop()
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
