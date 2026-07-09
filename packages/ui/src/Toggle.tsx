import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

interface Props extends Omit<ComponentProps<'input'>, 'onToggle'> {
  onToggle?: (enabled: boolean) => void
}

export default function Toggle({ className = '', title, onToggle, ...props }: Props) {
  return (
    <label
      className={twMerge('inline-flex items-center', props.disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
      title={title}
    >
      <input {...props} className="sr-only peer" onChange={(e) => onToggle?.(e.target.checked)} type="checkbox" />
      <span
        className={twMerge(
          "relative aspect-2/1 bg-surface-4 rounded-full border box-content transition peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 after:content-[''] after:absolute after:inset-y-[10%] after:left-[10%] after:w-[40%] after:bg-foreground after:border after:border-border-2 after:rounded-full after:transition after:shadow-sm peer-checked:after:translate-x-full peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
          className,
        )}
      />
    </label>
  )
}
