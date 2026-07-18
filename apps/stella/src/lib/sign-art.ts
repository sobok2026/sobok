import type { SignId } from '@/chart/types'

/**
 * Modern Western constellation lines and their constituent stars.
 *
 * The source coordinates, Hipparcos identifiers and visual magnitudes are
 * derived from D3-Celestial's `constellations.lines.json` and `stars.6.json`:
 * https://github.com/ofrohn/d3-celestial
 *
 * D3-Celestial is distributed under BSD-3-Clause. Its copyright and license
 * notice are reproduced in `apps/stella/THIRD_PARTY_NOTICES.md`.
 *
 * The IAU standardizes constellation names and boundaries, not one official
 * set of stick-figure lines. These are therefore a documented, widely used
 * modern Western convention rather than an “official IAU drawing”.
 * https://www.iau.org/Iau/Science/What-we-do/The-Constellations.aspx
 */

type SourceStar = readonly [
  hipparcosId: number,
  rightAscensionDegrees: number,
  declinationDegrees: number,
  visualMagnitude: number,
]

type SourceFigure = {
  stars: readonly SourceStar[]
  /** Ordered indices into `stars`; repeated first/last indices close a loop. */
  paths: readonly (readonly number[])[]
}

export type ProjectedSignStar = {
  hipparcosId: number
  magnitude: number
  radius: number
  x: number
  y: number
}

export type ProjectedSignFigure = {
  paths: readonly (readonly number[])[]
  stars: readonly ProjectedSignStar[]
}

