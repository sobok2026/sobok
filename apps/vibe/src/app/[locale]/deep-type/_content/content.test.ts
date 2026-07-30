import { describe, expect, test } from 'bun:test'
import type { AgreementValue, AxisId, GemAxisId, ItemAnswer, TypeAxisId } from '@deep-type/model'
import { AXIS_POLES, TYPE_AXES } from '@deep-type/model'
import { FREE_LIKERT_ITEMS, FREE_WORK_ITEMS, PAID_LIKERT_ITEMS, WORK_ITEMS } from '@deep-type/questionnaire'
import { scoreBaseAssessment, scoreRefinedAssessment } from '@deep-type/scoring'

import { createDeepTypeContent, createPaidQuestions } from './create-content'
import { deepTypeContent as ko } from './ko'
import { koFreeQuestionOptions } from './question-options/ko.free'
import { paidQuestionOptions as koPaidQuestionOptions } from './question-options/ko.paid'
import { koFreeQuestionPrompts } from './question-prompts/ko.free'
import { paidQuestionPrompts as koPaidQuestionPrompts } from './question-prompts/ko.paid'

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
        '떠오른 생각을 다른 사람에게 말하고 싶은 마음이 거의 없어요',
        '생각이 정리된 뒤에야 가끔 말로 꺼내요',
        '생각이 떠오르면 함께 일하는 사람에게 말하고 싶어져요',
        '생각이 떠오르는 즉시 말로 꺼내야 속이 개운해요',
      ],
      prompt: '일하다 생각이 하나 떠오르면 그다음에 어떻게 하나요?',
    },
    {
      axis: 'EI',
      id: 'inner-ei-2',
      lastPole: 'I',
      options: [
        '누군가와 연결되어야 에너지가 돌아와요',
        '너무 오래 혼자 있으면 오히려 지쳐요',
        '혼자 있는 시간이 어느 정도 필요해요',
        '충분히 혼자 있어야 제대로 회복돼요',
      ],
      prompt: '지쳤을 때 에너지를 회복하려면 무엇이 가장 필요한가요?',
    },
    {
      axis: 'EI',
      id: 'inner-ei-3',
      lastPole: 'E',
      options: [
        '누구와도 연결되지 않은 채 혼자 있을 때 가장 활력이 생겨요',
        '누군가와 연결되어 있어도 에너지에는 큰 변화가 없어요',
        '가벼운 연락을 주고받거나 약속이 있으면 기운이 나요',
        '누군가와 연결될 때 에너지가 확실히 올라가요',
      ],
      prompt: '다른 사람과 연결될 때와 혼자일 때 중 언제 에너지가 오르나요?',
    },
    {
      axis: 'EI',
      id: 'refine-inner-ei-1',
      lastPole: 'I',
      options: [
        '사람을 만나는 일정이 촘촘할수록 하루가 잘 굴러가요',
        '사람을 만나는 일정이 이어져도 부담스럽지 않아요',
        '일정 사이에 비는 시간을 조금 남겨 둬요',
        '일정 사이사이에 혼자 보낼 시간을 확보해 둬야 하루가 잘 굴러가요',
      ],
      prompt: '하루 일정을 짤 때 사람 만나는 일정을 어느 정도로 잡나요?',
    },
    {
      axis: 'EI',
      id: 'refine-inner-ei-2',
      lastPole: 'E',
      options: [
        '누군가 먼저 다가올 때까지 기다려요',
        '상황을 살핀 뒤 필요한 대화만 나눠요',
        '공통점이 보이면 내가 먼저 말을 걸어요',
        '처음 보는 자리에서도 먼저 말을 걸고 대화를 이어 가요',
      ],
      prompt: '처음 보는 사람들과 일하게 되면 어떻게 말을 트나요?',
    },
    // JP
    {
      axis: 'JP',
      id: 'inner-jp-1',
      lastPole: 'J',
      options: [
        '비는 시간은 아무 계획 없이 흘려보낼 때 편해요',
        '하고 싶은 것 한두 가지만 떠올려 둬요',
        '느슨한 계획이 있으면 마음이 편해요',
        '비는 시간에도 순서와 시간을 정해 두면 가장 편해요',
      ],
      prompt: '일정이 비는 시간이 생기면 어느 정도 계획이 있어야 편한가요?',
    },
    {
      axis: 'JP',
      id: 'inner-jp-2',
      lastPole: 'P',
      options: [
        '하던 일을 멈추고 새 순서와 기한을 세부까지 다시 정해요',
        '계획을 다시 정리해 둬야 움직일 수 있어요',
        '큰 방향만 두고 세부는 그때그때 맞춰요',
        '계획은 따로 세우지 않고 그 자리에서 맞는 쪽을 골라요',
      ],
      prompt: '진행하던 일의 조건이 바뀌면 어떻게 하나요?',
    },
    {
      axis: 'JP',
      id: 'inner-jp-3',
      lastPole: 'J',
      options: [
        '일단 시작하면서 방법을 찾아요',
        '목표만 잡고 바로 움직여요',
        '대략적인 순서를 세운 뒤 시작해요',
        '순서를 구체적으로 정리해야 시작할 수 있어요',
      ],
      prompt: '새로운 일을 시작할 때 계획과 실행 중 무엇이 먼저인가요?',
    },
    {
      axis: 'JP',
      id: 'refine-inner-jp-2',
      lastPole: 'P',
      options: [
        '정보가 적어도 결정을 일찍 확정해요',
        '방향이 보이면 미리 정해 두는 편이에요',
        '필요해질 때까지 결정을 열어 두는 편이에요',
        '결정을 꼭 내려야 하는 마지막 순간까지 확정하지 않아요',
      ],
      prompt: '정보가 충분하지 않을 때 결정은 언제 확정하는 편인가요?',
    },
    {
      axis: 'JP',
      id: 'refine-inner-jp-3',
      lastPole: 'J',
      options: [
        '작은 일을 끝내도 머릿속 여유는 크게 달라지지 않아요',
        '몇 가지가 남아 있어도 편하게 쉴 수 있어요',
        '작은 일을 마치면 신경 쓸 일이 줄어요',
        '작은 일까지 마감해 둬야 머릿속에 확실한 여유가 생겨요',
      ],
      prompt: '작은 일이 끝나지 않은 채 남아 있으면 머릿속 여유는 어떻게 달라지나요?',
    },
    // OA
    {
      axis: 'OA',
      id: 'gem-oa-1',
      lastPole: 'O',
      options: [
        '내 몫이라면 따로 조율하지 않고 스스로 정한 뒤 결과만 알려요',
        '방향만 짧게 알린 뒤 세부는 내가 정해요',
        '직접 맞물려 일하는 사람과 방향을 맞춘 뒤 움직여요',
        '관련된 사람 모두와 방향을 맞춘 뒤에야 움직여요',
      ],
      prompt: '맡은 일의 방향을 정할 때 움직이기 전에 어디까지 조율해 두나요?',
    },
    {
      axis: 'OA',
      id: 'gem-oa-2',
      lastPole: 'A',
      options: [
        '그 주에는 다른 사람의 일정에 맞춰 내 시간을 전부 배치했어요',
        '중요한 일정 몇 개는 상대 일정에 맞춰 옮겼어요',
        '내 작업 시간을 먼저 확보하고 남는 시간만 열어 두었어요',
        '그 주에도 내가 짠 시간표를 그대로 지켰어요',
      ],
      prompt: '지난달 일정이 몰렸던 한 주를 떠올리면 그때 누구의 시간표를 기준으로 움직였나요?',
    },
    {
      axis: 'OA',
      id: 'gem-oa-3',
      lastPole: 'O',
      options: [
        '다 끝난 뒤에 결과만 한 번 공유해요',
        '큰 고비를 넘길 때만 한 번씩 공유해요',
        '단계가 바뀔 때마다 중간 내용을 공유해요',
        '작은 진척까지 그때그때 공유해 둬야 편해요',
      ],
      prompt: '일을 하는 도중에 중간 내용을 얼마나 자주 공유하나요?',
    },
    {
      axis: 'OA',
      id: 'refine-gem-oa-1',
      lastPole: 'O',
      options: [
        '내 선에서 끝낸 뒤 나중에 알려도 된다고 생각해요',
        '핵심 한두 사람에게만 미리 말해 둬요',
        '관련된 사람들과 하나씩 미리 조율해요',
        '관련된 사람 모두와 이야기를 마쳐야 확정해요',
      ],
      prompt: '되돌리기 어려운 결정을 앞두면 보통 몇 사람까지 미리 맞춰 두나요?',
    },
    {
      axis: 'OA',
      id: 'refine-gem-oa-2',
      lastPole: 'A',
      options: [
        '묻기 전에 먼저 진행 상황을 알려요',
        '중요한 대목은 묻기 전에 알려요',
        '물어보면 그때 정리해 알려요',
        '결과가 나올 때까지는 따로 알리지 않아요',
      ],
      prompt: '맡은 일의 진행 상황을 보통 어느 시점에 알리는 편인가요?',
    },
    // RM
    {
      axis: 'RM',
      id: 'gem-rm-1',
      lastPole: 'R',
      options: [
        '지지해 주는 사람이 없으면 내 판단이 맞다는 확신도 사라져요',
        '지지가 없으면 확신이 눈에 띄게 옅어져요',
        '확신이 조금 흔들려도 판단은 바꾸지 않아요',
        '지지가 없어도 내 판단에 대한 확신은 달라지지 않아요',
      ],
      prompt: '일에서 내린 판단을 아무도 지지해 주지 않으면 그 판단에 대한 확신은 어떻게 되나요?',
    },
    {
      axis: 'RM',
      id: 'gem-rm-2',
      lastPole: 'M',
      options: [
        '반응이 미지근해도 내가 한 일의 가치는 그대로예요',
        '조금 아쉽기는 해도 그 일의 가치까지 의심하지는 않아요',
        '반응이 약하면 내가 잘했는지 다시 생각해요',
        '반응이 미지근하면 결과물의 완성도뿐 아니라 내 가치까지 의심해요',
      ],
      prompt: '내가 한 일에 대한 반응이 미지근하면 그 일을 어떻게 바라보나요?',
    },
    {
      axis: 'RM',
      id: 'gem-rm-3',
      lastPole: 'R',
      options: [
        '피드백에 따라 내가 한 일에 대한 가치 판단도 크게 달라져요',
        '평가가 좋지 않으면 내 기준도 흔들리는 편이에요',
        '피드백을 참고하되 내 기준도 유지해요',
        '외부 평가와 별개로 내 가치 기준을 분명히 지켜요',
      ],
      prompt: '다른 사람의 피드백은 내 가치 판단에 얼마나 영향을 주나요?',
    },
    {
      axis: 'RM',
      id: 'refine-gem-rm-1',
      lastPole: 'R',
      options: [
        '비판을 들으면 내 판단보다 상대의 평가를 우선하게 돼요',
        '비판이 오래 남아 내 판단을 자주 바꿔요',
        '비판을 검토하되 내 기준도 유지해요',
        '비판을 들어도 타당한 근거가 없다면 내 평가 기준을 분명히 지켜요',
      ],
      prompt: '비판을 들었을 때도 내 판단 기준을 얼마나 유지할 수 있나요?',
    },
    {
      axis: 'RM',
      id: 'refine-gem-rm-2',
      lastPole: 'M',
      options: [
        '칭찬이 없어도 동기는 거의 그대로 유지돼요',
        '반응이 없으면 조금 아쉽지만 계속해요',
        '칭찬이 없으면 동기가 눈에 띄게 줄어들어요',
        '인정과 칭찬이 없으면 하던 일을 이어 갈 힘이 크게 떨어져요',
      ],
      prompt: '칭찬이나 인정이 없으면 하던 일을 이어 갈 마음이 얼마나 달라지나요?',
    },
    // SN
    {
      axis: 'SN',
      id: 'inner-sn-1',
      lastPole: 'S',
      options: [
        '가능성을 넓게 열어 두고 큰 그림부터 살펴봐요',
        '방향을 먼저 상상한 뒤 세부를 확인해요',
        '확인된 사실과 적용 방법부터 살펴봐요',
        '구체적인 근거와 지금 할 수 있는 일을 먼저 봐요',
      ],
      prompt: '일의 방향을 정할 때 무엇부터 살펴보나요?',
    },
    {
      axis: 'SN',
      id: 'inner-sn-2',
      lastPole: 'N',
      options: [
        '눈앞에서 확인되는 사실을 중심으로 생각해요',
        '구체적인 맥락을 본 뒤 다른 가능성을 생각해요',
        '숨은 연결과 여러 가능성으로 생각이 자주 확장돼요',
        '아직 드러나지 않은 가능성부터 떠올려요',
      ],
      prompt: '어떤 문제를 붙들고 있을 때 생각은 어느 쪽으로 뻗어 가나요?',
    },
    {
      axis: 'SN',
      id: 'inner-sn-3',
      lastPole: 'S',
      options: [
        '원리와 개념을 먼저 알아야 이해할 수 있어요',
        '원리를 이해한 뒤 사례로 확인해요',
        '실제 사례에서 공통된 원리를 찾아요',
        '직접 적용할 수 있는 사례가 있어야 가장 잘 이해돼요',
      ],
      prompt: '새로운 개념을 이해할 때 어떤 순서가 가장 편한가요?',
    },
    {
      axis: 'SN',
      id: 'refine-inner-sn-1',
      lastPole: 'N',
      options: [
        '들은 내용 가운데 사실과 숫자가 가장 먼저 기억에 남아요',
        '항목을 하나씩 확인한 뒤 큰 줄기를 잡아요',
        '개별 항목보다 큰 줄기가 먼저 눈에 들어와요',
        '설명 뒤에 깔린 흐름과 앞으로의 변화가 먼저 읽혀요',
      ],
      prompt: '새로운 업무 설명을 들으면 무엇이 가장 먼저 머리에 남나요?',
    },
    {
      axis: 'SN',
      id: 'refine-inner-sn-2',
      lastPole: 'S',
      options: [
        '세부 정보를 모두 확인하기보다 전체 방향을 기준으로 결정해요',
        '큰 그림을 잡은 뒤 필요한 사실을 확인해요',
        '결정하기 전에 확인할 수 있는 세부 정보를 살펴봐요',
        '결론을 내리기 전에 구체적인 근거를 빠짐없이 다시 확인해요',
      ],
      prompt: '결정을 내릴 때 전체 방향과 세부 근거를 어떤 순서로 확인하나요?',
    },
    // TF
    {
      axis: 'TF',
      id: 'inner-tf-1',
      lastPole: 'T',
      options: [
        '누구에게 어떤 영향을 미칠지가 판단을 좌우해요',
        '상황의 맥락과 영향을 먼저 생각해요',
        '영향도 살피지만 일관된 기준을 우선해요',
        '기준이 앞뒤로 어긋나지 않는지부터 확인해요',
      ],
      prompt: '어떤 판단을 내릴 때 무엇을 가장 먼저 보나요?',
    },
    {
      axis: 'TF',
      id: 'inner-tf-2',
      lastPole: 'F',
      options: [
        '다른 사람에게 미칠 영향과 무관하게 결정해요',
        '영향은 확인하지만 판단을 거의 바꾸지 않아요',
        '영향이 크면 내 결정을 어느 정도 조정해요',
        '다른 사람에게 미칠 영향을 중심으로 결정을 조정해요',
      ],
      prompt: '내 결정이 다른 사람에게 영향을 줄 수 있다면 그 영향을 얼마나 반영하나요?',
    },
    {
      axis: 'TF',
      id: 'inner-tf-3',
      lastPole: 'T',
      options: [
        '어떤 감정인지부터 충분히 느껴 봐요',
        '감정을 정리한 뒤 사실을 돌아봐요',
        '감정과 사실을 구분해 함께 검토해요',
        '사실관계를 먼저 정리한 뒤 감정을 살펴봐요',
      ],
      prompt: '감정이 얽힌 일을 정리해야 할 때 무엇부터 살펴보나요?',
    },
    {
      axis: 'TF',
      id: 'refine-inner-tf-1',
      lastPole: 'T',
      options: [
        '상황과 사람의 맥락에 따라 판단 기준을 유연하게 바꿔요',
        '맥락에 따라 기준을 어느 정도 조정해요',
        '입장이 바뀌어도 같은 기준을 적용하는지 확인해요',
        '누가 어느 입장에 있어도 동일한 기준을 일관되게 적용해요',
      ],
      prompt: '상황이나 입장이 달라지면 판단 기준은 어떻게 적용하나요?',
    },
    {
      axis: 'TF',
      id: 'refine-inner-tf-2',
      lastPole: 'F',
      options: [
        '판단이 논리적으로 일관되면 각 사람에게 미칠 영향은 별도로 살펴봐요',
        '논리를 우선하되 사람에게 미칠 영향도 확인해요',
        '논리와 사람에게 미칠 영향을 함께 봐야 답이 완성돼요',
        '사람에게 미칠 영향을 충분히 반영해야 답이 완성돼요',
      ],
      prompt: '판단할 때 논리적 일관성과 사람에게 미칠 영향을 어떻게 함께 살펴보나요?',
    },
    // UO
    {
      axis: 'UO',
      id: 'gem-uo-1',
      lastPole: 'U',
      options: [
        '새로운 기회를 얻는 것보다 위험을 줄여야 한다는 마음이 더 큰 동기가 돼요',
        '안전하다는 확신이 있어야 움직일 마음이 생겨요',
        '위험이 있어도 기회가 크면 움직여요',
        '새로운 기회를 얻고 싶은 마음이 가장 큰 동력이 돼요',
      ],
      prompt: '새로운 기회를 얻는 일과 위험을 줄이는 일 중 어느 쪽이 나를 더 움직이나요?',
    },
    {
      axis: 'UO',
      id: 'gem-uo-2',
      lastPole: 'O',
      options: [
        '안정보다 확장과 새로운 기회를 먼저 택해요',
        '성장 가능성이 보이면 어느 정도 위험을 감수해요',
        '확장보다 현재의 안정을 조금 더 우선해요',
        '새로운 기회보다 지금 가진 안정과 기반을 지키는 일을 가장 우선해요',
      ],
      prompt: '확장과 현재의 안정이 충돌하면 어느 쪽을 더 우선하나요?',
    },
    {
      axis: 'UO',
      id: 'gem-uo-3',
      lastPole: 'U',
      options: [
        '목표를 세울 때는 피해야 할 손실부터 떠올려요',
        '안전한 범위를 확인한 뒤 원하는 결과를 생각해요',
        '얻고 싶은 변화를 먼저 그린 뒤 위험을 확인해요',
        '원하는 성장과 변화의 모습을 먼저 선명하게 그려요',
      ],
      prompt: '목표를 세울 때 무엇부터 떠올리는 편인가요?',
    },
    {
      axis: 'UO',
      id: 'refine-gem-uo-2',
      lastPole: 'O',
      options: [
        '새로운 일을 시작할 때 얻을 기회와 이득부터 살펴봐요',
        '가능성을 본 뒤 손실도 확인해요',
        '움직이기 전에 생길 수 있는 손실을 먼저 줄여요',
        '예상되는 손실과 위험을 충분히 줄인 뒤에야 새로운 일을 시작해요',
      ],
      prompt: '새로운 일을 시작할 때 얻을 기회와 예상 손실 중 무엇을 먼저 살펴보나요?',
    },
    {
      axis: 'UO',
      id: 'refine-gem-uo-3',
      lastPole: 'U',
      options: [
        '결과가 불확실하면 호기심보다 걱정이 앞서요',
        '안전하다는 단서가 있어야 관심이 생겨요',
        '기회가 보이면 불확실해도 호기심이 생겨요',
        '결과를 알 수 없을수록 새로운 기회를 탐색하고 싶은 에너지가 커져요',
      ],
      prompt: '결과가 불확실할 때 걱정과 호기심 중 무엇이 먼저 드나요?',
    },
    // VH
    {
      axis: 'VH',
      id: 'gem-vh-1',
      lastPole: 'V',
      options: [
        '감정은 혼자 정리할 때 가장 잘 이해돼요',
        '혼자 생각한 뒤 말로 꺼내면 조금 더 분명해져요',
        '믿는 사람에게 이야기하면서 감정을 정리해요',
        '감정을 말로 꺼내야 내가 무엇을 느끼는지 선명해져요',
      ],
      prompt: '내 감정을 이해할 때 혼자 생각하는 것과 말로 나누는 것 중 어느 쪽이 더 도움이 되나요?',
    },
    {
      axis: 'VH',
      id: 'gem-vh-2',
      lastPole: 'H',
      options: [
        '느낀 즉시 말해야 감정이 정리돼요',
        '잠깐 생각한 뒤 바로 나누는 게 편해요',
        '혼자 충분히 이해한 뒤에야 말하고 싶어요',
        '감정을 설명하기 전에 혼자 오래 정리할 시간이 꼭 필요해요',
      ],
      prompt: '감정을 다른 사람에게 말하기 전에 혼자 정리할 시간이 얼마나 필요한가요?',
    },
    {
      axis: 'VH',
      id: 'gem-vh-3',
      lastPole: 'V',
      options: [
        '감정을 거의 드러내지 않아 주변 사람들은 알아채기 어려워요',
        '오래 본 사람만 겨우 알아채요',
        '표정이나 말투에 감정이 자연스럽게 묻어나요',
        '느끼는 감정이 얼굴과 말에 곧바로 선명하게 드러나요',
      ],
      prompt: '내 감정은 표정이나 말투에 어느 정도 드러나는 편인가요?',
    },
    {
      axis: 'VH',
      id: 'refine-gem-vh-1',
      lastPole: 'V',
      options: [
        '그때 든 감정은 밖으로 꺼내지 않아야 빨리 가라앉아요',
        '한 사람에게만 짧게 기분을 말해요',
        '곁에 있는 사람에게 그때 기분을 그대로 말해요',
        '느낀 감정을 곧바로 말로 꺼내야 정리돼요',
      ],
      prompt: '일이 어긋났을 때 그때 든 감정을 얼마나 말로 꺼내나요?',
    },
    {
      axis: 'VH',
      id: 'refine-gem-vh-2',
      lastPole: 'H',
      options: [
        '묻는 순간 지금 느끼는 감정을 모두 말해요',
        '요즘 마음이 어떤지 어렵지 않게 말해요',
        '가벼운 이야기만 하고 속마음은 남겨 둬요',
        '속마음은 내 안에서 자리 잡은 뒤에 말하고 싶어요',
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
    /나만의|자유 시간|좋아하는 사람|낯선 모임|혼자[^.?]{0,20}생각[은이]|혼자[^.?]{0,12}(?:결정|판단|방향을 정|일을 시작|하는 일)/

  // The scene markers are split out because EI is the one axis where they are form (b) rather than form (a).
  // Everywhere else `혼자 있을 때` opens a private scene under which some other construct is measured; on EI
  // being alone is the construct, and the I end of an item like inner-ei-3 — which asks whether connection or
  // solitude raises energy — has no way to state its pole without one of these. Off EI they stay banned, so an
  // SN or JP item that reaches for `혼자 있을 때` still fails the way reanchoring intends.
  const ALONE_SCENE = /혼자 있(?:을 때|거나)|혼자일수록/

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
      const flagged = strings.filter(
        (value) => CONTEXT_FRAME.test(value) || (item.axis !== 'EI' && ALONE_SCENE.test(value)),
      )
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
