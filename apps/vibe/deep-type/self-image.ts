import { AXIS_POLES, type PersonaCode, TYPE_AXES } from './model'

/**
 * The four-letter code someone builds when they do not already carry one.
 *
 * These questions are NOT a measurement, and that difference is the whole reason this can exist. The 27 scored
 * items ask what the respondent actually did — recent, concrete, behavioural. The four here ask what the
 * respondent believes about themselves, which is a different construct, and keeping them apart is what leaves the
 * report's comparison meaningful: it contrasts a self-image against a measurement. Ask about behaviour here and
 * the comparison collapses into our measurement against our own measurement, which is the persona-versus-inner
 * product D13 removed.
 *
 * The prompts live in the locale files, like every other question. What lives here is the part that must not
 * drift: one item per type axis, in `TYPE_AXES` order, each answer an index into that axis's poles. The core
 * axes get nothing — a declared code is four letters by definition, and nobody arrives believing something about
 * their own core axes.
 */
export const SELF_IMAGE_AXES = TYPE_AXES

export type SelfImagePick = 0 | 1

/**
 * The four picks as a code. Positional: pick `i` belongs to `SELF_IMAGE_AXES[i]` and selects that axis's pole.
 * There is nothing to score — one question, one letter — because a self-report has nothing to average.
 */
export function selfImageCode(picks: readonly SelfImagePick[]): PersonaCode {
  if (picks.length !== SELF_IMAGE_AXES.length) {
    throw new Error(`self-image needs ${SELF_IMAGE_AXES.length} picks, got ${picks.length}`)
  }

  return SELF_IMAGE_AXES.map((axis, index) => AXIS_POLES[axis][picks[index] ?? 0]).join('') as PersonaCode
}
