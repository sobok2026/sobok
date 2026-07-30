import type { AxisValue, CoupleTypeAnswers, CoupleTypeContent } from './types'

const STORAGE_KEY = 'sobok_couple_type_progress'

/**
 * A run in progress, kept so leaving the quiz is not the same as losing it. Same contract as the rarity test's
 * store, and the same reason for `sessionStorage`: the run belongs to this tab, and the browser dropping it when
 * the tab closes is the retention policy rather than something we have to schedule.
 */
export type CoupleTypeProgress = {
  answers: CoupleTypeAnswers
  currentIndex: number
}

/**
 * Validated against the content rather than a copy of it. Question ids and the two letters each axis accepts are
 * the content's to define, so a run written before an item was renamed is filtered down to what still counts
 * instead of scoring a letter no axis recognises.
 */
export function readCoupleTypeProgress(content: CoupleTypeContent): CoupleTypeProgress | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<CoupleTypeProgress>) : null

    if (!parsed || typeof parsed.answers !== 'object' || parsed.answers === null) {
      return null
    }

    const allowedValuesByQuestionId = new Map<string, readonly AxisValue[]>(
      content.questions.map((question) => [question.id, content.axisDefinitions[question.axis].values]),
    )

    const answers = Object.fromEntries(
      Object.entries(parsed.answers).flatMap(([questionId, value]) => {
        const allowed = allowedValuesByQuestionId.get(questionId)

        return allowed?.includes(value as AxisValue) ? [[questionId, value]] : []
      }),
    ) as CoupleTypeAnswers

    const currentIndex =
      typeof parsed.currentIndex === 'number' &&
      Number.isInteger(parsed.currentIndex) &&
      parsed.currentIndex >= 0 &&
      parsed.currentIndex < content.questions.length
        ? parsed.currentIndex
        : 0

    return Object.keys(answers).length === 0 && currentIndex === 0 ? null : { answers, currentIndex }
  } catch {
    // Storage unavailable, or a payload that is not JSON.
    return null
  }
}

export function writeCoupleTypeProgress(progress: CoupleTypeProgress): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage unavailable or disabled. The run still works; it just cannot survive leaving the screen.
  }
}

export function clearCoupleTypeProgress(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Whether this tab holds a run at all, which is what tells the result screen its code was answered here rather
 * than shared with it. Deliberately content-free: the caller asking this question does not need the answers.
 */
export function hasCoupleTypeProgress(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}
