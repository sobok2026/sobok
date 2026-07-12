// Simplified stick figures of the twelve zodiac constellations — star points
// and connecting edges in a 100×100 box, drawn from the classic asterisms
// (Hyades V, Leo's sickle, the Sagittarius teapot, …). Data + one renderer
// instead of image assets, so theme, color and size stay CSS-controlled.

import type { SignId } from '../chart/types'

export type SignFigure = {
  /** [x, y, size] — size is a relative star weight (1 = minor, 2 = bright, 3 = alpha). */
  stars: readonly (readonly [number, number, number])[]
  /** Index pairs into `stars`. */
  lines: readonly (readonly [number, number])[]
}

export const SIGN_FIGURES: Record<SignId, SignFigure> = {
  aries: {
    stars: [
      [18, 62, 1],
      [40, 56, 1],
      [68, 46, 3],
      [80, 30, 2],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  },
  taurus: {
    stars: [
      [42, 58, 2], // Hyades vertex
      [56, 48, 3], // Aldebaran
      [78, 26, 2], // north horn tip
      [58, 66, 1],
      [82, 80, 2], // south horn tip
      [28, 66, 1],
      [18, 72, 1],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [0, 3],
      [3, 4],
      [0, 5],
      [5, 6],
    ],
  },
  gemini: {
    stars: [
      [36, 14, 3], // Castor
      [62, 20, 3], // Pollux
      [32, 42, 1],
      [58, 46, 1],
      [28, 66, 1],
      [56, 70, 1],
      [22, 86, 1],
      [64, 88, 1],
    ],
    lines: [
      [0, 2],
      [2, 4],
      [4, 6],
      [1, 3],
      [3, 5],
      [5, 7],
      [2, 3],
      [4, 5],
    ],
  },
  cancer: {
    stars: [
      [48, 44, 1],
      [44, 18, 1],
      [28, 70, 2],
      [70, 74, 2],
      [58, 58, 1],
    ],
    lines: [
      [1, 0],
      [0, 4],
      [4, 3],
      [0, 2],
    ],
  },
  leo: {
    stars: [
      [48, 16, 1], // sickle top
      [36, 22, 2],
      [30, 34, 1],
      [37, 47, 2], // Algieba
      [32, 60, 1],
      [28, 72, 3], // Regulus
      [58, 48, 1], // Zosma
      [60, 70, 1], // Chertan
      [85, 58, 2], // Denebola
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 7],
      [7, 8],
      [8, 6],
      [6, 3],
    ],
  },
  virgo: {
    stars: [
      [20, 34, 1],
      [33, 40, 1],
      [45, 45, 2], // Porrima
      [56, 32, 1],
      [70, 24, 2], // Vindemiatrix
      [52, 60, 1],
      [38, 70, 1],
      [62, 80, 3], // Spica
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
      [5, 6],
      [5, 7],
    ],
  },
  libra: {
    stars: [
      [30, 68, 2], // Zubenelgenubi
      [50, 26, 2], // Zubeneschamali
      [68, 46, 1],
      [24, 84, 1],
      [74, 68, 1],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 0],
      [0, 3],
      [2, 4],
    ],
  },
  scorpio: {
    stars: [
      [16, 16, 1],
      [14, 30, 1],
      [26, 24, 2], // head fork
      [36, 38, 3], // Antares
      [42, 52, 1],
      [46, 64, 1],
      [54, 74, 1],
      [66, 78, 1],
      [78, 72, 2], // Shaula
      [84, 60, 1], // sting tip
    ],
    lines: [
      [0, 2],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
    ],
  },
  sagittarius: {
    stars: [
      [18, 56, 1], // spout tip
      [34, 44, 2],
      [30, 66, 1],
      [46, 28, 1], // lid
      [56, 42, 2],
      [70, 32, 1],
      [76, 52, 1],
      [62, 64, 2],
    ],
    lines: [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [3, 4],
      [1, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [7, 2],
    ],
  },
  capricorn: {
    stars: [
      [18, 30, 2], // Algedi
      [26, 42, 1],
      [42, 62, 1],
      [56, 58, 1],
      [72, 42, 1],
      [82, 30, 2], // Deneb Algedi
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
  },
  aquarius: {
    stars: [
      [16, 40, 1],
      [30, 30, 2], // Sadalsuud
      [44, 40, 1],
      [56, 28, 2], // Sadalmelik
      [70, 36, 1],
      [62, 56, 1],
      [52, 72, 1],
      [60, 88, 1],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [3, 5],
      [5, 6],
      [6, 7],
    ],
  },
  pisces: {
    stars: [
      [16, 20, 1], // west fish loop
      [26, 14, 1],
      [30, 24, 1],
      [20, 28, 1],
      [30, 44, 1],
      [40, 60, 1],
      [50, 74, 2], // Alrescha, the knot
      [64, 68, 1],
      [78, 60, 1],
      [88, 50, 1], // east fish loop
      [92, 40, 1],
      [84, 36, 1],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 11],
      [11, 8],
    ],
  },
}
