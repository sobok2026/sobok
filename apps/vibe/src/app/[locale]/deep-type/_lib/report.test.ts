import { describe, expect, test } from 'bun:test'

import { deepTypeContent as content } from '../_content/ko'
import { buildDeepReport } from './report'
import type {
  AxesResult,
  AxisScore,
  ClaimedAxisScore,
  DichoAxisId,
  GemAxisId,
  GemCode,
  PersonaCode,
  PersonaResult,
} from './types'

function score(pole: string): AxisScore {
  return { answered: 5, borderline: false, confidence: 80, consistency: 100, lean: 0.8, pole }
}

function dicho(code: string): AxesResult<DichoAxisId> {
  return { axes: { EI: score(code[0]), JP: score(code[3]), SN: score(code[1]), TF: score(code[2]) }, code }
}

function gem(code: GemCode): AxesResult<GemAxisId> {
  return { axes: { OA: score(code[1]), RM: score(code[0]), UO: score(code[3]), VH: score(code[2]) }, code }
}

function persona(code: PersonaCode, claim: PersonaCode = code): PersonaResult {
  const ids: DichoAxisId[] = ['EI', 'SN', 'TF', 'JP']
  const axes = {} as Record<DichoAxisId, ClaimedAxisScore>
  const mismatches: DichoAxisId[] = []

  ids.forEach((id, index) => {
    const claimed = claim[index]
    const mismatch = code[index] !== claimed
    axes[id] = { ...score(code[index]), claimed, mismatch }
    if (mismatch) {
      mismatches.push(id)
    }
  })

  return { axes, code, mismatches }
}

describe('buildDeepReport sections', () => {
  test('transparent-type case (outer === inner)', () => {
    const report = buildDeepReport(content, persona('ENTJ'), dicho('ENTJ'), gem('ROVU'))

    expect(report.sections.gap.transparent).toBe(true)
    expect(report.sections.gap.syncRate).toBeNull()
    expect(report.sections.gap.lines).toHaveLength(0)
    expect(report.sections.summary).toEqual({ gemName: '루비', innerNoun: '엔진', outerNoun: '엔진' })
  })

  test('gapped case (outer !== inner) yields one line per differing letter', () => {
    const report = buildDeepReport(content, persona('ENTJ'), dicho('ISFP'), gem('ROVU'))

    expect(report.sections.gap.transparent).toBe(false)
    expect(report.sections.gap.syncRate).toBe(0)
    expect(report.sections.gap.lines).toHaveLength(4)
    expect(report.sections.gap.lines[0]).toEqual({
      gap: content.gapOuterInner.EI,
      prediction: content.prediction.EI,
    })
  })

  test('avoid resolves the U vs O2 collision key', () => {
    const withU = buildDeepReport(content, persona('ENTJ'), dicho('ENTJ'), gem('ROVU'))
    const withO = buildDeepReport(content, persona('ENTJ'), dicho('ENTJ'), gem('ROVO'))

    expect(withU.sections.avoid[3]).toBe(content.avoid.U)
    expect(withO.sections.avoid[3]).toBe(content.avoid.O2)
  })

  test('match swaps V/H for the best match, O/A+V/H for the clash', () => {
    const report = buildDeepReport(content, persona('ENTJ'), dicho('ENTJ'), gem('ROVU'))

    expect(report.sections.match.matchGem).toBe(content.gem.ROHU.gemName)
    expect(report.sections.match.clashGem).toBe(content.gem.RAHU.gemName)
  })

  test('love note follows the O/A letter', () => {
    const connected = buildDeepReport(content, persona('ENTJ'), dicho('ENTJ'), gem('ROVU'))
    const autonomous = buildDeepReport(content, persona('ENTJ'), dicho('ENTJ'), gem('RAVU'))

    expect(connected.sections.love.note).toBe(content.ui.loveNoteConnected)
    expect(autonomous.sections.love.note).toBe(content.ui.loveNoteAutonomous)
  })
})

describe('buildDeepReport measurement layer', () => {
  test('emits a labeled confidence bar for all 12 axes', () => {
    const report = buildDeepReport(content, persona('ENTJ'), dicho('INFP'), gem('ROVU'))

    expect(report.confidence.persona).toHaveLength(4)
    expect(report.confidence.inner).toHaveLength(4)
    expect(report.confidence.gem).toHaveLength(4)
    expect(report.confidence.persona[0]).toMatchObject({
      axisId: 'EI',
      axisName: content.axes.EI.name,
      confidence: 80,
      pole: 'E',
      poleLabel: content.axes.EI.poles.E.label,
    })
  })

  test('surfaces self-claim mismatches with claimed vs measured labels', () => {
    // claimed ESTJ, measured ISTJ → only EI overturned
    const report = buildDeepReport(content, persona('ISTJ', 'ESTJ'), dicho('ISTJ'), gem('ROVU'))

    expect(report.mismatches).toHaveLength(1)
    expect(report.mismatches[0]).toEqual({
      axisId: 'EI',
      axisName: content.axes.EI.name,
      claimedLabel: content.axes.EI.poles.E.label,
      measuredLabel: content.axes.EI.poles.I.label,
    })
  })

  test('no mismatches when measurement confirms the claim', () => {
    const report = buildDeepReport(content, persona('ENTJ', 'ENTJ'), dicho('ENTJ'), gem('ROVU'))

    expect(report.mismatches).toHaveLength(0)
  })
})
