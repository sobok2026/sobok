'use client'

import type { AssessmentProfile } from '@deep-type/model'
import { useEffect, useState } from 'react'

import { getReport, type NarrativeSection, postGenerate, type ReportSection } from '../_lib/api'

export type ReportPollState =
  | { phase: 'generating' }
  | {
      phase: 'done'
      narrative: NarrativeSection[]
      /** The engine report is on screen and the narration is still being written. */
      narrativePending: boolean
      /** The day access runs out, and the settlement date the document is dated by. Null together. */
      accessExpiresAt: string | null
      paidAt: string | null
      profile: AssessmentProfile
      sections: ReportSection[]
    }
  | { phase: 'failed' }

const POLL_INTERVAL_MS = 2500
// The engine report is already rendered by now, so this loop is only topping it up. A slower beat and a hard
// stop keep a stuck narration from turning into an open-ended request stream.
const NARRATIVE_POLL_INTERVAL_MS = 5000
const MAX_NARRATIVE_POLLS = 24

export function useReportPolling(accessToken: string): ReportPollState {
  const [state, setState] = useState<ReportPollState>({ phase: 'generating' })

  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let narrativePolls = 0
    // Once the engine report is on screen it stays there. A failed top-up poll must not swap a delivered
    // report for the refund screen.
    let delivered = false

    async function poll() {
      if (controller.signal.aborted) {
        return
      }
      // Both passes are idempotent and lock-protected. Retrying here is also what reclaims a narration whose
      // background pass died with its lease still held.
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
          delivered = true
          setState({
            accessExpiresAt: result.accessExpiresAt,
            narrative: result.narrative,
            narrativePending: result.narrativePending,
            paidAt: result.paidAt,
            phase: 'done',
            profile: result.profile,
            sections: result.sections,
          })
          if (!result.narrativePending || narrativePolls >= MAX_NARRATIVE_POLLS) {
            return
          }
          narrativePolls += 1
          timer = setTimeout(poll, NARRATIVE_POLL_INTERVAL_MS)
          return
        }
      } catch {
        if (!controller.signal.aborted && !delivered) {
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
