// The four things the free test hands over before any payment. This exists as one constant because the
// withdrawal-right limitation in `legal.ts` only holds if the terms and the free result screen name the same
// four deliverables — two independently maintained copies would drift and quietly void the legal basis.
//
// Source of truth: apps/vibe/MIGRATION.md §8.3 (D16). Strings are verbatim from the §8.3 code block and from
// the terms body on the line above it; do not reword them here without amending §8.3 and `legal.ts` together.
//
// Two invariants, both enforced by `free-deliverables.test.ts` (§8.3):
//   1. The `legal.ts` withdrawal-limitation paragraph contains these four joined by ' · ', exactly.
//   2. The four block headings on the free result screen are injected from this array.
// They are ko-only, and deliberately so: '두/세 갈래' is respondent-dependent and the join separator differs by
// locale (ja uses ・). The en/ja/zh refund pages carry the same four deliverables as prose, checked by eye.
// Value labels inside those blocks (the four-letter codes, the job name, the branch count, band wording) are
// deliberately out of scope: '두/세 갈래' is respondent-dependent, so a value-level invariant cannot hold.
//
// Array order is not cosmetic — it fixes the heading order on the free result screen (N8: the job card sits
// above the drain block).
export const FREE_DELIVERABLES_KO = [
  '속유형 네 글자',
  '마음의 코어 네 글자',
  '세계관 직업',
  '지치는 조건 신호',
] as const
