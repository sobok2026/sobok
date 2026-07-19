const KEY = 'ufo.best.v1'

export function loadBest(): number {
  if (typeof localStorage === 'undefined') return 0
  const v = Number(localStorage.getItem(KEY))
  return Number.isFinite(v) && v > 0 ? v : 0
}

/** Persists a new best and reports whether it beat the prior record. */
export function saveBest(score: number): boolean {
  const prev = loadBest()
  if (score > prev) {
    try {
      localStorage.setItem(KEY, String(score))
    } catch {
      // Private mode / storage disabled — best is simply not persisted.
    }
    return true
  }
  return false
}
