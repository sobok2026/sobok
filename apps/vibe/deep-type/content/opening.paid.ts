import type { AxisId, ClarityBand } from '../model'

// Paid content. The raw material of the composed opening (`worker/report/compose.ts`), which is the section a
// reader meets first and the one the report used to ship without whenever the narrator was off.
//
// Two rules hold this table together.
//
//   1. A pole line describes the pole at work, never the reader. `_content/ko.ts` already carries a pole
//      `description` and it is a sentence fragment sized for a chip under a bar; these are the paragraph that
//      fragment was standing in for, written for a career report rather than for a legend.
//   2. Nothing here says how strongly the pole showed. That is `BAND_FRAME`, keyed by the settled band, and
//      keeping the two apart is what stops a distinct-band sentence from being written into a pole that landed
//      near even. The composer joins them; neither half asserts the other.
//
// The composer selects features BY BAND and never by lean magnitude (§4.3): comparing |lean| across axes
// measured by five items each is an unequated within-person comparison that one flipped answer reorders. So no
// string here may claim a feature is the strongest, the first, or ahead of another.

export interface PoleSignature {
  /** Both poles of every axis carry one. Neither pole is a deficit and neither line may read as a warning. */
  line: string
}

type AxisSignature = Readonly<Record<string, PoleSignature>>

export const POLE_SIGNATURE = {
  EI: {
    E: {
      line: '일이 막히면 먼저 말로 꺼내 보는 쪽이에요. 회의든 잡담이든 소리 내어 설명하는 동안 흩어져 있던 게 자리를 잡아요.',
    },
    I: {
      line: '혼자 정리한 뒤에 꺼내는 쪽이에요. 말이 나올 때는 이미 한 번 걸러진 상태라 흔들림이 적어요.',
    },
  },
  SN: {
    S: {
      line: '지금 확인할 수 있는 것부터 짚고 넘어가요. 근거가 손에 잡혀야 다음 걸음이 가벼워져요.',
    },
    N: {
      line: '눈앞의 사실보다 그것들이 이어지는 모양이 먼저 보여요. 아직 없는 것을 그려 보는 데 쓰는 시간을 아깝게 여기지 않아요.',
    },
  },
  TF: {
    T: {
      line: '같은 기준으로 설명되는지를 먼저 봐요. 사람이 달라도 같은 답이 나오는 구조라야 마음이 놓여요.',
    },
    F: {
      line: '그 결정이 누구에게 어떻게 닿을지가 먼저 보여요. 맞는 답인지보다 남을 자국을 오래 생각해요.',
    },
  },
  JP: {
    J: {
      line: '시작하기 전에 순서와 끝을 정해 두는 쪽이에요. 정해 두면 흔들릴 일이 줄어서 몸이 가벼워져요.',
    },
    P: {
      line: '해 보면서 맞춰 가는 쪽이에요. 선택지를 열어 둔 채 움직일 때 오히려 좋은 수가 나와요.',
    },
  },
  RM: {
    R: {
      line: '값을 매기는 자가 안쪽에 있어요. 반응이 없어도 스스로 납득하면 계속 갈 수 있어요.',
    },
    M: {
      line: '주변의 반응이 힘의 온도를 바꿔요. 알아봐 주는 사람이 있을 때 훨씬 멀리 가요.',
    },
  },
  OA: {
    O: {
      line: '움직이기 전에 관계된 사람과 먼저 맞춰 둬요. 어긋남을 줄이는 데 드는 시간을 아깝게 여기지 않아요.',
    },
    A: {
      line: '정할 수 있는 범위를 먼저 잡고 움직여요. 정한 뒤에 알리는 편이 서로 편하다고 느껴요.',
    },
  },
  VH: {
    V: {
      line: '감정은 말로 꺼내는 동안 이름을 얻어요. 믿는 사람에게 한 번 말하고 나면 문제 크기가 줄어들어요.',
    },
    H: {
      line: '감정은 안에서 한 번 정리한 뒤에 꺼내요. 시간이 조금 걸리지만 꺼낼 때는 정돈된 상태예요.',
    },
  },
  UO: {
    U: {
      line: '얻을 것이 먼저 눈에 들어와요. 새 기회 앞에서 몸이 먼저 움직여요.',
    },
    O: {
      line: '잃지 않을 것이 먼저 눈에 들어와요. 지킬 것을 확인하고 나서야 손이 나가요.',
    },
  },
} as const satisfies Record<AxisId, AxisSignature>

/**
 * How firmly the axis landed, in the settled ruler's own terms. Keyed by `band5` so the opening cannot say
 * something the band tables below it contradict. Never says a letter could be different — the poles are frozen
 * (D1) and this is a statement about the spread of the answers, not about the letter.
 */
export const BAND_FRAME = {
  distinct: '이 축은 답이 한쪽으로 크게 몰렸어요.',
  moderate: '이 축은 한쪽으로 기울었고 반대쪽을 고른 답도 남아 있어요.',
  faint: '이 축은 양쪽이 비슷하게 놓였어요. 자리에 따라 다르게 나올 수 있는 쪽이에요.',
  // Unreachable at five odd-weighted items, kept as a real cell for the same reason `CLARITY_BANDS_PAID.tie` is.
  tie: '이 축은 양쪽 답이 같은 무게로 놓였어요.',
} as const satisfies Record<ClarityBand, string>

/**
 * Closes the lead sentence. What comes before it is `WORLD_JOB_CORE[gem].strength`, so this has to work after
 * any of those 16 strings and may not attach a particle to it.
 */
export const LEAD_JOIN =
  '속유형은 일하는 방식이고 마음의 코어는 그 방식을 밀어 주는 힘이에요. 아래는 이번 답에서 그 둘이 어떻게 만났는지 읽은 것이에요.'

/** Used when no axis cleared the near-even band, so the opening has no axis paragraph to lead with. */
export const NO_DISTINCT_AXIS_LINE =
  '이번 답은 여덟 축이 모두 양쪽에 가깝게 놓였어요. 어느 한쪽으로 몰린 자리가 없다는 것도 읽을거리예요. 상황에 맞춰 양쪽을 오가며 쓰는 편이라는 뜻이에요.'

export const NO_DISTINCT_AXIS_KICKER = '여덟 축'

export const DRAIN_OPENING_TAIL = '무엇이 힘을 빼는지는 일의 양보다 조건 쪽에서 갈려요.'

export const OPENING_CLOSING =
  '여기까지가 이번 답에서 뚜렷하게 나온 쪽이에요. 아래 섹션은 같은 답을 조건과 장면으로 나눠서 봐요.'

/** Kicker prefixes. Composed with a name from the profile, so each ends where a name can follow after ' · '. */
export const OPENING_KICKER = {
  combo: '강점',
  drain: '지치는 조건',
  interest: '끌리는 결',
} as const

/** Labels for the `note` line under a composed paragraph. Rendered as `label — value`, never with a particle. */
export const OPENING_NOTE_LABEL = {
  drain: '앞에 놓인 조건',
  interest: '앞에 놓인 관심',
} as const
