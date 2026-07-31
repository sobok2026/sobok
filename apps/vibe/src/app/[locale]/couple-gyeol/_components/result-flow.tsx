'use client'

import type { Locale } from '@sobok/domain/locale'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { parseGyeolResultParam } from '../_lib/model'
import { clearGyeolProgress, hasGyeolProgress } from '../_lib/progress'
import type { GyeolContent } from '../_lib/types'
import { ResultView } from './result-view'

/**
 * The result, addressed by `?r=` and therefore shareable, bookmarkable and reloadable — none of which the
 * in-page phase it replaced could do.
 *
 * The parameter is the whole input. `parseGyeolResultParam` refuses anything that does not reproduce its own
 * grade and axis totals, so a hand-edited link cannot invent a rarity; it goes back to the landing, which owns
 * the message for an unreadable share.
 */
export function ResultFlow({ content, locale }: { content: GyeolContent; locale: Locale }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const shared = searchParams.get('r')
  const result = parseGyeolResultParam(shared)
  // A stored run means this grade was answered in this tab. Read after mount, so the first paint of a shared link
  // is the same HTML the visitor who answered sees.
  const [ownRun, setOwnRun] = useState(false)

  useEffect(() => {
    setOwnRun(hasGyeolProgress())
  }, [])

  useEffect(() => {
    if (!result) {
      router.replace(shared ? `/${locale}/couple-gyeol?r=${encodeURIComponent(shared)}` : `/${locale}/couple-gyeol`)
    }
  }, [locale, result, router, shared])

  if (!result) {
    return (
      <div className="flex flex-1 items-center justify-center px-safe py-16">
        <div className="h-12 w-12 rounded-full border-4 border-page-accent/20 border-t-page-accent" />
      </div>
    )
  }

  function restart() {
    clearGyeolProgress()
    router.push(`/${locale}/couple-gyeol`)
  }

  return <ResultView content={content} isSharedResult={!ownRun} onRestart={restart} result={result} />
}
