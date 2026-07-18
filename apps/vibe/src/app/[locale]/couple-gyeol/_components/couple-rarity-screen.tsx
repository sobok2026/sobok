'use client'

import type { Locale } from '@sobok/domain/locale'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { calculateGyeolResult, parseGyeolResultParam, rarityQuestionIds, serializeGyeolResult } from '../_lib/model'
import type { GyeolAnswers, GyeolContent, GyeolQuestionId, GyeolResult } from '../_lib/types'
import { IntroView } from './intro-view'
import { QuizView } from './quiz-view'
import { ResultView } from './result-view'

type CoupleGyeolFlowProps = {
  content: GyeolContent
  locale: Locale
}

type View = 'intro' | 'quiz' | 'result'

export function CoupleGyeolFlow({ content, locale }: CoupleGyeolFlowProps) {
  const searchParams = useSearchParams()
  const sharedResult = useMemo(() => parseGyeolResultParam(searchParams.get('r')), [searchParams])
  const hasInvalidSharedResult = searchParams.has('r') && !sharedResult
  const [view, setView] = useState<View>(() => (sharedResult ? 'result' : 'intro'))
  const [answers, setAnswers] = useState<GyeolAnswers>({})
  const [currentIndex, setCurrentIndex] = useState(0)

  const answeredCount = Object.keys(answers).length
  const isComplete = answeredCount === rarityQuestionIds.length

  const calculatedResult = useMemo(() => {
    if (!isComplete) {
      return null
    }

    return calculateGyeolResult(answers)
  }, [answers, isComplete])
  const result = calculatedResult ?? sharedResult

  function startQuiz() {
    clearResultQuery()
    setAnswers({})
    setCurrentIndex(0)
    setView('quiz')
  }

  function restart() {
    clearResultQuery()
    setAnswers({})
    setCurrentIndex(0)
    setView('intro')
  }

  function selectAnswer(questionId: GyeolQuestionId, optionId: GyeolAnswers[keyof GyeolAnswers]) {
    if (!optionId) {
      return
    }

    setAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }))

    if (currentIndex < content.questions.length - 1) {
      setCurrentIndex((index) => Math.min(content.questions.length - 1, index + 1))
    }
  }

  function goBack() {
    if (currentIndex === 0) {
      setView('intro')
      return
    }

    setCurrentIndex((index) => Math.max(0, index - 1))
  }

  function goNext() {
    if (currentIndex < content.questions.length - 1) {
      setCurrentIndex((index) => Math.min(content.questions.length - 1, index + 1))
      return
    }

    if (calculatedResult) {
      replaceResultQuery(calculatedResult)
      setView('result')
    }
  }

  if (view === 'result' && result) {
    return (
      <ResultView
        content={content}
        isSharedResult={!calculatedResult}
        locale={locale}
        onRestart={restart}
        result={result}
      />
    )
  }

  if (view === 'quiz') {
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

  return (
    <IntroView content={content} hasInvalidSharedResult={hasInvalidSharedResult} locale={locale} onStart={startQuiz} />
  )
}

function replaceResultQuery(result: GyeolResult) {
  const url = new URL(window.location.href)
  url.searchParams.set('r', serializeGyeolResult(result))
  window.history.replaceState(null, '', url)
}

function clearResultQuery() {
  const url = new URL(window.location.href)
  url.searchParams.delete('r')
  window.history.replaceState(null, '', url)
}
