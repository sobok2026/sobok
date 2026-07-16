'use client'

import { useEffect, useState } from 'react'

import { useCityCatalog } from '@/components/CityCatalogProvider'
import { decodeShareHash, isShareHash, type SharedPayload, type ShareKind } from '@/lib/share'

type PayloadFor<K extends ShareKind> = Extract<SharedPayload, { kind: K }>

export type SharedPayloadState<K extends ShareKind> =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'invalid' }
  | { status: 'ready'; payload: PayloadFor<K> }

export function useSharedPayload<K extends ShareKind>(kind: K): SharedPayloadState<K> {
  const catalog = useCityCatalog()
  const [state, setState] = useState<SharedPayloadState<K>>({ status: 'loading' })

  useEffect(() => {
    function sync() {
      if (!isShareHash(window.location.hash)) {
        setState({ status: 'none' })
        return
      }

      const payload = decodeShareHash(window.location.hash, kind, catalog)
      setState(payload ? { status: 'ready', payload: payload as PayloadFor<K> } : { status: 'invalid' })
    }

    sync()
    window.addEventListener('hashchange', sync)

    return () => {
      window.removeEventListener('hashchange', sync)
    }
  }, [catalog, kind])

  return state
}
