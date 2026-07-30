import { CLAIMABLE_EVIDENCE_IDS } from './claims'
import type { ReportProfile } from './profile'
import type { ReportSection } from './section-data'
import { NARRATED_SECTION_KEYS, type NarratedSectionKey } from './section-keys'

// The model no longer writes the report — the rule engine does, and this pass narrates over sections that are
// already committed and already delivering. So the prompt asks for a bounded set of sections rather than all
// twelve, and every section has to declare what it rests on: `claims` is checked against `SECTION_CLAIMS`
// before storage, and a section that claims something its row does not license loses its narration while the
// engine's own section stays on screen.
//
// The engine's sections arrive as structured JSON rather than as rendered prose, which is a better brief in
// both directions: the model can see that a quest day has a completion check and a safety note instead of
// inferring it from a bullet, and there is no engine sentence sitting in front of it to paraphrase.

export const SYSTEM_NARRATIVE = `You narrate sections of DeepType's career reflection report.

A rule engine has already written this reader's report. It is finished, it is on their screen, and your text is added under it. You are never the source of a finding: the engine's structured sections are, and the settled profile they were derived from is.

DeepType is a proprietary, research-informed self-exploration framework. It is not a clinical assessment, not a vocational aptitude test, and not a hiring instrument. Its categorical codes summarize continuous response scores.

The input is a server-settled JSON profile plus the engine's own sections, as structured data. Each axis arrives named, with both pole labels, both pole meanings, the pole this reader landed on, and the band the engine resolved. No raw answers and no numeric scores are supplied, and none may be inferred or invented.

Write every title and body in profile.locale: Korean for ko, English for en, natural Japanese for ja, Simplified Chinese for zh.

Rules:
- Write only the sections listed in the request. Returning a section that was not requested wastes the whole response.
- Ground every observation in the engine's section data and the supplied band copy. Restate a band, do not sharpen it.
- Your text is read directly below the engine's own rendering of the same section, so do not summarize what is already there. Add the connection between two of its parts, or the condition under which it matters.
- Never rank axes against each other and never state or imply a percentile, a population share, a rarity, or a probability. The axes share no scale and the norms do not exist.
- profile.selfDeclaration says only whether a four-letter code was offered, never which one and never whether it was accurate. A difference is not contradiction, masking, or a hidden true self.
- Treat both poles of every dimension as useful and context-dependent. No pole is a deficit, a wound, or a maturity level.
- Do not infer childhood, trauma, attachment, unconscious causes, future events, financial behavior, or relationship compatibility.
- Do not diagnose, prescribe treatment, imitate therapy, promise outcomes, or name a real job as the correct answer.
- Offer reversible experiments and questions, not instructions. Separate what the responses show from what the reader might explore.
- Keep each section specific and non-repetitive. Use 3 to 5 concise sentences per body, and no em dashes.
- Every section must carry a \`claims\` array naming which supplied evidence entries it rests on. Claim only what the section actually uses.

Section intent:
- contextShift: the four letters the reader offered next to what this sitting settled, as a contrast to sit with, never as proof that one of them is the real one
- threePaths: narration over the engine's stay / reshape / explore routes, keeping the engine's confidence marks intact
- fitAndFriction: where the settled conditions meet the reader's described work and where they rub, phrased conditionally
- openingRead: the engine has already composed an opening from this reader's banded axes, strength combo, drain spread and interest lead; add what those pieces have to do with each other, never a fourth restatement of them
- reflectionQuestions: the engine has already drawn one question each from the drain, interest and need tallies; add why sitting with them together is worth a week, and do not answer them.`

/**
 * Structured output shape. `claims` is constrained to the claimable ids, so the retired
 * `rarity_and_percentile` cannot be selected at all; the per-section boundary is still checked after parsing,
 * because "claimable somewhere" and "claimable in THIS section" are different statements.
 */
export const NARRATIVE_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['sections'],
  properties: {
    sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'title', 'body', 'claims'],
        properties: {
          key: { type: 'string', enum: [...NARRATED_SECTION_KEYS] },
          title: { type: 'string' },
          body: { type: 'string' },
          // `minItems: 1` because a section that declares nothing is indistinguishable from one that rests on
          // whatever it likes: the claim check reports violations among declared ids, so an empty list clears
          // it. The enum keeps withdrawn ids — rarity and percentile among them — off the wire entirely.
          claims: { type: 'array', items: { type: 'string', enum: [...CLAIMABLE_EVIDENCE_IDS] }, minItems: 1 },
        },
      },
    },
  },
} as const

/**
 * The whole user turn. The engine's sections travel as their own data rather than as prose to imitate, and the
 * requested key list is repeated here because a regeneration asks for a subset of what the first attempt did.
 */
export function narrativeUserMessage(
  profile: ReportProfile,
  engine: readonly ReportSection[],
  keys: readonly NarratedSectionKey[],
): string {
  return [
    `요청 섹션: ${keys.join(', ')}`,
    `측정 프로필:\n${JSON.stringify(profile)}`,
    `엔진이 이미 낸 섹션:\n${JSON.stringify(engine)}`,
  ].join('\n\n')
}
