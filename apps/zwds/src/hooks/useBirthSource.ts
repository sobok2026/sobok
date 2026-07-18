'use client'

import { useBirthProfile } from '@/components/BirthProfileProvider'
import type { StoredBirth } from '@/lib/birth-storage'
import { useSharedPayload } from './useSharedPayload'

export type BirthSourceState = {
  birth: StoredBirth | null
  save: (birth: StoredBirth, persistent: boolean) => void
  shared: boolean
  status: 'loading' | 'invalid' | 'ready'
}

/** Resolves an isolated shared birth before falling back to the visitor's saved profile. */
export function useBirthSource(): BirthSourceState {
  const sharedState = useSharedPayload()
  const profile = useBirthProfile()

  const payload = sharedState.status === 'ready' ? sharedState.payload : null
  const shared = payload !== null

  let status: BirthSourceState['status']

  if (sharedState.status === 'invalid') {
    status = 'invalid'
  } else if (sharedState.status === 'loading' || (sharedState.status === 'none' && !profile.hydrated)) {
    status = 'loading'
  } else {
    status = 'ready'
  }

  return {
    birth: payload?.birth ?? profile.birth,
    save: profile.save,
    shared,
    status,
  }
}
