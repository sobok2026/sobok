import type { DrainFacet, InterestFacet, NeedFacet } from '../model'

// Paid content. The closing section's question bank.
//
// Three questions, drawn from three different dimensions rather than three from one: the drain leader, the
// interest leader and the need leader. Drawing all three from one tally would make the section a fourth
// restatement of a block the reader has already read twice.
//
// Every entry is a question the reader answers about their own week, never one the report answers for them.
// That is the whole point of closing on questions instead of a summary — a summary would be the engine having
// the last word about a person, and §4.3's claim boundary does not license that. So no entry may contain a
// finding, a recommendation, or a second sentence that hints at the expected answer.
//
// Answerable from memory, inside a week, with nobody else's permission. A question that needs a manager's
// agreement or a month of tracking is one the reader silently fails, which is worse than not asking.

export const REFLECTION_BY_DRAIN = {
  BREAK: '이번 주에 끊기지 않고 이어서 일한 시간은 언제 생겼나요?',
  VAGUE: '지금 맡은 일 가운데 어디까지 하면 끝인지 적혀 있는 것은 무엇인가요?',
  EMPTY: '넘긴 결과를 누가 받아 가는지 이름을 댈 수 있는 일은 어떤 것인가요?',
  TENSION: '그 자리에서 하지 못하고 남겨 둔 말은 주로 어떤 종류였나요?',
  OVERLOAD: '겹친 일 가운데 하나를 뒤로 미룰 수 있다면 무엇을 고르겠어요?',
  STUCK: '방법을 바꿔 보자고 말할 수 있었던 자리와 그러지 못한 자리는 무엇이 달랐나요?',
} as const satisfies Record<DrainFacet, string>

export const REFLECTION_BY_INTEREST = {
  MAKE: '최근에 직접 만들어서 끝까지 가 본 것은 무엇이었나요?',
  ANALYZE: '이유를 파고들다가 시간 가는 줄 몰랐던 일은 무엇이었나요?',
  CREATE: '없던 형태를 처음 만들어 본 일은 언제였고 그때 무엇이 남았나요?',
  HELP: '누군가 다시 움직이게 도운 일 가운데 기억에 남는 장면은 무엇인가요?',
  LEAD: '흩어진 일을 한 방향으로 모아 본 경험은 어떤 자리에서 생겼나요?',
  ORDER: '어수선하던 것을 순서대로 놓았을 때 무엇이 달라졌나요?',
} as const satisfies Record<InterestFacet, string>

export const REFLECTION_BY_NEED = {
  AUT: '지금 하는 일에서 순서를 직접 정할 수 있는 부분은 어디까지인가요?',
  MASTER: '요즘 새로 배우고 있다고 느끼는 부분은 무엇인가요?',
  IMPACT: '만든 결과가 실제로 쓰이는 장면을 본 적은 언제였나요?',
  BELONG: '막혔을 때 바로 연락할 수 있는 사람은 지금 몇 걸음 거리에 있나요?',
  STABLE: '다음 달 일정 가운데 지금 알고 있는 것은 어디까지인가요?',
  NOVEL: '최근에 처음 해 본 일은 무엇이었고 그때 시간은 어떻게 흘렀나요?',
} as const satisfies Record<NeedFacet, string>

/** Which block the question came out of, shown beside it so a reader can go back and re-read that block. */
export const REFLECTION_SOURCE = {
  drain: '지치는 조건에서',
  interest: '끌리는 일의 결에서',
  need: '오래 일하게 하는 조건에서',
} as const

/**
 * Why this dimension is worth a week, one line each. Authored per dimension rather than per facet: the
 * question already changes with the facet, and what does not change is the reason that kind of question repays
 * being carried around instead of answered on the spot.
 *
 * Still not an answer, and still not a hint at one. Each line says what the reader will be able to see after a
 * week that they cannot see today, which is the only thing the report can honestly promise about a question.
 */
export const REFLECTION_WHY = {
  drain:
    '힘이 빠지는 조건은 그날의 기분과 섞여 있어서 한 번의 기억으로는 갈라지지 않아요. 한 주를 놓고 보면 매번 같이 나타난 조건이 하나쯤 드러나요.',
  interest:
    '손이 먼저 가는 쪽은 잘하는 쪽과 겹치기도 하고 갈리기도 해요. 실제로 시간이 빨리 갔던 장면을 모아 두면 그 둘이 어디서 갈라지는지 보여요.',
  need: '있을 때는 잘 보이지 않고 없을 때만 티가 나는 조건이에요. 한 주 동안 어떤 날이 유난히 무거웠는지 적어 두면 무엇이 빠져 있었는지 뒤늦게 잡혀요.',
} as const satisfies Record<keyof typeof REFLECTION_SOURCE, string>

export const REFLECTION_CLOSING =
  '지금 답을 다 내지 않아도 괜찮아요. 세 질문은 한 주 동안 곁에 두고 떠오를 때마다 적어 보라고 놓은 것이에요.'
