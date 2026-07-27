import { describe, expect, test } from 'bun:test'
import type { AgreementValue, AxisId, GemAxisId, ItemAnswer, TypeAxisId } from '@deep-type/model'
import { AXIS_POLES, TYPE_AXES } from '@deep-type/model'
import { FREE_LIKERT_ITEMS, FREE_WORK_ITEMS, PAID_LIKERT_ITEMS, WORK_ITEMS } from '@deep-type/questionnaire'
import { scoreBaseAssessment, scoreRefinedAssessment } from '@deep-type/scoring'

import { createDeepTypeContent } from './create-content'
import { deepTypeContent as en } from './en'
import { deepTypeContent as ja } from './ja'
import { deepTypeContent as ko } from './ko'
import { koQuestionOptions } from './question-options/ko'
import { koQuestionPrompts } from './question-prompts/ko'
import { deepTypeContent as zh } from './zh'

const contents = { en, ja, ko, zh } as const
const SCORED_IDS = [...FREE_LIKERT_ITEMS, ...PAID_LIKERT_ITEMS].map((item) => item.id)

describe('deep type question catalog', () => {
  test('every locale carries exactly the scored instrument', () => {
    const expected = [...SCORED_IDS].sort().join()
    for (const [locale, content] of Object.entries(contents)) {
      expect(`${locale}:${Object.keys(content.questions).sort().join()}`).toBe(`${locale}:${expected}`)
      expect(Object.keys(content.axes).sort()).toEqual(['EI', 'JP', 'OA', 'RM', 'SN', 'TF', 'UO', 'VH'])
    }
  })

  // The reserve banks stay authored in the locale files; what must not happen is one of them reaching the
  // shipped catalog, because the three non-ko banks hold `TODO <id>` notes for every `-4` item.
  test('no placeholder or blank text reaches the catalog', () => {
    for (const [locale, content] of Object.entries(contents)) {
      for (const [id, question] of Object.entries(content.questions)) {
        const strings = [question.prompt, ...question.options]
        expect(`${locale}/${id}:${strings.some((value) => value.trim().length === 0)}`).toBe(`${locale}/${id}:false`)
        expect(`${locale}/${id}:${strings.some((value) => /\bTODO\b/.test(value))}`).toBe(`${locale}/${id}:false`)
      }
    }
  })

  test('the placeholder gate fires when a selected item is untranslated', () => {
    expect(() =>
      createDeepTypeContent({
        ...ko,
        questionOptions: koQuestionOptions,
        questionPrompts: { ...koQuestionPrompts, [String(SCORED_IDS[0])]: 'TODO inner-ei-1' },
      }),
    ).toThrow(/placeholder/)
  })

  test('selecting an item with no authored text stops the build', () => {
    expect(() =>
      createDeepTypeContent({
        ...ko,
        questionOptions: koQuestionOptions,
        questionPrompts: Object.fromEntries(Object.entries(koQuestionPrompts).filter(([id]) => id !== SCORED_IDS[0])),
      }),
    ).toThrow(/has no prompt/)
  })
})

