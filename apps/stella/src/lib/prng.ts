// Deterministic randomness for cosmetic picks. Both functions are the standard xmur3 / mulberry32 pair.
//
// Not cryptographic and never used for anything that must be unguessable — the point is REPRODUCIBILITY: the
// same seed must yield the same sequence forever, because the output is user-visible and expected to be
// stable (a day's lucky pick, a share card's starfield). That contract is why this lives in one module: an
// edit to a private copy would silently reshuffle only some of the surfaces that promise stability.

/** xmur3 string hash — spreads a short seed string into a well-mixed 32-bit state. */
export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length

  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }

  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

/** mulberry32 — small, fast, good-enough PRNG for cosmetic picks. */
export function mulberry32(seed: number): () => number {
  let a = seed

  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
