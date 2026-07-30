import type { AgreementValue, ItemAnswer, OptionIndex, PersonaCode, PersonaSource, WorkAnswer } from '@deep-type/model'

const STORAGE_KEY = 'sobok_deep_type_progress'

/**
 * One answer as the run holds it. Kept discriminated so an option index can never land in an agreement level —
 * the same reason the reducer keeps them apart — and exported from here because the store is what has to put them
 * back together after a reload.
 */
export type ProgressAnswer = { kind: 'likert'; value: ItemAnswer } | { kind: 'work'; value: WorkAnswer }

/**
 * A free run in progress, which is deliberately not the same object as a finished sitting.
 *
 * The finished one (`sitting.ts`) is a contract: the result screen scores it and the server prices it, and both
 * require all twenty-seven answers. Writing partial answers under that key would hand a half-run to a scorer that
 * cannot score it, so an unfinished run lives here under its own key and is deleted the moment the sitting is
 * written. Twenty-seven items is four or five minutes of attention and until now a reload cost all of it.
 */
export type DeepTypeProgress = {
  declaredPersona: PersonaCode | null
  personaSource: PersonaSource
  answers: readonly ProgressAnswer[]
}

export function readDeepTypeProgress(): DeepTypeProgress | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<DeepTypeProgress>) : null

    if (!parsed || !Array.isArray(parsed.answers)) {
      return null
    }

    const answers = parsed.answers.filter(isProgressAnswer)

    if (answers.length === 0) {
      return null
    }

    const declaredPersona = parsed.declaredPersona ?? null

    return {
      answers,
      declaredPersona,
      // A run written before the self-image branch existed carries no source, and every one of those was typed.
      personaSource: declaredPersona ? (parsed.personaSource ?? 'declared') : 'unknown',
    }
  } catch {
    // Storage unavailable, or a payload written by an older instrument.
    return null
  }
}

export function writeDeepTypeProgress(progress: DeepTypeProgress): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage unavailable or disabled. The run still works; it just cannot survive leaving the screen.
  }
}

export function clearDeepTypeProgress(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Validated by kind and by range, because a restored answer goes straight into scoring. Whether an item id still
 * exists in the instrument is not checked here: the run walks `FREE_RUN` by position, so a renamed item drops out
 * of the tally at the point that reads it rather than at the point that reads storage.
 */
function isProgressAnswer(answer: unknown): answer is ProgressAnswer {
  if (typeof answer !== 'object' || answer === null || !('kind' in answer) || !('value' in answer)) {
    return false
  }

  const value = answer.value

  if (typeof value !== 'object' || value === null || !('itemId' in value) || typeof value.itemId !== 'string') {
    return false
  }

  if (answer.kind === 'likert') {
    return 'value' in value && isAgreementValue(value.value)
  }

  return answer.kind === 'work' && 'optionIndex' in value && isOptionIndex(value.optionIndex)
}

function isAgreementValue(value: unknown): value is AgreementValue {
  return value === 1 || value === 2 || value === 3 || value === 4
}

function isOptionIndex(value: unknown): value is OptionIndex {
  return value === 0 || value === 1 || value === 2 || value === 3
}
