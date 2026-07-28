import type { BandCopy, FreeDrainSpread, TentativeBand } from '../model'

// Free-path band copy. Two scales live here and never merge (N7): the clarity scale answers "how far apart did
// this axis's answers land", the drain scale answers "how many drain conditions came out level". Neither
// answers "is the letter right" - that question is closed before this file is read (pole freeze, D1).
//
// D1 (settled result) and D14 (tentative band) are not in tension because they are about different objects.
// The eight letters and the world job are decided by the free pass and the paid pass does not reopen them;
// what the paid pass re-derives is the ruler printed beside them. Nothing in this file may say a letter could
// move. The tentativeness marker rides on the ruler, never on the result.
//
// Data only, no type declarations - every other module under content/ is the same. The band unions live in
// model.ts because a content table that owns its own types can drift from the scorer that produces them.

// Rendered as `선명도 · {label}` on its own line under each axis bar, so nothing attaches a 조사 to it.
// Never interpolate the axis name into these strings: 은/는 splits across the eight names
// ('사회적 에너지'는 / '판단 기준'은), and a template would break on half of them.
//
// Labels are MIGRATION §8.2 verbatim. The tentativeness marker is not one fixed prefix - faint takes '아직',
// the other two take '지금까지는'. A lint that greps for a single literal will therefore miss two of three;
// check membership in {'아직', '지금까지는'} instead.
//
// Keys are band3 values, produced by comparing the integer |S3| (MIGRATION §3.4): 1 -> faint3, 3 -> moderate3,
// >= 5 -> distinct3. Never compare the rounded rational lean against 1/3 - round(3/9, 4) = 0.3333 < 1/3
// deletes the entire moderate3 cell (31.25% of the grid).
export const CLARITY_BANDS_FREE = {
  faint3: {
    detail: '한쪽이 앞서긴 하는데 답이 양쪽에 비슷하게 놓였어요. 반대쪽 설명도 같이 읽어 봐요.',
    label: '아직 반반에 가까워요',
  },
  moderate3: {
    detail: '기운 방향은 보이는데 굳었다고 보기엔 일러요.',
    label: '지금까지는 한쪽으로 기울어요',
  },
  distinct3: {
    // The movement notice repeats here and only here. Dropping out of distinct3 is where a reader feels
    // cheated, and it is the second most common transition after faint3 -> faint: 8.98% + 6.84% = 15.82% of
    // the 4^5 response grid leaves distinct3 for a lower paid band (exhaustive enumeration).
    detail: '답이 한쪽으로 몰렸어요. 문항이 늘면 이 값은 오르내려요.',
    label: '지금까지는 뚜렷해요',
  },
} as const satisfies Record<TentativeBand, BandCopy>

// `single` is absent by construction, not by omission: three forced choices over six facets cap exposure at 2,
// so the top count can never lead the runner-up by more than one. The key type forbids writing it back in, and
// the single-branch wording itself is paid-only. The §8.2 CI rule ("무료 번들에 그 라벨 리터럴 0건") is a
// literal scan, so this comment may explain the ban but may never spell the banned token - a source-text grep
// would otherwise flag its own documentation. The gate must walk AST string literals, not raw file text.
export const DRAIN_SPREAD_FREE = {
  double: {
    detail: '두 조건이 비슷하게 나왔어요. 둘 다 내 신호로 읽어 봐요.',
    label: '지금은 두 갈래로 보여요',
  },
  triple: {
    detail: '세 조건이 나란히 나왔어요. 셋을 묶어 하나의 신호로 읽어 봐요.',
    label: '지금은 세 갈래로 보여요',
  },
} as const satisfies Record<FreeDrainSpread, BandCopy>

// Rendered once above the axis blocks, where report-view.tsx:143 renders `content.ui.clarityNote` today.
// It replaces that key outright: ui.clarityNote is a single string shared by the free and the paid render
// (dynamic-report-view.tsx renders the same ReportView), so leaving it in place would put tentative wording on
// the paid screen. ui.clarityBands (clear/moderate/slight) dies with it - one three-key label map shared by
// both tiers is exactly the merge N7 forbids. Both keys must be dropped from DeepTypeUiText and from all four
// _content locale files; en/ja/zh are mechanical deletions, not translations (D10, Phase 7 removes them).
//
// This is the line that separates D1 from D14 out loud - result settled, ruler re-derived - so it must survive
// as one three-sentence block and must not be split across components.
//
// It says eight letters, not four: D13 kept two four-letter codes, so naming one of them would leave the other
// looking negotiable. The re-measure verb in the second sentence belongs to a banned family - D14 requires the
// movement notice and the ban forbids the words that express it, so the copy gate needs an allowlist keyed on
// these two identifiers.
export const CLARITY_NOTE_FREE =
  '여덟 글자와 세계관 직업은 여기서 정해졌어요. 심층 검사가 다시 재는 건 그 옆에 붙는 선명도뿐이고 늘어나는 건 리포트가 다루는 범위예요. 선명도는 올라가기도 내려가기도 해요.'

// Carries the promise without naming the sep>=2 label, which the free bundle may not contain as a literal.
export const DRAIN_NARROW_NOTE_FREE = '조건을 더 물어 갈래를 좁히는 건 심층 리포트가 해요.'

// Shared by both tiers. It lives on the free side because free may not import paid; the paid module re-exports
// this identifier instead of restating the sentence, so the gloss cannot drift between tiers.
export const DRAIN_SPREAD_MEANING =
  '갈래는 지금 답에서 서로 비슷하게 나온 조건의 수예요. 갈래가 많다고 신호가 약한 건 아니에요.'
