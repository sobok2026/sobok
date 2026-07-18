'use client'

import type { Locale } from '@sobok/domain/locale'
import { useMemo, useState } from 'react'

import { calculateCoupleTypeCode } from '../_lib/model'
import type { AxisValue, CoupleTypeAnswers, CoupleTypeContent } from '../_lib/types'
import { QuizView } from './quiz-view'
import { ResultView } from './result-view'

type CoupleTypeFlowProps = {
  content: CoupleTypeContent
  locale: Locale
}

export function CoupleTypeFlow({ content, locale }: CoupleTypeFlowProps) {
  const { axisDefinitions, questions, results, ui } = content
  const [answers, setAnswers] = useState<CoupleTypeAnswers>({})
  const [isResultVisible, setIsResultVisible] = useState(false)

  const answeredCount = Object.keys(answers).length
  const isComplete = answeredCount === questions.length

  const result = useMemo(() => {
    if (!isComplete) {
      return null
    }

    const resultCode = calculateCoupleTypeCode({ answers, axisDefinitions, questions })

    return results[resultCode]
  }, [answers, axisDefinitions, isComplete, questions, results])

  function selectAnswer(questionId: string, value: AxisValue) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }))
  }

  function showResult() {
    setIsResultVisible(true)
  }

  function restart() {
    setAnswers({})
    setIsResultVisible(false)
  }

  function editAnswers() {
    setIsResultVisible(false)
  }

  return isResultVisible && result ? (
    <ResultView
      answerCount={answeredCount}
      axisDefinitions={axisDefinitions}
      locale={locale}
      onEdit={editAnswers}
      onRestart={restart}
      result={result}
      ui={ui}
    />
  ) : (
    <QuizView
      answers={answers}
      axisDefinitions={axisDefinitions}
      locale={locale}
      onComplete={showResult}
      onSelect={selectAnswer}
      questions={questions}
      ui={ui}
    />
  )
}
