import type { AxisId, GemCode, InnerCode, TentativeBand } from '../model'

// The long-form reading, and the tables both tiers read it out of.
//
// It is free content, and that placement is the decision this file records. The eight axes, the world job and
// the strength cards are the free deliverables (§4.1 rows 1-3), so the prose that explains them cannot be paid
// copy without the free screen having to describe its own result in labels alone — which is what it did, and
// why the result read as a legend rather than as a reading. What the paid tier adds is a second ruler over the
// same axes and eight more sections about work; it does not add a second description of the same eight letters.
//
// `AXIS_SCENE` therefore replaces `POLE_SIGNATURE`, which lived in `opening.paid.ts` and said the same thing
// one tier up. One table, both engines, no chance of the free screen and the paid opening describing the same
// pole differently.
//
// Rules the copy follows, all inherited from the tables it grew out of:
//
//   1. A scene describes the pole at work, never the reader. No sentence may read as a verdict on a person, and
//      neither pole may read as a deficit — every scene names what the pole buys and what it costs in the same
//      breath, so the two poles of an axis are two ways of working rather than a better and a worse one.
//   2. Nothing here says how firmly the pole showed. That is `AXIS_BAND_TAIL` on the free side and `BAND_FRAME`
//      on the paid side, both keyed by the band the respective ruler settled. The composer joins them; neither
//      half asserts the other.
//   3. No comparison between axes, ever. Five or three items an axis is an unequated within-person measurement
//      (§4.3), so no string may call a feature the strongest, the first, or ahead of another.

export interface AxisScene {
  /** Three sentences on how this pole shows up across a working week. */
  scene: string
}

type AxisScenes = Readonly<Record<string, AxisScene>>

