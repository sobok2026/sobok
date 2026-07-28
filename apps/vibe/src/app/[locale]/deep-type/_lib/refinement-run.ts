import type { ItemAnswer, WorkAnswer } from '@deep-type/model'
import { FREE_WORK_ITEMS } from '@deep-type/questionnaire'

import { PAID_RUN } from './paid-run'

/**
 * The two rules the paid block's bookkeeping rests on, out of the component so they can be tested without a
 * DOM. Both were wrong in a way that only showed up on the last screen or in the second browser, and neither
 * failure is visible in the shape of the data — a short work buffer looks exactly like a buffer mid-run.
 */

const FREE_WORK_IDS = new Set(FREE_WORK_ITEMS.map((item) => item.id))

export function isFreeWork(answer: WorkAnswer): boolean {
  return FREE_WORK_IDS.has(answer.itemId)
}

/**
 * How far into `PAID_RUN` a buffer sits. The free drain block travels inside the work array because the submit
 * needs all twenty-four forced choices at once, but it was answered before this screen existed and is not a
 * step here — so the position is the Likert answers plus the paid picks and nothing else.
 */
export function paidCount(answers: readonly ItemAnswer[], work: readonly WorkAnswer[]): number {
  return answers.length + work.filter((entry) => !isFreeWork(entry)).length
}

export function isRunComplete(answers: readonly ItemAnswer[], work: readonly WorkAnswer[]): boolean {
  return paidCount(answers, work) >= PAID_RUN.length
}

export interface WorkAnswerSources {
  /** The buffer parked on the server. The only source that can hold paid picks. */
  parked: readonly WorkAnswer[]
  /** `result.free_work_answers`, held since `POST /session`. The only source that survives a new browser. */
  server: readonly WorkAnswer[]
  /** This tab's own sitting. Present only where the free run happened in this browser. */
  sitting: readonly WorkAnswer[]
}

/**
 * The work buffer to resume with. The two halves come from different places and are therefore chosen
 * separately: paid picks exist only in the parked buffer, while the free three have three possible sources and
 * the parked one carries them only once a paid item has been answered in a tab that had them.
 *
 * Choosing the whole buffer on `parked.length > 0` — which is what this replaced — is wrong in exactly the case
 * that costs money. Pay, close the tab at the intro, open the e-mail link on a phone: the sitting is gone, the
 * server's free three were never asked for, and every answer from there on parks a buffer that is non-empty and
 * free-less. It wins the test, the free three never arrive, and `RefinedWorkAnswersSchema` rejects the
 * twenty-one-item submission at the end of a block the buyer just finished.
 *
 * Free answers keep their leading position so the array stays "free block, then paid picks in answer order",
 * which is what lets `back()` drop the last element.
 */
export function resumeWorkAnswers({ parked, server, sitting }: WorkAnswerSources): WorkAnswer[] {
  const free = [parked.filter(isFreeWork), server, sitting].find((source) => source.length > 0) ?? []
  return [...free, ...parked.filter((answer) => !isFreeWork(answer))]
}
