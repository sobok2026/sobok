import clsx from 'clsx'
import { type PointerEvent, useEffect, useEffectEvent, useRef, useState } from 'react'

const RADIUS = 42
const DEAD_ZONE = 7
const REST = { x: 0, y: 0, left: 80, top: 80, running: false }

export default function MovementStick({
  onMove,
}: {
  onMove: (sideways: number, forward: number, running: boolean) => void
}) {
  const surface = useRef<HTMLButtonElement>(null)
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null)
  const [stick, setStick] = useState(REST)
  const [active, setActive] = useState(false)

  function reset() {
    const id = pointer.current?.id
    pointer.current = null
    onMove(0, 0, false)
    setStick(REST)
    setActive(false)
    if (id !== undefined && surface.current?.hasPointerCapture(id)) surface.current.releasePointerCapture(id)
  }

  const resetFromWindow = useEffectEvent(reset)

  useEffect(() => {
    const hidden = () => {
      if (document.hidden) resetFromWindow()
    }

    window.addEventListener('blur', resetFromWindow)
    window.addEventListener('resize', resetFromWindow)
    document.addEventListener('visibilitychange', hidden)

    return () => {
      window.removeEventListener('blur', resetFromWindow)
      window.removeEventListener('resize', resetFromWindow)
      document.removeEventListener('visibilitychange', hidden)
      resetFromWindow()
    }
  }, [])

  function move(event: PointerEvent<HTMLButtonElement>) {
    const origin = pointer.current
    if (!origin || origin.id !== event.pointerId) return
    const x = event.clientX - origin.x
    const y = event.clientY - origin.y
    const distance = Math.hypot(x, y)
    const direction = distance || 1
    const amount = Math.min(1, Math.max(0, (distance - DEAD_ZONE) / (RADIUS - DEAD_ZONE)))
    const running = distance > RADIUS + 22 && -y / direction > 0.75
    onMove((x / direction) * amount, (-y / direction) * amount, running)
    setStick((previous) => ({
      ...previous,
      x: (x / direction) * Math.min(RADIUS, distance),
      y: (y / direction) * Math.min(RADIUS, distance),
      running,
    }))
  }

  function release(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerId === pointer.current?.id) reset()
  }

  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 z-7 select-none">
      <button
        ref={surface}
        type="button"
        aria-label="이동 스틱"
        aria-describedby="movement-stick-help"
        className="relative block size-40 touch-none rounded-full [-webkit-touch-callout:none] active:translate-none"
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (event.button !== 0 || pointer.current) return
          event.preventDefault()
          const bounds = event.currentTarget.getBoundingClientRect()
          pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
          event.currentTarget.setPointerCapture(event.pointerId)
          setStick({
            ...REST,
            left: Math.min(bounds.width - 56, Math.max(56, event.clientX - bounds.left)),
            top: Math.min(bounds.height - 56, Math.max(56, event.clientY - bounds.top)),
          })
          setActive(true)
        }}
        onPointerMove={move}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onBlur={reset}
      >
        <span
          className={clsx(
            'pointer-events-none absolute grid size-28 -translate-1/2 place-items-center',
            'rounded-full border border-white/55 bg-ink/20 shadow-hud',
            'data-[active=true]:border-white/80 data-[active=true]:bg-ink/35',
            'data-[running=true]:ring-2 data-[running=true]:ring-focus',
          )}
          style={{ left: stick.left, top: stick.top }}
          data-active={active}
          data-running={stick.running}
          aria-hidden="true"
        >
          <svg className="size-20 text-white/65" viewBox="0 0 80 80" fill="none">
            <path
              d="m35 13 5-5 5 5m22 22 5 5-5 5M45 67l-5 5-5-5M13 45l-5-5 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className={clsx(
              'absolute size-12 rounded-full border border-white/85 bg-surface/85 shadow-hud',
              'data-[active=true]:bg-white data-[running=true]:bg-focus',
            )}
            style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }}
            data-active={active}
            data-running={stick.running}
          />
        </span>
      </button>
      <p
        className={clsx(
          'pointer-events-none absolute inset-x-0 bottom-0 text-center',
          'text-sm font-medium text-white [text-shadow:0_1px_5px_#000]',
        )}
        aria-hidden="true"
      >
        {stick.running ? '달리기' : '이동'}
      </p>
      <p id="movement-stick-help" className="sr-only">
        왼쪽 스틱을 밀어 이동하고 위로 더 밀면 달립니다. 손을 떼면 멈춥니다. 키보드는 WASD로 이동합니다.
      </p>
    </div>
  )
}