export const AXIS_SCENE = {
  EI: {
    E: {
      scene:
        '일이 막히면 먼저 말로 꺼내 보는 쪽이에요. 회의든 잡담이든 소리 내어 설명하는 동안 흩어져 있던 게 자리를 잡아요. 사람이 오가는 자리에서 머리가 오히려 맑아지고 말할 상대가 없는 날은 같은 생각을 여러 번 돌게 돼요.',
    },
    I: {
      scene:
        '혼자 정리한 뒤에 꺼내는 쪽이에요. 말이 나올 때는 이미 한 번 걸러진 상태라 흔들림이 적어요. 대신 정리할 시간이 잘리면 말수가 먼저 줄고 자리를 뜨고 싶어져요.',
    },
  },
  SN: {
    S: {
      scene:
        '지금 확인할 수 있는 것부터 짚고 넘어가요. 근거가 손에 잡혀야 다음 걸음이 가벼워져요. 아직 벌어지지 않은 이야기가 길어지면 마음이 붕 뜨고 확인할 수 있는 항목 하나를 찾을 때까지 편하지 않아요.',
    },
    N: {
      scene:
        '눈앞의 사실보다 그것들이 이어지는 모양이 먼저 보여요. 아직 없는 것을 그려 보는 데 쓰는 시간을 아깝게 여기지 않아요. 같은 일이 같은 방식으로만 반복되면 손보다 마음이 먼저 지루해져요.',
    },
  },
  TF: {
    T: {
      scene:
        '같은 기준으로 설명되는지를 먼저 봐요. 사람이 달라도 같은 답이 나오는 구조라야 마음이 놓여요. 그래서 예외를 두자는 이야기가 나오면 그 예외의 근거부터 묻게 돼요.',
    },
    F: {
      scene:
        '그 결정이 누구에게 어떻게 닿을지가 먼저 보여요. 맞는 답인지보다 남을 자국을 오래 생각해요. 결론이 같아도 전하는 순서와 말투를 다듬는 데 시간을 써요.',
    },
  },
  JP: {
    J: {
      scene:
        '시작하기 전에 순서와 끝을 정해 두는 쪽이에요. 정해 두면 흔들릴 일이 줄어서 몸이 가벼워져요. 계획이 도중에 뒤집히는 날에는 일의 양보다 그 변경 자체가 힘을 빼요.',
    },
    P: {
      scene:
        '해 보면서 맞춰 가는 쪽이에요. 선택지를 열어 둔 채 움직일 때 오히려 좋은 수가 나와요. 처음부터 끝까지 정해진 절차만 남으면 같은 일도 몸이 무거워져요.',
    },
  },
  RM: {
    R: {
      scene:
        '값을 매기는 자가 안쪽에 있어요. 반응이 없어도 스스로 납득하면 계속 갈 수 있어요. 대신 스스로 납득하지 못한 일은 남이 좋다고 해도 손이 잘 나가지 않아요.',
    },
    M: {
      scene:
        '주변의 반응이 힘의 온도를 바꿔요. 알아봐 주는 사람이 있을 때 훨씬 멀리 가요. 혼자 오래 붙들어야 하는 일에서는 중간에 한 번 보여 줄 사람을 만들어 두는 편이 나아요.',
    },
  },
  OA: {
    O: {
      scene:
        '움직이기 전에 관계된 사람과 먼저 맞춰 둬요. 어긋남을 줄이는 데 드는 시간을 아깝게 여기지 않아요. 합의가 없는 채로 일이 굴러가면 진도보다 그 불편함이 먼저 신경 쓰여요.',
    },
    A: {
      scene:
        '정할 수 있는 범위를 먼저 잡고 움직여요. 정한 뒤에 알리는 편이 서로 편하다고 느껴요. 매번 허락을 받아야 하는 구조에서는 일의 난도와 상관없이 속도가 떨어져요.',
    },
  },
  VH: {
    V: {
      scene:
        '감정은 말로 꺼내는 동안 이름을 얻어요. 믿는 사람에게 한 번 말하고 나면 문제 크기가 줄어들어요. 말할 자리가 없는 주에는 일보다 그 답답함이 더 오래 남아요.',
    },
    H: {
      scene:
        '감정은 안에서 한 번 정리한 뒤에 꺼내요. 시간이 조금 걸리지만 꺼낼 때는 정돈된 상태예요. 바로 대답하라고 재촉받으면 실제로 느낀 것보다 작게 말하고 넘어가게 돼요.',
    },
  },
  UO: {
    U: {
      scene:
        '얻을 것이 먼저 눈에 들어와요. 새 기회 앞에서 몸이 먼저 움직여요. 지키는 일만 이어지는 자리에서는 잘하고 있어도 흥이 잘 붙지 않아요.',
    },
    O: {
      scene:
        '잃지 않을 것이 먼저 눈에 들어와요. 지킬 것을 확인하고 나서야 손이 나가요. 되돌릴 수 있는 범위가 보이면 오히려 과감해지고 그 범위가 흐릿하면 시작 자체가 늦어져요.',
    },
  },
} as const satisfies Record<AxisId, AxisScenes>

/**
 * One short line under a scene, in the free ruler's own terms. Short on purpose: the axis cards above the
 * reading already carry the band's full copy, and repeating it at paragraph length would make the reading a
 * second rendering of the same block.
 */
export const AXIS_BAND_TAIL = {
  distinct3: '이번 답은 이쪽으로 크게 몰렸어요.',
  moderate3: '이쪽으로 기울었고 반대쪽을 고른 답도 남아 있어요.',
  faint3: '양쪽이 비슷하게 놓였어요. 반대쪽 설명도 같이 읽어 봐요.',
} as const satisfies Record<TentativeBand, string>

/**
 * The working method behind each of the sixteen world-job families, as a paragraph.
 *
 * `WORLD_JOB_FAMILY[inner]` already carries a `method` line and a three-word `role`, and both are sized for a
 * card field. These are what those two were standing in for: what the method looks like on a Tuesday, and the
 * kind of day it goes badly on. They describe the way of working the eight letters point at, never the person.
 */
