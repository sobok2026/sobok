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

export type DeepTypeUiText = {
  analyzingBody: string
  analyzingTitle: string
  answerScale: readonly [string, string, string, string]
  backCta: string
  clarityLabel: string
  clarityNote: string
  contextBody: string
  contextTitle: string
  gemIntroBody: string
  gemIntroCta: string
  gemIntroTitle: string
  gemStepLabel: string
  innerIntroBody: string
  innerIntroCta: string
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
  emailLabel: string
  emailPlaceholder: string
  errorGeneric: string
  fallbackNote: string
  generatingBody: string
  generatingTitle: string
  listPriceLabel: string
  lockedItems: readonly string[]
  notice: string
  priceLabel: string
  processing: string
  refinementIntroBody: string
  refinementIntroCta: string
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
  limitations: readonly string[]
  limitationsTitle: string
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
  questions: Record<string, string>
  ui: DeepTypeUiText
}
