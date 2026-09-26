import clsx from 'clsx'
import { type ButtonHTMLAttributes, type ReactNode, useEffect, useId, useRef } from 'react'

export function PosButton({
  tone = 'soft',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'soft' | 'dark' | 'active' | 'key' | 'hot' | 'iced' }) {
  const colors = {
    soft: 'bg-pos-soft text-pos-ink',
    dark: 'bg-pos-panel text-white',
    active: 'bg-pos-active text-white',
    key: 'bg-ink text-white',
    hot: 'bg-pos-hot text-white',
    iced: 'bg-pos-iced text-white',
  }

  return (
    <button
      type="button"
      {...props}
      className={clsx(
        'min-h-10 rounded px-3 py-2 text-sm font-semibold leading-snug',
        'disabled:opacity-40 aria-pressed:bg-pos-active aria-pressed:text-white',
        colors[tone],
        className,
      )}
    />
  )
}

export function PosDialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const id = useId()
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement
    const field = dialog.current?.querySelector<HTMLInputElement>('input:not(:disabled)')

    if (field) {
      field.focus()
      field.select()
    } else {
      dialog.current?.focus()
    }

    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus()
      }
    }
  }, [])

  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-black/50 p-5">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={clsx(
          'max-h-full w-full overflow-auto rounded-lg bg-white p-5 text-pos-ink shadow-xl outline-none',
          wide ? 'max-w-3xl' : 'max-w-md',
        )}
        onKeyDown={(event) => {
          event.stopPropagation()

          if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
          }

          if (event.key === 'Tab') {
            const items = [
              ...event.currentTarget.querySelectorAll<HTMLElement>(
                'button:not(:disabled), input:not(:disabled), select:not(:disabled), summary',
              ),
            ].filter((item) => item.checkVisibility())
            if (event.shiftKey && (document.activeElement === items[0] || document.activeElement === dialog.current)) {
              event.preventDefault()
              items.at(-1)?.focus()
            } else if (
              !event.shiftKey &&
              (document.activeElement === items.at(-1) || document.activeElement === dialog.current)
            ) {
              event.preventDefault()
              items[0]?.focus()
            }
          }
        }}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id={id} className="text-xl font-semibold">
            {title}
          </h2>
          <PosButton tone="dark" onClick={onClose} aria-label={`${title} 닫기`}>
            ×
          </PosButton>
        </div>
        {children}
      </div>
    </div>
  )
}

function appendKey(value: string, key: string) {
  if (key === '.5') {
    return String(Math.floor(Number(value || 0)) + 0.5)
  }
  return value === '0' ? key : value + key
}

export function NumericPad({
  value,
  onChange,
  onConfirm,
  decimal = false,
  money = false,
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  onConfirm: () => void
  decimal?: boolean
  money?: boolean
  disabled?: boolean
}) {
  const append = (key: string) => {
    const next = appendKey(value, key)
    if (next.length <= 8 && /^\d*(\.5)?$/.test(next)) {
      onChange(next)
    }
  }

  return (
    <fieldset className="grid grid-cols-4 gap-1" aria-label="숫자 키패드">
      {['7', '8', '9'].map((key) => (
        <PosButton
          key={key}
          tone="key"
          onClick={() => append(key)}
          disabled={disabled}
          className="min-h-13 text-xl pos-compact:min-h-10"
        >
          {key}
        </PosButton>
      ))}
      <PosButton
        tone="active"
        onClick={() => onChange(value.slice(0, -1))}
        disabled={disabled}
        aria-label="한 자리 지우기"
      >
        ←
      </PosButton>
      {['4', '5', '6'].map((key) => (
        <PosButton
          key={key}
          tone="key"
          onClick={() => append(key)}
          disabled={disabled}
          className="min-h-13 text-xl pos-compact:min-h-10"
        >
          {key}
        </PosButton>
      ))}
      <PosButton tone="active" onClick={() => onChange('')} disabled={disabled} aria-label="입력 지우기">
        C
      </PosButton>
      {['1', '2', '3'].map((key) => (
        <PosButton
          key={key}
          tone="key"
          onClick={() => append(key)}
          disabled={disabled}
          className="min-h-13 text-xl pos-compact:min-h-10"
        >
          {key}
        </PosButton>
      ))}
      <PosButton tone="active" onClick={onConfirm} disabled={disabled} className={money ? 'row-span-3' : 'row-span-2'}>
        확인
      </PosButton>
      <PosButton
        tone="key"
        onClick={() => append('0')}
        disabled={disabled}
        className="min-h-13 text-xl pos-compact:min-h-10"
      >
        0
      </PosButton>
      <PosButton
        tone="key"
        onClick={() => append(decimal ? '.5' : '00')}
        disabled={disabled}
        className="col-span-2 text-xl"
      >
        {decimal ? '.5' : '00'}
      </PosButton>
      {money &&
        [1000, 10000, 50000].map((amount, index) => (
          <PosButton
            key={amount}
            tone="key"
            disabled={disabled}
            onClick={() => onChange(String(Math.min(99999999, Number(value || 0) + amount)))}
          >
            {['천원', '만원', '오만원'][index]}
          </PosButton>
        ))}
    </fieldset>
  )
}