export const INNER_FAMILY_READING = {
  ENFJ: '사람이 지금 어디까지 왔는지를 먼저 보고 다음 한 걸음을 같이 정하는 방식이에요. 잘한 부분을 짚어 주는 말이 자연스럽게 나오고 그 말이 실제로 상대를 움직여요. 혼자 끝내는 일보다 누군가를 한 단계 올려놓는 일에서 하루가 길게 느껴지지 않아요.',
  ENFP: '따로 놓여 있던 사람과 생각을 붙여 보는 데서 일이 시작돼요. 아직 이름이 없는 것을 먼저 알아보고 판을 벌이는 쪽이라 첫 단계에서 속도가 가장 잘 나요. 다 만들어진 자리를 지키는 일보다 없던 자리를 여는 일에서 힘이 붙어요.',
  ENTJ: '끝 그림을 먼저 세우고 거기서 거꾸로 오늘 할 일을 잘라 오는 방식이에요. 사람과 준비를 어디에 놓아야 목표에 닿는지가 빠르게 보여요. 목적지가 흐린 채로 굴러가는 일에서는 속도보다 그 흐림이 먼저 힘을 빼요.',
  ENTP: '원래 그렇게 해 왔다는 말 앞에서 한 번 더 묻는 쪽이에요. 문제를 다른 각도로 세워 놓으면 답이 훨씬 쉬워진다는 걸 몸으로 알고 있어요. 정해진 절차를 그대로 반복하는 자리보다 절차를 다시 짜도 되는 자리에서 잘 굴러가요.',
  ESFJ: '누가 빠져 있고 누가 아직 말을 못 했는지가 먼저 눈에 들어와요. 일이 굴러가려면 사이가 먼저 편해야 한다는 감각이 있어서 자리를 데우는 몫을 자연스럽게 맡아요. 사람이 서로 등지고 있는 자리에서는 성과보다 그 공기가 먼저 신경 쓰여요.',
  ESFP: '그 자리의 온도를 읽고 바로 반응을 만드는 방식이에요. 준비한 대본이 없어도 지금 앞에 있는 사람에게 맞춰 흐름을 바꿀 수 있어요. 반응이 오지 않는 일을 오래 붙들고 있으면 실력과 상관없이 힘이 빠져요.',
  ESTJ: '말로 끝난 것을 실제로 끝나게 만드는 방식이에요. 누가 무엇을 언제까지 하는지 나눠 놓으면 그다음은 알아서 굴러간다고 느껴요. 기준 없이 각자 알아서 하자는 자리에서는 일의 양보다 그 모호함이 먼저 지치게 해요.',
  ESTP: '생각을 오래 굴리기보다 일단 손을 대 보고 답을 찾는 방식이에요. 상황이 급해질수록 오히려 판단이 빨라지고 몸이 먼저 나가요. 아무 일도 벌어지지 않는 긴 회의에서 가장 빨리 지쳐요.',
  INFJ: '여러 사람이 한 말 아래에 깔린 진짜 주제를 찾아내는 방식이에요. 눈앞의 요구를 그대로 받는 대신 그게 무엇을 향한 것인지 먼저 정리해요. 방향이 서면 조용히 오래 밀고 갈 수 있고 방향이 없는 일에는 손이 잘 붙지 않아요.',
  INFP: '중요하다고 느낀 것을 남는 형태로 옮겨 놓는 방식이에요. 같은 내용도 어떤 말로 담느냐에 따라 달라진다고 느껴서 표현을 오래 고쳐요. 마음이 가지 않는 주제를 다룰 때는 잘하고 못하고와 상관없이 진도가 느려져요.',
  INTJ: '지금 결정이 몇 달 뒤에 어디로 이어지는지를 먼저 그려 보는 방식이에요. 순서를 잘 짜 두면 나중에 들일 힘이 크게 줄어든다는 걸 알고 있어요. 즉흥으로 굴러가는 자리에서는 일 자체보다 되돌리는 일이 힘을 빼요.',
  INTP: '답보다 그 답이 나온 이유를 먼저 확인하고 싶어져요. 겉으로 정리된 설명이 있어도 안쪽 구조가 보이지 않으면 넘어가지 못해요. 이유를 물을 수 없는 자리에서는 시키는 대로 해도 손끝이 무거워요.',
  ISFJ: '약속한 것과 달라진 것을 조용히 챙겨 두는 방식이에요. 큰 소리로 드러나지 않아도 빠진 곳을 먼저 알아보고 메워 놓아요. 챙긴 일이 아무 데도 남지 않는 자리에서는 일보다 그 허전함이 오래 남아요.',
  ISFP: '눈과 손으로 먼저 느끼고 그 느낌을 형태로 옮기는 방식이에요. 설명하기 어려운 차이를 알아보고 그 차이를 살려 내는 데 시간을 써요. 결과물의 결을 볼 사람이 없는 자리에서는 만드는 재미가 빨리 식어요.',
  ISTJ: '해야 할 것을 적어 두고 빠진 것을 하나씩 지워 가는 방식이에요. 기준이 정해진 일에서는 흔들림 없이 끝까지 가요. 기준이 자주 바뀌는 자리에서는 일의 난도와 상관없이 피로가 쌓여요.',
  ISTP: '말로 설명을 듣기보다 직접 열어 보고 원인을 찾는 방식이에요. 손에 잡히는 문제 앞에서 판단이 빨라지고 군더더기가 사라져요. 실물 없이 회의만 이어지는 자리에서 가장 빨리 흥미를 잃어요.',
} as const satisfies Record<InnerCode, string>

