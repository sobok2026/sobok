import { describe, expect, test } from 'bun:test'
import type { AgreementValue, AxisId, GemAxisId, ItemAnswer, TypeAxisId } from '@deep-type/model'
import { AXIS_POLES, TYPE_AXES } from '@deep-type/model'
import { FREE_LIKERT_ITEMS, FREE_WORK_ITEMS, PAID_LIKERT_ITEMS, WORK_ITEMS } from '@deep-type/questionnaire'
import { scoreBaseAssessment, scoreRefinedAssessment } from '@deep-type/scoring'

import { createDeepTypeContent, createPaidQuestions } from './create-content'
import { deepTypeContent as ko } from './ko'
import { koFreeQuestionOptions } from './question-options/ko.free'
import { koPaidQuestionOptions } from './question-options/ko.paid'
import { koFreeQuestionPrompts } from './question-prompts/ko.free'
import { koPaidQuestionPrompts } from './question-prompts/ko.paid'

const SCORED_IDS = [...FREE_LIKERT_ITEMS, ...PAID_LIKERT_ITEMS].map((item) => item.id)
const FREE_IDS = [...FREE_LIKERT_ITEMS, ...FREE_WORK_ITEMS].map((item) => item.id)

// The two tiers ship as separate modules so paid text stays out of the free static export, so a test that wants
// to read the whole scored instrument has to put them back together itself.
const koPaidQuestions = createPaidQuestions(koPaidQuestionPrompts, koPaidQuestionOptions)
const koQuestions = { ...ko.questions, ...koPaidQuestions }

// Everything below reads ko only. ko is the canonical locale; en/ja/zh carry the same forty ids with empty
// strings and are filled by a human before they ship, so asserting anything about their text here would only
// pin the emptiness.
describe('deep type question catalog', () => {
  test('the free bundle carries the free tier and nothing else', () => {
    expect(Object.keys(ko.questions).sort()).toEqual([...FREE_IDS].sort())
    expect(Object.keys(ko.axes).sort()).toEqual(['EI', 'JP', 'OA', 'RM', 'SN', 'TF', 'UO', 'VH'])
  })

  // The gate behind MIGRATION L6. `out/**/*.{html,txt}` is scanned by `scripts/check-paid-bundle.ts` after a
  // build; this is the same claim one step earlier, where it fails in a second instead of after `next build`.
  test('no paid item text is reachable from the free bundle', () => {
    for (const id of Object.keys(koPaidQuestions)) {
      expect(`${id}:${id in ko.questions}`).toBe(`${id}:false`)
    }
  })

  test('selecting an item the catalog does not carry stops the build', () => {
    expect(() =>
      createDeepTypeContent({
        ...ko,
        questionOptions: koFreeQuestionOptions,
        questionPrompts: Object.fromEntries(Object.entries(koFreeQuestionPrompts).filter(([id]) => id !== FREE_IDS[0])),
      }),
    ).toThrow(/has no prompt/)
  })

  // Likert only. The four options are one ordinal ladder, so a repeat is a dead rung: two positions that score
  // differently while reading identically. Forced-choice work items are a different shape and are not authored
  // yet, so pinning them here would only pin the emptiness.
  test('gives every ko Likert item four distinct options', () => {
    for (const id of SCORED_IDS) {
      const question = koQuestions[id]
      const distinct = new Set((question?.options ?? []).map((option) => option.trim())).size
      expect(`${id}:${distinct}`).toBe(`${id}:4`)
    }
  })
})

