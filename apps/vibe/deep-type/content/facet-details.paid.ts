import type { DrainFacet, EnvironmentFacet, InterestFacet, NeedFacet, PurposeFacet } from '../model'

// Paid content. Two authored paragraphs per work facet, sixty in all.
//
// `work-labels.*` already carries two strings per facet, and neither can do this job. `name` is the facet's
// title and has to stay short enough to sit in a chip; `action` is the one reversible choice the facet
// suggests, which is advice rather than description. What was missing is the middle — what the condition
// actually looks like in someone's week — and its absence is why the report read as a list of headings.
//
// `detail` is that middle. Two sentences each, and the second is never a restatement of the first: the first
// says what the scene looks like and the second says what it costs or gives. A facet whose two sentences say
// the same thing twice is the defect to catch in review.
//
// `contrast` is the same condition read from the other side, and it is the field that turns a facet from a label
// into something a reader can check against a real week. The direction is fixed per dimension and is not a
// matter of taste:
//
//   need / environment / interest / purpose — what shows up in the place where this is MISSING.
//   drain — what comes back when this condition EASES.
//
// Drain runs the other way because drain facets already name the adverse condition; asking what its absence
// looks like would be asking what a good week looks like, which is the other four dimensions' job.
//
// Descriptive only, both fields. These paragraphs are read out under a facet the respondent's own picks put in
// front, so a sentence that told them what to do would be advice attributed to their answers. The advice lives
// in `action` and is rendered beside this, never inside it.

export interface FacetDetail {
  /** The same condition from the other side. See the per-dimension direction above. */
  contrast: string
  detail: string
}

export const DRAIN_DETAILS = {
  BREAK: {
    contrast:
      '끊김이 줄어든 날에는 같은 분량이 훨씬 짧게 느껴져요. 붙잡고 있던 실을 놓지 않아도 되니까 마무리까지 한 번에 가요.',
    detail:
      '한 가지를 붙들고 있는데 다른 요청이 계속 들어오는 날이에요. 일 자체는 어렵지 않아도 끊긴 자리를 다시 붙잡는 데 힘이 쌓여요.',
  },
  VAGUE: {
    contrast:
      '끝이 적혀 있는 일에서는 속도가 눈에 띄게 붙어요. 어디까지 하면 되는지 알 때 스스로 늘려 잡는 습관도 멈춰요.',
    detail:
      '어디까지 하면 끝인지 아무도 말해 주지 않은 일이에요. 끝을 스스로 정하다 보니 다 하고 나서도 끝난 것 같지 않아요.',
  },
  EMPTY: {
    contrast:
      '받아 가는 사람이 보이면 같은 일이 갑자기 가벼워져요. 어디에 쓰였는지 한 줄만 들어도 다음 일에 손이 빨리 나가요.',
    detail: '넘긴 결과가 어디로 가는지 보이지 않는 일이에요. 잘 만들어도 잘 만든 티가 나지 않아 손에 남는 게 없어요.',
  },
  TENSION: {
    contrast:
      '할 말을 그 자리에서 할 수 있으면 저녁이 조용해져요. 사람 쪽으로 새던 힘이 일 쪽으로 돌아오는 게 바로 느껴져요.',
    detail: '그 자리에서 하지 못한 말이 집에 와서도 떠오르는 관계예요. 일보다 사람 쪽에 힘이 먼저 쓰여요.',
  },
  OVERLOAD: {
    contrast:
      '하나를 확실히 뒤로 미룰 수 있으면 남은 것들이 제자리를 찾아요. 겹치지 않은 주에는 일의 양이 같아도 덜 무거워요.',
    detail:
      '해야 할 일이 겹치고 끝나는 날짜까지 붙어 있는 때예요. 하나를 붙들면 다른 하나가 밀려서 어느 쪽도 편하지 않아요.',
  },
  STUCK: {
    contrast:
      '방법을 바꿔 보자고 말할 수 있는 자리에서는 같은 일도 재미가 붙어요. 한 번 받아들여진 경험이 있으면 다음 제안이 훨씬 쉬워져요.',
    detail: '더 나은 방법이 보이는데 그대로 하라고 정해진 일이에요. 손보다 마음이 먼저 지쳐요.',
  },
} as const satisfies Record<DrainFacet, FacetDetail>