/**
 * What powers the method, one paragraph per core code.
 *
 * Each entry reads the four core letters together rather than one at a time, which is the whole reason the
 * table has sixteen rows instead of eight: `RM` decides where the value is set and `UO` decides which way the
 * first step points, and the same `R` reads differently beside `U` than beside `O`.
 */
export const GEM_CORE_READING = {
  MAHO: '반응에 따라 온도가 움직이지만 그 온도를 밖으로 바로 꺼내지는 않아요. 혼자 있는 시간에 마음을 한 줄로 정리해 두고 그다음에 사람을 만나요. 지킬 것이 분명한 자리에서 가장 편안하게 움직여요.',
  MAHU: '주변의 반응을 재료로 삼되 결정은 내 범위 안에서 내려요. 떠오른 생각을 바로 꺼내지 않고 혼자 오래 키운 뒤에 보여 줘요. 얻을 것이 보이는 쪽으로 몸이 먼저 기울어요.',
  MAVO: '반응은 살피지만 내 범위를 먼저 정해 두고 움직여요. 느낀 것은 그때그때 말로 꺼내는 편이라 마음이 오래 쌓이지 않아요. 크게 걸지 않고 작게 시작하는 방식이 몸에 맞아요.',
  MAVU: '알아봐 주는 눈이 있으면 훨씬 멀리 가요. 정하는 범위는 내 쪽에 두고 표현은 바로바로 꺼내요. 새로 얻을 것 앞에서 망설이는 시간이 짧아요.',
  MOHO: '사람들의 반응이 힘의 온도를 바꾸고 그 반응을 아주 작은 신호에서 먼저 읽어요. 읽은 것은 안에서 정리한 뒤에 꺼내요. 지킬 것을 확인하고 나서 움직이는 쪽이라 급한 결정에는 시간을 달라고 하는 편이 나아요.',
  MOHU: '상대가 하지 않은 말까지 오래 곱씹는 쪽이에요. 맞춰 두는 일을 먼저 하고 감정은 안에서 정리한 뒤에 꺼내요. 그 사이에 새로 얻을 것이 보이면 조용히 그쪽으로 방향을 잡아요.',
  MOVO: '어색함이 길어지는 것을 그냥 두지 않고 먼저 말을 붙여요. 느낀 것을 바로 말로 꺼내기 때문에 오해가 오래 남지 않아요. 지키고 싶은 관계 앞에서는 한 박자 조심스러워지는 쪽이에요.',
  MOVU: '혼자 있을 때보다 주고받을 때 생각이 커져요. 맞추는 일과 말하는 일을 모두 먼저 하는 편이라 판이 빨리 데워져요. 새로 얻을 것이 보이면 사람을 모아 그쪽으로 움직여요.',
  RAHO: '값을 매기는 자가 안쪽에 있어서 반응이 없어도 흔들림이 적어요. 정할 범위를 스스로 잡고 감정은 안에서 정리해요. 지킬 것을 먼저 확인하는 쪽이라 결정이 늦어 보여도 되돌리는 일이 적어요.',
  RAHU: '남의 평가보다 스스로 납득했는지가 기준이에요. 방해가 줄어들수록 깊이가 생기고 그 시간에 결과가 나와요. 얻을 것이 보이는 쪽으로는 혼자서도 멀리 가요.',
  RAVO: '내 기준으로 값을 매기고 범위도 내가 정해요. 느낀 것은 바로 말로 꺼내는 편이라 안에 오래 담아 두지 않아요. 지금 가진 흐름을 지키는 쪽이라 큰 변화보다 작은 조정을 먼저 골라요.',
  RAVU: '허락을 기다리기보다 정할 수 있는 범위 안에서 먼저 움직여요. 생각과 감정을 바로 꺼내기 때문에 방향이 주변에 빨리 전해져요. 얻을 것 앞에서 출발이 빠른 쪽이에요.',
  ROHO: '내 기준을 들고 가되 관계된 사람과 먼저 맞춰 두는 쪽이에요. 감정은 안에서 정리한 뒤에 꺼내고 지킬 것을 확인하고 나서 손을 내밀어요. 오래 이어 온 것을 흔들지 않는 방식으로 힘을 써요.',
  ROHU: '스스로 납득한 일은 반응이 없어도 계속 밀어요. 주변과 먼저 맞춰 두고 감정은 안에서 정리해요. 얻을 것이 분명해지면 조용히 오래 가는 쪽이에요.',
  ROVO: '내 기준으로 판단하면서도 관계에서는 먼저 다가가는 쪽이에요. 느낀 것을 바로 말하기 때문에 사이에 앙금이 잘 남지 않아요. 지킬 것을 먼저 보는 쪽이라 약속을 가볍게 바꾸지 않아요.',
  ROVU: '값은 내 안에서 매기지만 움직일 때는 사람을 데리고 가요. 생각과 감정을 바로 꺼내 방향을 나누고 얻을 것이 보이면 출발이 빨라요. 혼자 결정하고 혼자 끝내는 방식보다 같이 가는 방식이 몸에 맞아요.',
} as const satisfies Record<GemCode, string>

