import { describe, expect, test } from 'bun:test'
import type { WorkFacetId } from '@deep-type/model'
import { FREE_WORK_ITEMS, WORK_ITEMS } from '@deep-type/questionnaire'

import type { QuestionOptionCatalog, QuestionPromptCatalog } from '../_lib/types'
import { koFreeQuestionOptions } from './question-options/ko.free'
import { koPaidQuestionOptions } from './question-options/ko.paid'
import { koFreeQuestionPrompts } from './question-prompts/ko.free'
import { koPaidQuestionPrompts } from './question-prompts/ko.paid'

// The two tiers ship as separate modules so paid text stays out of the free static export. Alignment is a
// property of the whole forced-choice block, so they are rejoined here exactly as `question-similarity.test.ts`
// rejoins them for the Likert block.
const PROMPTS: QuestionPromptCatalog = { ...koFreeQuestionPrompts, ...koPaidQuestionPrompts }
const OPTIONS: QuestionOptionCatalog = { ...koFreeQuestionOptions, ...koPaidQuestionOptions }

/**
 * The forced-choice counterpart of `content.test.ts`'s option-polarity pins, and it exists for the same reason.
 * A `WorkItem`'s `facets` array is positional — option i credits `facets[i]` — so the ko text and the facet
 * vector are one contract held in two files. Reordering the four strings during a copy edit re-keys every
 * answer to that item, and nothing else in the tree notices: the option count is still four, the facets are
 * still four distinct ids of the right dimension, and every exposure count in `questionnaire.test.ts` is
 * untouched. That is the same class of defect as a flipped `reverse` flag.
 *
 * Each entry pins the facet at a position together with a fragment that must appear in that position's ko
 * option and in none of its three siblings. A fragment rather than the whole string: the guard has to fail on a
 * reorder and stay quiet on a wording pass, and a full-text pin fails on both. The uniqueness half is what makes
 * a swap detectable — without it a fragment common to two options would still be found after they traded places.
 *
 * `facets` is the frozen side of the contract. It was fixed by the equal-exposure arithmetic in
 * `questionnaire.ts`; when this test fails the text moved, not the vector.
 */
const OPTION_PINS = {
  B01: [
    ['MAKE', '손봤다'],
    ['ANALYZE', '자료를 찾아봤다'],
    ['CREATE', '그림으로'],
    ['HELP', '연락했다'],
  ],
  B02: [
    ['LEAD', '사람을 모으고'],
    ['ORDER', '표로'],
    ['MAKE', '도구'],
    ['HELP', '막힌 사람'],
  ],
  B03: [
    ['ANALYZE', '파고든다'],
    ['CREATE', '영상으로'],
    ['LEAD', '작은 계획'],
    ['ORDER', '찾기 쉽게'],
  ],
  B04: [
    ['MAKE', '풀렸다고'],
    ['ANALYZE', '복잡한 이유'],
    ['HELP', '편해졌다고'],
    ['ORDER', '빠진 것 없이'],
  ],
  B05: [
    ['CREATE', '새로운 모습'],
    ['HELP', '고민'],
    ['LEAD', '목표를 정하고'],
    ['ANALYZE', '자료를 비교'],
  ],
  B06: [
    ['MAKE', '고친 과정'],
    ['CREATE', '내가 쓴 글'],
    ['LEAD', '계획과 제안'],
    ['ORDER', '순서표'],
  ],
  B07: [
    ['AUT', '내가 고를 수 있었다'],
    ['MASTER', '어제보다'],
    ['IMPACT', '쓰는 사람의 반응'],
    ['BELONG', '주고받았다'],
  ],
  B08: [
    ['STABLE', '일정부터'],
    ['NOVEL', '전과 다른 역할'],
    ['AUT', '정해도 되는 범위'],
    ['MASTER', '배울 자료'],
  ],
  B09: [
    ['BELONG', '함께해 주었다'],
    ['IMPACT', '실제로 쓰였다'],
    ['STABLE', '생활 흐름'],
    ['NOVEL', '새 방법'],
  ],
  B10: [
    ['AUT', '내 방식과 순서'],
    ['MASTER', '배우며 나아질'],
    ['IMPACT', '도움이 됐는지'],
    ['BELONG', '오래 맞춰 갈'],
  ],
  B11: [
    ['BREAK', '집중이 자주 끊겼다'],
    ['VAGUE', '자주 바뀌었다'],
    ['OVERLOAD', '쓸 수 있는 시간'],
    ['TENSION', '기대에 계속 맞췄다'],
  ],
  B12: [
    ['EMPTY', '왜 하는지 모른 채'],
    ['STUCK', '새로 배울 것'],
    ['BREAK', '옮겨 갔다'],
    ['VAGUE', '다르게 들렸다'],
  ],
  B13: [
    ['OVERLOAD', '먼저 할 것을'],
    ['TENSION', '편하게 말할'],
    ['EMPTY', '어디에 쓰이는지'],
    ['STUCK', '시험해 볼 수'],
  ],
  B14: [
    ['BREAK', '알림 없이'],
    ['VAGUE', '적어 달라고'],
    ['OVERLOAD', '날짜를 다시'],
    ['TENSION', '걸리는 이야기'],
  ],
  B15: [
    ['EMPTY', '끝까지 몰랐다'],
    ['STUCK', '되풀이하며'],
    ['BREAK', '몰입하지 못했다'],
    ['OVERLOAD', '떠안았다'],
  ],
  B16: [
    ['SOLVE', '다시 움직이게 했다'],
    ['UNDERSTAND', '이해시켰다'],
    ['EXPRESS', '눈에 보이는 결과'],
    ['CARE', '해 볼 수 있게 도왔다'],
  ],
  B17: [
    ['MOVE', '다음으로 움직일'],
    ['STEADY', '이어지게 해서'],
    ['SOLVE', '써 볼 방법'],
    ['CARE', '혼자라고'],
  ],
  B18: [
    ['UNDERSTAND', '하나로 이어졌다'],
    ['EXPRESS', '완성됐다'],
    ['MOVE', '앞으로 갔다'],
    ['STEADY', '안정된 순서'],
  ],
  B20: [
    ['FOCUS_ENV', '오래 머물'],
    ['TOGETHER_ENV', '말을 주고받을'],
    ['FREEDOM_ENV', '내 손으로'],
    ['CLEAR_ENV', '기준이 분명했다'],
  ],
  B21: [
    ['VARIETY_ENV', '적당히 섞였다'],
    ['VISIBLE_ENV', '반응을 바로 볼'],
    ['FOCUS_ENV', '다른 연락 없이'],
    ['TOGETHER_ENV', '물어볼 사람'],
  ],
  B22: [
    ['FREEDOM_ENV', '내 방식에 맞게'],
    ['CLEAR_ENV', '기준을 적어 봤다'],
    ['VARIETY_ENV', '새 역할이나'],
    ['VISIBLE_ENV', '먼저 반응을 물었다'],
  ],
  B25: [
    ['VAGUE', '기준부터'],
    ['EMPTY', '누가 쓰는지'],
    ['TENSION', '불편한 말'],
    ['STUCK', '바꿀 여지'],
  ],
  B26: [
    ['STABLE', '맡을 범위가'],
    ['NOVEL', '넣어 볼 수 있다'],
    ['AUT', '선이 넓다'],
    ['IMPACT', '어디까지 이어졌는지'],
  ],
  B27: [
    ['MASTER', '실력이 붙었다고'],
    ['BELONG', '말이 잘 통할'],
    ['STABLE', '한동안 그대로일'],
    ['NOVEL', '새로 시도할'],
  ],
} as const satisfies Record<string, readonly [readonly [WorkFacetId, string], ...(readonly [WorkFacetId, string])[]]>