const SIGN_FIGURES = {
  aries: {
    stars: [
      [13209, 42.496, 27.2605, 3.61],
      [9884, 31.7934, 23.4624, 2.01],
      [8903, 28.66, 20.808, 2.64],
      [8832, 28.3826, 19.2939, 3.88],
    ],
    paths: [[0, 1, 2, 3]],
  },
  taurus: {
    stars: [
      [26451, 84.4112, 21.1425, 2.97],
      [21421, 68.9802, 16.5093, 0.87],
      [20894, 67.1656, 15.8709, 3.4],
      [20205, 64.9483, 15.6276, 3.65],
      [20455, 65.7337, 17.5425, 3.77],
      [20889, 67.1542, 19.1804, 3.53],
      [25428, 81.573, 28.6075, 1.65],
      [18724, 60.1701, 12.4903, 3.41],
      [16083, 51.7923, 9.7327, 3.73],
      [18907, 60.7891, 5.9893, 3.91],
      [15900, 51.2033, 9.0289, 3.61],
      [16852, 54.2183, 0.4017, 4.29],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5, 6],
      [3, 7, 8, 9],
      [8, 10, 11],
    ],
  },
  gemini: {
    stars: [
      [29655, 93.7194, 22.5068, 3.31],
      [30343, 95.7401, 22.5136, 2.87],
      [32246, 100.983, 25.1311, 3.06],
      [34693, 107.7849, 30.2452, 4.41],
      [36850, 113.6494, 31.8883, 1.58],
      [37826, 116.329, 28.0262, 1.16],
      [36962, 113.9806, 26.8957, 4.06],
      [35550, 110.0307, 21.9823, 3.5],
      [34088, 106.0272, 20.5703, 4.01],
      [31681, 99.4279, 16.3993, 1.93],
      [32362, 101.3224, 12.8956, 3.35],
      [35350, 109.5232, 16.5404, 3.58],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      [7, 11],
    ],
  },
  cancer: {
    stars: [
      [44066, 134.6218, 11.8577, 4.26],
      [42911, 131.1712, 18.1543, 3.94],
      [42806, 130.8214, 21.4685, 4.66],
      [43103, 131.6743, 28.7599, 4.03],
      [40526, 124.1288, 9.1855, 3.53],
    ],
    paths: [
      [0, 1, 2, 3],
      [1, 4],
    ],
  },
  leo: {
    stars: [
      [49669, 152.093, 11.9672, 1.36],
      [49583, 151.8331, 16.7627, 3.48],
      [50583, 154.9931, 19.8415, 2.01],
      [54872, 168.5271, 20.5237, 2.56],
      [57632, 177.2649, 14.5721, 2.14],
      [54879, 168.56, 15.4296, 3.33],
      [50335, 154.1726, 23.4173, 3.43],
      [48455, 148.1909, 26.007, 3.88],
      [47908, 146.4628, 23.7743, 2.97],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5, 0],
      [2, 6, 7, 8],
    ],
  },
  virgo: {
    stars: [
      [57380, 176.4648, 6.5294, 4.04],
      [57757, 177.6738, 1.7647, 3.59],
      [60129, -175.0235, -0.6668, 3.89],
      [61941, -169.5848, -1.4494, 2.74],
      [64238, -162.5125, -5.539, 4.38],
      [65474, -158.7018, -11.1613, 0.98],
      [69701, -145.9964, -6.0005, 4.07],
      [71957, -139.2349, -5.6582, 3.87],
      [63608, -164.4558, 10.9592, 2.85],
      [63090, -166.0991, 3.3975, 3.39],
      [66249, -156.3267, -0.5958, 3.38],
      [68520, -149.5884, 1.5445, 4.23],
      [72220, -138.4378, 1.8929, 3.73],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5, 6, 7],
      [8, 9, 3],
      [4, 10, 11, 12],
    ],
  },
  libra: {
    stars: [
      [73714, -133.9824, -25.282, 3.25],
      [72622, -137.2804, -16.0418, 2.75],
      [74785, -130.7483, -9.3829, 2.61],
      [76333, -126.1184, -14.7895, 3.91],
      [76470, -125.744, -28.1351, 3.6],
      [76600, -125.336, -29.7778, 3.66],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5],
      [1, 3],
    ],
  },
  scorpio: {
    stars: [
      [78265, -120.287, -26.1141, 2.89],
      [78401, -119.9166, -22.6217, 2.29],
      [78820, -118.6407, -19.8055, 2.56],
      [80112, -114.7028, -25.5928, 2.9],
      [80763, -112.6481, -26.432, 1.06],
      [81266, -111.0294, -28.216, 2.82],
      [82396, -107.4591, -34.2932, 2.29],
      [82514, -107.0324, -38.0474, 3],
      [82729, -106.3541, -42.3613, 3.62],
      [84143, -101.9617, -43.2392, 3.32],
      [86228, -95.6703, -42.9978, 1.86],
      [87073, -93.1038, -40.127, 2.99],
      [86670, -94.378, -39.03, 2.39],
      [85927, -96.5978, -37.1038, 1.62],
    ],
    paths: [
      [0, 1, 2],
      [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    ],
  },
  sagittarius: {
    stars: [
      [89642, -85.5932, -36.7617, 3.1],
      [90185, -83.957, -34.3846, 1.79],
      [89931, -84.7515, -29.8281, 2.72],
      [90496, -83.0073, -25.4217, 2.82],
      [89341, -86.5591, -21.0588, 3.84],
      [95241, -69.3404, -44.459, 3.96],
      [95347, -69.0284, -40.6159, 3.96],
      [93506, -74.347, -29.8801, 2.6],
      [92041, -78.5859, -26.9908, 3.17],
      [98032, -61.1846, -41.8683, 4.12],
      [98412, -60.0659, -35.2763, 4.37],
      [98066, -61.0402, -26.2995, 4.7],
      [96465, -65.8232, -24.8836, 4.59],
      [95477, -68.6813, -24.5086, 5.02],
      [94643, -71.1149, -25.2567, 4.86],
      [92855, -76.1836, -26.2967, 2.05],
      [88635, -88.548, -30.4241, 2.98],
      [93864, -73.265, -27.6704, 3.32],
      [93683, -73.8292, -21.7415, 3.76],
      [94141, -72.559, -21.0236, 2.88],
      [94820, -70.5913, -18.9529, 4.88],
      [95168, -69.5818, -17.8472, 3.92],
      [95176, -69.5682, -15.955, 4.52],
      [93085, -75.5675, -21.1067, 3.52],
      [92761, -76.4576, -22.7448, 4.86],
    ],
    paths: [
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 3],
      [9, 10, 11, 12, 13, 14, 15, 8, 2, 16, 1, 7, 17, 15, 18, 19, 20, 21, 22],
      [18, 23, 24, 15],
    ],
  },
  capricorn: {
    stars: [
      [100027, -55.588, -12.5082, 4.3],
      [100345, -54.7472, -14.7814, 3.05],
      [101027, -52.7849, -17.8137, 4.77],
      [102485, -48.4761, -25.2709, 4.13],
      [102978, -47.0446, -26.9191, 4.12],
      [105881, -38.3332, -22.4113, 3.77],
      [107556, -33.2398, -16.1273, 2.85],
      [106985, -34.9773, -16.6623, 3.69],
      [105515, -39.4383, -16.8345, 4.28],
      [104139, -43.5132, -17.2329, 4.08],
    ],
    paths: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]],
  },
  aquarius: {
    stars: [
      [102618, -48.081, -9.4958, 3.78],
      [103045, -46.8365, -8.9833, 4.73],
      [106278, -37.1103, -5.5712, 2.9],
      [109074, -28.554, -0.3199, 2.95],
      [110395, -24.5859, -1.3873, 3.86],
      [110960, -22.792, -0.02, 3.65],
      [111497, -21.1609, -0.1175, 4.04],
      [112961, -16.8464, -7.5796, 3.73],
      [115033, -10.5241, -9.1825, 4.41],
      [114341, -12.6383, -21.1724, 3.68],
      [109139, -28.3907, -13.8697, 4.29],
      [110003, -25.7915, -7.7833, 4.17],
      [110672, -23.6807, 1.3774, 4.8],
      [115438, -9.2574, -20.1006, 3.96],
      [116901, -4.5591, -17.8165, 4.82],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [2, 10],
      [3, 11],
      [5, 12],
      [13, 8, 14],
    ],
  },
  pisces: {
    stars: [
      [5742, 18.4373, 24.5837, 4.67],
      [5586, 17.9152, 30.0896, 4.51],
      [6193, 19.8666, 27.2641, 4.74],
      [5571, 17.8634, 21.0347, 4.66],
      [7097, 22.8709, 15.3458, 3.62],
      [8198, 26.3485, 9.1577, 4.26],
      [9487, 30.5118, 2.7638, 3.82],
      [8833, 28.389, 3.1875, 4.61],
      [7884, 25.3579, 5.4876, 4.45],
      [7007, 22.5463, 6.1438, 4.84],
      [5737, 18.4329, 7.5754, 5.21],
      [4906, 15.7359, 7.8901, 4.27],
      [3786, 12.1706, 7.5851, 4.44],
      [118268, -0.1721, 6.8633, 4.03],
      [116771, -5.0123, 5.6263, 4.13],
      [115830, -8.0079, 6.379, 4.27],
      [115227, -9.9142, 5.3813, 5.05],
      [114971, -10.7086, 3.2823, 3.7],
      [115738, -8.2669, 1.2556, 4.95],
      [116928, -4.4883, 1.78, 4.49],
      [117245, -3.402, 3.4868, 4.95],
      [113889, -14.0308, 3.82, 4.48],
    ],
    paths: [
      [0, 1, 2, 0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 14],
      [17, 21],
    ],
  },
} as const satisfies Record<SignId, SourceFigure>

