import type { ReactNode } from 'react'

type Props = {
  disabled: boolean
  children: ReactNode
  onClick?: () => void
}

export default function PostBaseButton({ disabled, children, onClick }: Props) {
  return (
    <label
      aria-disabled={disabled}
      className="hover:bg-surface-4/50 h-fit cursor-pointer rounded-full p-2 transition aria-disabled:cursor-not-allowed aria-disabled:text-foreground-subtle hover:aria-disabled:bg-transparent"
      onClick={onClick}
    >
      {children}
    </label>
  )
}
