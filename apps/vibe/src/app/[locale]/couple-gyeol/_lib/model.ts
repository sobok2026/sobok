import type {
  GyeolAnswers,
  GyeolAxisId,
  GyeolAxisScores,
  GyeolGrade,
  GyeolOptionId,
  GyeolQuestionId,
  GyeolResult,
  GyeolResultCode,
  GyeolTrait,
} from './types'

type OptionProfile = {
  axis: GyeolAxisId
  value: number
  traits: readonly GyeolTrait[]
}

export const axisOrder = ['affection', 'tempo', 'balance', 'recovery'] as const satisfies readonly GyeolAxisId[]

export const rarityQuestionIds = [
  'duration',
  'frequency',
  'replyRhythm',
  'planning',
  'changeResponse',
  'expression',
  'reassurance',
  'support',
  'repair',
  'apology',
  'stress',
  'privateSignals',
  'memory',
  'balance',
  'decision',
  'space',
] as const satisfies readonly GyeolQuestionId[]

export const rarityOptionIdsByQuestion = {
  apology: ['apology-fast', 'apology-action', 'apology-miss'],
  balance: ['balance-similar', 'balance-complementary', 'balance-volatile'],
  changeResponse: ['change-fast', 'change-cautious', 'change-role-split'],
  decision: ['decision-together', 'decision-alternate', 'decision-one-sided'],
  duration: ['duration-new', 'duration-seasonal', 'duration-long'],
  expression: ['expression-direct', 'expression-subtle', 'expression-mixed'],
  frequency: ['frequency-daily', 'frequency-steady', 'frequency-event'],
  memory: ['memory-exact', 'memory-vibe', 'memory-now'],
  planning: ['plans-flexible', 'plans-planned', 'plans-drifting'],
  privateSignals: ['signals-many', 'signals-some', 'signals-few'],
  reassurance: ['reassurance-clear', 'reassurance-subtle', 'reassurance-awkward'],
  repair: ['repair-fast', 'repair-cooldown', 'repair-comeback'],
  replyRhythm: ['reply-fast', 'reply-slow', 'reply-asymmetric'],
  space: ['space-close', 'space-respecting', 'space-uneven'],
  stress: ['stress-share', 'stress-quiet', 'stress-bounce'],
  support: ['support-listen', 'support-practical', 'support-light'],
} as const satisfies Record<GyeolQuestionId, readonly [GyeolOptionId, GyeolOptionId, GyeolOptionId]>

const optionProfiles = {
  'apology-action': { axis: 'recovery', value: 25, traits: ['archive'] },
  'apology-fast': { axis: 'recovery', value: 23, traits: ['reconnect'] },
  'apology-miss': { axis: 'recovery', value: 10, traits: ['spark'] },
  'balance-complementary': { axis: 'balance', value: 25, traits: ['harbor'] },
  'balance-similar': { axis: 'balance', value: 20, traits: ['orbit'] },
  'balance-volatile': { axis: 'balance', value: 9, traits: ['reconnect'] },
  'change-cautious': { axis: 'tempo', value: 16, traits: ['harbor'] },
  'change-fast': { axis: 'tempo', value: 22, traits: ['spark'] },
  'change-role-split': { axis: 'tempo', value: 24, traits: ['reconnect'] },
  'decision-alternate': { axis: 'balance', value: 20, traits: ['orbit'] },
  'decision-one-sided': { axis: 'balance', value: 10, traits: ['reconnect'] },
  'decision-together': { axis: 'balance', value: 25, traits: ['harbor'] },
  'duration-long': { axis: 'balance', value: 25, traits: ['archive'] },
  'duration-new': { axis: 'balance', value: 12, traits: ['spark'] },
  'duration-seasonal': { axis: 'balance', value: 19, traits: ['orbit'] },
  'expression-direct': { axis: 'affection', value: 18, traits: ['reconnect'] },
  'expression-mixed': { axis: 'affection', value: 25, traits: ['signal', 'reconnect'] },
  'expression-subtle': { axis: 'affection', value: 21, traits: ['signal'] },
  'frequency-daily': { axis: 'tempo', value: 24, traits: ['orbit'] },
  'frequency-event': { axis: 'tempo', value: 13, traits: ['spark'] },
  'frequency-steady': { axis: 'tempo', value: 21, traits: ['harbor'] },
  'memory-exact': { axis: 'recovery', value: 24, traits: ['archive'] },
  'memory-now': { axis: 'recovery', value: 12, traits: ['spark'] },
  'memory-vibe': { axis: 'recovery', value: 20, traits: ['signal', 'archive'] },
  'plans-drifting': { axis: 'tempo', value: 11, traits: ['reconnect'] },
  'plans-flexible': { axis: 'tempo', value: 25, traits: ['orbit'] },
  'plans-planned': { axis: 'tempo', value: 21, traits: ['harbor'] },
  'reassurance-awkward': { axis: 'affection', value: 10, traits: ['spark'] },
  'reassurance-clear': { axis: 'affection', value: 25, traits: ['reconnect'] },
  'reassurance-subtle': { axis: 'affection', value: 19, traits: ['signal'] },
  'repair-comeback': { axis: 'recovery', value: 25, traits: ['reconnect', 'archive'] },
  'repair-cooldown': { axis: 'recovery', value: 15, traits: ['harbor'] },
  'repair-fast': { axis: 'recovery', value: 23, traits: ['reconnect'] },
  'reply-asymmetric': { axis: 'tempo', value: 21, traits: ['reconnect'] },
  'reply-fast': { axis: 'tempo', value: 23, traits: ['spark'] },
  'reply-slow': { axis: 'tempo', value: 14, traits: ['harbor'] },
  'signals-few': { axis: 'affection', value: 11, traits: ['spark'] },
  'signals-many': { axis: 'affection', value: 25, traits: ['signal'] },
  'signals-some': { axis: 'affection', value: 18, traits: ['harbor', 'signal'] },
  'space-close': { axis: 'balance', value: 19, traits: ['orbit'] },
  'space-respecting': { axis: 'balance', value: 25, traits: ['harbor'] },
  'space-uneven': { axis: 'balance', value: 11, traits: ['reconnect'] },
  'stress-bounce': { axis: 'recovery', value: 20, traits: ['spark'] },
  'stress-quiet': { axis: 'recovery', value: 16, traits: ['harbor'] },
  'stress-share': { axis: 'recovery', value: 24, traits: ['reconnect'] },
  'support-light': { axis: 'affection', value: 14, traits: ['spark'] },
  'support-listen': { axis: 'affection', value: 25, traits: ['archive'] },
  'support-practical': { axis: 'affection', value: 21, traits: ['harbor'] },
} as const satisfies Record<GyeolOptionId, OptionProfile>

