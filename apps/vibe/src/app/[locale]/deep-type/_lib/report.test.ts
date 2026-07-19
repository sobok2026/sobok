import { describe, expect, test } from 'bun:test'

import { deepTypeContent } from '../_content/ko'
import { buildDeepReport } from './report'

describe('buildDeepReport', () => {
  test('composes every section from the three codes, transparent-type case (outer === inner)', () => {
    const report = buildDeepReport(deepTypeContent, 'ENTJ', 'ENTJ', 'ROVU')

    expect(report.sections.gap.transparent).toBe(true)
    expect(report.sections.gap.syncRate).toBeNull()
    expect(report.sections.gap.lines).toHaveLength(0)
    expect(report.sections.summary).toEqual({ gemName: '루비', innerNoun: '엔진', outerNoun: '엔진' })
  })

  test('composes every section from the three codes, gapped case (outer !== inner)', () => {
    // ISFP is ENTJ's full opposite on all 4 letters, keeping the sync-rate math unambiguous.
    const report = buildDeepReport(deepTypeContent, 'ENTJ', 'ISFP', 'ROVU')

    expect(report.sections.gap.transparent).toBe(false)
    expect(report.sections.gap.syncRate).toBe(0)
    // outer/inner differ on all 4 letters — one gap line per differing letter.
    expect(report.sections.gap.lines).toHaveLength(4)
    expect(report.sections.gap.lines[0]).toEqual({
      gap: deepTypeContent.gapOuterInner.EI,
      prediction: deepTypeContent.prediction.EI,
    })
  })

  test('the avoid section resolves the UO-collision key correctly (U vs O2)', () => {
    const withU = buildDeepReport(deepTypeContent, 'ENTJ', 'ENTJ', 'ROVU')
    const withO = buildDeepReport(deepTypeContent, 'ENTJ', 'ENTJ', 'ROVO')

    expect(withU.sections.avoid[3]).toBe(deepTypeContent.avoid.U)
    expect(withO.sections.avoid[3]).toBe(deepTypeContent.avoid.O2)
  })

  test('match section swaps V/H for the best match and O/A+V/H for the clash', () => {
    const report = buildDeepReport(deepTypeContent, 'ENTJ', 'ENTJ', 'ROVU')

    expect(report.sections.match.matchGem).toBe(deepTypeContent.gem.ROHU.gemName)
    expect(report.sections.match.clashGem).toBe(deepTypeContent.gem.RAHU.gemName)
  })

  test('love note picks the connected/autonomous variant from the O/A letter', () => {
    const connected = buildDeepReport(deepTypeContent, 'ENTJ', 'ENTJ', 'ROVU')
    const autonomous = buildDeepReport(deepTypeContent, 'ENTJ', 'ENTJ', 'RAVU')

    expect(connected.sections.love.note).toBe(deepTypeContent.ui.loveNoteConnected)
    expect(autonomous.sections.love.note).toBe(deepTypeContent.ui.loveNoteAutonomous)
  })
})
