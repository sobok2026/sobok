import { useEffect, useState } from 'react'

export function useWriterLock() {
  const [hasLock, setHasLock] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    let release: (() => void) | undefined

    if (!navigator.locks) {
      setHasLock(true)
      return
    }

    queueMicrotask(() => {
      if (cancelled) return
      void navigator.locks
        .request('sobok-cafe-writer', { ifAvailable: true }, async (lock) => {
          if (cancelled) return
          setHasLock(!!lock)
          if (lock)
            await new Promise<void>((resolve) => {
              release = resolve
            })
        })
        .catch(() => {
          if (!cancelled) setHasLock(false)
        })
    })

    return () => {
      cancelled = true
      release?.()
    }
  }, [])

  return hasLock
}
