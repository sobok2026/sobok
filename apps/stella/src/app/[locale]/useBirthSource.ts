'use client'

import { useBirthProfile } from './BirthProfileProvider'
import type { StoredBirth } from './birth-storage'
import type { SharedPayload, ShareKind } from './share'
import { useSharedPayload } from './useSharedPayload'

type PayloadFor<K extends ShareKind> = Extract<SharedPayload, { kind: K }>

export type BirthSourceState<K extends ShareKind> = {
  birth: StoredBirth | null
  payload: PayloadFor<K> | null
  /** True when the visitor's own birth is a saved profile (localStorage), not a session copy. */
  persistent: boolean
  /** True once a session-only birth has been deliberately surfaced this page load. */
  revealed: boolean
  save: (birth: StoredBirth, persistent: boolean) => void
  shared: boolean
  status: 'loading' | 'invalid' | 'ready'
}

/** Resolves an isolated shared birth before falling back to the visitor's saved profile. */
export function useBirthSource<K extends ShareKind>(kind: K): BirthSourceState<K> {
  const sharedState = useSharedPayload(kind)
  const profile = useBirthProfile()

  const payload = sharedState.status === 'ready' ? sharedState.payload : null
  const shared = payload !== null

  let status: BirthSourceState<K>['status']

  if (sharedState.status === 'invalid') {
    status = 'invalid'
  } else if (sharedState.status === 'loading' || (sharedState.status === 'none' && !profile.hydrated)) {
    status = 'loading'
  } else {
    status = 'ready'
  }

  return {
    birth: payload?.birth ?? profile.birth,
    payload,
    persistent: profile.persistent,
    revealed: profile.revealed,
    save: profile.save,
    shared,
    status,
  }
}
