'use client'

import { Eye, EyeOff } from 'lucide-react'
import { type ComponentProps, useState } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = Omit<ComponentProps<'input'>, 'type'> & {
  toggleLabel: string
  wrapperClassName?: string
  toggleClassName?: string
  iconClassName?: string
}

/**
 * 비밀번호 입력 + 표시/숨김 토글. 값 제어(controlled·uncontrolled)는 소비처의 몫이며,
 * 이 컴포넌트는 오직 표시 여부만 내부 상태로 소유하고 나머지 prop은 native input으로 그대로 전달한다.
 * 따라서 controlled/uncontrolled 분기 코드가 없다(prop을 넘기면 controlled, 안 넘기면 uncontrolled).
 */
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
      <input {...inputProps} className={className} disabled={disabled} type={isVisible ? 'text' : 'password'} />
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
