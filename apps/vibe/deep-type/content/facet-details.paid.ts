import type { DrainFacet, EnvironmentFacet, InterestFacet, NeedFacet, PurposeFacet } from '../model'

// Paid content. One authored paragraph per work facet, thirty in all.
//
// `work-labels.*` already carries two strings per facet, and neither can do this job. `name` is the facet's
// title and has to stay short enough to sit in a chip; `action` is the one reversible choice the facet
// suggests, which is advice rather than description. What was missing is the middle — what the condition
// actually looks like in someone's week — and its absence is why the report read as a list of headings.
//
// Two sentences each, and the second is never a restatement of the first: the first says what the scene looks
// like and the second says what it costs or gives. A facet whose two sentences say the same thing twice is the
// defect to catch in review.
//
// Descriptive only. These paragraphs are read out under a facet the respondent's own picks put in front, so a
// sentence that told them what to do would be advice attributed to their answers. The advice lives in `action`
// and is rendered beside this, never inside it.

export const DRAIN_DETAILS = {
  BREAK:
    '한 가지를 붙들고 있는데 다른 요청이 계속 들어오는 날이에요. 일 자체는 어렵지 않아도 끊긴 자리를 다시 붙잡는 데 힘이 쌓여요.',
  VAGUE:
    '어디까지 하면 끝인지 아무도 말해 주지 않은 일이에요. 끝을 스스로 정하다 보니 다 하고 나서도 끝난 것 같지 않아요.',
  EMPTY: '넘긴 결과가 어디로 가는지 보이지 않는 일이에요. 잘 만들어도 잘 만든 티가 나지 않아 손에 남는 게 없어요.',
  TENSION: '그 자리에서 하지 못한 말이 집에 와서도 떠오르는 관계예요. 일보다 사람 쪽에 힘이 먼저 쓰여요.',
  OVERLOAD:
    '해야 할 일이 겹치고 끝나는 날짜까지 붙어 있는 때예요. 하나를 붙들면 다른 하나가 밀려서 어느 쪽도 편하지 않아요.',
  STUCK: '더 나은 방법이 보이는데 그대로 하라고 정해진 일이에요. 손보다 마음이 먼저 지쳐요.',
} as const satisfies Record<DrainFacet, string>

export const NEED_DETAILS = {
  AUT: '무엇을 하느냐보다 어떻게 할지 고를 수 있느냐가 힘을 좌우해요. 같은 일도 순서를 직접 잡으면 훨씬 가볍게 느껴져요.',
  MASTER: '어제보다 조금 나아진 게 눈에 보일 때 계속할 힘이 생겨요. 익숙해진 일만 반복되면 잘하고 있어도 흥이 빠져요.',
  IMPACT:
    '넘긴 것이 누구에게 어떻게 쓰이는지 보일 때 일이 살아나요. 쓰임이 보이지 않으면 분량이 적어도 무겁게 느껴져요.',
  BELONG:
    '믿고 말할 수 있는 사람이 옆에 있으면 어려운 일도 넘어가요. 관계가 얕은 자리에서는 일보다 눈치에 힘이 쓰여요.',
  STABLE:
    '다음 주에 무슨 일이 있을지 알 수 있는 생활이 바탕이 돼요. 예고 없이 바뀌는 일정이 이어지면 일보다 그쪽이 먼저 지쳐요.',
  NOVEL: '처음 보는 문제 앞에서 오히려 손이 빨라져요. 다 아는 일만 이어지면 시간이 느리게 가요.',
} as const satisfies Record<NeedFacet, string>

export const ENVIRONMENT_DETAILS = {
  FOCUS_ENV: '하루에 끊기지 않는 시간이 얼마나 있느냐가 결과를 갈라요. 짧게 여러 번보다 길게 한 번이 훨씬 멀리 가요.',
  TOGETHER_ENV:
    '막혔을 때 바로 물어볼 사람이 가까이 있어야 해요. 답을 기다리는 시간이 길어지면 일보다 기다림이 힘을 빼요.',
  FREEDOM_ENV:
    '무엇을 먼저 할지 스스로 정할 수 있는 자리가 맞아요. 순서까지 정해져서 내려오면 같은 일도 남의 일처럼 느껴져요.',
  CLEAR_ENV:
    '내 몫이 어디까지고 언제 끝인지 적혀 있어야 편해요. 경계가 흐린 자리에서는 다 하고도 마음이 놓이지 않아요.',
  VARIETY_ENV:
    '역할이 조금씩 바뀌고 새 문제가 들어오는 자리가 맞아요. 같은 일이 오래 이어지면 익숙함이 지루함으로 바뀌어요.',
  VISIBLE_ENV:
    '만든 것이 쓰이는 장면을 직접 볼 수 있어야 해요. 결과가 보이지 않는 자리에서는 잘해도 실감이 나지 않아요.',
} as const satisfies Record<EnvironmentFacet, string>

export const INTEREST_DETAILS = {
  MAKE: '설명을 듣는 것보다 직접 만들어 보는 쪽이 빨라요. 손에 잡히는 결과가 나올 때 다음 단계가 저절로 보여요.',
  ANALYZE: '결론보다 왜 그렇게 됐는지가 먼저 궁금해져요. 어긋난 지점을 찾아낼 때 시간이 빨리 가요.',
  CREATE: '없던 형태를 처음 만들어 보는 일에 손이 먼저 가요. 정해진 틀을 채우는 일보다 틀을 짜는 쪽이 재미있어요.',
  HELP: '막혀 있는 사람이 눈에 먼저 들어와요. 그 사람이 다시 움직이는 걸 볼 때 힘이 돌아와요.',
  LEAD: '흩어진 사람과 일을 한 방향으로 모으는 자리가 편해요. 다음에 무엇을 할지 정해서 나눌 때 속도가 붙어요.',
  ORDER: '어수선한 것을 순서대로 놓을 때 마음이 편해져요. 기준이 서면 그다음은 알아서 굴러간다고 느껴요.',
} as const satisfies Record<InterestFacet, string>

export const PURPOSE_DETAILS = {
  SOLVE: '막혀 있던 것이 풀려서 실제로 달라졌을 때 일이 의미를 얻어요. 바뀐 게 없으면 애쓴 시간도 흐릿해져요.',
  UNDERSTAND: '겉으로만 정리하고 넘어가면 찜찜함이 남아요. 끝까지 알아냈을 때 비로소 끝났다고 느껴요.',
  EXPRESS: '머릿속에 있던 것이 밖에서 형태를 얻을 때 힘이 나요. 누군가 그걸 보고 반응할 때 한 번 더 힘이 나요.',
  CARE: '옆 사람이 다시 걸어가는 걸 볼 때 일한 보람이 생겨요. 성과보다 그 장면이 오래 남아요.',
  MOVE: '멈춰 있던 일이 다시 굴러갈 때 신이 나요. 민 만큼 앞으로 나간 게 보이면 더 밀고 싶어져요.',
  STEADY: '정한 것을 오래 지켜 냈을 때 스스로에 대한 믿음이 쌓여요. 눈에 띄지 않아도 무너지지 않은 게 결과라고 느껴요.',
} as const satisfies Record<PurposeFacet, string>
