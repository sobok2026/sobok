import type { ClarityBand } from '../model'

// Paid content. What the composed opening (`worker/report/compose.ts`) adds on top of the shared axis scenes —
// the settled ruler's framing, and the strings that hold the reading together.
//
// The pole paragraphs are NOT here. They used to be, as `POLE_SIGNATURE`, and that was the wrong tier: the
// eight letters are a free deliverable (§4.1 rows 1-3), so a free screen that could not describe its own axes
// in prose was left rendering a legend while the paid report held the only sentences that explained it. They
// live in `content/reading.free.ts` now and both engines read them, which is also what keeps the free screen
// and the paid opening from describing the same pole two different ways.
//
// What stays paid is the ruler. `BAND_FRAME` is keyed by `band5`, which only the paid pass produces, and it is
// the one thing the opening says about an axis that the free screen cannot.
//
// The composer never ranks axes (§4.3): comparing |lean| across axes measured by five items each is an
// unequated within-person comparison that one flipped answer reorders. So no string here may claim a feature is
// the strongest, the first, or ahead of another, and the opening prints all eight axes in their fixed order
// rather than a selection that would imply one.

/**
 * How firmly the axis landed, in the settled ruler's own terms. Keyed by `band5` so the opening cannot say
 * something the band tables below it contradict. Never says a letter could be different — the poles are frozen
 * (D1) and this is a statement about the spread of the answers, not about the letter.
 *
 * No subject, and that is not brevity: '이 축은' put the report's own unit of measurement in front of a reader
 * who never sees it named anywhere else, and the obvious swap — '이 글자는' — would make the sentence a claim
 * about the letter, which is the one thing D1 forbids. The note sits directly under the paragraph for its own
 * axis, so what it is about is already on screen; starting at 답 says it is about the answers and nothing else.
 */
export const BAND_FRAME = {
  distinct: '답이 한쪽으로 크게 몰렸어요.',
  moderate: '한쪽으로 기울었고 반대쪽을 고른 답도 남아 있어요.',
  faint: '양쪽이 비슷하게 놓였어요. 자리에 따라 다르게 나올 수 있어요.',
  // Unreachable at five odd-weighted items, kept as a real cell for the same reason `CLARITY_BANDS_PAID.tie` is.
  tie: '양쪽 답이 같은 무게로 놓였어요.',
} as const satisfies Record<ClarityBand, string>

/**
 * Closes the lead sentence. What comes before it is `WORLD_JOB_CORE[gem].strength`, so this has to work after
 * any of those 16 strings and may not attach a particle to it.
 */
export const LEAD_JOIN =
  '속유형은 일하는 방식이고 마음의 코어는 그 방식을 밀어 주는 힘이에요. 아래는 이번 답에서 그 둘이 어떻게 만났는지 읽은 것이에요.'

export const DRAIN_OPENING_TAIL = '무엇이 힘을 빼는지는 일의 양보다 조건 쪽에서 갈려요.'

export const OPENING_CLOSING =
  '여기까지가 여덟 글자를 하나씩 읽은 것이에요. 아래 섹션은 같은 답을 조건과 장면으로 나눠서 봐요.'

/**
 * Headings inside the opening, so eleven paragraphs read as three blocks instead of one wall. They are not
 * sections: the report's sections are `section-keys.ts` and these are the opening's own internal order.
 *
 * '네 글자', not '네 축'. The reader met these four as four letters on the free result and the block under this
 * heading prints one paragraph per letter, so the heading counts what is under it in the words already learned.
 */
export const OPENING_BLOCK = {
  inner: '속유형 네 글자',
  gem: '마음의 코어 네 글자',
  work: '이번 답이 가리키는 결',
} as const

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
