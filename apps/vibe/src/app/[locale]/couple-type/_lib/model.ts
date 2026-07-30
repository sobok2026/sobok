import type {
  Axis,
  AxisDefinition,
  AxisOption,
  AxisValue,
  CoupleTypeAnswers,
  CoupleTypeCode,
  CoupleTypeQuestion,
  CoupleTypeResult,
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

/**
 * The result addressed by a URL, which is the whole state the result route carries.
 *
 * The four letters are their own serialisation — there is nothing to encode and nothing to version — and the
 * content's result table is the only authority on which combinations exist. So an unknown or hand-edited code
 * resolves to null and the caller sends the visitor back to the landing.
 */
export function parseCoupleTypeCode(
  results: Record<CoupleTypeCode, CoupleTypeResult>,
  value: string | null | undefined,
): CoupleTypeCode | null {
  return value && value in results ? (value as CoupleTypeCode) : null
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
