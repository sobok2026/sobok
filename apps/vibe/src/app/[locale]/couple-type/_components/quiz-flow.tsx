'use client'

import type { Locale } from '@sobok/domain/locale'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { calculateCoupleTypeCode } from '../_lib/model'
import { type CoupleTypeProgress, readCoupleTypeProgress, writeCoupleTypeProgress } from '../_lib/progress'
import type { AxisValue, CoupleTypeAnswers, CoupleTypeContent } from '../_lib/types'
import { QuizView } from './quiz-view'

/**
 * The run. Its own route, so the bottom island and the desktop navigation can step aside for it by URL alone.
 *
 * Every state change goes through `commit`, the only writer of the stored run, so answering and moving between
 * questions can never take a path that skips the write.
 */
export function QuizFlow({ content, locale }: { content: CoupleTypeContent; locale: Locale }) {
  const { axisDefinitions, questions, ui } = content
  const router = useRouter()
  const [answers, setAnswers] = useState<CoupleTypeAnswers>({})
  const [currentIndex, setCurrentIndex] = useState(0)

  // Read after mount, not during render: this screen is prerendered at build time and `sessionStorage` does not
  // exist there. Question one is what the HTML contains and a restored run moves off it on hydrate.
  useEffect(() => {
    const stored = readCoupleTypeProgress(content)

    if (stored) {
      setAnswers(stored.answers)
      setCurrentIndex(stored.currentIndex)
    }
  }, [content])

  function commit(next: CoupleTypeProgress) {
    setAnswers(next.answers)
    setCurrentIndex(next.currentIndex)
    writeCoupleTypeProgress(next)
  }

  function selectAnswer(questionId: string, value: AxisValue) {
    const isLastQuestion = currentIndex === questions.length - 1

    commit({
      answers: { ...answers, [questionId]: value },
      currentIndex: isLastQuestion ? currentIndex : currentIndex + 1,
    })
  }

  function goBack() {
    if (currentIndex === 0) {
      router.push(`/${locale}/couple-type`)
      return
    }

    commit({ answers, currentIndex: currentIndex - 1 })
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      commit({ answers, currentIndex: currentIndex + 1 })
      return
    }

    if (Object.keys(answers).length !== questions.length) {
      return
    }

    // The stored run outlives the navigation on purpose: it is what tells the result screen the four letters were
    // answered here rather than shared with it, and what 'adjust answers' returns to.
    router.push(`/${locale}/couple-type/result?t=${calculateCoupleTypeCode({ answers, axisDefinitions, questions })}`)
  }

  return (
    <QuizView
      answers={answers}
      axisDefinitions={axisDefinitions}
      currentIndex={currentIndex}
      locale={locale}
      onBack={goBack}
      onNext={goNext}
      onSelect={selectAnswer}
      questions={questions}
      ui={ui}
    />
  )
}