// §9.1 assertion 8. Reversing an option array during a content edit flips the sign of every answer to that
// item and no type or runtime check notices, so the whole ko text of the scored 40 is pinned here: the stem
// and all four options in order, plus the pole that moving from the first option to the last one leans toward.
//
// All four options are pinned, not just the two ends. `AGREEMENT_SCORE` maps the four positions to -3/-1/+1/+3,
// so swapping options 2 and 3 alone flips the sign of every mid-scale answer and moves the item by ±2 points
// while leaving both endpoints untouched. A free axis spans ±9, so that is enough to flip a close axis.
//
// The stem is pinned for the mirrored reason: it carries the scene the options answer, so restoring a
// pre-reanchoring stem changes what the item measures without touching a single option.
//
// `lastPole` is read off the option text by hand and is never derived from the item's `reverse` flag. A wrong
// flag is precisely what this block exists to catch, so deriving the expectation from the flag would make the
// check vacuous — the test would agree with the bug.
//
// Entries are grouped by axis because that is the only grouping a test enforces (see 'every axis carries five
// pinned items'). Phase 0's 무손질 / 재앵커 / 전면 재작성 split is history, not structure — it lives in
// MIGRATION.md §9.1 and nothing here reads it.
describe('scored item option polarity', () => {
  const POLARITY = [
    // EI
    {
      axis: 'EI',
      id: 'inner-ei-1',
      lastPole: 'E',
      options: [
        '생각을 밖으로 꺼내고 싶은 마음이 거의 없다',
        '정리가 끝난 뒤에야 가끔 말로 꺼낸다',
        '떠오르면 같이 일하는 사람에게 말하고 싶어진다',
        '떠오르는 즉시 말로 꺼내야 개운하다',
      ],
      prompt: '일하다 생각이 하나 떠오르면 그다음에 어떻게 하나요?',
    },
    {
      axis: 'EI',
      id: 'inner-ei-2',
      lastPole: 'I',
      options: [
        '누군가와 연결되어야 에너지가 돌아온다',
        '너무 오래 혼자 있으면 오히려 지친다',
        '혼자 있는 시간이 어느 정도 필요하다',
        '충분히 혼자 있어야 제대로 회복된다',
      ],
      prompt: '지쳤을 때 에너지를 회복하려면 무엇이 가장 필요한가요?',
    },
    {
      axis: 'EI',
      id: 'inner-ei-3',
      lastPole: 'E',
      options: [
        '누구와도 연결되지 않고 혼자일 때 가장 활력이 난다',
        '누군가와 연결돼도 에너지는 크게 달라지지 않는다',
        '가벼운 연락이나 자리가 있으면 기운이 난다',
        '누군가와 연결될 때 확실히 에너지가 올라간다',
      ],
      prompt: '다른 사람과 연결될 때와 혼자일 때 중 언제 에너지가 오르나요?',
    },
    {
      axis: 'EI',
      id: 'refine-inner-ei-1',
      lastPole: 'I',
      options: [
        '만나는 일정이 촘촘할수록 하루가 잘 굴러간다',
        '만나는 일정이 이어져도 부담스럽지 않다',
        '일정 사이에 비는 시간을 조금 남겨 둔다',
        '사이사이 혼자 있는 시간을 비워 둬야 하루가 굴러간다',
      ],
      prompt: '하루 일정을 짤 때 사람 만나는 일정을 어느 정도로 잡나요?',
    },
    {
      axis: 'EI',
      id: 'refine-inner-ei-2',
      lastPole: 'E',
      options: [
        '누군가 먼저 다가올 때까지 기다린다',
        '상황을 살핀 뒤 필요한 대화만 한다',
        '공통점이 보이면 내가 먼저 말을 건다',
        '처음 보는 자리에서도 먼저 말을 걸고 대화를 이어 간다',
      ],
      prompt: '처음 보는 사람들과 일하게 되면 어떻게 말을 트나요?',
    },
    // JP
    {
      axis: 'JP',
      id: 'inner-jp-1',
      lastPole: 'J',
      options: [
        '비는 시간은 아무 계획 없이 흘러갈 때 편하다',
        '하고 싶은 것 한두 가지만 떠올린다',
        '느슨한 계획이 있으면 마음이 편하다',
        '비는 시간에도 순서와 시간을 정해 두면 가장 편하다',
      ],
      prompt: '일정이 비는 시간이 생기면 어느 정도 계획이 있어야 편한가요?',
    },
    {
      axis: 'JP',
      id: 'inner-jp-2',
      lastPole: 'P',
      options: [
        '하던 일을 멈추고 새 순서와 기한을 세부까지 다시 확정한다',
        '계획을 다시 정리해 두어야 움직일 수 있다',
        '큰 방향만 두고 세부는 그때그때 맞춘다',
        '계획은 따로 세우지 않고 그 자리에서 맞는 쪽을 고른다',
      ],
      prompt: '진행하던 일의 조건이 바뀌면 어떻게 하나요?',
    },
    {
      axis: 'JP',
      id: 'inner-jp-3',
      lastPole: 'J',
      options: [
        '일단 시작하면서 방법을 찾는다',
        '목표만 잡고 바로 움직인다',
        '대략적인 순서를 세운 뒤 시작한다',
        '순서를 구체적으로 정리해야 시작할 수 있다',
      ],
      prompt: '새로운 일을 시작할 때 계획과 실행 중 무엇이 먼저인가요?',
    },
    {
      axis: 'JP',
      id: 'refine-inner-jp-2',
      lastPole: 'P',
      options: [
        '정보가 적어도 일찍 결정을 확정한다',
        '방향이 보이면 미리 정해 두는 편이다',
        '필요해질 때까지 결정을 열어 두는 편이다',
        '마지막으로 꼭 필요해지기 전에는 결정을 확정하지 않는다',
      ],
      prompt: '정보가 충분하지 않을 때 결정은 언제 확정하는 편인가요?',
    },
    {
      axis: 'JP',
      id: 'refine-inner-jp-3',
      lastPole: 'J',
      options: [
        '작은 일을 끝내도 머릿속 여유는 크게 달라지지 않는다',
        '몇 가지가 남아 있어도 편하게 쉴 수 있다',
        '작은 일을 마치면 신경 쓸 것이 줄어든다',
        '작은 일까지 마감해 두어야 머릿속에 확실한 여유가 생긴다',
      ],
      prompt: '작은 일이 끝나지 않은 채 남아 있으면 머릿속 여유는 어떻게 달라지나요?',
    },
    // OA
    {
      axis: 'OA',
      id: 'gem-oa-1',
      lastPole: 'O',
      options: [
        '내 몫이면 조율 없이 정하고 결과만 전한다',
        '방향만 짧게 알린 뒤 세부는 내가 정한다',
        '바로 맞물린 사람과 방향을 맞춘 뒤 움직인다',
        '맞물린 사람 전부와 방향이 맞아야 움직인다',
      ],
      prompt: '맡은 일의 방향을 정할 때 움직이기 전에 어디까지 조율해 두나요?',
    },
    {
      axis: 'OA',
      id: 'gem-oa-2',
      lastPole: 'A',
      options: [
        '그 주에는 다른 사람 일정에 내 시간을 전부 밀어 넣었다',
        '중요한 일정 몇 개는 상대 쪽에 맞춰 옮겼다',
        '내 작업 시간을 먼저 잡고 남는 자리만 열어 두었다',
        '그 주에도 내가 짠 시간표를 그대로 지켰다',
      ],
      prompt: '지난달 일정이 몰렸던 한 주를 떠올리면 그때 누구의 시간표를 기준으로 움직였나요?',
    },
    {
      axis: 'OA',
      id: 'gem-oa-3',
      lastPole: 'O',
      options: [
        '다 끝난 뒤에 결과만 한 번 공유한다',
        '큰 고비를 넘길 때만 한 번씩 공유한다',
        '단계가 바뀔 때마다 중간 내용을 공유한다',
        '작은 진척까지 그때그때 공유해 두어야 편하다',
      ],
      prompt: '일을 하는 도중에 중간 내용을 얼마나 자주 공유하나요?',
    },
    {
      axis: 'OA',
      id: 'refine-gem-oa-1',
      lastPole: 'O',
      options: [
        '내 선에서 끝내고 나중에 알려도 된다고 본다',
        '핵심 한두 사람에게만 미리 말해 둔다',
        '일이 걸린 사람들과 하나씩 미리 맞춰 본다',
        '일이 걸린 사람 전부와 이야기가 끝나야 확정한다',
      ],
      prompt: '되돌리기 어려운 결정을 앞두면 보통 몇 사람까지 미리 맞춰 두나요?',
    },
    {
      axis: 'OA',
      id: 'refine-gem-oa-2',
      lastPole: 'A',
      options: [
        '묻기 전에 먼저 진행 상황을 알린다',
        '중요한 대목은 묻기 전에 알린다',
        '물어보면 그때 정리해서 알린다',
        '결과가 나올 때까지는 따로 알리지 않는다',
      ],
      prompt: '맡은 일의 진행 상황을 보통 어느 시점에 알리는 편인가요?',
    },
    // RM
    {
      axis: 'RM',
      id: 'gem-rm-1',
      lastPole: 'R',
      options: [
        '지지하는 사람이 없으면 내 판단이 맞다는 느낌이 사라진다',
        '지지가 없으면 확신이 눈에 띄게 옅어진다',
        '확신이 조금 흔들려도 판단은 그대로 둔다',
        '지지가 없어도 내 판단에 대한 확신은 달라지지 않는다',
      ],
      prompt: '일에서 내린 판단을 아무도 지지해 주지 않으면 그 판단에 대한 확신은 어떻게 되나요?',
    },
    {
      axis: 'RM',
      id: 'gem-rm-2',
      lastPole: 'M',
      options: [
        '반응이 미지근해도 내 일의 가치는 그대로다',
        '조금 아쉽지만 가치까지 의심하지는 않는다',
        '반응이 약하면 내가 잘했는지 다시 생각한다',
        '반응이 미지근하면 결과물과 내 가치까지 의심한다',
      ],
      prompt: '내가 한 일에 대한 반응이 미지근하면 그 일을 어떻게 바라보나요?',
    },
    {
      axis: 'RM',
      id: 'gem-rm-3',
      lastPole: 'R',
      options: [
        '피드백에 따라 내가 한 일의 가치 판단도 크게 달라진다',
        '평가가 좋지 않으면 내 기준이 흔들리는 편이다',
        '피드백을 참고하되 내 기준도 유지한다',
        '외부 평가와 별개로 내 가치 기준을 분명히 지킨다',
      ],
      prompt: '다른 사람의 피드백은 내 가치 판단에 얼마나 영향을 주나요?',
    },
    {
      axis: 'RM',
      id: 'refine-gem-rm-1',
      lastPole: 'R',
      options: [
        '비판을 들으면 내 판단보다 상대의 평가를 우선하게 된다',
        '비판이 오래 남아 내 판단을 자주 바꾼다',
        '비판을 검토하되 내 기준도 유지한다',
        '비판을 들어도 타당한 근거가 없다면 내 평가 기준을 분명히 지킨다',
      ],
      prompt: '비판을 들었을 때도 내 판단 기준을 얼마나 유지할 수 있나요?',
    },
    {
      axis: 'RM',
      id: 'refine-gem-rm-2',
      lastPole: 'M',
      options: [
        '칭찬이 없어도 동기는 거의 그대로 유지된다',
        '반응이 없으면 조금 아쉽지만 계속한다',
        '칭찬이 없으면 동기가 눈에 띄게 줄어든다',
        '인정과 칭찬이 없으면 하던 일을 이어 갈 힘이 크게 떨어진다',
      ],
      prompt: '칭찬이나 인정이 없으면 하던 일을 이어 갈 마음이 얼마나 달라지나요?',
    },
    // SN
    {
      axis: 'SN',
      id: 'inner-sn-1',
      lastPole: 'S',
      options: [
        '가능성과 큰 그림부터 넓혀 본다',
        '방향을 상상한 뒤 세부를 확인한다',
        '확인된 사실과 적용 방법부터 살핀다',
        '구체적인 근거와 지금 할 수 있는 일을 먼저 본다',
      ],
      prompt: '일의 방향을 정할 때 무엇부터 살펴보나요?',
    },
    {
      axis: 'SN',
      id: 'inner-sn-2',
      lastPole: 'N',
      options: [
        '눈앞에서 확인되는 사실을 중심으로 생각한다',
        '구체적인 맥락을 본 뒤 다른 가능성을 생각한다',
        '숨은 연결과 여러 가능성으로 생각이 자주 확장된다',
        '아직 드러나지 않은 가능성부터 떠올린다',
      ],
      prompt: '어떤 문제를 붙들고 있을 때 생각은 어느 쪽으로 뻗어 가나요?',
    },
    {
      axis: 'SN',
      id: 'inner-sn-3',
      lastPole: 'S',
      options: [
        '원리와 개념을 먼저 알아야 이해된다',
        '원리를 이해하고 사례로 확인한다',
        '실제 사례에서 공통 원리를 찾는다',
        '직접 적용할 수 있는 사례가 있어야 가장 잘 이해된다',
      ],
      prompt: '새로운 개념을 이해할 때 어떤 순서가 가장 편한가요?',
    },
    {
      axis: 'SN',
      id: 'refine-inner-sn-1',
      lastPole: 'N',
      options: [
        '들은 사실과 숫자가 그대로 먼저 남는다',
        '항목을 하나씩 확인한 뒤 큰 줄기를 잡는다',
        '항목보다 큰 줄기가 먼저 눈에 들어온다',
        '설명 뒤에 깔린 흐름과 앞으로의 변화가 먼저 읽힌다',
      ],
      prompt: '새로운 업무 설명을 들으면 무엇이 가장 먼저 머리에 남나요?',
    },
    {
      axis: 'SN',
      id: 'refine-inner-sn-2',
      lastPole: 'S',
      options: [
        '세부 정보를 모두 확인하기보다 전체 방향을 기준으로 결정한다',
        '큰 그림을 잡은 뒤 필요한 사실을 확인한다',
        '결정하기 전에 확인 가능한 세부 정보를 살핀다',
        '결론을 내리기 전에 구체적인 근거를 빠짐없이 다시 확인한다',
      ],
      prompt: '결정을 내릴 때 전체 방향과 세부 근거를 어떤 순서로 확인하나요?',
    },
    // TF
    {
      axis: 'TF',
      id: 'inner-tf-1',
      lastPole: 'T',
      options: [
        '누구에게 어떤 영향이 갈지가 판단을 좌우한다',
        '맥락과 영향을 먼저 생각한다',
        '영향도 보지만 일관된 기준을 우선한다',
        '기준이 앞뒤로 어긋나지 않는지부터 확인한다',
      ],
      prompt: '어떤 판단을 내릴 때 무엇을 가장 먼저 보나요?',
    },
    {
      axis: 'TF',
      id: 'inner-tf-2',
      lastPole: 'F',
      options: [
        '다른 사람에게 미칠 영향과 무관하게 결정한다',
        '영향은 확인하지만 판단을 거의 바꾸지 않는다',
        '영향이 크면 내 결정을 어느 정도 조정한다',
        '다른 사람에게 미칠 영향을 중심으로 결정을 조정한다',
      ],
      prompt: '내 결정이 다른 사람에게 영향을 줄 수 있다면 그 영향을 얼마나 반영하나요?',
    },
    {
      axis: 'TF',
      id: 'inner-tf-3',
      lastPole: 'T',
      options: [
        '감정이 무엇인지부터 충분히 느껴 본다',
        '감정을 정리한 뒤 사실을 돌아본다',
        '감정과 사실을 구분해 함께 검토한다',
        '사실관계를 먼저 분리한 뒤 감정을 살핀다',
      ],
      prompt: '감정이 얽힌 일을 정리해야 할 때 무엇부터 살펴보나요?',
    },
    {
      axis: 'TF',
      id: 'refine-inner-tf-1',
      lastPole: 'T',
      options: [
        '상황과 사람의 맥락에 따라 판단 기준을 유연하게 바꾼다',
        '맥락에 따라 기준을 어느 정도 조정한다',
        '입장이 바뀌어도 같은 기준인지 확인한다',
        '누가 어느 입장에 있어도 동일한 기준을 일관되게 적용한다',
      ],
      prompt: '상황이나 입장이 달라지면 판단 기준은 어떻게 적용하나요?',
    },
    {
      axis: 'TF',
      id: 'refine-inner-tf-2',
      lastPole: 'F',
      options: [
        '판단이 논리적으로 일관되면 사람마다 느끼는 영향은 별도로 본다',
        '논리를 우선하되 사람에게 미칠 영향도 확인한다',
        '논리와 사람에게 미칠 영향을 함께 봐야 답이 완성된다',
        '사람에게 남길 영향을 충분히 반영해야 답이 완성된다',
      ],
      prompt: '판단할 때 논리적 일관성과 사람에게 미칠 영향을 어떻게 함께 살펴보나요?',
    },
    // UO
    {
      axis: 'UO',
      id: 'gem-uo-1',
      lastPole: 'U',
      options: [
        '새로운 기회를 얻는 것보다 위험을 줄이는 일이 나를 더 강하게 움직인다',
        '안전을 확인해야 움직일 마음이 생긴다',
        '위험이 있어도 기회가 크면 움직인다',
        '새로운 기회를 얻을 가능성이 가장 강하게 나를 움직인다',
      ],
      prompt: '새로운 기회를 얻는 일과 위험을 줄이는 일 중 어느 쪽이 나를 더 움직이나요?',
    },
    {
      axis: 'UO',
      id: 'gem-uo-2',
      lastPole: 'O',
      options: [
        '안정보다 확장과 새로운 기회를 먼저 택한다',
        '성장 가능성이 보이면 어느 정도 위험을 감수한다',
        '확장보다 현재의 안정을 조금 더 우선한다',
        '새로운 기회보다 지금 가진 안정과 기반을 지키는 일을 가장 우선한다',
      ],
      prompt: '확장과 현재의 안정이 충돌하면 어느 쪽을 더 우선하나요?',
    },
    {
      axis: 'UO',
      id: 'gem-uo-3',
      lastPole: 'U',
      options: [
        '목표를 세울 때 피해야 할 손실부터 떠올린다',
        '안전한 범위를 확인한 뒤 원하는 결과를 생각한다',
        '얻고 싶은 변화를 먼저 그리고 위험을 확인한다',
        '원하는 성장과 변화의 모습을 먼저 선명하게 그린다',
      ],
      prompt: '목표를 세울 때 무엇부터 떠올리는 편인가요?',
    },
    {
      axis: 'UO',
      id: 'refine-gem-uo-2',
      lastPole: 'O',
      options: [
        '새로운 움직임에서 얻을 기회와 이득부터 살핀다',
        '가능성을 본 뒤 손실도 확인한다',
        '움직이기 전에 생길 수 있는 손실을 먼저 줄인다',
        '가능한 손실과 위험을 충분히 줄인 뒤에야 새롭게 움직인다',
      ],
      prompt: '새로운 일을 시작할 때 얻을 기회와 예상 손실 중 무엇을 먼저 살펴보나요?',
    },
    {
      axis: 'UO',
      id: 'refine-gem-uo-3',
      lastPole: 'U',
      options: [
        '결과가 불확실하면 호기심보다 걱정이 앞선다',
        '안전하다는 단서가 있어야 관심이 생긴다',
        '기회가 보이면 불확실해도 호기심이 생긴다',
        '결과를 알 수 없을수록 새로운 기회를 탐색하고 싶은 에너지가 커진다',
      ],
      prompt: '결과가 불확실할 때 걱정과 호기심 중 무엇이 먼저 드나요?',
    },
    // VH
    {
      axis: 'VH',
      id: 'gem-vh-1',
      lastPole: 'V',
      options: [
        '감정은 혼자 정리해야 가장 잘 이해된다',
        '혼자 생각한 뒤 말하면 조금 더 분명해진다',
        '믿는 사람에게 말하면서 감정이 정리된다',
        '감정을 말로 꺼내야 무엇을 느끼는지 선명해진다',
      ],
      prompt: '내 감정을 이해할 때 혼자 생각하는 것과 말로 나누는 것 중 어느 쪽이 더 도움이 되나요?',
    },
    {
      axis: 'VH',
      id: 'gem-vh-2',
      lastPole: 'H',
      options: [
        '느끼는 즉시 말해야 감정이 정리된다',
        '짧게 생각한 뒤 바로 나누는 편이 편하다',
        '혼자 충분히 이해한 뒤에야 말하고 싶다',
        '감정을 설명하기 전에 긴 혼자만의 처리 시간이 꼭 필요하다',
      ],
      prompt: '감정을 다른 사람에게 말하기 전에 혼자 정리할 시간이 얼마나 필요한가요?',
    },
    {
      axis: 'VH',
      id: 'gem-vh-3',
      lastPole: 'V',
      options: [
        '감정을 거의 드러내지 않아 주변이 알아채기 어렵다',
        '오래 본 사람만 겨우 알아챈다',
        '표정이나 말투에 감정이 자연스럽게 묻어난다',
        '느끼는 감정이 얼굴과 말에 바로 선명하게 드러난다',
      ],
      prompt: '내 감정은 표정이나 말투에 어느 정도 드러나는 편인가요?',
    },
    {
      axis: 'VH',
      id: 'refine-gem-vh-1',
      lastPole: 'V',
      options: [
        '그때 든 감정은 밖으로 꺼내지 않아야 빨리 가라앉는다',
        '한 사람에게만 짧게 기분을 말한다',
        '옆에 있는 사람에게 그때 기분을 그대로 말한다',
        '느낀 감정을 곧바로 말로 꺼내야 정리된다',
      ],
      prompt: '일이 어긋났을 때 그때 든 감정을 얼마나 말로 꺼내나요?',
    },
    {
      axis: 'VH',
      id: 'refine-gem-vh-2',
      lastPole: 'H',
      options: [
        '묻는 순간 지금 느끼는 것을 다 말한다',
        '요즘 마음이 어떤지 어렵지 않게 말한다',
        '가벼운 이야기만 하고 속마음은 남겨 둔다',
        '속마음은 내 안에서 자리 잡은 뒤에 말하고 싶다',
      ],
      prompt: '누가 요즘 어떠냐고 물으면 속마음을 어디까지 말하나요?',
    },
  ] as const satisfies readonly {
    axis: AxisId
    id: string
    lastPole: string
    options: readonly [string, string, string, string]
    prompt: string
  }[]

  // Frame regression guard. Reanchoring pulled private-life scene framing out of the scored 40, but the pins
  // above only freeze today's text — they say nothing about text a later edit introduces. This checks the
  // shape instead of the exact string.
  //
  // `혼자` cannot simply be banned, because it arrives in two forms and only one of them is a frame.
  //   (a) frame — `혼자` sets a scene under which some other axis is measured: '혼자 있을 때 생각은 …'(SN),
  //       '혼자 결정할 때 …'(JP), '혼자 하는 일은 …'(JP). Remove the word and the item still measures the same
  //       construct, only without the private scene.
  //   (b) pole — `혼자` is the content of one pole: '충분히 혼자 있어야 제대로 회복된다'(EI의 I) ·
  //       '감정은 혼자 정리해야 가장 잘 이해된다'(VH의 H). Remove the word and there is nothing left to measure.
  // So the pattern never matches `혼자` on its own. It matches `혼자` bound to a scene marker (있을 때 · 있거나 ·
  // 일수록) or to a decision/planning/thought-direction predicate (결정 · 판단 · 방향을 정 · 일을 시작 ·
  // 하는 일 · subject-marked 생각은/생각이) — which is what (a) always does and (b) never does. `혼자 있으면`,
  // `혼자 있는`, `혼자 생각한 뒤` and `혼자만의` stay legal because form (b) uses all four today.
  //
  // The other four literals (나만의 · 자유 시간 · 좋아하는 사람 · 낯선 모임) have no legitimate form on any
  // axis, so they are matched unconditionally. Note that 나만의 does not match 혼자만의, which is VH's H pole.
  //
  // The scan runs per item across stem + four options together, so one flagged string fails the item. That is
  // deliberate: a reverted item carries its frame in several of its five strings, not just one.
  const CONTEXT_FRAME =
    /나만의|자유 시간|좋아하는 사람|낯선 모임|혼자 있(?:을 때|거나)|혼자[^.?]{0,20}생각[은이]|혼자[^.?]{0,12}(?:결정|판단|방향을 정|일을 시작|하는 일)|혼자일수록/

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

  test('pins every scored item, with nothing left unpinned and nothing pinned twice', () => {
    const pinned = POLARITY.map((item) => item.id)
    expect(pinned.length).toBe(40)
    expect(new Set(pinned).size).toBe(40)
    expect([...pinned].sort().join()).toBe([...SCORED_IDS].sort().join())
  })

  // Every axis carries exactly five scored items, so a drifting count means the table gained or lost an item
  // on some axis without the total moving.
  test('every axis carries five pinned items', () => {
    const perAxis = new Map<string, number>()
    for (const item of POLARITY) perAxis.set(item.axis, (perAxis.get(item.axis) ?? 0) + 1)
    const counted = [...perAxis].map(([axis, count]) => `${axis}:${count}`).sort()
    expect(counted.join()).toBe('EI:5,JP:5,OA:5,RM:5,SN:5,TF:5,UO:5,VH:5')
  })

  test('no private-life context frame reaches the scored 40', () => {
    for (const item of POLARITY) {
      const question = koQuestions[item.id]
      const strings = question ? [question.prompt, ...question.options] : []
      expect(`${item.id}:${strings.length}`).toBe(`${item.id}:5`)
      const flagged = strings.filter((value) => CONTEXT_FRAME.test(value))
      expect(`${item.id}:${flagged.join(' | ')}`).toBe(`${item.id}:`)
    }
  })

  for (const item of POLARITY) {
    test(`${item.id} runs from '${item.lastPole}'-opposite to ${item.lastPole}`, () => {
      const question = koQuestions[item.id]
      expect(question?.prompt).toBe(item.prompt)
      expect(question?.options).toEqual(item.options)

      const [first, second] = AXIS_POLES[item.axis]
      const travel = axisScore(item.id, 4, item.axis) - axisScore(item.id, 1, item.axis)
      // Six points: the last option contributes +3 to a forward item and -3 to a reverse one, the first option
      // the opposite. Sign, not magnitude, is what names the pole.
      expect(Math.abs(travel)).toBe(6)
      expect(travel > 0 ? first : second).toBe(item.lastPole)
    })
  }
})
