'use client'

import { track } from '@sobok/analytics/browser'
import type { Locale } from '@sobok/domain/locale'
import { useLocale } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { useBirthSource } from '@/hooks/useBirthSource'
import type { StoredBirth } from '@/lib/birth-storage'
import type { SharedPayload, ShareKind } from '@/lib/share'

import { useLiveDateKey } from './useLiveDateKey'

type PayloadFor<K extends ShareKind> = Extract<SharedPayload, { kind: K }>

/** The surfaces that read the sky — daily pages pin a calendar day, love pins a moment. */
export type ReadingSurface = Extract<ShareKind, 'today' | 'tomorrow' | 'love'>

export type ReadingLoadInput<K extends ReadingSurface> = {
  locale: Locale
  birth: StoredBirth | null
  /** The pinned share payload — the sender's day anchor (daily) or share moment (love). */
  payload: PayloadFor<K> | null
  shared: boolean
  surface: K
}

export type ReadingLoadResult<D> = {
  data: D | null
  failed: boolean
  /** The URL carried a share hash that could not be decoded — the page owes the visitor an explanation. */
  invalid: boolean
  shared: boolean
}

/**
 * The async lifecycle the reading pages share: resolve the birth (saved profile or an isolated shared one),
 * wait for the local calendar day (daily surfaces roll over at midnight; love pins its share moment instead),
 * run the surface's loader, and count the view. A shared link pins the sender's day so the recipient
 * reproduces their reading rather than recomputing their own.
 */
export function useReadingLoad<K extends ReadingSurface, D>(
  surface: K,
  resolve: (input: ReadingLoadInput<K>) => Promise<D>,
): ReadingLoadResult<D> {
  const [data, setData] = useState<D | null>(null)
  const [failed, setFailed] = useState(false)
  const birthSource = useBirthSource(surface)
  const resolveRef = useRef(resolve)
  const locale = useLocale()

  const { birth, payload, shared } = birthSource
  const liveDateKey = useLiveDateKey(surface !== 'love' && !shared)
  const sourceReady = birthSource.status === 'ready'
  const dayReady = surface === 'love' || shared || liveDateKey !== null

  useEffect(() => {
    resolveRef.current = resolve
  })

  useEffect(() => {
    let cancelled = false

    if (!sourceReady || !dayReady) {
      return () => {
        cancelled = true
      }
    }

    async function run() {
      try {
        setFailed(false)
        setData(null)

        const result = await resolveRef.current({ locale, birth, payload, shared, surface })

        if (cancelled) {
          return
        }

        setData(result)

        track('view_reading', {
          content_type: surface,
          personalized: birth !== null,
          time_known: birth?.timeKnown ?? false,
          shared,
        })
      } catch {
        if (!cancelled) {
          setFailed(true)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [birth, dayReady, liveDateKey, locale, payload, shared, sourceReady, surface])

  return {
    data,
    failed,
    invalid: birthSource.status === 'invalid',
    shared,
  }
}
