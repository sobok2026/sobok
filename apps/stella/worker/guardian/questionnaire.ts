import { LOCALES, type Locale } from '@sobok/domain/locale'
import { z } from 'zod'
import {
  GUARDIAN_FULL_REPORT_PRODUCT_SKUS,
  GUARDIAN_REPORT_SLOTS,
  type GuardianFullReportProductSku,
  type GuardianReportSlot,
} from './manifest'

export const GUARDIAN_QUESTIONNAIRE_SCHEMA_VERSION = 1 as const
export const GUARDIAN_CORE_QUESTIONS_PER_SLOT = 3 as const
export const GUARDIAN_REQUIRED_ADAPTIVE_QUESTIONS_PER_SLOT = 1 as const
export const GUARDIAN_MAX_ADAPTIVE_QUESTIONS_PER_SLOT = 2 as const
export const GUARDIAN_MAX_QUESTION_BANK_SIZE = 150 as const
export const GUARDIAN_MAX_TEXT_ANSWER_LENGTH = 500 as const

export type GuardianQuestionPhase = 'core' | 'adaptive' | 'note'
export type GuardianQuestionKind = 'single_choice' | 'free_text'
export type GuardianQuestionSignals = Readonly<Record<string, number>>
export type GuardianAdaptiveQuestionRole = 'required' | 'deepening'

interface GuardianQuestionCopy {
  id: string
  prompt: string
  supportingText: string | null
}

export interface GuardianQuestionOption {
  id: string
  label: string
  signals: GuardianQuestionSignals
}

interface GuardianSingleChoiceQuestionBase extends GuardianQuestionCopy {
  slot: GuardianReportSlot
  kind: 'single_choice'
  options: readonly GuardianQuestionOption[]
}

export interface GuardianCoreQuestion extends GuardianSingleChoiceQuestionBase {
  phase: 'core'
}

export type GuardianAdaptiveQuestionSelection =
  | {
      readonly role: 'required'
      readonly priority: number
      readonly signalWeights: GuardianQuestionSignals
    }
  | {
      readonly role: 'deepening'
      readonly priority: number
      readonly minimumScore: number
      readonly signalWeights: GuardianQuestionSignals
    }

export interface GuardianAdaptiveQuestion extends GuardianSingleChoiceQuestionBase {
  phase: 'adaptive'
  selection: GuardianAdaptiveQuestionSelection
}

export type GuardianSingleChoiceQuestion = GuardianCoreQuestion | GuardianAdaptiveQuestion

export interface GuardianFreeTextQuestion extends GuardianQuestionCopy {
  phase: 'note'
  kind: 'free_text'
  optional: true
}

export type GuardianQuestion = GuardianSingleChoiceQuestion | GuardianFreeTextQuestion

/**
 * The paid source file contract. Prompts, labels, adaptive selection policies, and signal weights live in tracked JSON under
 * apps/stella/content; the publisher validates that source and atomically publishes it into Postgres.
 */
export interface GuardianQuestionnaireContent {
  schemaVersion: typeof GUARDIAN_QUESTIONNAIRE_SCHEMA_VERSION
  version: string
  productSku: GuardianFullReportProductSku
  locale: Locale
  coreQuestionsPerSlot: typeof GUARDIAN_CORE_QUESTIONS_PER_SLOT
  requiredAdaptiveQuestionsPerSlot: typeof GUARDIAN_REQUIRED_ADAPTIVE_QUESTIONS_PER_SLOT
  maximumAdaptiveQuestionsPerSlot: typeof GUARDIAN_MAX_ADAPTIVE_QUESTIONS_PER_SLOT
  questions: readonly GuardianQuestion[]
}

export type GuardianQuestionnaireAnswer =
  | { readonly type: 'option'; readonly optionId: string }
  | { readonly type: 'text'; readonly text: string | null }

export type GuardianQuestionnaireAnswerSnapshot = Readonly<Record<string, GuardianQuestionnaireAnswer>>
export type GuardianQuestionnaireSignalSnapshot = Readonly<Record<string, number>>

