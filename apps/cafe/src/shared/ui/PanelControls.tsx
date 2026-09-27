import clsx from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

export function PanelStatus({ children }: { children: ReactNode }) {
  return <p className="-mt-3 mb-5 text-body text-muted">{children}</p>
}

/**
 * The one thing to do at this station, shown only when the order rail points here. The title says what is wrong and
 * the button inside, the panel's only primary action, says what to do about it.
 */
export function PanelNow({
  blocked = false,
  title,
  detail,
  children,
}: {
  blocked?: boolean
  title: string
  detail?: ReactNode
  children?: ReactNode
}) {
  return (
    <section
      className="group/now mb-5 rounded-2xl bg-brand/8 p-4 data-[blocked=true]:bg-danger/8"
      data-blocked={blocked}
      aria-label="지금 할 일"
    >
      <h3 className="text-lg leading-snug font-semibold group-data-[blocked=true]/now:text-danger">{title}</h3>
      {detail && <p className="mt-1 text-body text-ink/75">{detail}</p>}
      {children && <div className="mt-3">{children}</div>}
    </section>
  )
}

export function PanelSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-4 last:mb-0">
      {title && <h3 className="mb-1 text-sm font-semibold text-muted">{title}</h3>}
      <div className="divide-y divide-line">{children}</div>
    </section>
  )
}

export function PanelRow({
  title,
  note,
  alert = false,
  status,
  children,
}: {
  title: ReactNode
  note?: ReactNode
  alert?: boolean
  status?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="group/row flex min-h-14 items-center gap-3 py-2.5" data-alert={alert}>
      <div className="min-w-0 grow">
        <p className="text-base font-medium">{title}</p>
        {note && <p className="mt-0.5 text-sm text-muted group-data-[alert=true]/row:text-danger">{note}</p>}
      </div>
      {status}
      {children && <div className="flex shrink-0 gap-1.5">{children}</div>}
    </div>
  )
}

/** A row's state in one word, or the label itself when the item is in use. */
export function StatusChip({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'alert' | 'label'
  children: ReactNode
}) {
  return (
    <span
      className={clsx(
        'shrink-0 rounded-full bg-control px-2.5 text-sm leading-6 font-medium whitespace-nowrap text-muted tabular-nums',
        'data-[tone=alert]:bg-danger/10 data-[tone=alert]:text-danger',
        'data-[tone=label]:rounded-md data-[tone=label]:border data-[tone=label]:border-label-line',
        'data-[tone=label]:bg-label data-[tone=label]:text-ink',
      )}
      data-tone={tone}
    >
      {children}
    </span>
  )
}

export function RowButton({ primary = false, className, ...props }: ComponentProps<'button'> & { primary?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        'min-h-9 rounded-lg border border-control-line bg-control px-3 text-sm font-medium whitespace-nowrap text-ink',
        'data-[primary=true]:border-brand data-[primary=true]:bg-brand data-[primary=true]:text-on-brand',
        className,
      )}
      data-primary={primary}
    />
  )
}

export function PanelTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; badge?: number }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="mb-4 grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-control p-1" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={clsx(
            'flex min-h-9 items-center justify-center gap-1.5 rounded-lg text-body text-muted',
            'aria-selected:bg-surface aria-selected:font-semibold aria-selected:text-ink aria-selected:shadow-sm',
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {!!tab.badge && (
            <span className="min-w-5 rounded-full bg-danger px-1.5 text-sm leading-5 font-semibold text-white">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export function PanelSearch({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <input
      type="search"
      aria-label={label}
      placeholder={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mb-4 min-h-11 w-full rounded-xl border border-control-line bg-control px-3.5 text-body text-ink"
    />
  )
}

export function PanelEmpty({ children }: { children: ReactNode }) {
  return <p className="py-3 text-body text-muted">{children}</p>
}