describe('forced-choice ko catalog', () => {
  test('carries a ko stem and four options for every scored work item', () => {
    for (const item of WORK_ITEMS) {
      const prompt = PROMPTS[item.id] ?? ''
      const options = OPTIONS[item.id] ?? []
      expect(`${item.id}:${prompt.trim().length > 0}`).toBe(`${item.id}:true`)
      expect(`${item.id}:${options.length}`).toBe(`${item.id}:4`)
      expect(`${item.id}:${options.filter((option) => option.trim().length > 0).length}`).toBe(`${item.id}:4`)
    }
  })

  // The free run ends on these three and they are the only input to `drainSignature`, so a blank one is not a
  // missing translation but a free product that renders four empty buttons.
  test('leaves nothing blank on the three items the free deliverable reads', () => {
    expect(FREE_WORK_ITEMS.map((item) => item.id)).toEqual(['B11', 'B12', 'B13'])
    for (const item of FREE_WORK_ITEMS) {
      expect([PROMPTS[item.id], ...(OPTIONS[item.id] ?? [])].filter((text) => !text?.trim())).toEqual([])
    }
  })

  // Four positions that score differently must read differently, or one of them is a dead rung.
  test('gives every item four distinct options', () => {
    for (const item of WORK_ITEMS) {
      const distinct = new Set((OPTIONS[item.id] ?? []).map((option) => option.trim())).size
      expect(`${item.id}:${distinct}`).toBe(`${item.id}:4`)
    }
  })

  test('scores exactly as many options as the catalog offers', () => {
    for (const item of WORK_ITEMS) {
      expect(`${item.id}:${item.facets.length}`).toBe(`${item.id}:${(OPTIONS[item.id] ?? []).length}`)
    }
  })
})

describe('forced-choice option alignment', () => {
  const PINNED = OPTION_PINS as Record<string, readonly (readonly [WorkFacetId, string])[]>

  test('pins every scored work item, with nothing unpinned and nothing pinned twice', () => {
    const ids = WORK_ITEMS.map((item) => item.id)
    expect(ids.length).toBe(24)
    expect(new Set(ids).size).toBe(24)
    expect(Object.keys(PINNED).sort()).toEqual([...ids].sort())
  })

  for (const item of WORK_ITEMS) {
    test(`${item.id} holds its ko text against its facet vector`, () => {
      const pins = PINNED[item.id] ?? []
      const options = OPTIONS[item.id] ?? []
      expect(`${item.id}:${pins.length}`).toBe(`${item.id}:4`)

      for (const [index, pin] of pins.entries()) {
        const [facet, fragment] = pin
        expect(`${item.id}[${index}]:${item.facets[index]}`).toBe(`${item.id}[${index}]:${facet}`)

        // The fragment identifies one option and only one, so trading two options fails here even when both
        // still contain vocabulary the other pin would have accepted.
        const carriers = options.flatMap((option, at) => (option.includes(fragment) ? [at] : []))
        expect(`${item.id}[${index}] '${fragment}' in ${JSON.stringify(carriers)}`).toBe(
          `${item.id}[${index}] '${fragment}' in [${index}]`,
        )
      }
    })
  }
})
