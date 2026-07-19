import type { GemCode, InnerCode, InnerGroup, PersonaCode } from './types'

// --- Inner-code → group, and the two "compatible inner" transforms ---------------------------------
//
// A person's Inner group (NF/NT/SJ/SP) drives which Gem-deep question bank they see. Keyed off the S/N
// and J/P letters (indices 1 and 3) of the Inner code.
export function groupOf(inner: InnerCode): InnerGroup {
  const isIntuitive = inner[1] === 'N'
  const isJudging = inner[3] === 'J'

  if (isIntuitive) {
    return inner[2] === 'F' ? 'NF' : 'NT'
  }

  return isJudging ? 'SJ' : 'SP'
}

// The gem whose only difference is opposite V/H (emotional processing) — "complementary": one expresses,
// the other holds, and they fill each other's gap.
export function bestMatchInner(gem: GemCode): GemCode {
  return flipGemPole(gem, 2)
}

// The gem whose O/A (relationship distance) *and* V/H (emotional processing) are both flipped — the
// combination most likely to misread each other's signals.
export function clashInner(gem: GemCode): GemCode {
  return flipGemPole(flipGemPole(gem, 1), 2)
}

function flipGemPole(gem: GemCode, index: number): GemCode {
  const letters = gem.split('')
  const letter = letters[index]

  if (index === 1) {
    letters[index] = letter === 'O' ? 'A' : 'O'
  } else if (index === 2) {
    letters[index] = letter === 'V' ? 'H' : 'V'
  }

  return letters.join('') as GemCode
}

export function syncRate(a: string, b: string): number {
  let matches = 0

  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) {
      matches++
    }
  }

  return Math.round((matches / a.length) * 100)
}

// --- result-code serialization ----------------------------------------------------------------------
//
// The result is fully client-side (no server storage now that the tier is free): the three codes encode
// into one opaque string for the share/re-view URL. Mirrors couple-gyeol's serialize/parse pattern.
export type DeepTypeResult = {
  gem: GemCode
  inner: InnerCode
  outer: PersonaCode
}

export function serializeDeepResult(result: DeepTypeResult): string {
  return [result.outer, result.inner, result.gem].join('_')
}

export function parseDeepResultCode(value: string | null | undefined): DeepTypeResult | null {
  if (!value) {
    return null
  }

  const [outer, inner, gem] = value.split('_')

  if (!isDichoCode(outer) || !isDichoCode(inner) || !isGemCode(gem)) {
    return null
  }

  return { gem: gem as GemCode, inner: inner as InnerCode, outer: outer as PersonaCode }
}

function isDichoCode(value: string | undefined): boolean {
  return value !== undefined && /^[EI][SN][TF][JP]$/.test(value)
}

function isGemCode(value: string | undefined): boolean {
  return value !== undefined && /^[RM][OA][VH][UO]$/.test(value)
}
