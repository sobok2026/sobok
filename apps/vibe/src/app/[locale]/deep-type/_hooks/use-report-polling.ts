'use client'

import type { AssessmentProfile } from '@deep-type/model'
import { useEffect, useState } from 'react'

import { getReport, postGenerate, type ReportSection } from '../_lib/api'

export type ReportPollState =
  | { phase: 'generating' }
  | { phase: 'done'; profile: AssessmentProfile; sections: ReportSection[] }
  | { phase: 'failed' }

const POLL_INTERVAL_MS = 2500

export function useReportPolling(accessToken: string): ReportPollState {
  const [state, setState] = useState<ReportPollState>({ phase: 'generating' })

  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined

    async function poll() {
      if (controller.signal.aborted) {
        return
      }
      // Generation is idempotent and lock-protected. Retrying here lets transient failures consume the
      // server's bounded retry budget instead of leaving the client polling a failed row forever.
      await postGenerate(accessToken, controller.signal).catch(() => undefined)
      if (controller.signal.aborted) {
        return
      }
      try {
        const result = await getReport(accessToken, controller.signal)
        if (controller.signal.aborted) {
          return
        }
        if (result.done) {
          setState({ phase: 'done', profile: result.profile, sections: result.sections })
          return
        }
      } catch {
        if (!controller.signal.aborted) {
          setState({ phase: 'failed' })
        }
        return
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS)
    }

    void poll()
    return () => {
      controller.abort()
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [accessToken])

  return state
}
