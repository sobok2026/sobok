'use client'

import type { Locale } from '@sobok/domain/locale'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { parseCoupleTypeCode } from '../_lib/model'
import { clearCoupleTypeProgress, hasCoupleTypeProgress } from '../_lib/progress'
import type { CoupleTypeContent } from '../_lib/types'
import { ResultView } from './result-view'

/**
 * The result, addressed by `?t=` — four letters the content's result table either knows or does not.
 *
 * Splitting the route gave this test something it never had: a result that survives a reload and can be sent to
 * the other half of the couple. 'Adjust answers' asks the store rather than the URL, because a visitor who
 * arrived by link has no run of their own to adjust and belongs on the landing instead of in someone else's.
 */
export function ResultFlow({ content, locale }: { content: CoupleTypeContent; locale: Locale }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = parseCoupleTypeCode(content.results, searchParams.get('t'))

  useEffect(() => {
    if (!code) {
      router.replace(`/${locale}/couple-type`)
    }
  }, [code, locale, router])

  if (!code) {
    return (
      <div className="flex flex-1 items-center justify-center px-safe py-16">
        <div className="h-12 w-12 rounded-full border-4 border-page-accent/20 border-t-page-accent" />
      </div>
    )
  }

  function edit() {
    router.push(hasCoupleTypeProgress() ? `/${locale}/couple-type/quiz` : `/${locale}/couple-type`)
  }

  function restart() {
    clearCoupleTypeProgress()
    router.push(`/${locale}/couple-type`)
  }

  return (
    <ResultView
      answerCount={content.questions.length}
      axisDefinitions={content.axisDefinitions}
      onEdit={edit}
      onRestart={restart}
      result={content.results[code]}
      ui={content.ui}
    />
  )
}