const VIEWBOX_SIZE = 100
const FIGURE_PADDING = 10
const DEGREES_TO_RADIANS = Math.PI / 180
const projectionCache = new Map<SignId, ProjectedSignFigure>()

function circularMeanRightAscension(stars: readonly SourceStar[]): number {
  let x = 0
  let y = 0

  for (const [, rightAscension] of stars) {
    const radians = rightAscension * DEGREES_TO_RADIANS
    x += Math.cos(radians)
    y += Math.sin(radians)
  }

  return Math.atan2(y, x) / DEGREES_TO_RADIANS
}

function angularOffset(value: number, origin: number): number {
  return ((value - origin + 540) % 360) - 180
}

function starRadius(magnitude: number): number {
  return Math.max(1.15, Math.min(2.6, 2.9 - magnitude * 0.38))
}

function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Projects a sign's real sky coordinates into a consistently padded square.
 * North is up and east is left, matching conventional printed sky-atlas
 * orientation. Right ascension uses a circular mean so Virgo and Pisces do not
 * split at the ±180° seam.
 */
export function projectSignFigure(sign: SignId): ProjectedSignFigure {
  const cached = projectionCache.get(sign)
  if (cached) {
    return cached
  }

  const source = SIGN_FIGURES[sign]
  const centerRightAscension = circularMeanRightAscension(source.stars)
  const centerDeclination = source.stars.reduce((sum, [, , declination]) => sum + declination, 0) / source.stars.length
  const rightAscensionScale = Math.cos(centerDeclination * DEGREES_TO_RADIANS)

  const skyPoints = source.stars.map(([, rightAscension, declination]) => ({
    x: -angularOffset(rightAscension, centerRightAscension) * rightAscensionScale,
    y: -declination,
  }))

  const xs = skyPoints.map(({ x }) => x)
  const ys = skyPoints.map(({ y }) => y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const span = Math.max(maxX - minX, maxY - minY, 1)
  const scale = (VIEWBOX_SIZE - FIGURE_PADDING * 2) / span
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  const projected: ProjectedSignFigure = {
    paths: source.paths,
    stars: source.stars.map(([hipparcosId, , , magnitude], index) => ({
      hipparcosId,
      magnitude,
      radius: roundCoordinate(starRadius(magnitude)),
      x: roundCoordinate(VIEWBOX_SIZE / 2 + (skyPoints[index].x - centerX) * scale),
      y: roundCoordinate(VIEWBOX_SIZE / 2 + (skyPoints[index].y - centerY) * scale),
    })),
  }

  projectionCache.set(sign, projected)
  return projected
}