export type GuardianQuestionnaireProgress =
  | {
      status: 'question'
      version: string
      question: GuardianSingleChoiceQuestion
      answeredQuestionCount: number
      signalSnapshot: GuardianQuestionnaireSignalSnapshot
    }
  | {
      status: 'optional-note'
      version: string
      note: GuardianFreeTextQuestion
      answeredQuestionCount: number
      signalSnapshot: GuardianQuestionnaireSignalSnapshot
    }
  | {
      status: 'complete'
      version: string
      answeredQuestionCount: number
      signalSnapshot: GuardianQuestionnaireSignalSnapshot
    }

export type GuardianQuestionnaireClientStep =
  | {
      status: 'question'
      version: string
      progress: {
        answered: number
        minimumTotal: number
        maximumTotal: number
      }
      question: {
        id: string
        slot: GuardianReportSlot
        phase: 'core' | 'adaptive'
        kind: 'single_choice'
        prompt: string
        supportingText: string | null
        options: readonly { id: string; label: string }[]
      }
    }
  | {
      status: 'optional-note'
      version: string
      progress: {
        answered: number
        minimumTotal: number
        maximumTotal: number
      }
      note: {
        id: string
        prompt: string
        supportingText: string | null
        optional: true
        maxLength: number
      }
    }
  | {
      status: 'complete'
      version: string
      progress: {
        answered: number
        minimumTotal: number
        maximumTotal: number
      }
    }

const ContentIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9._-]*$/)
const CopySchema = z.string().trim().min(1).max(500)
const SignalSchema = z
  .record(ContentIdSchema, z.number().int().positive())
  .refine((signals) => Object.keys(signals).length > 0, 'Every option must contribute at least one signal')

const CommonQuestionCopy = {
  id: ContentIdSchema,
  prompt: CopySchema,
  supportingText: CopySchema.nullable(),
} as const

const OptionSchema = z
  .object({
    id: ContentIdSchema,
    label: z.string().trim().min(1).max(160),
    signals: SignalSchema,
  })
  .strict()

const SingleChoiceQuestionFields = {
  ...CommonQuestionCopy,
  slot: z.enum(GUARDIAN_REPORT_SLOTS),
  kind: z.literal('single_choice'),
  options: z.array(OptionSchema).min(2).max(7),
} as const

const RequiredSelectionSchema = z
  .object({
    role: z.literal('required'),
    priority: z.number().int().nonnegative(),
    signalWeights: SignalSchema,
  })
  .strict()

const DeepeningSelectionSchema = z
  .object({
    role: z.literal('deepening'),
    priority: z.number().int().nonnegative(),
    minimumScore: z.number().int().positive(),
    signalWeights: SignalSchema,
  })
  .strict()

const CoreQuestionSchema = z
  .object({
    ...SingleChoiceQuestionFields,
    phase: z.literal('core'),
  })
  .strict()

const AdaptiveQuestionSchema = z
  .object({
    ...SingleChoiceQuestionFields,
    phase: z.literal('adaptive'),
    selection: z.discriminatedUnion('role', [RequiredSelectionSchema, DeepeningSelectionSchema]),
  })
  .strict()

const FreeTextQuestionSchema = z
  .object({
    ...CommonQuestionCopy,
    phase: z.literal('note'),
    kind: z.literal('free_text'),
    optional: z.literal(true),
  })
  .strict()

const GuardianQuestionnaireContentSchema = z
  .object({
    schemaVersion: z.literal(GUARDIAN_QUESTIONNAIRE_SCHEMA_VERSION),
    version: ContentIdSchema,
    productSku: z.enum(GUARDIAN_FULL_REPORT_PRODUCT_SKUS),
    locale: z.enum(LOCALES),
    coreQuestionsPerSlot: z.literal(GUARDIAN_CORE_QUESTIONS_PER_SLOT),
    requiredAdaptiveQuestionsPerSlot: z.literal(GUARDIAN_REQUIRED_ADAPTIVE_QUESTIONS_PER_SLOT),
    maximumAdaptiveQuestionsPerSlot: z.literal(GUARDIAN_MAX_ADAPTIVE_QUESTIONS_PER_SLOT),
    questions: z
      .array(z.discriminatedUnion('phase', [CoreQuestionSchema, AdaptiveQuestionSchema, FreeTextQuestionSchema]))
      .min(GUARDIAN_CORE_QUESTIONS_PER_SLOT * GUARDIAN_REPORT_SLOTS.length + 1)
      .max(GUARDIAN_MAX_QUESTION_BANK_SIZE),
  })
  .strict()

