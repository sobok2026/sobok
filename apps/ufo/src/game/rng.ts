/** mulberry32 — tiny deterministic PRNG. Seeded per run so a session is reproducible if needed. */
export class Rng {
  private s: number

  constructor(seed: number) {
    this.s = seed >>> 0
  }

  /** [0, 1) */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /** Inclusive integer [min, max]. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }

  chance(p: number): boolean {
    return this.next() < p
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)]
  }
}

export function makeSeed(): number {
  // App runtime only (Workflow scripts forbid these; this file never runs there).
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0
}
