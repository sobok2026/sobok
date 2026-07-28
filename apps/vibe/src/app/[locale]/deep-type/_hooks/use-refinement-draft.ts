'use client'

import type { ItemAnswer, WorkAnswer } from '@deep-type/model'
import { useEffect, useRef, useState } from 'react'

import { getRefinementDraft, putRefinementDraft, type RefinementDraft, type RefinementResume } from '../_lib/api'

export type DraftState =
  | { phase: 'loading' }
  | { draft: RefinementResume; phase: 'ready'; resumed: boolean }
  | { phase: 'failed' }

/**
 * Thirty-seven questions is long enough that a closed tab has to be survivable, and the buyer has already paid —
 * losing their answers means either re-answering or a refund. So the whole buffer goes to the server after every
 * answer. `PUT` replaces it wholesale, which is why a duplicate or a retry costs nothing.
 *
 * Writes are chained rather than fired in parallel. Two overlapping PUTs can land out of order and park a
 * shorter buffer over a longer one, which on the next resume looks exactly like the buyer answered fewer
 * questions than they did. Chaining costs nothing here — the payload is small and the next write is only queued
 * behind one request.
 *
 * A failed save is swallowed on purpose: the answers are still in memory and the run continues. The failure that
 * matters is a failed *load*, which is the one that could silently restart someone at question one.
 */
export function useRefinementDraft(accessToken: string): { save: (draft: RefinementDraft) => void; state: DraftState } {
  const [state, setState] = useState<DraftState>({ phase: 'loading' })
  const chain = useRef<Promise<unknown>>(Promise.resolve())

  useEffect(() => {
    const controller = new AbortController()

    getRefinementDraft(accessToken, controller.signal)
      .then((draft) => {
        if (!controller.signal.aborted) {
          setState({ draft, phase: 'ready', resumed: hasParkedAnswers(draft) })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ phase: 'failed' })
        }
      })

    return () => controller.abort()
  }, [accessToken])

  function save(draft: RefinementDraft) {
    chain.current = chain.current.then(() => putRefinementDraft(accessToken, draft)).catch(() => undefined)
  }

  return { save, state }
}

// An empty buffer is a fresh sitting, not a resume. The free drain answers alone are not a resume either: they
// are parked at the start of the block, before a single paid question has been answered.
function hasParkedAnswers(draft: { answers: readonly ItemAnswer[]; workAnswers: readonly WorkAnswer[] }): boolean {
  return draft.answers.length > 0
}
