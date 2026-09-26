import type { ComponentProps } from 'react'

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary'
  size?: 'regular' | 'start' | 'compact'
}

const buttonColors = {
  primary: 'border-brand bg-brand text-on-brand',
  secondary: 'mt-2 border-control-line bg-control text-ink',
}

const buttonSizes = {
  regular: 'min-h-11 px-4 py-3 text-sm font-medium',
  start: 'min-h-13 px-5 py-3 text-base font-medium',
  compact: 'min-h-10 px-3 py-2 text-sm font-medium',
}

export function Button({ variant = 'primary', size = 'regular', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={[
        'flex w-full items-center justify-between gap-3 rounded-xl border text-left leading-relaxed',
        buttonColors[variant],
        buttonSizes[size],
        className,
      ].join(' ')}
    />
  )
}

export function TextButton({
  danger = false,
  className = '',
  ...props
}: ComponentProps<'button'> & { danger?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={[
        'min-h-9 border-0 bg-transparent px-0 py-2 text-xs hover:underline underline-offset-4',
        danger ? 'text-danger' : 'text-muted',
        className,
      ].join(' ')}
    />
  )
}

export function InventoryButton(props: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      {...props}
      className="w-full rounded-[0.3125rem] border border-control-line bg-control px-3 py-2.5 text-sm text-brand"
    />
  )
}
