import { FREE_ITEM_COUNT, PAID_ITEM_COUNT } from './questionnaire'

// What a run costs the respondent, as two numbers copy may quote and one it may not restate.
//
// The minute range is anchor B (7.5~10s per Likert, 10~16s per forced choice), rounded outward to whole
// minutes. Anchor A is the faster estimate and the pilot may support it, but the display risk is asymmetric:
// under-promising the time costs nothing while over-promising it reads as a bait, and revising the number down
// is a change in the reader's favour that needs no notice. See MIGRATION §8.1.
//
// Copy interpolates these rather than spelling them, so a change to the instrument moves every quoted figure in
// the same commit. The two counts are exposed at exactly two places (`paywall.effortNote`, `methodology
// .scoringBody`) and the two minute ranges at exactly two others (`ui.landingNote`, `paywall.effortNote`).
export const FREE_EFFORT = {
  count: FREE_ITEM_COUNT,
  maxMinutes: 5,
  minMinutes: 4,
} as const

export const PAID_EFFORT = {
  count: PAID_ITEM_COUNT,
  maxMinutes: 8,
  minMinutes: 6,
} as const
