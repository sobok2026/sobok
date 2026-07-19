import { describe, expect, test } from 'bun:test'

import { deepTypeContent as ko } from '../_content/ko'
import { GEM_ITEMS } from './gem'
import { INNER_ITEMS } from './inner'
import { PERSONA_MEASURE_ITEMS, PERSONA_VERIFY_ITEMS } from './persona'
import type { AxisId, ChoiceItem, Item, ItemContent } from './types'
import { DICHO_AXES, GEM_AXES } from './types'

type Bank = {
  axes: readonly { id: AxisId }[]
  content: Record<string, ItemContent>
  items: readonly Item[]
  name: string
  perAxis: number
}

const BANKS: Bank[] = [
  { axes: DICHO_AXES, content: ko.personaQuestions, items: PERSONA_MEASURE_ITEMS, name: 'persona-measure', perAxis: 5 },
  { axes: DICHO_AXES, content: ko.personaQuestions, items: PERSONA_VERIFY_ITEMS, name: 'persona-verify', perAxis: 2 },
  { axes: DICHO_AXES, content: ko.innerQuestions, items: INNER_ITEMS, name: 'inner', perAxis: 5 },
  { axes: GEM_AXES, content: ko.gemQuestions, items: GEM_ITEMS, name: 'gem', perAxis: 5 },
]

const isChoice = (item: Item): item is ChoiceItem => item.kind === 'choice'
const strongestOption = (options: readonly number[]) => options.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a))

for (const bank of BANKS) {
  describe(`${bank.name} bank`, () => {
    test(`holds exactly ${bank.perAxis} items per axis`, () => {
      for (const axis of bank.axes) {
        const count = bank.items.filter((item) => item.axis === axis.id).length

        expect(count).toBe(bank.perAxis)
      }
      expect(bank.items).toHaveLength(bank.perAxis * bank.axes.length)
    })

    test('every item id encodes its own axis', () => {
      for (const item of bank.items) {
        expect(item.id.split('-')[1]).toBe(item.axis)
      }
    })

    test('choice option values are integers in [-2, 2] with 2–4 options', () => {
      for (const item of bank.items) {
        if (!isChoice(item)) {
          continue
        }
        expect(item.options.length).toBeGreaterThanOrEqual(2)
        expect(item.options.length).toBeLessThanOrEqual(4)
        for (const value of item.options) {
          expect(Number.isInteger(value)).toBe(true)
          expect(Math.abs(value)).toBeLessThanOrEqual(2)
        }
      }
    })

    // Acquiescence / position-bias control: within an axis, the strong answers must not all favor the same
    // pole, and "always pick the first option" must net to ~0 rather than drifting toward one pole.
    test('keying is balanced within every axis', () => {
      for (const axis of bank.axes) {
        const choiceItems = bank.items.filter((item): item is ChoiceItem => item.axis === axis.id && isChoice(item))
        const strongSigns = new Set(choiceItems.map((item) => Math.sign(strongestOption(item.options))))
        const firstOptionSum = choiceItems.reduce((sum, item) => sum + item.options[0], 0)

        expect(strongSigns.has(1)).toBe(true)
        expect(strongSigns.has(-1)).toBe(true)
        expect(Math.abs(firstOptionSum)).toBeLessThanOrEqual(2)
      }
    })

    test('every item has content matching its shape', () => {
      for (const item of bank.items) {
        const itemContent = bank.content[item.id]

        expect(itemContent).toBeDefined()
        expect(itemContent.text.trim().length).toBeGreaterThan(0)

        if (isChoice(item)) {
          expect('options' in itemContent).toBe(true)
          if ('options' in itemContent) {
            expect(itemContent.options).toHaveLength(item.options.length)
            for (const option of itemContent.options) {
              expect(option.trim().length).toBeGreaterThan(0)
            }
          }
        } else {
          expect('lo' in itemContent && 'hi' in itemContent).toBe(true)
          if ('lo' in itemContent) {
            expect(itemContent.lo.trim().length).toBeGreaterThan(0)
            expect(itemContent.hi.trim().length).toBeGreaterThan(0)
          }
        }
      }
    })
  })
}

describe('persona verify subset', () => {
  test('every verify item is drawn from the full measure bank', () => {
    const measureIds = new Set(PERSONA_MEASURE_ITEMS.map((item) => item.id))

    for (const item of PERSONA_VERIFY_ITEMS) {
      expect(measureIds.has(item.id)).toBe(true)
    }
  })
})
