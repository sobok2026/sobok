import type { ItemAnswer, PersonaCode, PersonaSource, WorkAnswer } from '@deep-type/model'

const STORAGE_KEY = 'sobok_deep_type_answers'

// One free sitting, as the test hands it to every screen that needs to score or submit it. Scoring reads all
// three parts, so they travel together rather than as a bare answer array.
export type DeepTypeSitting = {
  declaredPersona: PersonaCode | null
  /** How the four letters were reached. `unknown` whenever `declaredPersona` is null. */
  personaSource: PersonaSource
  likert: ItemAnswer[]
  work: WorkAnswer[]
}

export function readSitting(): DeepTypeSitting | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<DeepTypeSitting>) : null
    if (!parsed || !Array.isArray(parsed.likert) || !Array.isArray(parsed.work)) {
      return null
    }
    const declaredPersona = parsed.declaredPersona ?? null
    return {
      declaredPersona,
      likert: parsed.likert,
      // A sitting written before the self-image branch existed carries no source, and every one of those was typed.
      personaSource: declaredPersona ? (parsed.personaSource ?? 'declared') : 'unknown',
      work: parsed.work,
    }
  } catch {
    // Storage unavailable, or a payload written by an older instrument.
    return null
  }
}

export function writeSitting(sitting: DeepTypeSitting): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sitting))
  } catch {
    // Storage unavailable or disabled. The result screen redirects rather than showing a blank report.
  }
}

export function clearSitting(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * The forced-choice answers the refined tally needs. A tab reached by email re-open never held a sitting, so
 * this can be empty and the submission is refused server-side rather than scored against a partial set.
 */
export function readSittingWorkAnswers(): WorkAnswer[] {
  return readSitting()?.work ?? []
}