export class GuardianQuestionnaireContentError extends Error {
  readonly issues: readonly string[]

  constructor(issues: readonly string[]) {
    super(`Invalid guardian questionnaire content:\n${issues.map((issue) => `- ${issue}`).join('\n')}`)
    this.name = 'GuardianQuestionnaireContentError'
    this.issues = issues
  }
}

export class GuardianQuestionnaireStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GuardianQuestionnaireStateError'
  }
}

export function parseGuardianQuestionnaireContent(input: unknown): GuardianQuestionnaireContent {
  const parsed = GuardianQuestionnaireContentSchema.safeParse(input)
  if (!parsed.success) {
    throw new GuardianQuestionnaireContentError(
      parsed.error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`),
    )
  }

  const content = parsed.data as GuardianQuestionnaireContent
  const issues = questionnaireContentIssues(content)
  if (issues.length > 0) {
    throw new GuardianQuestionnaireContentError(issues)
  }
  return content
}

/**
 * Replays the immutable answer sequence and chooses each follow-up from the cumulative signal snapshot. The
 * first adaptive pass guarantees one question for every report slot; a second pass may add one deepening
 * question per slot when its published threshold is met. The optional note is a separate, unnumbered step.
 */
export function resolveGuardianQuestionnaireProgress(
  content: GuardianQuestionnaireContent,
  answers: GuardianQuestionnaireAnswerSnapshot,
): GuardianQuestionnaireProgress {
  const coreQuestions = content.questions.filter(
    (question): question is GuardianCoreQuestion => question.phase === 'core',
  )
  const adaptiveQuestions = content.questions.filter(
    (question): question is GuardianAdaptiveQuestion => question.phase === 'adaptive',
  )
  const note = content.questions.find((question): question is GuardianFreeTextQuestion => question.phase === 'note')
  if (!note) {
    throw new GuardianQuestionnaireStateError(`Questionnaire ${content.version} has no optional note`)
  }

  const signals: Record<string, number> = {}
  const consumedAnswerIds = new Set<string>()
  let answeredQuestionCount = 0

  for (const question of coreQuestions) {
    const answer = answers[question.id]
    if (!answer) {
      return {
        status: 'question',
        version: content.version,
        question,
        answeredQuestionCount,
        signalSnapshot: signals,
      }
    }
    addChoiceAnswerSignals(question, answer, signals)
    consumedAnswerIds.add(question.id)
    answeredQuestionCount += 1
  }

  const selectedAdaptiveQuestions: GuardianAdaptiveQuestion[] = []
  while (true) {
    const question = selectNextAdaptiveQuestion(adaptiveQuestions, selectedAdaptiveQuestions, signals)
    if (!question) {
      break
    }
    const answer = answers[question.id]
    if (!answer) {
      return {
        status: 'question',
        version: content.version,
        question,
        answeredQuestionCount,
        signalSnapshot: signals,
      }
    }
    addChoiceAnswerSignals(question, answer, signals)
    consumedAnswerIds.add(question.id)
    selectedAdaptiveQuestions.push(question)
    answeredQuestionCount += 1
  }

  const noteAnswer = answers[note.id]
  if (!noteAnswer) {
    return {
      status: 'optional-note',
      version: content.version,
      note,
      answeredQuestionCount,
      signalSnapshot: signals,
    }
  }
  if (noteAnswer.type !== 'text') {
    throw new GuardianQuestionnaireStateError(`Optional note ${note.id} requires a text answer`)
  }
  consumedAnswerIds.add(note.id)

  if (Object.keys(answers).some((questionId) => !consumedAnswerIds.has(questionId))) {
    throw new GuardianQuestionnaireStateError('Questionnaire answers contain a question outside the selected sequence')
  }

  return {
    status: 'complete',
    version: content.version,
    answeredQuestionCount,
    signalSnapshot: signals,
  }
}

/**
 * Explicit allow-list projection: prompts and labels for the current step are returned, while the bank,
 * selection policies, signal keys, signal weights, and accumulated answers remain on the server.
 */
export function toGuardianQuestionnaireClientStep(
  content: GuardianQuestionnaireContent,
  progress: GuardianQuestionnaireProgress,
): GuardianQuestionnaireClientStep {
  const slotCount = GUARDIAN_REPORT_SLOTS.length
  const fixedMinimumTotal = slotCount * (content.coreQuestionsPerSlot + content.requiredAdaptiveQuestionsPerSlot)
  const fixedMaximumTotal = slotCount * (content.coreQuestionsPerSlot + content.maximumAdaptiveQuestionsPerSlot)
  const isChoiceSequenceFinished = progress.status === 'optional-note' || progress.status === 'complete'
  const stepProgress = {
    answered: progress.answeredQuestionCount,
    minimumTotal: isChoiceSequenceFinished
      ? progress.answeredQuestionCount
      : Math.max(fixedMinimumTotal, progress.answeredQuestionCount + 1),
    maximumTotal: isChoiceSequenceFinished ? progress.answeredQuestionCount : fixedMaximumTotal,
  }

  if (progress.status === 'complete') {
    return {
      status: 'complete',
      version: progress.version,
      progress: stepProgress,
    }
  }

  if (progress.status === 'optional-note') {
    return {
      status: 'optional-note',
      version: progress.version,
      progress: stepProgress,
      note: {
        id: progress.note.id,
        prompt: progress.note.prompt,
        supportingText: progress.note.supportingText,
        optional: true,
        maxLength: GUARDIAN_MAX_TEXT_ANSWER_LENGTH,
      },
    }
  }

  const { question } = progress
  return {
    status: 'question',
    version: progress.version,
    progress: stepProgress,
    question: {
      id: question.id,
      slot: question.slot,
      phase: question.phase,
      kind: question.kind,
      prompt: question.prompt,
      supportingText: question.supportingText,
      options: question.options.map(({ id, label }) => ({ id, label })),
    },
  }
}

function addChoiceAnswerSignals(
  question: GuardianSingleChoiceQuestion,
  answer: GuardianQuestionnaireAnswer,
  signals: Record<string, number>,
): void {
  if (answer.type !== 'option') {
    throw new GuardianQuestionnaireStateError(`Question ${question.id} requires an option answer`)
  }
  const option = question.options.find((candidate) => candidate.id === answer.optionId)
  if (!option) {
    throw new GuardianQuestionnaireStateError(`Question ${question.id} has no published option ${answer.optionId}`)
  }
  for (const [signal, value] of Object.entries(option.signals)) {
    signals[signal] = (signals[signal] ?? 0) + value
  }
}

function selectNextAdaptiveQuestion(
  questions: readonly GuardianAdaptiveQuestion[],
  selectedQuestions: readonly GuardianAdaptiveQuestion[],
  signals: GuardianQuestionnaireSignalSnapshot,
): GuardianAdaptiveQuestion | null {
  const selectedIds = new Set(selectedQuestions.map(({ id }) => id))
  const requiredSlots = new Set(
    selectedQuestions.filter(({ selection }) => selection.role === 'required').map(({ slot }) => slot),
  )

  if (requiredSlots.size < GUARDIAN_REPORT_SLOTS.length) {
    return highestRankedQuestion(
      questions.filter(
        (question) =>
          question.selection.role === 'required' && !selectedIds.has(question.id) && !requiredSlots.has(question.slot),
      ),
      signals,
    )
  }

  const deepenedSlots = new Set(
    selectedQuestions.filter(({ selection }) => selection.role === 'deepening').map(({ slot }) => slot),
  )
  return highestRankedQuestion(
    questions.filter((question) => {
      if (question.selection.role !== 'deepening' || selectedIds.has(question.id) || deepenedSlots.has(question.slot)) {
        return false
      }
      return adaptiveSelectionScore(question, signals) >= question.selection.minimumScore
    }),
    signals,
  )
}

function highestRankedQuestion(
  questions: readonly GuardianAdaptiveQuestion[],
  signals: GuardianQuestionnaireSignalSnapshot,
): GuardianAdaptiveQuestion | null {
  let winner: GuardianAdaptiveQuestion | null = null
  let winnerScore = Number.NEGATIVE_INFINITY
  for (const question of questions) {
    const score = adaptiveSelectionScore(question, signals)
    if (
      score > winnerScore ||
      (score === winnerScore && question.selection.priority > (winner?.selection.priority ?? -1))
    ) {
      winner = question
      winnerScore = score
    }
  }
  return winner
}

function adaptiveSelectionScore(
  question: GuardianAdaptiveQuestion,
  signals: GuardianQuestionnaireSignalSnapshot,
): number {
  return Object.entries(question.selection.signalWeights).reduce(
    (score, [signal, weight]) => score + (signals[signal] ?? 0) * weight,
    0,
  )
}

function questionnaireContentIssues(content: GuardianQuestionnaireContent): string[] {
  const issues: string[] = []
  const questionIds = new Set<string>()
  const producedSignals = new Set<string>()

  for (const question of content.questions) {
    if (questionIds.has(question.id)) {
      issues.push(`Duplicate question id: ${question.id}`)
      continue
    }
    questionIds.add(question.id)

    if (question.kind === 'single_choice') {
      const optionIds = new Set<string>()
      for (const option of question.options) {
        if (optionIds.has(option.id)) {
          issues.push(`Question ${question.id} has duplicate option id: ${option.id}`)
        }
        optionIds.add(option.id)
        for (const signal of Object.keys(option.signals)) {
          producedSignals.add(signal)
        }
      }
    }
  }

  const coreQuestions = content.questions.filter(
    (question): question is GuardianCoreQuestion => question.phase === 'core',
  )
  const expectedCoreCount = GUARDIAN_REPORT_SLOTS.length * content.coreQuestionsPerSlot
  if (coreQuestions.length !== expectedCoreCount) {
    issues.push(`Expected ${expectedCoreCount} core questions, found ${coreQuestions.length}`)
  }
  for (const slot of GUARDIAN_REPORT_SLOTS) {
    const slotCoreCount = coreQuestions.filter((question) => question.slot === slot).length
    if (slotCoreCount !== content.coreQuestionsPerSlot) {
      issues.push(`Slot ${slot} must contain ${content.coreQuestionsPerSlot} core questions, found ${slotCoreCount}`)
    }
  }

  const notes = content.questions.filter(({ phase }) => phase === 'note')
  if (notes.length !== 1) {
    issues.push(`Exactly one optional note must be published, found ${notes.length}`)
  } else if (content.questions.at(-1)?.id !== notes[0]?.id) {
    issues.push('The optional note must be the final item in the source file')
  }

  const adaptiveQuestions = content.questions.filter(
    (question): question is GuardianAdaptiveQuestion => question.phase === 'adaptive',
  )
  for (const slot of GUARDIAN_REPORT_SLOTS) {
    const requiredCount = adaptiveQuestions.filter(
      (question) => question.slot === slot && question.selection.role === 'required',
    ).length
    const deepeningCount = adaptiveQuestions.filter(
      (question) => question.slot === slot && question.selection.role === 'deepening',
    ).length
    if (requiredCount < content.requiredAdaptiveQuestionsPerSlot) {
      issues.push(`Slot ${slot} needs at least one required adaptive question, found ${requiredCount}`)
    }
    if (deepeningCount < content.maximumAdaptiveQuestionsPerSlot - content.requiredAdaptiveQuestionsPerSlot) {
      issues.push(`Slot ${slot} needs at least one deepening adaptive question, found ${deepeningCount}`)
    }
  }

  for (const question of adaptiveQuestions) {
    for (const signal of Object.keys(question.selection.signalWeights)) {
      if (!producedSignals.has(signal)) {
        issues.push(`Adaptive selector ${question.id} references a signal no option produces: ${signal}`)
      }
    }
  }

  return issues
}
