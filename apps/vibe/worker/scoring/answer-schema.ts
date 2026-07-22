import { BASE_ITEMS, REFINEMENT_ITEMS } from '@deep-type/questionnaire'
import { z } from 'zod'

const AgreementValueSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
const ItemAnswerSchema = z.object({
  itemId: z.string().min(1).max(48),
  value: AgreementValueSchema,
})

export const BaseAnswersSchema = z.array(ItemAnswerSchema).length(BASE_ITEMS.length)
export const RefinementAnswersSchema = z.array(ItemAnswerSchema).length(REFINEMENT_ITEMS.length)
