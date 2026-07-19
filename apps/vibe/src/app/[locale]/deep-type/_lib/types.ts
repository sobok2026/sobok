// Persona/Inner share the same 4-dichotomy shape (E/I · S/N · T/F · J/P) — Persona is "how you are
// around people", Inner is "how you are alone". Gem is a separate 4-axis code (R/M · O/A · V/H · U/O).
export type EIPole = 'E' | 'I'
export type SNPole = 'S' | 'N'
export type TFPole = 'T' | 'F'
export type JPPole = 'J' | 'P'
export type RMPole = 'R' | 'M'
export type OAPole = 'O' | 'A'
export type VHPole = 'V' | 'H'
export type UOPole = 'U' | 'O'

export type DichoCode = `${EIPole}${SNPole}${TFPole}${JPPole}`
export type PersonaCode = DichoCode
export type InnerCode = DichoCode
export type GemCode = `${RMPole}${OAPole}${VHPole}${UOPole}`

export type DichoAxisId = 'EI' | 'JP' | 'SN' | 'TF'
export type GemAxisId = 'OA' | 'RM' | 'UO' | 'VH'
export type AxisId = DichoAxisId | GemAxisId

export type InnerGroup = 'NF' | 'NT' | 'SJ' | 'SP'

// A single answered question's contribution to each axis it touches — mirrors the source's `sig` object,
// e.g. `{ EI: 2 }` or (for a multi-axis question) `{ SN: 2, TF: 1 }`.
export type AxisSignal = Partial<Record<AxisId, number>>

export type AnsweredSignal = {
  // The axis this question is the "anchor" for, if any — used as a tie-breaker in sumSigs()/judge()
  // when a phase's raw total for an axis nets to zero but this question still leaned one way.
  anchor?: AxisId
  signal: AxisSignal
}

export type AxisDefinition<TAxisId extends AxisId, TPoleA extends string, TPoleB extends string> = {
  id: TAxisId
  poles: readonly [TPoleA, TPoleB]
}

export const DICHO_AXES = [
  { id: 'EI', poles: ['E', 'I'] },
  { id: 'SN', poles: ['S', 'N'] },
  { id: 'TF', poles: ['T', 'F'] },
  { id: 'JP', poles: ['J', 'P'] },
] as const satisfies readonly AxisDefinition<DichoAxisId, string, string>[]

export const GEM_AXES = [
  { id: 'RM', poles: ['R', 'M'] },
  { id: 'OA', poles: ['O', 'A'] },
  { id: 'VH', poles: ['V', 'H'] },
  { id: 'UO', poles: ['U', 'O'] },
] as const satisfies readonly AxisDefinition<GemAxisId, string, string>[]

export type AxisJudgment<TId extends string> = {
  code: string
  axes: Record<TId, { pole: string; strength: number }>
}

// --- question shapes -----------------------------------------------------------------------------

export type PickQuestionId = string
export type SliderQuestionId = string

// A "pick one of N" question: N options, each with its own scoring signal. Text lives in _content, keyed
// by the same id.
export type PickQuestionDef = {
  id: PickQuestionId
  anchor?: AxisId
  optionCount: 3 | 4
  options: readonly AxisSignal[]
}

// A single-axis slider question (0-100, midpoint 50): sign of (value-50) maps to the axis's pole,
// flipped if `negated`.
export type SliderQuestionDef = {
  id: SliderQuestionId
  anchor?: AxisId
  axis: AxisId
  negated: boolean
}

export type QuestionDef = PickQuestionDef | SliderQuestionDef

export function isSliderQuestion(question: QuestionDef): question is SliderQuestionDef {
  return 'axis' in question
}

// --- answer shapes ---------------------------------------------------------------------------------

export type PickAnswer = { kind: 'pick'; optionIndex: number; questionId: PickQuestionId }
export type SliderAnswer = { kind: 'slider'; questionId: SliderQuestionId; value: number }
export type Answer = PickAnswer | SliderAnswer

// --- content shapes ---------------------------------------------------------------------------------

export type PickQuestionContent = {
  scene?: string
  text: string
  options: readonly string[]
}

export type SliderQuestionContent = {
  hi: string
  lo: string
  scene?: string
  text: string
}

export type DeepTypeUiText = {
  claimSubtitle: string
  claimTitle: string
  deepIntroBody: string
  deepIntroCta: string
  deepIntroTitle: string
  landingCta: string
  landingNote: string
  landingSubtitle: string
  landingTitle: string
  loveNoteAutonomous: string
  loveNoteConnected: string
  part2IntroBody: string
  part2IntroCta: string
  part2IntroTitle: string
  paywallCta: string
  paywallFeatureList: readonly string[]
  paywallSubtitle: string
  paywallTitle: string
  quickIntroBody: string
  quickIntroCta: string
  quickIntroTitle: string
  quickShareTextTemplate: string
  socialBatteryNoteExtroverted: string
  socialBatteryNoteIntroverted: string
  transparentTypeNote: string
}

export type ReportSectionContent = {
  title: string
}

export type DeepTypeContent = {
  metadata: {
    description: string
    title: string
  }
  ui: DeepTypeUiText
  personaQuestions: Record<string, PickQuestionContent | SliderQuestionContent>
  innerQuestions: Record<string, PickQuestionContent | SliderQuestionContent>
  gemQuestions: Record<string, PickQuestionContent | SliderQuestionContent>
  axes: Record<
    AxisId,
    {
      name: string
      poles: Record<string, { description: string; label: string }>
    }
  >
  gemGroupFlavor: Record<InnerGroup, string>
  base: Record<PersonaCode, { ident: string; keywords: readonly [string, string]; noun: string }>
  hiddenDescription: Record<InnerCode, string>
  gem: Record<
    GemCode,
    {
      gemName: string
      gemWhy: string
      grow: string
      keyword: string
      lack: string
      love: string
      modifier: string
      narrative: string
      read: string
    }
  >
  // Keyed by GemCode (not the localized gem display name) so lookups stay stable across locales.
  gemDescription: Record<GemCode, string>
  gapOuterInner: Record<string, string>
  prediction: Record<string, string>
  social: Record<string, string>
  recharge: Record<string, string>
  stressGuide: Record<string, { aid: string; base: string; dont: string; sign: string }>
  lifeAttitude: Record<string, { desc: string; name: string; tip: string }>
  avoid: Record<string, string>
  ctaByEI: Record<EIPole, string>
  ctaByRM: Record<RMPole, string>
  ctaByVH: Record<VHPole, string>
  work: Record<string, string>
  reportSections: Record<ReportSectionKey, ReportSectionContent>
}

export type ReportSectionKey =
  | 'avoid'
  | 'gap'
  | 'goals'
  | 'lifeAttitude'
  | 'love'
  | 'match'
  | 'recharge'
  | 'social'
  | 'stress'
  | 'summary'
  | 'thisWeek'
  | 'weakSpot'

export type DeepReport = {
  code: {
    gem: GemCode
    inner: InnerCode
    outer: PersonaCode
  }
  sections: {
    avoid: readonly string[]
    gap: { lines: readonly { gap: string; prediction: string }[]; syncRate: number | null; transparent: boolean }
    goals: string
    lifeAttitude: { desc: string; name: string; tip: string }
    love: { note: string; text: string }
    match: { clashGem: string; matchGem: string }
    recharge: string
    social: { note?: string; text: string }
    stress: { aid: string; base: string; dont: string; sign: string }
    summary: { gemName: string; innerNoun: string; outerNoun: string }
    thisWeek: readonly string[]
    weakSpot: string
  }
}
