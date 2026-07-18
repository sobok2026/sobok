'use client'

import { useEffect, useState } from 'react'

import { decodeShareHash, isShareHash, type SharedPayload } from '@/lib/share'

export type SharedPayloadState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'invalid' }
  | { status: 'ready'; payload: SharedPayload }

/** Resolves a shared chart from the URL hash fragment, re-syncing on hashchange. */
export function useSharedPayload(): SharedPayloadState {
  const [state, setState] = useState<SharedPayloadState>({ status: 'loading' })

  useEffect(() => {
    function sync() {
      if (!isShareHash(window.location.hash)) {
        setState({ status: 'none' })
        return
      }

      const payload = decodeShareHash(window.location.hash)
      setState(payload ? { status: 'ready', payload } : { status: 'invalid' })
    }

    sync()
    window.addEventListener('hashchange', sync)

    return () => {
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  return state
}