export const NEED_DETAILS = {
  AUT: {
    contrast:
      '고를 수 있는 게 없는 자리에서는 일의 난도와 상관없이 남의 일처럼 느껴져요. 순서까지 정해져서 내려오면 잘해도 흥이 붙지 않아요.',
    detail:
      '무엇을 하느냐보다 어떻게 할지 고를 수 있느냐가 힘을 좌우해요. 같은 일도 순서를 직접 잡으면 훨씬 가볍게 느껴져요.',
  },
  MASTER: {
    contrast:
      '늘고 있다는 감각이 사라지면 성과가 나와도 마음이 식어요. 잘하는 일만 반복되는 시기에 오래 머무는 게 가장 위험해요.',
    detail:
      '어제보다 조금 나아진 게 눈에 보일 때 계속할 힘이 생겨요. 익숙해진 일만 반복되면 잘하고 있어도 흥이 빠져요.',
  },
  IMPACT: {
    contrast:
      '쓰임이 보이지 않으면 분량이 적어도 무겁게 느껴져요. 누가 받아 가는지 모르는 채로 오래 하면 열심히 한 기억만 남아요.',
    detail:
      '넘긴 것이 누구에게 어떻게 쓰이는지 보일 때 일이 살아나요. 쓰임이 보이지 않으면 분량이 적어도 무겁게 느껴져요.',
  },
  BELONG: {
    contrast:
      '믿고 말할 사람이 없는 자리에서는 일보다 눈치에 힘이 쓰여요. 실력이 아니라 혼자라는 느낌이 먼저 사람을 지치게 해요.',
    detail:
      '믿고 말할 수 있는 사람이 옆에 있으면 어려운 일도 넘어가요. 관계가 얕은 자리에서는 일보다 눈치에 힘이 쓰여요.',
  },
  STABLE: {
    contrast:
      '예고 없이 바뀌는 일정이 이어지면 일보다 그쪽이 먼저 지쳐요. 다음 주를 그릴 수 없는 상태가 길어지면 집중도 같이 흩어져요.',
    detail:
      '다음 주에 무슨 일이 있을지 알 수 있는 생활이 바탕이 돼요. 예고 없이 바뀌는 일정이 이어지면 일보다 그쪽이 먼저 지쳐요.',
  },
  NOVEL: {
    contrast: '다 아는 일만 이어지면 시간이 느리게 가요. 새로 만질 것이 없는 자리에서는 성실함으로 버티다 소진돼요.',
    detail: '처음 보는 문제 앞에서 오히려 손이 빨라져요. 다 아는 일만 이어지면 시간이 느리게 가요.',
  },
} as const satisfies Record<NeedFacet, FacetDetail>

export const ENVIRONMENT_DETAILS = {
  FOCUS_ENV: {
    contrast:
      '짧게 여러 번 끊기는 하루에서는 결과물의 질이 먼저 떨어져요. 남은 일이 아니라 다시 붙잡는 일에 시간이 들어가요.',
    detail: '하루에 끊기지 않는 시간이 얼마나 있느냐가 결과를 갈라요. 짧게 여러 번보다 길게 한 번이 훨씬 멀리 가요.',
  },
  TOGETHER_ENV: {
    contrast:
      '물어볼 사람이 멀면 답을 기다리는 시간이 일보다 커져요. 혼자 판단해서 밀고 간 뒤에 되돌리는 일도 늘어나요.',
    detail: '막혔을 때 바로 물어볼 사람이 가까이 있어야 해요. 답을 기다리는 시간이 길어지면 일보다 기다림이 힘을 빼요.',
  },
  FREEDOM_ENV: {
    contrast:
      '순서까지 정해져서 내려오는 자리에서는 같은 일도 남의 일처럼 느껴져요. 맡은 범위가 좁을수록 책임감도 같이 줄어들어요.',
    detail:
      '무엇을 먼저 할지 스스로 정할 수 있는 자리가 맞아요. 순서까지 정해져서 내려오면 같은 일도 남의 일처럼 느껴져요.',
  },
  CLEAR_ENV: {
    contrast: '경계가 흐린 자리에서는 다 하고도 마음이 놓이지 않아요. 어디까지가 내 몫인지 매번 확인하는 데 힘이 새요.',
    detail: '내 몫이 어디까지고 언제 끝인지 적혀 있어야 편해요. 경계가 흐린 자리에서는 다 하고도 마음이 놓이지 않아요.',
  },
  VARIETY_ENV: {
    contrast:
      '같은 일이 오래 이어지면 익숙함이 지루함으로 바뀌어요. 새 문제가 들어오지 않는 자리에서 가장 먼저 마음이 떠나요.',
    detail:
      '역할이 조금씩 바뀌고 새 문제가 들어오는 자리가 맞아요. 같은 일이 오래 이어지면 익숙함이 지루함으로 바뀌어요.',
  },
  VISIBLE_ENV: {
    contrast: '결과가 보이지 않는 자리에서는 잘해도 실감이 나지 않아요. 반응이 없는 상태가 길어지면 기준도 흐려져요.',
    detail: '만든 것이 쓰이는 장면을 직접 볼 수 있어야 해요. 결과가 보이지 않는 자리에서는 잘해도 실감이 나지 않아요.',
  },
} as const satisfies Record<EnvironmentFacet, FacetDetail>

