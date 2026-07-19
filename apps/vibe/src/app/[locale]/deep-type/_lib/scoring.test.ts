import { describe, expect, test } from 'bun:test'

import { resolveResponse, scoreAxes, scorePersonaWithClaim } from './scoring'
import type { AxisResponse, ChoiceItem, ScaleItem } from './types'
import { DICHO_AXES } from './types'

describe('resolveResponse', () => {
  const choice: ChoiceItem = { axis: 'EI', id: 'x', kind: 'choice', options: [2, 1, -1, -2] }
  const scale: ScaleItem = { axis: 'EI', id: 'y', kind: 'scale', reverse: false }
  const scaleReversed: ScaleItem = { axis: 'EI', id: 'z', kind: 'scale', reverse: true }

  test('choice returns the selected option value', () => {
    expect(resolveResponse(choice, { itemId: 'x', kind: 'choice', optionIndex: 0 })).toEqual({ axis: 'EI', value: 2 })
    expect(resolveResponse(choice, { itemId: 'x', kind: 'choice', optionIndex: 3 })).toEqual({ axis: 'EI', value: -2 })
  })

  test('scale maps the midpoint to 0 and the ends to ±2', () => {
    expect(resolveResponse(scale, { itemId: 'y', kind: 'scale', value: 50 }).value).toBe(0)
    expect(resolveResponse(scale, { itemId: 'y', kind: 'scale', value: 100 }).value).toBe(2)
    expect(resolveResponse(scale, { itemId: 'y', kind: 'scale', value: 0 }).value).toBe(-2)
  })

  test('reverse negates the scale value', () => {
    expect(resolveResponse(scaleReversed, { itemId: 'z', kind: 'scale', value: 100 }).value).toBe(-2)
  })
})

describe('scoreAxes', () => {
  test('a fully one-sided axis scores lean 1, confidence 100, not borderline', () => {
    const responses: AxisResponse[] = [
      { axis: 'EI', value: 2 },
      { axis: 'EI', value: 2 },
    ]
    const { axes } = scoreAxes(responses, DICHO_AXES)

    expect(axes.EI.pole).toBe('E')
    expect(axes.EI.lean).toBe(1)
    expect(axes.EI.confidence).toBe(100)
    expect(axes.EI.borderline).toBe(false)
    expect(axes.EI.consistency).toBe(100)
  })

  test('a dead-even axis is reported as borderline with honest low confidence (no floor)', () => {
    const responses: AxisResponse[] = [
      { axis: 'TF', value: 2 },
      { axis: 'TF', value: -2 },
    ]
    const { axes } = scoreAxes(responses, DICHO_AXES)

    expect(axes.TF.lean).toBe(0)
    expect(axes.TF.confidence).toBe(0)
    expect(axes.TF.borderline).toBe(true)
    // exactly-even resolves deterministically to poles[0], never to a noise tie-break
    expect(axes.TF.pole).toBe('T')
  })

  test('confidence tracks the true magnitude with no artificial floor', () => {
    // one mild lean on a single item → lean 0.5 → confidence 50 (the old engine floored at 55)
    const { axes } = scoreAxes([{ axis: 'SN', value: 1 }], DICHO_AXES)

    expect(axes.SN.confidence).toBe(50)
  })

  test('a barely-there lean is flagged borderline', () => {
    const { axes } = scoreAxes([{ axis: 'JP', value: 0.2 }], DICHO_AXES)

    expect(axes.JP.lean).toBeCloseTo(0.1, 5)
    expect(axes.JP.borderline).toBe(true)
  })

  test('consistency is the share of items agreeing with the resolved pole', () => {
    const responses: AxisResponse[] = [
      { axis: 'EI', value: 2 },
      { axis: 'EI', value: 2 },
      { axis: 'EI', value: -2 },
    ]
    const { axes } = scoreAxes(responses, DICHO_AXES)

    expect(axes.EI.pole).toBe('E')
    expect(axes.EI.consistency).toBe(67)
  })

  test('an unanswered axis resolves to poles[0] at zero confidence, flagged borderline', () => {
    const { axes } = scoreAxes([], DICHO_AXES)

    expect(axes.EI.pole).toBe('E')
    expect(axes.EI.confidence).toBe(0)
    expect(axes.EI.borderline).toBe(true)
  })
})

describe('scorePersonaWithClaim', () => {
  test('a confirmed claim stands with no mismatch', () => {
    const responses: AxisResponse[] = [
      { axis: 'EI', value: 2 },
      { axis: 'EI', value: 1 },
    ]
    const result = scorePersonaWithClaim('ENTJ', responses)

    expect(result.axes.EI.pole).toBe('E')
    expect(result.axes.EI.mismatch).toBe(false)
    expect(result.mismatches).not.toContain('EI')
  })

  test('two clearly contradicting verification items override the claim → mismatch', () => {
    const responses: AxisResponse[] = [
      { axis: 'EI', value: -2 },
      { axis: 'EI', value: -2 },
    ]
    const result = scorePersonaWithClaim('ENTJ', responses)

    // prior +2 + (-4) = -2 → flips E→I
    expect(result.axes.EI.pole).toBe('I')
    expect(result.axes.EI.claimed).toBe('E')
    expect(result.axes.EI.mismatch).toBe(true)
    expect(result.mismatches).toContain('EI')
  })

  test('a single soft contradiction cannot overturn the claim (prior holds, but borderline)', () => {
    const responses: AxisResponse[] = [
      { axis: 'EI', value: -1 },
      { axis: 'EI', value: -1 },
    ]
    const result = scorePersonaWithClaim('ENTJ', responses)

    // prior +2 + (-2) = 0 → stays E, but split
    expect(result.axes.EI.pole).toBe('E')
    expect(result.axes.EI.mismatch).toBe(false)
    expect(result.axes.EI.borderline).toBe(true)
  })

  test('the prior is keyed to the claimed pole, not always positive', () => {
    // claim I on EI: prior is negative; confirming-I answers keep it I
    const responses: AxisResponse[] = [
      { axis: 'EI', value: -2 },
      { axis: 'EI', value: -2 },
    ]
    const result = scorePersonaWithClaim('INTJ', responses)

    expect(result.axes.EI.pole).toBe('I')
    expect(result.axes.EI.mismatch).toBe(false)
  })
})
