import { describe, expect, test } from 'bun:test'

import { deepTypeContent } from '../src/app/[locale]/deep-type/_content/ko'
import { AXIS_POLES, PERSONA_CODES, TYPE_AXES } from './model'
import { SELF_IMAGE_AXES, type SelfImagePick, selfImageCode } from './self-image'

/**
 * The self-image branch is a positional contract in three places at once — the axis order here, the option order
 * in `AXIS_POLES`, and the question order in the locale file. None of the three carries an identifier, so a
 * reorder in any one of them silently re-keys the other two and produces a code that reads perfectly plausible
 * and describes someone else.
 */
describe('self-image code', () => {
  test('follows the type axes in order', () => {
    expect(SELF_IMAGE_AXES).toEqual(TYPE_AXES)
  })

  test('takes each pick as an index into that axis pole pair', () => {
    expect(selfImageCode([0, 0, 0, 0])).toBe('ESTJ')
    expect(selfImageCode([1, 1, 1, 1])).toBe('INFP')
    expect(selfImageCode([0, 1, 0, 1])).toBe('ENTP')
  })

  // Sixteen picks, sixteen codes, and every one of them a code the instrument already knows. A mapping that
  // drifted would still return four letters — this is what makes the drift visible.
  test('reaches every persona code exactly once', () => {
    const codes = new Set<string>()
    for (let mask = 0; mask < 16; mask++) {
      const picks = [0, 1, 2, 3].map((bit) => ((mask >> bit) & 1) as SelfImagePick)
      codes.add(selfImageCode(picks))
    }

    expect(codes.size).toBe(16)
    expect([...codes].sort()).toEqual([...PERSONA_CODES].sort())
  })

  test('refuses a run that did not answer every axis', () => {
    expect(() => selfImageCode([0, 1, 0])).toThrow()
    expect(() => selfImageCode([0, 1, 0, 1, 0])).toThrow()
  })
})

describe('self-image ko content', () => {
  const content = deepTypeContent.selfImage

  test('asks one question per axis with one option per pole', () => {
    expect(content.items.length).toBe(SELF_IMAGE_AXES.length)
    for (const [index, item] of content.items.entries()) {
      expect(`${index}:${item.options.length}`).toBe(`${index}:${AXIS_POLES[SELF_IMAGE_AXES[index]].length}`)
      expect(`${index}:${item.prompt.trim().length > 0}`).toBe(`${index}:true`)
      expect(`${index}:${item.options.filter((option) => option.trim().length > 0).length}`).toBe(`${index}:2`)
    }
  })

  /**
   * The line that keeps this branch legitimate. These four ask what the reader believes about themselves; the 27
   * scored items ask what they did. Let a scene or a time window in here and the report stops comparing a
   * self-image to a measurement and starts comparing our measurement to itself, which is the persona layer D13
   * removed. The vocabulary below is what the scored items open with, so its absence is the cheap proxy.
   */
  test('asks about self-image and never about a remembered episode', () => {
    const behavioural = /최근|지난|실제로 (한|했|가장)|었을 때|번 이상|이번 주|어제/
    for (const item of content.items) {
      const text = [item.prompt, ...item.options].join(' ')
      expect(`${item.prompt.slice(0, 12)}: ${behavioural.test(text)}`).toBe(`${item.prompt.slice(0, 12)}: false`)
      expect(item.prompt).toContain('생각해요')
    }
  })
})