export const INTEREST_DETAILS = {
  MAKE: {
    contrast:
      '만들 것 없이 정리만 이어지는 자리에서는 흥이 빨리 식어요. 회의에서 오래 다듬기보다 초안 하나를 만들어 놓는 쪽이 빨라요.',
    detail: '설명을 듣는 것보다 직접 만들어 보는 쪽이 빨라요. 손에 잡히는 결과가 나올 때 다음 단계가 저절로 보여요.',
  },
  ANALYZE: {
    contrast:
      '왜인지 묻지 못하고 넘어가는 일이 쌓이면 마음이 찜찜해져요. 근거를 보지 못한 결론을 전달만 하는 자리에서 가장 지쳐요.',
    detail: '결론보다 왜 그렇게 됐는지가 먼저 궁금해져요. 어긋난 지점을 찾아낼 때 시간이 빨리 가요.',
  },
  CREATE: {
    contrast:
      '틀이 이미 정해진 일만 이어지면 손이 늦어져요. 채우는 몫만 남은 자리에서는 잘해도 내 것이라는 느낌이 들지 않아요.',
    detail: '없던 형태를 처음 만들어 보는 일에 손이 먼저 가요. 정해진 틀을 채우는 일보다 틀을 짜는 쪽이 재미있어요.',
  },
  HELP: {
    contrast:
      '사람이 보이지 않는 일에서는 성과가 나도 남는 게 적어요. 도움이 닿았는지 확인할 수 없으면 같은 일이 공허해져요.',
    detail: '막혀 있는 사람이 눈에 먼저 들어와요. 그 사람이 다시 움직이는 걸 볼 때 힘이 돌아와요.',
  },
  LEAD: {
    contrast:
      '방향을 정할 수 없는 자리에서는 실행만 남아 답답해져요. 결정이 다른 곳에서 내려올 때 속도보다 의욕이 먼저 떨어져요.',
    detail: '흩어진 사람과 일을 한 방향으로 모으는 자리가 편해요. 다음에 무엇을 할지 정해서 나눌 때 속도가 붙어요.',
  },
  ORDER: {
    contrast:
      '기준 없이 굴러가는 자리에서는 일보다 어수선함이 먼저 힘을 빼요. 정리할 권한이 없으면 눈에 보이는 게 계속 걸려요.',
    detail: '어수선한 것을 순서대로 놓을 때 마음이 편해져요. 기준이 서면 그다음은 알아서 굴러간다고 느껴요.',
  },
} as const satisfies Record<InterestFacet, FacetDetail>

export const PURPOSE_DETAILS = {
  SOLVE: {
    contrast: '바뀐 게 없으면 애쓴 시간도 흐릿해져요. 같은 문제가 그대로 남은 채 다음 일로 넘어갈 때 가장 힘이 빠져요.',
    detail: '막혀 있던 것이 풀려서 실제로 달라졌을 때 일이 의미를 얻어요. 바뀐 게 없으면 애쓴 시간도 흐릿해져요.',
  },
  UNDERSTAND: {
    contrast:
      '겉으로만 정리하고 넘어가면 찜찜함이 남아요. 알아낼 시간을 받지 못한 일은 끝났다고 적어 놓고도 끝난 것 같지 않아요.',
    detail: '겉으로만 정리하고 넘어가면 찜찜함이 남아요. 끝까지 알아냈을 때 비로소 끝났다고 느껴요.',
  },
  EXPRESS: {
    contrast:
      '밖으로 꺼낼 자리가 없으면 안에 쌓인 것이 무게가 돼요. 반응이 돌아오지 않는 일에서는 다음 것을 만들 힘이 잘 생기지 않아요.',
    detail: '머릿속에 있던 것이 밖에서 형태를 얻을 때 힘이 나요. 누군가 그걸 보고 반응할 때 한 번 더 힘이 나요.',
  },
  CARE: {
    contrast:
      '사람이 어떻게 됐는지 모르고 넘어가는 일이 쌓이면 마음이 마모돼요. 성과만 남고 장면이 남지 않을 때 가장 허전해요.',
    detail: '옆 사람이 다시 걸어가는 걸 볼 때 일한 보람이 생겨요. 성과보다 그 장면이 오래 남아요.',
  },
  MOVE: {
    contrast: '민 만큼 나가지 않으면 힘을 쓴 자리부터 지쳐요. 멈춰 있는 일을 오래 붙들면 밀 힘 자체가 줄어들어요.',
    detail: '멈춰 있던 일이 다시 굴러갈 때 신이 나요. 민 만큼 앞으로 나간 게 보이면 더 밀고 싶어져요.',
  },
  STEADY: {
    contrast:
      '정한 것을 지키지 못하고 흐트러지면 결과와 상관없이 마음이 상해요. 기준이 자주 바뀌는 자리에서는 쌓이는 게 없다고 느껴요.',
    detail:
      '정한 것을 오래 지켜 냈을 때 스스로에 대한 믿음이 쌓여요. 눈에 띄지 않아도 무너지지 않은 게 결과라고 느껴요.',
  },
} as const satisfies Record<PurposeFacet, FacetDetail>
