export type GyeolAxisId = 'affection' | 'tempo' | 'balance' | 'recovery'

export type GyeolAxisScores = Record<GyeolAxisId, number>

export type GyeolQuestionId =
  | 'duration'
  | 'frequency'
  | 'replyRhythm'
  | 'planning'
  | 'changeResponse'
  | 'expression'
  | 'reassurance'
  | 'support'
  | 'repair'
  | 'apology'
  | 'stress'
  | 'privateSignals'
  | 'memory'
  | 'balance'
  | 'decision'
  | 'space'

export type GyeolOptionId =
  | 'duration-new'
  | 'duration-seasonal'
  | 'duration-long'
  | 'frequency-daily'
  | 'frequency-steady'
  | 'frequency-event'
  | 'reply-fast'
  | 'reply-slow'
  | 'reply-asymmetric'
  | 'plans-flexible'
  | 'plans-planned'
  | 'plans-drifting'
  | 'change-fast'
  | 'change-cautious'
  | 'change-role-split'
  | 'expression-direct'
  | 'expression-subtle'
  | 'expression-mixed'
  | 'reassurance-clear'
  | 'reassurance-subtle'
  | 'reassurance-awkward'
  | 'support-listen'
  | 'support-practical'
  | 'support-light'
  | 'repair-fast'
  | 'repair-cooldown'
  | 'repair-comeback'
  | 'apology-fast'
  | 'apology-action'
  | 'apology-miss'
  | 'stress-share'
  | 'stress-quiet'
  | 'stress-bounce'
  | 'signals-many'
  | 'signals-some'
  | 'signals-few'
  | 'memory-exact'
  | 'memory-vibe'
  | 'memory-now'
  | 'balance-similar'
  | 'balance-complementary'
  | 'balance-volatile'
  | 'decision-together'
  | 'decision-alternate'
  | 'decision-one-sided'
  | 'space-close'
  | 'space-respecting'
  | 'space-uneven'

export type GyeolTrait = 'archive' | 'harbor' | 'orbit' | 'reconnect' | 'signal' | 'spark'

export type GyeolGrade = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type GyeolResultCode = GyeolTrait | 'rare'

export type GyeolAnswers = Partial<Record<GyeolQuestionId, GyeolOptionId>>

export type CompleteGyeolAnswers = Record<GyeolQuestionId, GyeolOptionId>

export type GyeolResult = {
  axisScores: GyeolAxisScores
  code: GyeolResultCode
  grade: GyeolGrade
  score: number
  weaveIndex: number
}

export type GyeolQuestion = {
  id: GyeolQuestionId
  options: readonly [
    {
      id: GyeolOptionId
      label: string
    },
    {
      id: GyeolOptionId
      label: string
    },
    {
      id: GyeolOptionId
      label: string
    },
  ]
  question: string
}

export type GyeolResultContent = {
  mission: string
  nickname: string
  reasons: readonly [string, string, string]
  summary: string
}

export type GyeolGradeContent = {
  description: string
  label: string
  mountainLabel: string
}

export type GyeolUiText = {
  answeredCount: string
  axisScoresTitle?: string
  backButton: string
  copyFallbackButton: string
  copiedFeedback: string
  emptyResultDescription: string
  emptyResultTitle: string
  gradeTitle: string
  heroCta: string
  heroDescription: string
  heroEyebrow: string
  heroSecondaryCta: string
  heroTitle: string
  indexLabel: string
  introNote: string
  missionTitle: string
  modelStepGradeBody: string
  modelStepGradeTitle: string
  modelStepInputBody: string
  modelStepInputTitle: string
  modelStepShareBody: string
  modelStepShareTitle: string
  modelNotice: string
  nextButton: string
  questionEyebrow: string
  reasonsTitle: string
  resultButton: string
  resultEyebrow: string
  restartButton: string
  resultCardBody: string
  resultCardTitle: string
  shareButton: string
  shareFallbackBody: string
  shareLead: string
  shareTitle: string
}

export type GyeolContent = {
  axes?: Record<
    GyeolAxisId,
    {
      description: string
      label: string
    }
  >
  grades: Record<GyeolGrade, GyeolGradeContent>
  metadata: {
    description: string
    title: string
  }
  questions: readonly GyeolQuestion[]
  results: Record<GyeolResultCode, GyeolResultContent>
  ui: GyeolUiText
}
