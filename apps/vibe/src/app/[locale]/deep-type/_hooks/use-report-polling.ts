'use client'

import { useEffect, useState } from 'react'

import { getReport, postGenerate, type ReportSection } from '../_lib/api'

export type ReportPollState =
  | { phase: 'generating' }
  | { phase: 'done'; sections: ReportSection[] }
  | { phase: 'failed' }

const POLL_INTERVAL_MS = 2500

// Kick generation once, then poll GET /report to done. Generation is idempotent + cache-first server-side,
// so re-entry (StrictMode double-mount, remount) is safe. A terminal API error (not-paid / refunded /
// generation-failed) resolves to 'failed'; the view then shows the static report as a consolation.
export function useReportPolling(accessToken: string): ReportPollState {
  const [state, setState] = useState<ReportPollState>({ phase: 'generating' })

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function poll() {
      if (cancelled) {
        return
      }
      try {
        const result = await getReport(accessToken)
        if (cancelled) {
          return
        }
        if (result.done) {
          setState({ phase: 'done', sections: result.sections })
          return
        }
      } catch {
        if (!cancelled) {
          setState({ phase: 'failed' })
        }
        return
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS)
    }

    async function run() {
      // A 202/500 here is fine — the poll loop is the source of truth for the final state.
      await postGenerate(accessToken).catch(() => undefined)
      poll()
    }

    run()
    return () => {
      cancelled = true
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [accessToken])

  return state
}
