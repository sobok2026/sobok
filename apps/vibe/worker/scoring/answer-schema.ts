import { PERSONA_CODES } from '@deep-type/model'
import { FREE_LIKERT_ITEMS, FREE_WORK_ITEMS, PAID_LIKERT_ITEMS, WORK_ITEMS } from '@deep-type/questionnaire'
import { z } from 'zod'

const AgreementValueSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
const OptionIndexSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])

const ItemAnswerSchema = z.object({
  itemId: z.string().min(1).max(48),
  value: AgreementValueSchema,
})

// Forced-choice answers carry an option index, so a Likert payload cannot satisfy this schema by accident.
const WorkAnswerSchema = z.object({
  itemId: z.string().min(1).max(48),
  optionIndex: OptionIndexSchema,
})

// Lengths are read off the instrument rather than restated, so changing the selection tables moves the wire
// contract with them instead of leaving a literal here to drift.
export const BaseAnswersSchema = z.array(ItemAnswerSchema).length(FREE_LIKERT_ITEMS.length)
export const BaseWorkAnswersSchema = z.array(WorkAnswerSchema).length(FREE_WORK_ITEMS.length)
export const RefinementAnswersSchema = z.array(ItemAnswerSchema).length(PAID_LIKERT_ITEMS.length)
// The refined pass tallies all five dimensions, so it needs the free drain block back alongside the paid 21.
export const RefinedWorkAnswersSchema = z.array(WorkAnswerSchema).length(WORK_ITEMS.length)

// The paid block is answered over one or more sittings, so the in-progress set is a prefix of the submission
// rather than a submission. Length is therefore a CEILING, not an equality — the only guarantee a draft owes
// is that it cannot grow unbounded in the row. Nothing parsed by these two ever reaches the scorer: the
// resume path replays the draft to the client, and the client re-submits through the fixed-length schemas
// above. Keeping that one-way is what stops a short draft from becoming a short scoring input.
export const RefinementDraftAnswersSchema = z.array(ItemAnswerSchema).max(PAID_LIKERT_ITEMS.length)
export const RefinementDraftWorkAnswersSchema = z.array(WorkAnswerSchema).max(WORK_ITEMS.length)

/** Offered, never measured. Only whether it was given reaches the profile. */
export const DeclaredPersonaSchema = z.enum(PERSONA_CODES).nullable()
