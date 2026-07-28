import type { AxisId, GemCode, WorkDimension } from '@deep-type/model'

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

// Keyed by item id, never by position. The four banks used to arrive as parallel arrays zipped against the
// item list, so reordering or dropping one item shifted every prompt after it onto the wrong scoring vector
// without any type or runtime error. A lookup by id cannot drift; a missing id throws at build time.
export type QuestionPromptCatalog = Readonly<Record<string, string>>
export type QuestionOptionCatalog = Readonly<Record<string, QuestionContent['options']>>

export type DeepTypeUiText = {
  analyzingBody: string
  analyzingTitle: string
  backCta: string
  closestAnswerHint: string
  declareBody: string
  /** O6: what choosing '모름' costs, said here and again on the paywall. Never a section count (D5). */
  declareNotice: string
  declareTitle: string
  declareUnknownLabel: string
  landingCta: string
  landingNote: string
  landingStepCoreDesc: string
  landingStepJobDesc: string
  landingStepTypeDesc: string
  landingSubtitle: string
  landingTitle: string
  layerGem: string
  layerInner: string
  methodologyCta: string
  methodologyNoteBody: string
  methodologyNoteTitle: string
  reopenCta: string
  reportDisclaimer: string
  reportRestartCta: string
  reportShareCopied: string
  reportShareCta: string
  reportShareText: string
  // The one interruption in the free run. It fires where the type letters are decided and nowhere else, so it
  // may name those four letters and may not promise anything the remaining fifteen items have not measured.
  revealBody: string
  revealTemplate: string
  revealTitle: string
  // The three stretches of the single 27-item run. They label the progress bar; they are not screen titles,
  // because the run never changes screens.
  segmentCoreLabel: string
  segmentDrainLabel: string
  segmentTypeLabel: string
  /** Heading of the strength-card block. Not one of the four the terms name, so it lives here and not there. */
  strengthCardsTitle: string
  summaryTemplate: string
  worldJobCoreLabel: string
  worldJobFamilyLabel: string
}

export type DeepTypePaywallContent = {
  ageConfirmation: string
  benefits: readonly string[]
  body: string
  closeCta: string
  consentPrivacy: string
  consentWithdrawal: string
  cta: string
  discountTemplate: string
  effortNote: string
  emailLabel: string
  emailPlaceholder: string
  errorGeneric: string
  errorUnavailable: string
  // 보안 확인 실패는 만료(다시 풀면 됨)와 거절(다시 풀어도 안 됨)을 나눠서 안내한다. errorUnavailable 은
  // Cloudflare 가 답하지 않아 fail closed 로 막은 경우다.
  errorVerificationExpired: string
  errorVerificationFailed: string
  fallbackNote: string
  generatingBody: string
  generatingTitle: string
  /** Shown while the engine report is already on screen and the narration is still being written. */
  narrativePendingNote: string
  notice: string
  processing: string
  /**
   * The last request of the paid block failing. Its own copy rather than `errorGeneric`, which names payment —
   * telling a buyer whose card already cleared that the payment failed is the worst sentence available here.
   */
  refinementFailedBody: string
  refinementFailedTitle: string
  refinementIntroBody: string
  refinementIntroCta: string
  refinementIntroHint: string
  refinementIntroTitle: string
  /** Paired with the two above. Without it the failure screen is a dead end for someone who has paid. */
  refinementRetryCta: string
  refinementStepLabel: string
  refinementSubmitting: string
  refundCta: string
  refundDone: string
  refundFailed: string
  refundPending: string
  /** Shown when parked answers came back from the server and the buyer resumes mid-block. */
  resumeNote: string
  title: string
  /**
   * O6, second half. `ui.declareNotice` says the same thing at the picker; this one says it where money is
   * about to move, which is where a buyer who forgot the picker would otherwise find out afterwards. It
   * describes what is missing without counting anything (D5).
   */
  unknownPersonaNote: string
  unlockCta: string
  /** The five work blocks are presented one dimension at a time, so each needs its own heading. */
  workDimensions: Record<WorkDimension, string>
  workStepLabel: string
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
  /** Free-tier question text only. The paid 37 arrive through `_content/paid-questions.ts`. */
  questions: Record<string, QuestionContent>
  ui: DeepTypeUiText
}
