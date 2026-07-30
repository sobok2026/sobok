'use client'

import type { Locale } from '@sobok/domain/locale'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { calculateGyeolResult, rarityQuestionIds, serializeGyeolResult } from '../_lib/model'
import { type GyeolProgress, readGyeolProgress, writeGyeolProgress } from '../_lib/progress'
import type { GyeolAnswers, GyeolContent, GyeolQuestionId } from '../_lib/types'
import { QuizView } from './quiz-view'

/**
 * The run. Its own route, so the bottom island and the desktop navigation can step aside for it by URL alone.
 *
 * Every state change goes through `commit`, which is also the only writer of the stored run. Answering and
 * navigating between questions are the same event as far as recovery is concerned — losing the position is as
 * annoying as losing the answers — so neither one gets a path that skips the write.
 */
export function QuizFlow({ content, locale }: { content: GyeolContent; locale: Locale }) {
  const router = useRouter()
  const [answers, setAnswers] = useState<GyeolAnswers>({})
  const [currentIndex, setCurrentIndex] = useState(0)

  // Read after mount, not during render: this screen is prerendered at build time and `sessionStorage` does not
  // exist there. Question one is what the HTML contains and a restored run moves off it on hydrate.
  useEffect(() => {
    const stored = readGyeolProgress()

    if (stored) {
      setAnswers(stored.answers)
      setCurrentIndex(stored.currentIndex)
    }
  }, [])

  function commit(next: GyeolProgress) {
    setAnswers(next.answers)
    setCurrentIndex(next.currentIndex)
    writeGyeolProgress(next)
  }

  function selectAnswer(questionId: GyeolQuestionId, optionId: GyeolAnswers[keyof GyeolAnswers]) {
    if (!optionId) {
      return
    }

    const isLastQuestion = currentIndex === content.questions.length - 1

    commit({
      answers: { ...answers, [questionId]: optionId },
      currentIndex: isLastQuestion ? currentIndex : currentIndex + 1,
    })
  }

  function goBack() {
    if (currentIndex === 0) {
      router.push(`/${locale}/couple-gyeol`)
      return
    }

    commit({ answers, currentIndex: currentIndex - 1 })
  }

  function goNext() {
    if (currentIndex < content.questions.length - 1) {
      commit({ answers, currentIndex: currentIndex + 1 })
      return
    }

    if (Object.keys(answers).length !== rarityQuestionIds.length) {
      return
    }

    // The stored run outlives the navigation on purpose. It is what tells the result screen the grade belongs to
    // this visitor rather than to whoever shared it, and it is what a back gesture from the result resumes.
    router.push(`/${locale}/couple-gyeol/result?r=${serializeGyeolResult(calculateGyeolResult(answers))}`)
  }

  return (
    <QuizView
      answers={answers}
      content={content}
      currentIndex={currentIndex}
      locale={locale}
      onBack={goBack}
      onNext={goNext}
      onSelect={selectAnswer}
    />
  )
}
