import type { GuardianEditionScorer, GuardianFamilyScorer } from './draw'
import {
  GUARDIAN_ZODIAC_SIGNS,
  type GuardianPlanetId,
  type GuardianSelectionContext,
  type GuardianZodiacSign,
} from './manifest'
import type { GuardianQuestionnaireSignalSnapshot } from './questionnaire'

export const scoreGuardianFamilySelection: GuardianFamilyScorer = (family, context) => {
  validateSignals(context.paidSignals)
  validateMidheaven(context)

  if (family.slot === 'self') {
    return family.sign === planetSign(context, 'sun') ? 1 : 0
  }

  const affinityScore = rawSignalScore(family.signalAffinities, context.paidSignals)
  if (family.slot === 'love') {
    return finiteScore(affinityScore + (family.sign === planetSign(context, 'venus') ? 8 : 0))
  }
  if (family.slot === 'work') {
    const saturnSign = planetSign(context, 'saturn')
    if (context.chart.timeKnown) {
      if (context.chart.midheaven === null) {
        throw new Error('Guardian known-time selection chart is missing its midheaven')
      }
      const midheavenSign = zodiacSign(context.chart.midheaven, 'midheaven longitude')
      return finiteScore(affinityScore + (family.sign === midheavenSign ? 6 : 0) + (family.sign === saturnSign ? 4 : 0))
    }
    return finiteScore(affinityScore + (family.sign === saturnSign ? 10 : 0))
  }

  return finiteScore(
    affinityScore +
      (family.sign === planetSign(context, 'mercury') ? 5 : 0) +
      (family.sign === planetSign(context, 'mars') ? 5 : 0),
  )
}

function validateMidheaven(context: GuardianSelectionContext): void {
  if (context.chart.timeKnown !== (context.chart.midheaven !== null)) {
    throw new Error('Guardian selection chart has an inconsistent time-known and midheaven shape')
  }
  if (context.chart.midheaven !== null) {
    assertFinite(context.chart.midheaven, 'midheaven longitude')
  }
}

export const scoreGuardianEditionSelection: GuardianEditionScorer = (edition, context) => {
  if (edition.slot === 'love') {
    throw new Error('Guardian love editions must use their weighted-random pool')
  }
  validateSignals(context.paidSignals)
  return finiteScore(
    rawSignalScore(edition.selectionSignals, context.paidSignals) +
      (edition.previewTone === context.previewAnswers.tone ? 1 : 0),
  )
}

function planetSign(context: GuardianSelectionContext, planetId: GuardianPlanetId): GuardianZodiacSign {
  const matches = context.chart.planets.filter(({ id }) => id === planetId)
  if (matches.length !== 1) {
    throw new Error(`Guardian selection chart must contain exactly one ${planetId} planet`)
  }
  return zodiacSign(matches[0].lon, `${planetId} longitude`)
}

function zodiacSign(longitude: number, label: string): GuardianZodiacSign {
  assertFinite(longitude, label)
  const normalized = ((longitude % 360) + 360) % 360
  const sign = GUARDIAN_ZODIAC_SIGNS[Math.floor(normalized / 30)]
  if (!sign) {
    throw new Error(`Guardian selection has an invalid ${label}`)
  }
  return sign
}

function validateSignals(signals: GuardianQuestionnaireSignalSnapshot): void {
  for (const [signal, value] of Object.entries(signals)) {
    assertFinite(value, `paid signal ${signal}`)
  }
}

function rawSignalScore(signalIds: readonly string[], signals: GuardianQuestionnaireSignalSnapshot): number {
  return finiteScore(signalIds.reduce((score, signal) => score + (signals[signal] ?? 0), 0))
}

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Guardian selection requires a finite ${label}`)
  }
}

function finiteScore(score: number): number {
  assertFinite(score, 'score')
  return score
}
