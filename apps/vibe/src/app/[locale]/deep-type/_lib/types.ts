import type { AxisId, GemCode, WorkDimension } from '@deep-type/model'
import type { PayMethod } from '@deep-type/pay-method'

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
  declareTitle: string
  declareUnknownHint: string
  declareUnknownLabel: string
  landingCta: string
  landingNote: string
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
  minorNotice: string
  cta: string
  /**
   * Payment-method picker. Only rendered where more than one method is offered — `payMethodsFor` gives `ko`
   * the wallets and everyone else the card channel alone — but every method carries a label in every locale,
   * so a locale that gains one later cannot ship the picker with a blank button. `Record<PayMethod, string>`
   * rather than a key each: adding a method then fails to compile until all four locales name it.
   */
  methodLabel: string
  methodLabels: Record<PayMethod, string>
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
  /**
   * The SPB leg. `paypalHint` sits above PayPal's own button after `/checkout` approves — the screen's only
   * explanation of why our pay button just became someone else's — and `paypalCancel` is the way back to an
   * editable form. Required in every locale like `methodLabels`: a locale that gains PayPal later cannot ship
   * the leg with blank copy.
   */
  paypalCancel: string
  paypalHint: string
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
   * O6. The picker no longer has a way to arrive here — '모름' builds a code instead of skipping — so this
   * reaches only a sitting stored before that branch existed, where `declaredPersona` is null. Kept because
   * such a sitting can still be resumed, and because the API accepts a null code from any caller. It describes
   * what is missing without counting anything (D5).
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

/**
 * The landing page, which is an ad destination before it is a product page. A visitor arrives from a paid click
 * knowing nothing, so the screen has to answer three questions in order — what is this, what do I get, what does
 * it cost me — before it asks for the first tap.
 *
 * Structured rather than a flat bag of strings because each group renders as a numbered list and the numbering
 * has to follow the array. A translator adds an entry and the screen grows a row.
 */
export type DeepTypeLandingContent = {
  /** Question a visitor already has, and the sentence that says this test takes it seriously. */
  asks: readonly { body: string; question: string }[]
  ctaMeta: string
  /** Cost, time, and when the result arrives. Three, because a fourth stops being scannable. */
  facts: readonly { label: string; value: string }[]
  /** What the free run hands back. Titles come from FREE_DELIVERABLES_KO, so only the bodies live here. */
  getsBodies: readonly string[]
  getsTitle: string
  kicker: string
  /** What the free run costs and what the paid one does. Offer terms, not a disclaimer. */
  offerNote: string
  stepsTitle: string
  steps: readonly { duration: string; title: string }[]
  stickyCta: string
}

/**
 * The four questions someone answers instead of picking a code they do not know. Order follows
 * `SELF_IMAGE_AXES`, and `options` is [first pole, second pole] for that axis — positional on both counts, so a
 * translator reorders nothing.
 */
export type DeepTypeSelfImageContent = {
  body: string
  items: readonly { options: readonly [string, string]; prompt: string }[]
  /** Shown on the progress rail, so it has to be short. The title is for the banner. */
  segmentLabel: string
  title: string
}

export type DeepTypeContent = {
  axes: Record<AxisId, AxisContent>
  gemNames: Record<GemCode, string>
  landing: DeepTypeLandingContent
  metadata: { description: string; title: string }
  methodology: MethodologyContent
  paywall: DeepTypePaywallContent
  /** Free-tier question text only. The paid 37 arrive through `_content/paid-questions.ts`. */
  questions: Record<string, QuestionContent>
  selfImage: DeepTypeSelfImageContent
  ui: DeepTypeUiText
}
