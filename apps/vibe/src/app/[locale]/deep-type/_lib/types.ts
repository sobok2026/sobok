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

export type DichoAxisId = 'EI' | 'SN' | 'TF' | 'JP'
export type GemAxisId = 'RM' | 'OA' | 'VH' | 'UO'
export type AxisId = DichoAxisId | GemAxisId

export type InnerGroup = 'NF' | 'NT' | 'SJ' | 'SP'

export type AxisDefinition<TAxisId extends AxisId, TPoleA extends string, TPoleB extends string> = {
  id: TAxisId
  poles: readonly [TPoleA, TPoleB]
}

// The first pole in each pair is the axis's canonical `+` direction: every item's signed value and every
// score's `lean` is measured toward poles[0]. poles[1] is simply the negative direction.
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

// --- items ------------------------------------------------------------------------------------------
//
// Every item measures exactly ONE axis — no cross-axis "bonus" signals. Keeping items unidimensional is
// what makes the score honest: an axis's lean is just the mean of its own items, nothing bleeds in.
//
// A `choice` item's options each carry a signed strength toward the axis's first pole (poles[0]), drawn
// from {-2, -1, +1, +2} (0 allowed for a deliberate "either way" option). A `scale` item maps a 0..100
// slider onto [-2, +2] (midpoint 50 → 0), negated when `reverse` is set.
//
// Balanced keying — mixing which pole the strong answer favors across an axis's items, and NOT always
// putting the +2 option at the same index — is a property of each axis's item SET, enforced by the bank
// invariant tests, not by the engine. It is what keeps "always pick the first / always agree" from
// drifting the result toward one pole (acquiescence control).

export type ItemId = string

export type ChoiceItem = {
  readonly id: ItemId
  readonly axis: AxisId
  readonly kind: 'choice'
  readonly options: readonly number[]
}

export type ScaleItem = {
  readonly id: ItemId
  readonly axis: AxisId
  readonly kind: 'scale'
  readonly reverse: boolean
}

export type Item = ChoiceItem | ScaleItem

export function isScaleItem(item: Item): item is ScaleItem {
  return item.kind === 'scale'
}

// --- answers & responses ----------------------------------------------------------------------------

export type ChoiceAnswer = { kind: 'choice'; itemId: ItemId; optionIndex: number }
export type ScaleAnswer = { kind: 'scale'; itemId: ItemId; value: number }
export type ItemAnswer = ChoiceAnswer | ScaleAnswer

// A resolved answer's signed contribution to its axis, in [-2, +2] toward poles[0].
export type AxisResponse = { axis: AxisId; value: number }

// --- scores -----------------------------------------------------------------------------------------

// Below this |lean| an axis is reported as genuinely split ("거의 반반") instead of faking certainty.
export const BORDERLINE_LEAN = 0.2

export type AxisScore = {
  // Resolved pole letter (poles[0] when lean >= 0, else poles[1]).
  pole: string
  // Signed mean toward poles[0], in [-1, 1]. 0 = perfectly split.
  lean: number
  // Honest 0..100 = round(|lean| * 100). No artificial floor.
  confidence: number
  // True when |lean| < BORDERLINE_LEAN — the result view flags this axis as split.
  borderline: boolean
  // Share (0..100) of this axis's items that pointed the same way as the resolved pole.
  consistency: number
  answered: number
}

export type AxesResult<TId extends string> = {
  code: string
  axes: Record<TId, AxisScore>
}

// Persona is measured against the visitor's self-claimed type: the claim seeds a weak prior, verification
// items can override it. `mismatch` marks an axis where the measured evidence flipped the claimed letter.
export type ClaimedAxisScore = AxisScore & { claimed: string; mismatch: boolean }

export type PersonaResult = {
  code: PersonaCode
  axes: Record<DichoAxisId, ClaimedAxisScore>
  mismatches: readonly DichoAxisId[]
}

// --- content shapes ---------------------------------------------------------------------------------

export type ChoiceItemContent = {
  scene?: string
  text: string
  options: readonly string[]
}

export type ScaleItemContent = {
  hi: string
  lo: string
  scene?: string
  text: string
}

export type ItemContent = ChoiceItemContent | ScaleItemContent

export type DeepTypeUiText = {
  analyzingBody: string
  analyzingTitle: string
  claimSubtitle: string
  claimTitle: string
  claimVerifyBody: string
  claimVerifyCta: string
  claimVerifyTitle: string
  confidenceBorderlineLabel: string
  confidenceIntro: string
  confidenceTitle: string
  // interim "겉속 간극" reveal after the Inner chapter (mirrors the prototype midpoint)
  gapRevealCta: string
  gapRevealEyebrow: string
  // {outer}/{inner} resolved by the reveal view
  gapRevealGapLine: string
  gapRevealInnerLead: string
  gapRevealPull: string
  innerIntroBody: string
  innerIntroCta: string
  innerIntroTitle: string
  landingCta: string
  landingStepGemDesc: string
  landingStepInnerDesc: string
  landingStepOuterDesc: string
  // report layer/label chrome — kept in content so every locale renders without hardcoded ko in the view
  layerGemFull: string
  layerGemShort: string
  layerInner: string
  layerPersona: string
  matchClashLabel: string
  matchFitLabel: string
  selfAloneTitle: string
  stressAidLabel: string
  stressDontLabel: string
  stressSignLabel: string
  // {outerNoun}/{innerNoun}/{gemName}/{narrative} resolved by the report view
  summaryTemplate: string
  // {rate} resolved by the report view
  syncRateLabel: string
  landingNote: string
  landingSubtitle: string
  landingTitle: string
  loveNoteAutonomous: string
  loveNoteConnected: string
  measureIntroBody: string
  measureIntroCta: string
  measureIntroTitle: string
  // {claimed}/{measured} → pole labels of the overridden axis.
  mismatchNote: string
  mismatchTitle: string
  // interim persona reveal after the verify chapter (light — the type was self-claimed)
  personaRevealDiff: string
  personaRevealEyebrow: string
  personaRevealMeasured: string
  personaRevealSame: string
  reportDisclaimer: string
  reportRestartCta: string
  reportShareCta: string
  reportShareText: string
  socialBatteryNoteExtroverted: string
  socialBatteryNoteIntroverted: string
  transparentTypeNote: string
}

export type ReportSectionContent = {
  title: string
}

export type AxisContent = {
  name: string
  poles: Record<string, { description: string; label: string }>
}

export type DeepTypeContent = {
  metadata: {
    description: string
    title: string
  }
  ui: DeepTypeUiText
  personaQuestions: Record<string, ItemContent>
  innerQuestions: Record<string, ItemContent>
  gemQuestions: Record<string, ItemContent>
  axes: Record<AxisId, AxisContent>
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

// --- report -----------------------------------------------------------------------------------------

// One axis's honest read, ready to render as a confidence bar. `pole`/`lean` come from the score;
// name + labels are resolved from content.axes so the view stays copy-free.
export type ConfidenceBar = {
  axisId: AxisId
  axisName: string
  pole: string
  poleLabel: string
  poleDescription: string
  confidence: number
  borderline: boolean
}

export type PersonaMismatch = {
  axisId: DichoAxisId
  axisName: string
  claimedLabel: string
  measuredLabel: string
}

export type DeepReport = {
  code: {
    gem: GemCode
    inner: InnerCode
    outer: PersonaCode
  }
  confidence: {
    gem: readonly ConfidenceBar[]
    inner: readonly ConfidenceBar[]
    persona: readonly ConfidenceBar[]
  }
  mismatches: readonly PersonaMismatch[]
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