/** Chapter headings and the line under each, in reading order. */
export const READING_CHAPTER = {
  worldJob: {
    intro: '두 코드가 만나 이름 하나가 나왔어요. 이름보다 그 아래에서 무엇이 어떻게 움직이는지를 읽어 봐요.',
    title: '내 세계관 직업을 풀어 읽으면',
  },
  inner: {
    intro: '속유형 네 글자는 일하는 방식이에요. 네 축이 하루 어디에서 보이는지 하나씩 놓았어요.',
    title: '속유형 네 축이 보이는 자리',
  },
  gem: {
    intro: '마음의 코어 네 글자는 그 방식을 밀어 주는 힘이에요. 무엇이 힘을 넣고 무엇이 힘을 빼는지 봐요.',
    title: '마음의 코어 네 축이 힘을 대는 자리',
  },
  closing: {
    intro: '여기까지가 스물일곱 문항이 말해 줄 수 있는 범위예요.',
    title: '이 결과를 어디까지 읽으면 될까',
  },
} as const

/** Kicker over the two world-job paragraphs, so each names which half of the code it came out of. */
export const READING_KICKER = {
  family: '일하는 방식',
  core: '방식을 미는 힘',
} as const

export const READING_CHAPTER_ORDER = ['worldJob', 'inner', 'gem', 'closing'] as const

export type ReadingChapterId = (typeof READING_CHAPTER_ORDER)[number]

/**
 * The closing chapter, authored rather than composed. It says what the free sitting can and cannot carry, and
 * it says it in the reading's own voice instead of leaving that to the small print under the cards.
 */
export const READING_CLOSING_PARAGRAPHS = [
  '여기 적힌 것은 오늘 고른 답을 정리한 것이에요. 사람을 설명하는 문장이 아니라 이번 답이 어느 쪽으로 놓였는지를 옮긴 것이라고 읽어 주세요.',
  '읽다가 어긋난다고 느낀 대목이 있으면 그 대목이 가장 쓸모 있어요. 어떤 자리에서 그렇게 느꼈는지 한 줄로 적어 두면 다음에 같은 장면이 왔을 때 알아보기 쉬워져요.',
] as const

/** One line to close the whole reading on. Not advice — a place to put the reading down. */
export const READING_CLOSING_NOTE =
  '오늘 읽은 것 가운데 하나만 골라 이번 주에 확인해 봐요. 여덟 축을 다 들고 다닐 필요는 없어요.'
