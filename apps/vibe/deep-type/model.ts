export const INSTRUMENT_VERSION = '3.0.0' as const

export const TYPE_AXES = ['EI', 'SN', 'TF', 'JP'] as const
export const CONTEXT_AXES = [...TYPE_AXES, 'NE'] as const
export const GEM_AXES = ['RM', 'OA', 'VH', 'UO'] as const
export const REFINEMENT_AXES = [...TYPE_AXES, ...GEM_AXES] as const

export type TypeAxisId = (typeof TYPE_AXES)[number]
export type ContextAxisId = (typeof CONTEXT_AXES)[number]
export type GemAxisId = (typeof GEM_AXES)[number]
export type RefinementAxisId = (typeof REFINEMENT_AXES)[number]
export type AxisId = ContextAxisId | GemAxisId

export type PersonaCode = `${'E' | 'I'}${'S' | 'N'}${'T' | 'F'}${'J' | 'P'}`
export type InnerCode = PersonaCode
export type GemCode = `${'R' | 'M'}${'O' | 'A'}${'V' | 'H'}${'U' | 'O'}`

export const AXIS_POLES = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
  NE: ['N', 'C'],
  RM: ['R', 'M'],
  OA: ['O', 'A'],
  VH: ['V', 'H'],
  UO: ['U', 'O'],
} as const satisfies Record<AxisId, readonly [string, string]>

export type AgreementValue = 1 | 2 | 3 | 4

export type ItemAnswer = {
  itemId: string
  value: AgreementValue
}

export type AxisScore = {
  /** Number of valid responses contributing to this axis. */
  answered: number
  /** Distance from an even split. Descriptive only; it is not reliability or certainty. */
  clarity: number
  /** Share associated with the first pole in AXIS_POLES, from 0 to 100. */
  firstShare: number
  /** Signed mean toward the first pole, from -1 to 1. */
  lean: number
  pole: string
  /** Share associated with the second pole in AXIS_POLES, from 0 to 100. */
  secondShare: number
}

export type ContextLayerProfile = {
  axes: Record<ContextAxisId, AxisScore>
  code: PersonaCode
}

export type GemLayerProfile = {
  axes: Record<GemAxisId, AxisScore>
  code: GemCode
}

export type AssessmentProfile = {
  gem: GemLayerProfile
  inner: ContextLayerProfile
  instrumentVersion: typeof INSTRUMENT_VERSION
  persona: ContextLayerProfile
}

export const PERSONA_CODES = [
  'ESTJ',
  'ESTP',
  'ESFJ',
  'ESFP',
  'ENTJ',
  'ENTP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISTP',
  'ISFJ',
  'ISFP',
  'INTJ',
  'INTP',
  'INFJ',
  'INFP',
] as const satisfies readonly PersonaCode[]

export const GEM_CODES = [
  'ROVU',
  'ROVO',
  'ROHU',
  'ROHO',
  'RAVU',
  'RAVO',
  'RAHU',
  'RAHO',
  'MOVU',
  'MOVO',
  'MOHU',
  'MOHO',
  'MAVU',
  'MAVO',
  'MAHU',
  'MAHO',
] as const satisfies readonly GemCode[]
