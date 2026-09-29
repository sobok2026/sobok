import { useEffect, useRef, useState } from 'react'

/** Input follows the device in use, including touch laptops with a mouse attached. */
export function useTouchControls() {
  const [touchControls, setTouchControls] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const touchControlsRef = useRef(touchControls)

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)')
    const update = (touch: boolean) => {
      touchControlsRef.current = touch
      setTouchControls(touch)
    }
    const changed = () => update(media.matches)
    const pointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.pointerType === 'pen') update(true)
      if (event.pointerType === 'mouse') update(false)
    }
    const keyboard = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        update(false)
      }
    }

    media.addEventListener('change', changed)
    document.addEventListener('pointerdown', pointer, true)
    window.addEventListener('keydown', keyboard, true)

    return () => {
      media.removeEventListener('change', changed)
      document.removeEventListener('pointerdown', pointer, true)
      window.removeEventListener('keydown', keyboard, true)
    }
  }, [])

  return { touchControls, touchControlsRef }
}
