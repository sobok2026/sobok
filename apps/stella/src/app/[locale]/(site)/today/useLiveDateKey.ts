import { useEffect, useState } from 'react'

import { localDateKey } from './daily'

/** Local calendar date key, kept fresh across midnight rollovers, tab refocus and bfcache restores. */
export function useLiveDateKey(enabled: boolean): string | null {
  const [dateKey, setDateKey] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setDateKey(null)
      return
    }

    let timeoutId: number | undefined

    function syncAndSchedule() {
      setDateKey(localDateKey())

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }

      const now = new Date()
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timeoutId = window.setTimeout(syncAndSchedule, Math.max(1_000, nextMidnight.getTime() - now.getTime() + 250))
    }

    function syncWhenVisible() {
      if (document.visibilityState === 'visible') {
        syncAndSchedule()
      }
    }

    syncAndSchedule()
    document.addEventListener('visibilitychange', syncWhenVisible)
    window.addEventListener('pageshow', syncAndSchedule)

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
      document.removeEventListener('visibilitychange', syncWhenVisible)
      window.removeEventListener('pageshow', syncAndSchedule)
    }
  }, [enabled])

  return dateKey
}
