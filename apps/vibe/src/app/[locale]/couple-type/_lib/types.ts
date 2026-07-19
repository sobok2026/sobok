export type Axis = 'pace' | 'expression' | 'repair' | 'bond'
export type PaceValue = 'S' | 'H'
export type ExpressionValue = 'O' | 'N'
export type RepairValue = 'Q' | 'L'
export type BondValue = 'P' | 'D'
export type AxisValue = PaceValue | ExpressionValue | RepairValue | BondValue
export type CoupleTypeCode = `${PaceValue}${ExpressionValue}${RepairValue}${BondValue}`
export type CoupleTypeAnswers = Partial<Record<CoupleTypeQuestion['id'], AxisValue>>

export type CoupleTypeDisplayCode =
  | 'BABE'
  | 'BURN'
  | 'DEEP'
  | 'FIRE'
  | 'FOOL'
  | 'FUXK'
  | 'KINK'
  | 'KISS'
  | 'LOVE'
  | 'LUST'
  | 'REAL'
  | 'SEXY'
  | 'SLOW'
  | 'SOUL'
  | 'VIBE'
  | 'WILD'

export type AxisOption = {
  body: string
  label: string
}

export type AxisDefinition = {
  label: string
  options: Record<string, AxisOption>
  values: readonly [AxisValue, AxisValue]
}

export type CoupleTypeResult = {
  code: CoupleTypeCode
  dateMission: string
  displayCode: CoupleTypeDisplayCode
  strengths: readonly string[]
  summary: string
  title: string
  watchOut: string
}

export type CoupleTypeQuestionOption = {
  label: string
  value: AxisValue
}

export type CoupleTypeQuestion = {
  axis: Axis
  id: string
  options: readonly [CoupleTypeQuestionOption, CoupleTypeQuestionOption]
  question: string
}

export type CoupleTypeUiText = {
  answeredCount: string
  dateMissionTitle: string
  editButton: string
  heroDescription: string
  heroEyebrow: string
  heroTitle: string
  homeLink: string
  navigationLabel: string
  nextButton: string
  previousButton: string
  privacyNotice: string
  questionCountLabel: string
  questionCountValue: string
  resultButton: string
  resultCountLabel: string
  resultCountValue: string
  resultEyebrow: string
  restartButton: string
  rhythmsTitle: string
  selectAnswerButton: string
  strengthsTitle: string
  watchOutTitle: string
}

export type CoupleTypeMetadata = {
  description: string
  title: string
}

export type CoupleTypeContent = {
  axisDefinitions: Record<Axis, AxisDefinition>
  metadata: CoupleTypeMetadata
  questions: readonly CoupleTypeQuestion[]
  results: Record<CoupleTypeCode, CoupleTypeResult>
  ui: CoupleTypeUiText
}
