import type { BandCopy, BandShift, ClarityBand, DrainSpread } from '../model'
import { DRAIN_SPREAD_MEANING } from './band-labels.free'

// Paid-path band copy. Same two scales, same separation (N7), tentativeness marker dropped: at five items per
// axis nothing further re-derives the clarity read. What stays frozen either way is the pole - the paid tier
// never re-decides a letter, it only re-decides how loudly the ruler is drawn beside it.
//
// Paid faint sits at 56.9% pole accuracy on a letter that is nonetheless frozen. The copy resolves that by
// describing where the answers landed and never whether the letter is correct: '반대쪽 설명도 같이 읽어 봐요'
// is an invitation to read, while '반대쪽이 맞을 수도 있어요' would be a claim about the result and is banned.
//
// Keys are band5 values from the integer |S5| (MIGRATION §3.4): <= 3 -> faint, 5 -> moderate, >= 7 -> distinct. The
// rational form is a trap in both directions - round(5/15, 4) = 0.3333 < 1/3 deletes moderate, and the
// axis-profile.tsx percentage cut (>= 50 / >= 25) misfiles |S5| = 7 as moderate.
export const CLARITY_BANDS_PAID = {
  faint: {
    detail: '답이 양쪽에 비슷하게 놓였어요. 반대쪽 설명도 같이 읽어 봐요. 글자는 앞선 쪽 그대로예요.',
    label: '반반에 가까워요',
  },
  moderate: {
    detail: '답이 한쪽으로 기울었어요. 반대쪽을 고른 답도 남아 있어요.',
    label: '한쪽으로 기울어요',
  },
  distinct: {
    // '거의 없어요' rather than a rarity verb: FAKE_METRIC bans the rarity term, and a rarity word invites a family
    // regex to fire even though this counts the reader's own answers and never compares them to other people.
    detail: '답이 한쪽으로 크게 몰렸어요. 반대쪽을 고른 답이 거의 없어요.',
    label: '한쪽이 뚜렷해요',
  },
  // Unreachable: five items each contribute an odd score, so |S5| is odd and never 0. Kept as a real entry
  // rather than a hole because a defensive union member whose lookup returns undefined defends nothing. The
  // unreachability is an assertUnreachable test, not a runtime branch.
  //
  // An earlier draft wrote this label with the DETERMINISM adverb from §8.5. Unreachable strings are still
  // linted - copy-policy.ts walks literals, not reachable branches - so that was a real CI break, not a
  // theoretical one. Rewritten without it. `pole` is null in this state (§3.4), so the label may not name a
  // leading side.
  tie: {
    detail: '양쪽 답이 같은 무게로 놓였어요.',
    label: '어느 쪽도 앞서지 않아요',
  },
} as const satisfies Record<ClarityBand, BandCopy>

// `single` exists only here. The free tier caps facet exposure at 2 and cannot separate a leader; at exposure 4
// it can. Verb choice is not cosmetic - '좁혀졌어요' claims narrowing, so the sep=0 row must not use it.
export const DRAIN_SPREAD_PAID = {
  single: {
    detail: '한 조건이 나머지보다 앞서요.',
    label: '한 갈래로 좁혀졌어요',
  },
  double: {
    detail: '두 조건이 비슷하게 앞서요. 둘 다 내 신호로 읽어요.',
    label: '두 갈래로 좁혀졌어요',
  },
  triple: {
    detail: '세 조건이 나란해요. 셋을 묶어 하나의 신호로 읽어요.',
    label: '세 갈래가 비슷하게 나왔어요',
  },
} as const satisfies Record<DrainSpread, BandCopy>

// Free -> paid movement, paid-only because the free tier has nothing to compare against.
//
// Both `up` and `down` details are exhaustively true rather than hedged, but only downstream of one caller-side
// guard in scoring.ts: the shift is `down` whenever Math.sign(S5) !== Math.sign(S3), decided BEFORE any band
// comparison. That predicate is `evidenceSplit` (§3.4 scoring contract), so the guard is
// `evidenceSplit ? 'down' : compareBands(...)` and needs no second flag.
//
// Without the guard, 24 of the 156 raw upgrades (15.4%) are sign reversals - the frozen letter lost support
// while the bar grew on the other side - and '더 선명해졌어요' is false in every one of them. They occupy a
// single cell, |S3| = 1 -> |S5| = 5 (faint3 -> moderate). S3 and S5 are odd integers so neither is ever 0 and
// Math.sign is exact.
//
// Exhaustive enumeration over the 4^5 = 1024 response grid (keying-invariant: the signed lattice
// {-3,-1,1,3} is symmetric, so reversing an item permutes the grid onto itself). After the guard:
// up 132 / same 386 / down 506. '더 물어본 답이 모두 같은 쪽이었어요' holds in 132/132 guarded upgrades and
// '양쪽 답이 섞여 있었어요' holds in 506/506 guarded downgrades. Counts are grid-uniform, not a respondent
// distribution.
//
// `down` covers two mechanisms - a genuine band drop and a sign reversal that did not drop a band (120 of the
// 506). Its wording names the mechanism, not the outcome, so it is true of both, and it repeats the pole-freeze
// guarantee at exactly the moment the reader doubts it. That repetition is what keeps D14 from reading as a
// retraction of D1. The key stays `down` for §8.2 parity even though `mixed` would describe it better.
export const BAND_SHIFT_PAID = {
  up: {
    detail: '더 물어본 답이 모두 같은 쪽이었어요.',
    label: '더 선명해졌어요',
  },
  same: {
    detail: '앞 단계에서 나온 선명도와 같아요.',
    label: '그대로예요',
  },
  down: {
    detail: '문항을 더해 보니 양쪽 답이 섞여 있었어요. 여덟 글자는 그대로예요.',
    label: '답이 갈렸어요',
  },
} as const satisfies Record<BandShift, BandCopy>

// The paid counterpart of CLARITY_NOTE_FREE, and the reason that constant may not simply be shared: the paid
// screen must not repeat a tentativeness marker it has just resolved. Same object split as the free note -
// letters settled by the free pass, ruler re-derived here - stated in the past tense.
//
// The re-draw verb in the second sentence belongs to a banned family and is exempt by identifier, the same
// allowlist that covers CLARITY_NOTE_FREE.
export const CLARITY_NOTE_PAID =
  '여덟 글자는 무료 검사에서 정해진 그대로예요. 여기서 다시 그린 건 그 옆의 선명도와 갈래뿐이에요.'

export { DRAIN_SPREAD_MEANING }