// §9.1 assertion 8. Reversing an option array during a reanchoring edit flips the sign of every answer to that
// item and no type or runtime check notices, so both halves are pinned: the exact string at each end, and the
// pole that moving from the first option to the last one leans toward. Mutation check: reversing any one of the
// arrays below in `question-options/ko.ts` turns this block red.
//
// Coverage is the 23 items whose ko text is already final — the 17 §9.1 files under 무손질 재사용 plus the 6 this
// pass rewrote. The 16 reanchor items and `refine-inner-ei-1` are deliberately absent: Phase 0 rewrites their
// text, so pinning it now would fail on the very edit the pin exists to police. They are added when Phase 0
// lands, and `POLARITY` is then the whole scored 40.
describe('scored item option polarity', () => {
  const POLARITY = [
    // 무손질 재사용 (§9.1) — the text below must not move at all, in Phase 0 or after.
    {
      axis: 'SN',
      firstOption: '원리와 개념을 먼저 알아야 이해된다',
      id: 'inner-sn-3',
      lastOption: '직접 적용할 수 있는 사례가 있어야 가장 잘 이해된다',
      lastPole: 'S',
    },
    {
      axis: 'SN',
      firstOption: '세부 정보를 모두 확인하기보다 전체 방향을 기준으로 결정한다',
      id: 'refine-inner-sn-2',
      lastOption: '결론을 내리기 전에 구체적인 근거를 빠짐없이 다시 확인한다',
      lastPole: 'S',
    },
    {
      axis: 'TF',
      firstOption: '다른 사람에게 미칠 영향과 무관하게 결정한다',
      id: 'inner-tf-2',
      lastOption: '다른 사람에게 미칠 영향을 중심으로 결정을 조정한다',
      lastPole: 'F',
    },
    {
      axis: 'TF',
      firstOption: '상황과 사람의 맥락에 따라 판단 기준을 유연하게 바꾼다',
      id: 'refine-inner-tf-1',
      lastOption: '누가 어느 입장에 있어도 동일한 기준을 일관되게 적용한다',
      lastPole: 'T',
    },
    {
      axis: 'TF',
      firstOption: '판단이 논리적으로 일관되면 사람마다 느끼는 영향은 별도로 본다',
      id: 'refine-inner-tf-2',
      lastOption: '사람에게 남길 영향을 충분히 반영해야 답이 완성된다',
      lastPole: 'F',
    },
    // `inner-jp-1` carries '자유 시간' in both its stem and two of its options, so §9.1 filing it under
    // 무손질 재사용 is wrong and Phase 0 will reanchor it. Pinned anyway: until that edit happens the text is
    // live, and a failure here at that point is the review prompt, not a false alarm.
    {
      axis: 'JP',
      firstOption: '자유 시간은 아무 계획 없이 흘러갈 때 편하다',
      id: 'inner-jp-1',
      lastOption: '자유 시간도 순서와 시간을 정해 두면 가장 편하다',
      lastPole: 'J',
    },
    {
      axis: 'JP',
      firstOption: '작은 일을 끝내도 머릿속 여유는 크게 달라지지 않는다',
      id: 'refine-inner-jp-3',
      lastOption: '작은 일까지 마감해 두어야 머릿속에 확실한 여유가 생긴다',
      lastPole: 'J',
    },
    {
      axis: 'JP',
      firstOption: '정보가 적어도 일찍 결정을 확정한다',
      id: 'refine-inner-jp-2',
      lastOption: '마지막으로 꼭 필요해지기 전에는 결정을 확정하지 않는다',
      lastPole: 'P',
    },
    {
      axis: 'RM',
      firstOption: '피드백에 따라 내가 한 일의 가치 판단도 크게 달라진다',
      id: 'gem-rm-3',
      lastOption: '외부 평가와 별개로 내 가치 기준을 분명히 지킨다',
      lastPole: 'R',
    },
    {
      axis: 'RM',
      firstOption: '반응이 미지근해도 내 일의 가치는 그대로다',
      id: 'gem-rm-2',
      lastOption: '반응이 미지근하면 결과물과 내 가치까지 의심한다',
      lastPole: 'M',
    },
    {
      axis: 'RM',
      firstOption: '비판을 들으면 내 판단보다 상대의 평가를 우선하게 된다',
      id: 'refine-gem-rm-1',
      lastOption: '비판을 들어도 타당한 근거가 없다면 내 평가 기준을 분명히 지킨다',
      lastPole: 'R',
    },
    {
      axis: 'RM',
      firstOption: '칭찬이 없어도 동기는 거의 그대로 유지된다',
      id: 'refine-gem-rm-2',
      lastOption: '인정과 칭찬이 없으면 하던 일을 이어 갈 힘이 크게 떨어진다',
      lastPole: 'M',
    },
    {
      axis: 'UO',
      firstOption: '새로운 기회를 얻는 것보다 위험을 줄이는 일이 나를 더 강하게 움직인다',
      id: 'gem-uo-1',
      lastOption: '새로운 기회를 얻을 가능성이 가장 강하게 나를 움직인다',
      lastPole: 'U',
    },
    {
      axis: 'UO',
      firstOption: '목표를 세울 때 피해야 할 손실부터 떠올린다',
      id: 'gem-uo-3',
      lastOption: '원하는 성장과 변화의 모습을 먼저 선명하게 그린다',
      lastPole: 'U',
    },
    {
      axis: 'UO',
      firstOption: '안정보다 확장과 새로운 기회를 먼저 택한다',
      id: 'gem-uo-2',
      lastOption: '새로운 기회보다 지금 가진 안정과 기반을 지키는 일을 가장 우선한다',
      lastPole: 'O',
    },
    {
      axis: 'UO',
      firstOption: '결과가 불확실하면 호기심보다 걱정이 앞선다',
      id: 'refine-gem-uo-3',
      lastOption: '결과를 알 수 없을수록 새로운 기회를 탐색하고 싶은 에너지가 커진다',
      lastPole: 'U',
    },
    {
      axis: 'UO',
      firstOption: '새로운 움직임에서 얻을 기회와 이득부터 살핀다',
      id: 'refine-gem-uo-2',
      lastOption: '가능한 손실과 위험을 충분히 줄인 뒤에야 새롭게 움직인다',
      lastPole: 'O',
    },
    // 전면 재작성 — authored in this pass, final.
    {
      axis: 'RM',
      firstOption: '지지하는 사람이 없으면 내 판단이 맞다는 느낌이 사라진다',
      id: 'gem-rm-1',
      lastOption: '지지가 없어도 내 판단에 대한 확신은 달라지지 않는다',
      lastPole: 'R',
    },
    {
      axis: 'OA',
      firstOption: '내 몫이면 조율 없이 정하고 결과만 전한다',
      id: 'gem-oa-1',
      lastOption: '맞물린 사람 전부와 방향이 맞아야 움직인다',
      lastPole: 'O',
    },
    {
      axis: 'OA',
      firstOption: '그 주에는 다른 사람 일정에 내 시간을 전부 밀어 넣었다',
      id: 'gem-oa-2',
      lastOption: '그 주에도 내가 짠 시간표를 그대로 지켰다',
      lastPole: 'A',
    },
    {
      axis: 'OA',
      firstOption: '다 끝난 뒤에 결과만 한 번 공유한다',
      id: 'gem-oa-3',
      lastOption: '작은 진척까지 그때그때 공유해 두어야 편하다',
      lastPole: 'O',
    },
    {
      axis: 'OA',
      firstOption: '내 선에서 끝내고 나중에 알려도 된다고 본다',
      id: 'refine-gem-oa-1',
      lastOption: '일이 걸린 사람 전부와 이야기가 끝나야 확정한다',
      lastPole: 'O',
    },
    {
      axis: 'OA',
      firstOption: '묻기 전에 먼저 진행 상황을 알린다',
      id: 'refine-gem-oa-2',
      lastOption: '결과가 나올 때까지는 따로 알리지 않는다',
      lastPole: 'A',
    },
  ] as const satisfies readonly {
    axis: AxisId
    firstOption: string
    id: string
    lastOption: string
    lastPole: string
  }[]

  const freeWork = FREE_WORK_ITEMS.map((item) => ({ itemId: item.id, optionIndex: 0 as const }))
  const paidWork = WORK_ITEMS.map((item) => ({ itemId: item.id, optionIndex: 0 as const }))

  function answers(items: readonly { id: string }[], target: string, value: AgreementValue): ItemAnswer[] {
    return items.map((item) => ({ itemId: item.id, value: item.id === target ? value : 2 }))
  }

  function axisScore(id: string, value: AgreementValue, axis: AxisId): number {
    const profile = id.startsWith('refine-')
      ? scoreRefinedAssessment(answers(FREE_LIKERT_ITEMS, '', 2), answers(PAID_LIKERT_ITEMS, id, value), paidWork, null)
      : scoreBaseAssessment(answers(FREE_LIKERT_ITEMS, id, value), freeWork, null)
    return (TYPE_AXES as readonly AxisId[]).includes(axis)
      ? profile.inner.axes[axis as TypeAxisId].score
      : profile.gem.axes[axis as GemAxisId].score
  }

  test('pins every scored item whose text is final, and nothing that Phase 0 will move', () => {
    const pinned = POLARITY.map((item) => item.id)
    expect(pinned.length).toBe(23)
    expect(new Set(pinned).size).toBe(23)
    expect(pinned.filter((id) => !SCORED_IDS.includes(id))).toEqual([])
  })

  for (const item of POLARITY) {
    test(`${item.id} runs from '${item.lastPole}'-opposite to ${item.lastPole}`, () => {
      const question = ko.questions[item.id]
      expect(question?.options[0]).toBe(item.firstOption)
      expect(question?.options[3]).toBe(item.lastOption)

      const [first, second] = AXIS_POLES[item.axis]
      const travel = axisScore(item.id, 4, item.axis) - axisScore(item.id, 1, item.axis)
      // Six points: the last option contributes +3 to a forward item and -3 to a reverse one, the first option
      // the opposite. Sign, not magnitude, is what names the pole.
      expect(Math.abs(travel)).toBe(6)
      expect(travel > 0 ? first : second).toBe(item.lastPole)
    })
  }
})
