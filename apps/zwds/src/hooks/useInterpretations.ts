import type { Locale } from '@sobok/domain/locale'
import { useEffect, useState } from 'react'

import { loadInterpretations } from '@/content/interpretations'
import type { Interpretations } from '@/content/interpretations/types'

/** Lazy-loads the locale's reading tables; null until the chunk arrives. */
export function useInterpretations(locale: Locale): Interpretations | null {
  const [interpretations, setInterpretations] = useState<Interpretations | null>(null)

  useEffect(() => {
    let cancelled = false

    loadInterpretations(locale).then(
      (loaded) => {
        if (!cancelled) {
          setInterpretations(loaded)
        }
      },
      () => {
        // 청크 로드 실패 — 명반은 그대로 두고 리딩만 조용히 생략한다.
      },
    )

    return () => {
      cancelled = true
    }
  }, [locale])

  return interpretations
}
