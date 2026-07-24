import type { AxisId, GemCode } from '@deep-type/model'

export type AxisPoleContent = {
  description: string
  label: string
  reflection: string
}

export type AxisContent = {
  description: string
  first: AxisPoleContent
  name: string
  second: AxisPoleContent
}

export type QuestionContent = {
  options: readonly [string, string, string, string]
  prompt: string
}

export type QuestionOptionCatalog = {
  gem: readonly QuestionContent['options'][]
  inner: readonly QuestionContent['options'][]
  persona: readonly QuestionContent['options'][]
  refinement: readonly QuestionContent['options'][]
}

export type DeepTypeUiText = {
  analyzingBody: string
  analyzingTitle: string
  backCta: string
  clarityBands: { clear: string; moderate: string; slight: string }
  clarityLabel: string
  clarityNote: string
  closestAnswerHint: string
  contextBody: string
  contextTitle: string
  gemIntroBody: string
  gemIntroCta: string
  gemIntroHint: string
  gemIntroTitle: string
  gemStepLabel: string
  innerIntroBody: string
  innerIntroCta: string
  innerIntroHint: string
  innerIntroTitle: string
  innerStepLabel: string
  landingCta: string
  reopenCta: string
  landingNote: string
  landingStepGemDesc: string
  landingStepInnerDesc: string
  landingStepOuterDesc: string
  landingSubtitle: string
  landingTitle: string
  layerGem: string
  layerInner: string
  layerPersona: string
  methodologyCta: string
  methodologyNoteBody: string
  methodologyNoteTitle: string
  personaIntroBody: string
  personaIntroCta: string
  personaIntroHint: string
  personaIntroTitle: string
  personaStepLabel: string
  profileTitle: string
  refinedLabel: string
  reflectionBody: string
  reflectionTitle: string
  reportDisclaimer: string
  reportRestartCta: string
  reportShareCopied: string
  reportShareCta: string
  reportShareText: string
  summaryTemplate: string
}

export type DeepTypePaywallContent = {
  body: string
  closeCta: string
  consentPrivacy: string
  ageConfirmation: string
  consentWithdrawal: string
  cta: string
  discountTemplate: string
  emailLabel: string
  emailPlaceholder: string
  effortNote: string
  errorGeneric: string
  fallbackNote: string
  generatingBody: string
  generatingTitle: string
  benefits: readonly string[]
  notice: string
  processing: string
  refinementIntroBody: string
  refinementIntroCta: string
  refinementIntroHint: string
  refinementIntroTitle: string
  refinementStepLabel: string
  refinementSubmitting: string
  refundCta: string
  refundDone: string
  refundFailed: string
  refundPending: string
  title: string
  unlockCta: string
}

export type MethodologyContent = {
  backCta: string
  evidenceBody: string
  evidenceTitle: string
  intro: string
  principles: readonly string[]
  principlesTitle: string
  modelBody: string
  modelTitle: string
  scoringBody: string
  scoringTitle: string
  sourcesIntro: string
  sourcesTitle: string
  title: string
}

export type DeepTypeContent = {
  axes: Record<AxisId, AxisContent>
  gemNames: Record<GemCode, string>
  metadata: { description: string; title: string }
  methodology: MethodologyContent
  paywall: DeepTypePaywallContent
  questions: Record<string, QuestionContent>
  ui: DeepTypeUiText
}
