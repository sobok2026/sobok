import type { ComponentProps } from 'react'

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary'
  size?: 'regular' | 'start' | 'compact'
}

const buttonColors = {
  primary: 'border-brand bg-brand text-on-brand',
  secondary: 'mt-2.5 border-[#d8dbcc] bg-[#f5f2e8] text-brand',
}

const buttonSizes = {
  regular: 'min-h-11.5 px-4.25 py-3.25 text-sm font-semibold',
  start: 'h-13.5 max-w-81.75 px-4.25 py-3.25 text-label font-medium',
  compact: 'min-h-11.5 p-2.5 text-sm font-semibold',
}

export function Button({ variant = 'primary', size = 'regular', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`flex w-full items-center justify-between rounded-sm border text-left leading-[1.6] ${buttonColors[variant]} ${buttonSizes[size]} ${className}`}
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
      className={`border-0 bg-transparent px-0 py-1.5 text-xs underline decoration-[#bfc5b4] underline-offset-5 ${danger ? 'text-danger' : 'text-muted'} ${className}`}
    />
  )
}
