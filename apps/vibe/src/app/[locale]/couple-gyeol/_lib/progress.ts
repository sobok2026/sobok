import { rarityOptionIdsByQuestion, rarityQuestionIds } from './model'
import type { GyeolAnswers, GyeolOptionId, GyeolQuestionId } from './types'

const STORAGE_KEY = 'sobok_couple_gyeol_progress'

/**
 * A run in progress, kept so leaving the quiz is not the same as losing it.
 *
 * Sixteen answers used to live in `useState` alone, which meant a mis-tap, a reload or a phone call threw all of
 * them away — and going back afterwards landed on question one with nothing filled in. Removing the navigation
 * from the quiz screen reduces the accidents; this makes the ones that still happen recoverable. `sessionStorage`
 * rather than `localStorage` because the run belongs to the tab and to now, and the browser clearing it when the
 * tab closes is the retention policy we want rather than one we have to write.
 */
export type GyeolProgress = {
  answers: GyeolAnswers
  currentIndex: number
}

export function readGyeolProgress(): GyeolProgress | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<GyeolProgress>) : null

    if (!parsed || typeof parsed.answers !== 'object' || parsed.answers === null) {
      return null
    }

    // Scoring throws on an answer it does not recognise, and it runs during render. So a payload written by an
    // older instrument is filtered down to what still scores rather than trusted or thrown away whole.
    const answers = Object.fromEntries(
      Object.entries(parsed.answers).flatMap(([questionId, optionId]) =>
        isGyeolAnswer(questionId, optionId) ? [[questionId, optionId]] : [],
      ),
    ) as GyeolAnswers

    const currentIndex =
      Number.isInteger(parsed.currentIndex) &&
      typeof parsed.currentIndex === 'number' &&
      parsed.currentIndex >= 0 &&
      parsed.currentIndex < rarityQuestionIds.length
        ? parsed.currentIndex
        : 0

    return Object.keys(answers).length === 0 && currentIndex === 0 ? null : { answers, currentIndex }
  } catch {
    // Storage unavailable, or a payload that is not JSON.
    return null
  }
}

export function writeGyeolProgress(progress: GyeolProgress): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage unavailable or disabled. The run still works; it just cannot survive leaving the screen.
  }
}

export function clearGyeolProgress(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function hasGyeolProgress(): boolean {
  return readGyeolProgress() !== null
}

function isGyeolAnswer(questionId: string, optionId: unknown): boolean {
  const allowedOptionIds: readonly string[] | undefined =
    rarityOptionIdsByQuestion[questionId as GyeolQuestionId] ?? undefined

  return typeof optionId === 'string' && (allowedOptionIds?.includes(optionId as GyeolOptionId) ?? false)
}
