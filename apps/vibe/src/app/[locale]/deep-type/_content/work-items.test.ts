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
    ['MAKE', '직접 손봤'],
    ['ANALYZE', '자료를 찾아봤'],
    ['CREATE', '그림으로'],
    ['HELP', '먼저 연락했'],
  ],
  B02: [
    ['LEAD', '사람을 모아'],
    ['ORDER', '한눈에 보이도록'],
    ['MAKE', '도구'],
    ['HELP', '막힌 사람'],
  ],
  B03: [
    ['ANALYZE', '파고들어'],
    ['CREATE', '영상으로'],
    ['LEAD', '작은 계획'],
    ['ORDER', '찾기 쉽게'],
  ],
  B04: [
    ['MAKE', '풀렸다고'],
    ['ANALYZE', '왜 복잡했는지'],
    ['HELP', '편해졌다고'],
    ['ORDER', '빠짐없이 정리'],
  ],
  B05: [
    ['CREATE', '새로운 형태'],
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
    ['AUT', '스스로 고를'],
    ['MASTER', '어제보다'],
    ['IMPACT', '쓰는 사람의 반응'],
    ['BELONG', '도움을 주고받'],
  ],
  B08: [
    ['STABLE', '생활 일정을'],
    ['NOVEL', '전과 다른 역할'],
    ['AUT', '정해도 되는 범위'],
    ['MASTER', '학습 자료와 피드백'],
  ],
  B09: [
    ['BELONG', '함께해 주었'],
    ['IMPACT', '실제로 쓰였'],
    ['STABLE', '생활 리듬'],
    ['NOVEL', '아직 해 보지 않은'],
  ],
  B10: [
    ['AUT', '내 방식과 작업 순서'],
    ['MASTER', '배우며 성장할'],
    ['IMPACT', '도움이 됐는지'],
    ['BELONG', '오래 호흡을'],
  ],
  B11: [
    ['BREAK', '집중이 자주 끊겼'],
    ['VAGUE', '자주 바뀌었'],
    ['OVERLOAD', '쓸 수 있는 시간'],
    ['TENSION', '기대에 계속 맞췄'],
  ],
  B12: [
    ['EMPTY', '목적을 알지 못한 채'],
    ['STUCK', '새로 배울 것'],
    ['BREAK', '자주 옮겨 가'],
    ['VAGUE', '사람마다 달랐'],
  ],
  B13: [
    ['OVERLOAD', '우선순위를 다시'],
    ['TENSION', '불편한 이야기도'],
    ['EMPTY', '어디에 쓰이는지'],
    ['STUCK', '시험해 볼 수'],
  ],
  B14: [
    ['BREAK', '알림이나 연락 없이'],
    ['VAGUE', '적어 달라고'],
    ['OVERLOAD', '양과 기한을'],
    ['TENSION', '걸리는 이야기'],
  ],
  B15: [
    ['EMPTY', '어디에 쓰였는지'],
    ['STUCK', '되풀이하며'],
    ['BREAK', '몰입하지 못했'],
    ['OVERLOAD', '떠안았'],
  ],
  B16: [
    ['SOLVE', '다시 움직이게'],
    ['UNDERSTAND', '이해할 수 있게 설명'],
    ['EXPRESS', '눈에 보이는 결과'],
    ['CARE', '다시 해 볼 수 있게'],
  ],
  B17: [
    ['MOVE', '다음 단계로 움직일'],
    ['STEADY', '마지막까지 빠짐없이'],
    ['SOLVE', '바로 적용할 방법'],
    ['CARE', '혼자라고'],
  ],
  B18: [
    ['UNDERSTAND', '하나로 연결됐'],
    ['EXPRESS', '글이나 화면으로'],
    ['MOVE', '실제로 나아갔'],
    ['STEADY', '안정된 순서'],
  ],
  B20: [
    ['FOCUS_ENV', '오래 몰입할'],
    ['TOGETHER_ENV', '말을 주고받을'],
    ['FREEDOM_ENV', '내 손으로'],
    ['CLEAR_ENV', '기준이 분명했'],
  ],
  B21: [
    ['VARIETY_ENV', '적당히 섞여'],
    ['VISIBLE_ENV', '반응을 바로 볼'],
    ['FOCUS_ENV', '방해받지 않고'],
    ['TOGETHER_ENV', '물어볼 사람'],
  ],
  B22: [
    ['FREEDOM_ENV', '내 방식에 맞게'],
    ['CLEAR_ENV', '기준을 적어 봤'],
    ['VARIETY_ENV', '새로운 역할이나'],
    ['VISIBLE_ENV', '먼저 의견을 물었'],
  ],
  B25: [
    ['VAGUE', '기준부터'],
    ['EMPTY', '누가 쓰는지'],
    ['TENSION', '불편한 이야기를'],
    ['STUCK', '바꿀 여지'],
  ],
  B26: [
    ['STABLE', '예고 없이'],
    ['NOVEL', '새로운 방법을 중간에'],
    ['AUT', '결정할 수 있는 범위'],
    ['IMPACT', '어떻게 이어졌는지'],
  ],
  B27: [
    ['MASTER', '실력이 늘었다고'],
    ['BELONG', '말이 잘 통할'],
    ['STABLE', '한동안 안정적으로'],
    ['NOVEL', '새롭게 시도할'],
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
