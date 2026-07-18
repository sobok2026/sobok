import type {
  Axis,
  AxisDefinition,
  AxisOption,
  AxisValue,
  CoupleTypeAnswers,
  CoupleTypeCode,
  CoupleTypeQuestion,
} from './types'

export const axisOrder = ['pace', 'expression', 'repair', 'bond'] as const

type CoupleTypeAxisDefinitions = Record<Axis, AxisDefinition>
type CoupleTypeQuestions = readonly CoupleTypeQuestion[]

export type CalculateCoupleTypeCodeParams = {
  answers: CoupleTypeAnswers
  axisDefinitions: CoupleTypeAxisDefinitions
  questions: CoupleTypeQuestions
}

export type GetAxisOptionParams = {
  axis: Axis
  axisDefinitions: CoupleTypeAxisDefinitions
  value: AxisValue
}

type ResolveAxisValueParams = CalculateCoupleTypeCodeParams & {
  axis: Axis
}

export function calculateCoupleTypeCode({
  answers,
  axisDefinitions,
  questions,
}: CalculateCoupleTypeCodeParams): CoupleTypeCode {
  const selected = axisOrder.map((axis) => resolveAxisValue({ answers, axis, axisDefinitions, questions })).join('')

  return selected as CoupleTypeCode
}

export function getAxisOption({ axis, axisDefinitions, value }: GetAxisOptionParams): AxisOption {
  const options = axisDefinitions[axis].options as Partial<Record<AxisValue, AxisOption>>
  const option = options[value]

  if (!option) {
    throw new Error(`Invalid axis option: ${axis}:${value}`)
  }

  return option
}

function resolveAxisValue({ answers, axis, axisDefinitions, questions }: ResolveAxisValueParams): AxisValue {
  const values = axisDefinitions[axis].values

  const score = {
    [values[0]]: 0,
    [values[1]]: 0,
  } as Record<AxisValue, number>

  for (const question of questions) {
    if (question.axis !== axis) {
      continue
    }

    const answer = answers[question.id]

    if (answer) {
      score[answer] += 1
    }
  }

  return score[values[0]] > score[values[1]] ? values[0] : values[1]
}
