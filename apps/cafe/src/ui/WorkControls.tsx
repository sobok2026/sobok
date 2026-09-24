import type { ComponentProps, ReactNode } from 'react'

export function WorkHud({ children, ...props }: Omit<ComponentProps<'section'>, 'className'>) {
  return (
    <section
      {...props}
      className="group/work absolute bottom-16 left-1/2 z-6 max-h-[calc(50dvh-3rem)] w-135 max-w-[calc(100%-3rem)] -translate-x-1/2 [scrollbar-width:thin] [scrollbar-color:#b9c4af_transparent] overflow-y-auto rounded-panel bg-surface px-5.5 py-4.5 shadow-hud compact:bottom-13 compact:max-h-[calc(50dvh-1.75rem)] compact:px-4.5 compact:py-3.5"
    >
      {children}
    </section>
  )
}

export function WorkTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3.5 text-xl leading-[1.4] font-semibold tracking-[-0.035em] group-data-[fault=true]/work:text-danger compact:mb-2.5">
      {children}
    </h2>
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
      className="flex min-h-11.5 w-full min-w-0 shrink grow basis-45 touch-none items-center justify-center gap-2.5 rounded-md border border-control-line bg-control px-3.5 py-2.5 text-left text-sm leading-[1.45] font-medium text-brand select-none data-[primary=true]:border-brand data-[primary=true]:bg-brand data-[primary=true]:text-surface data-[primary=true]:active:bg-[#3d6651]"
      data-primary={props.primary && !props.disabled}
      disabled={props.disabled}
      onClick={props.hold ? undefined : props.onUse}
      onPointerDown={
        props.hold
          ? (event) => {
              if (event.button !== 0) return
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
                if (!event.repeat) props.onUse()
              }
            }
          : undefined
      }
      onKeyUp={
        props.hold
          ? (event) => {
              if (['Space', 'Enter'].includes(event.code)) props.onStop()
            }
          : undefined
      }
    >
      <kbd className="shrink-0 rounded-sm border border-current px-1.25 py-0.75 text-xs">{props.shortcut}</kbd>
      <span>{props.children}</span>
    </button>
  )
}

export function WorkMeter({
  label,
  ratio,
  value,
  hint,
  tolerance,
}: {
  label: string
  ratio: number
  value: string
  hint: string
  tolerance?: number
}) {
  const scale = tolerance === undefined ? 1 : 1.3
  return (
    <div className="mb-4 compact:mb-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5 text-label text-muted tabular-nums">
        <strong className="text-base font-semibold text-ink">{value}</strong>
        <span>{hint}</span>
      </div>
      <div
        className="relative h-2.5 overflow-hidden rounded-[0.1875rem] bg-[#e1e5d9]"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(1, ratio) * 100)}
        aria-valuetext={value}
      >
        {tolerance !== undefined ? (
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
        ) : null}
        <i
          className="absolute inset-y-0 left-0 bg-[#9a8763] transition-[width] duration-90 ease-linear motion-reduce:transition-none"
          style={{ width: `${Math.min(100, (ratio / scale) * 100)}%` }}
        />
      </div>
    </div>
  )
}