const traitOrder = [
  'signal',
  'reconnect',
  'archive',
  'orbit',
  'harbor',
  'spark',
] as const satisfies readonly GyeolTrait[]
const resultCodes = [...traitOrder, 'rare'] as const satisfies readonly GyeolResultCode[]

export function calculateGyeolResult(answers: GyeolAnswers): GyeolResult {
  const axisScores = Object.fromEntries(axisOrder.map((axis) => [axis, 0])) as GyeolAxisScores
  const traitScores = Object.fromEntries(traitOrder.map((trait) => [trait, 0])) as Record<GyeolTrait, number>

  for (const questionId of rarityQuestionIds) {
    const optionId = answers[questionId]
    const allowedOptionIds: readonly GyeolOptionId[] = rarityOptionIdsByQuestion[questionId]

    if (!optionId || !allowedOptionIds.includes(optionId)) {
      throw new Error(`Missing rarity answer: ${questionId}`)
    }

    const profile = optionProfiles[optionId]
    axisScores[profile.axis] += profile.value

    for (const trait of profile.traits) {
      traitScores[trait] += profile.value
    }
  }

  const score = getScoreFromAxes(axisScores)
  const grade = getGrade(score)
  const code = grade <= 2 ? 'rare' : getDominantTrait(traitScores)

  return {
    axisScores,
    code,
    grade,
    score,
    weaveIndex: score,
  }
}

export function serializeGyeolResult(result: GyeolResult) {
  return [
    result.code,
    String(result.grade),
    String(result.weaveIndex),
    String(result.score),
    ...axisOrder.map((axis) => String(result.axisScores[axis])),
  ].join('_')
}

export function parseGyeolResultParam(value: string | null | undefined): GyeolResult | null {
  if (!value) {
    return null
  }

  const [code, gradeValue, weaveIndexValue, scoreValue, ...axisValues] = value.split('_')

  if (!isResultCode(code) || axisValues.length !== axisOrder.length) {
    return null
  }

  const grade = Number(gradeValue)
  const weaveIndex = Number(weaveIndexValue)
  const score = Number(scoreValue)
  const parsedAxisScores = axisValues.map(Number)

  if (
    !isGyeolGrade(grade) ||
    !Number.isInteger(weaveIndex) ||
    !Number.isInteger(score) ||
    parsedAxisScores.some((axisScore) => !Number.isInteger(axisScore) || !isPercentScore(axisScore))
  ) {
    return null
  }

  const axisScores = Object.fromEntries(
    axisOrder.map((axis, index) => [axis, parsedAxisScores[index]]),
  ) as GyeolAxisScores

  if (
    !isPercentScore(score) ||
    weaveIndex !== score ||
    score !== getScoreFromAxes(axisScores) ||
    grade !== getGrade(score)
  ) {
    return null
  }

  if ((code === 'rare' && grade > 2) || (code !== 'rare' && grade <= 2)) {
    return null
  }

  return {
    axisScores,
    code,
    grade,
    score,
    weaveIndex,
  }
}

function getDominantTrait(traitScores: Record<GyeolTrait, number>): GyeolTrait {
  return traitOrder.reduce((current, trait) => (traitScores[trait] > traitScores[current] ? trait : current))
}

function getGrade(score: number): GyeolGrade {
  if (score >= 90) {
    return 1
  }

  if (score >= 82) {
    return 2
  }

  if (score >= 74) {
    return 3
  }

  if (score >= 66) {
    return 4
  }

  if (score >= 58) {
    return 5
  }

  if (score >= 52) {
    return 6
  }

  return 7
}

function getScoreFromAxes(axisScores: GyeolAxisScores) {
  return Math.round(axisOrder.reduce((sum, axis) => sum + axisScores[axis], 0) / axisOrder.length)
}

function isPercentScore(value: number) {
  return value >= 0 && value <= 100
}

function isResultCode(value: string): value is GyeolResultCode {
  return resultCodes.includes(value as GyeolResultCode)
}

function isGyeolGrade(value: number): value is GyeolGrade {
  return Number.isInteger(value) && value >= 1 && value <= 7
}
