import { twMerge } from 'tailwind-merge'

export type StatusActionVariant = 'primary' | 'secondary' | 'tertiary'

const STATUS_ACTION_BASE_CLASS_NAME =
  'inline-flex min-h-11 w-full max-w-3xs items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong/70 disabled:opacity-60'

const STATUS_ACTION_VARIANT_CLASS_NAME = {
  primary:
    'bg-foreground text-background shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:opacity-90 active:opacity-80',
  secondary:
    'border border-border-2/80 bg-surface/60 text-foreground hover:border-border-strong hover:bg-surface-2/80 active:bg-surface',
  tertiary: 'text-foreground-muted hover:text-foreground active:text-foreground-secondary',
} satisfies Record<StatusActionVariant, string>

export function getStatusActionClassName(variant: StatusActionVariant, className?: string) {
  return twMerge(STATUS_ACTION_BASE_CLASS_NAME, STATUS_ACTION_VARIANT_CLASS_NAME[variant], className)
}
