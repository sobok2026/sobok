import { describe, expect, test } from 'bun:test'
import { AXES, type AxisId } from '@deep-type/model'
import { FREE_LIKERT_ITEMS, PAID_LIKERT_ITEMS } from '@deep-type/questionnaire'

import type { QuestionOptionCatalog, QuestionPromptCatalog } from '../_lib/types'
import { koQuestionOptions } from './question-options/ko'
import { koQuestionPrompts } from './question-prompts/ko'

const PROMPTS: QuestionPromptCatalog = koQuestionPrompts
const OPTIONS: QuestionOptionCatalog = koQuestionOptions

// Risk 40: each axis's reverse-keyed stock tends to restate the same construct, which inflates internal
// consistency and makes a band read sharper than the evidence supports. §9.1 fixes the measure — ko stem plus
// all four options, whitespace stripped, character 4-grams as a set, Jaccard — and the target ceiling at 0.10.
// A stem-only 8-gram gate was tried first and caught nothing.
const CEILING = 0.1

// Two pairs still sit over the ceiling and cannot be brought under it by reselecting: the free three per axis
// are forced (the `-4` ids are unauthored in three locales), and both admissible paid pairs for VH contain
// `refine-gem-vh-2`, so `gem-vh-2`·`refine-gem-vh-2` survives every combination. VH therefore belongs on the
// §9.1 rewrite list, not the reanchor list. Each entry is a ceiling, not a pin: a rewrite that lowers the
// number passes, a text edit that raises it fails, and removing the pair from this table is the goal.
//
// The best VH selection swaps `refine-gem-vh-1` for `-3` and takes the axis maximum from 0.1543 to 0.1092. It is
// not applied here because it moves which items Phase 0 has to reanchor, which is §9.1's call to make.
const EXEMPT: Record<string, number> = {
  'gem-vh-1|refine-gem-vh-1': 0.1543,
  'gem-vh-2|refine-gem-vh-2': 0.1092,
}

// The raw ko catalogs rather than the projected content, so a reserve item stays measurable: the reselection
// below has to be able to score the item it replaced, which `createDeepTypeContent` no longer projects.
function normalize(id: string): string {
  const prompt = PROMPTS[id]
  const options = OPTIONS[id]
  if (!prompt || !options) {
    throw new Error(`no ko text for ${id}`)
  }
  return [prompt, ...options].join('').replace(/\s+/g, '')
}

function grams(text: string): Set<string> {
  const out = new Set<string>()
  for (let index = 0; index + 4 <= text.length; index++) {
    out.add(text.slice(index, index + 4))
  }
  return out
}

const GRAMS = new Map<string, Set<string>>()
function gramsOf(id: string): Set<string> {
  let cached = GRAMS.get(id)
  if (!cached) {
    cached = grams(normalize(id))
    GRAMS.set(id, cached)
  }
  return cached
}

function jaccard(left: string, right: string): number {
  const a = gramsOf(left)
  const b = gramsOf(right)
  let shared = 0
  for (const gram of a) {
    if (b.has(gram)) {
      shared += 1
    }
  }
  const union = a.size + b.size - shared
  return union === 0 ? 0 : shared / union
}

function axisPairs(axis: AxisId): readonly [string, string][] {
  const ids = [...FREE_LIKERT_ITEMS, ...PAID_LIKERT_ITEMS].filter((item) => item.axis === axis).map((item) => item.id)
  const pairs: [string, string][] = []
  for (let left = 0; left < ids.length; left++) {
    for (let right = left + 1; right < ids.length; right++) {
      pairs.push([ids[left] as string, ids[right] as string])
    }
  }
  return pairs
}

describe('within-axis item similarity', () => {
  for (const axis of AXES) {
    test(`${axis} keeps every pair at or under its allowed ceiling`, () => {
      for (const [left, right] of axisPairs(axis)) {
        const allowed = EXEMPT[`${left}|${right}`] ?? CEILING
        expect(`${left}|${right}:${jaccard(left, right) <= allowed}`).toBe(`${left}|${right}:true`)
      }
    })
  }

  // The exemption table is a debt list, so it has to shrink rather than drift. A pair that no longer exceeds the
  // ceiling — or no longer exists, once a selection or a rewrite lands — must be deleted from it here.
  test('lists no exemption that the ceiling would already accept', () => {
    const live = new Set(AXES.flatMap((axis) => axisPairs(axis).map(([left, right]) => `${left}|${right}`)))
    for (const [key, allowed] of Object.entries(EXEMPT)) {
      expect(`${key}:selected=${live.has(key)}`).toBe(`${key}:selected=true`)
      const [left, right] = key.split('|') as [string, string]
      expect(`${key}:${jaccard(left, right) > CEILING}`).toBe(`${key}:true`)
      expect(allowed).toBeGreaterThan(CEILING)
    }
  })

  // `gem-uo-3`·`refine-gem-uo-1` measured 0.1718, the worst pair in the instrument, because `-1` restates the
  // free item nearly word for word. The paid draw moved to `refine-gem-uo-3`; this records what that bought and
  // fails if the selection drifts back.
  test('records the UO reselection', () => {
    expect(jaccard('gem-uo-3', 'refine-gem-uo-1')).toBeCloseTo(0.1718, 4)
    expect(jaccard('gem-uo-3', 'refine-gem-uo-3')).toBeLessThan(CEILING)
    const selected = [...FREE_LIKERT_ITEMS, ...PAID_LIKERT_ITEMS].map((item) => item.id)
    expect(selected).toContain('refine-gem-uo-3')
    expect(selected).not.toContain('refine-gem-uo-1')
  })
})
