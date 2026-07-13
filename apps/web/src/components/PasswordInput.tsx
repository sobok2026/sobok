'use client'

import { Eye, EyeOff } from 'lucide-react'
import { type ComponentProps, useState } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = Omit<ComponentProps<'input'>, 'type' | 'value'> & {
  toggleLabel: string
  wrapperClassName?: string
  toggleClassName?: string
  iconClassName?: string
}

export default function PasswordInput({
  toggleLabel,
  wrapperClassName,
  toggleClassName,
  iconClassName,
  className,
  disabled,
  ...inputProps
}: Props) {
  const [isVisible, setIsVisible] = useState(false)
  const iconClass = twMerge('size-3.5', iconClassName)

  return (
    <div className={twMerge('relative', wrapperClassName)}>
      <input
        autoCapitalize="off"
        autoCorrect="off"
        maxLength={64}
        spellCheck={false}
        {...inputProps}
        className={className}
        disabled={disabled}
        type={isVisible ? 'text' : 'password'}
      />
      <button
        aria-label={toggleLabel}
        aria-pressed={isVisible}
        className={toggleClassName}
        disabled={disabled}
        onClick={() => setIsVisible((visible) => !visible)}
        onMouseDown={(event) => event.preventDefault()}
        tabIndex={-1}
        type="button"
      >
        {isVisible ? <EyeOff className={iconClass} /> : <Eye className={iconClass} />}
      </button>
    </div>
  )
}
