import { LOCALES, type Locale } from '@sobok/domain/locale'
import { z } from 'zod'
import {
  GUARDIAN_FULL_REPORT_PRODUCT_SKUS,
  GUARDIAN_REPORT_SLOTS,
  type GuardianFullReportProductSku,
  type GuardianReportSlot,
} from './manifest'

export const GUARDIAN_QUESTIONNAIRE_SCHEMA_VERSION = 1 as const
export const GUARDIAN_CORE_QUESTION_COUNT = 12 as const
export const GUARDIAN_CORE_QUESTIONS_PER_SLOT = 3 as const
export const GUARDIAN_MAX_ADAPTIVE_QUESTIONS = 8 as const
export const GUARDIAN_MAX_QUESTION_BANK_SIZE = 150 as const
export const GUARDIAN_MAX_TEXT_ANSWER_LENGTH = 500 as const

export type GuardianQuestionPhase = 'core' | 'adaptive'
export type GuardianQuestionKind = 'single_choice' | 'free_text'
export type GuardianQuestionSignals = Readonly<Record<string, number>>

interface GuardianQuestionBase {
  id: string
  slot: GuardianReportSlot
  phase: GuardianQuestionPhase
  prompt: string
  supportingText: string | null
}

export interface GuardianQuestionOption {
  id: string
  label: string
  nextQuestionId: string | null
  signals: GuardianQuestionSignals
}

export interface GuardianSingleChoiceQuestion extends GuardianQuestionBase {
  kind: 'single_choice'
  options: readonly GuardianQuestionOption[]
}

export interface GuardianFreeTextQuestion extends GuardianQuestionBase {
  kind: 'free_text'
  optional: true
  nextQuestionId: string | null
}

export type GuardianQuestion = GuardianSingleChoiceQuestion | GuardianFreeTextQuestion

/**
 * The paid source file contract. Prompts, labels, branches, and signal weights live in tracked JSON under
 * apps/stella/content; the publisher validates that source and atomically publishes it into Postgres.
 */
export interface GuardianQuestionnaireContent {
  schemaVersion: typeof GUARDIAN_QUESTIONNAIRE_SCHEMA_VERSION
  version: string
  productSku: GuardianFullReportProductSku
  locale: Locale
  entryQuestionId: string
  coreQuestionCount: typeof GUARDIAN_CORE_QUESTION_COUNT
  maximumAdaptiveQuestions: typeof GUARDIAN_MAX_ADAPTIVE_QUESTIONS
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
      question: GuardianQuestion
      answeredCount: number
      signalSnapshot: GuardianQuestionnaireSignalSnapshot
    }
  | {
      status: 'complete'
      version: string
      answeredCount: number
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
      question:
        | {
            id: string
            slot: GuardianReportSlot
            phase: GuardianQuestionPhase
            kind: 'single_choice'
            prompt: string
            supportingText: string | null
            options: readonly { id: string; label: string }[]
          }
        | {
            id: string
            slot: GuardianReportSlot
            phase: GuardianQuestionPhase
            kind: 'free_text'
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
  .record(ContentIdSchema, z.number().finite())
  .refine((signals) => Object.keys(signals).length > 0, 'Every option must contribute at least one signal')

const CommonQuestionFields = {
  id: ContentIdSchema,
  slot: z.enum(GUARDIAN_REPORT_SLOTS),
  phase: z.enum(['core', 'adaptive']),
  prompt: CopySchema,
  supportingText: CopySchema.nullable(),
} as const

const OptionSchema = z
  .object({
    id: ContentIdSchema,
    label: z.string().trim().min(1).max(160),
    nextQuestionId: ContentIdSchema.nullable(),
    signals: SignalSchema,
  })
  .strict()

const SingleChoiceQuestionSchema = z
  .object({
    ...CommonQuestionFields,
    kind: z.literal('single_choice'),
    options: z.array(OptionSchema).min(2).max(7),
  })
  .strict()

const FreeTextQuestionSchema = z
  .object({
    ...CommonQuestionFields,
    kind: z.literal('free_text'),
    optional: z.literal(true),
    nextQuestionId: ContentIdSchema.nullable(),
  })
  .strict()

const GuardianQuestionnaireContentSchema = z
  .object({
    schemaVersion: z.literal(GUARDIAN_QUESTIONNAIRE_SCHEMA_VERSION),
    version: ContentIdSchema,
    productSku: z.enum(GUARDIAN_FULL_REPORT_PRODUCT_SKUS),
    locale: z.enum(LOCALES),
    entryQuestionId: ContentIdSchema,
    coreQuestionCount: z.literal(GUARDIAN_CORE_QUESTION_COUNT),
    maximumAdaptiveQuestions: z.literal(GUARDIAN_MAX_ADAPTIVE_QUESTIONS),
    questions: z
      .array(z.discriminatedUnion('kind', [SingleChoiceQuestionSchema, FreeTextQuestionSchema]))
      .min(GUARDIAN_CORE_QUESTION_COUNT)
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
  const issues = questionnaireGraphIssues(content)
  if (issues.length > 0) {
    throw new GuardianQuestionnaireContentError(issues)
  }
  return content
}

/**
 * Walks only the branch selected by saved answers. Callers must pass the immutable content version pinned to
 * the report. The returned `question` is server-internal because its options still contain server-only signals;
 * `toGuardianQuestionnaireClientStep` is the sole browser projection.
 */
export function resolveGuardianQuestionnaireProgress(
  content: GuardianQuestionnaireContent,
  answers: GuardianQuestionnaireAnswerSnapshot,
): GuardianQuestionnaireProgress {
  const questionById = new Map(content.questions.map((question) => [question.id, question]))
  const visited = new Set<string>()
  const signals: Record<string, number> = {}
  let answeredCount = 0
  let questionId: string | null = content.entryQuestionId

  while (questionId) {
    if (visited.has(questionId)) {
      throw new GuardianQuestionnaireStateError(`Questionnaire ${content.version} contains a cycle at ${questionId}`)
    }
    visited.add(questionId)

    const question = questionById.get(questionId)
    if (!question) {
      throw new GuardianQuestionnaireStateError(
        `Questionnaire ${content.version} references missing question ${questionId}`,
      )
    }

    const answer = answers[question.id]
    if (!answer) {
      return {
        status: 'question',
        version: content.version,
        question,
        answeredCount,
        signalSnapshot: signals,
      }
    }

    answeredCount += 1
    if (question.kind === 'single_choice') {
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
      questionId = option.nextQuestionId
      continue
    }

    if (answer.type !== 'text') {
      throw new GuardianQuestionnaireStateError(`Question ${question.id} requires a text answer`)
    }

    questionId = question.nextQuestionId
  }

  if (Object.keys(answers).length !== answeredCount) {
    throw new GuardianQuestionnaireStateError('Questionnaire answers contain questions outside the selected branch')
  }

  return {
    status: 'complete',
    version: content.version,
    answeredCount,
    signalSnapshot: signals,
  }
}

/**
 * Explicit allow-list projection: prompts and labels for the current step are returned, while the bank,
 * branches, signal keys, signal weights, and accumulated answers remain on the server.
 */
export function toGuardianQuestionnaireClientStep(
  content: GuardianQuestionnaireContent,
  progress: GuardianQuestionnaireProgress,
): GuardianQuestionnaireClientStep {
  const stepProgress = {
    answered: progress.answeredCount,
    minimumTotal: content.coreQuestionCount,
    maximumTotal: content.coreQuestionCount + content.maximumAdaptiveQuestions,
  }

  if (progress.status === 'complete') {
    return {
      status: 'complete',
      version: progress.version,
      progress: stepProgress,
    }
  }

  const { question } = progress
  if (question.kind === 'single_choice') {
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
      optional: true,
      maxLength: GUARDIAN_MAX_TEXT_ANSWER_LENGTH,
    },
  }
}

function questionnaireGraphIssues(content: GuardianQuestionnaireContent): string[] {
  const issues: string[] = []
  const questionById = new Map<string, GuardianQuestion>()

  for (const question of content.questions) {
    if (questionById.has(question.id)) {
      issues.push(`Duplicate question id: ${question.id}`)
      continue
    }
    questionById.set(question.id, question)

    if (question.kind === 'single_choice') {
      const optionIds = new Set<string>()
      for (const option of question.options) {
        if (optionIds.has(option.id)) {
          issues.push(`Question ${question.id} has duplicate option id: ${option.id}`)
        }
        optionIds.add(option.id)
      }
    }
  }

  if (!questionById.has(content.entryQuestionId)) {
    issues.push(`Entry question does not exist: ${content.entryQuestionId}`)
  } else if (questionById.get(content.entryQuestionId)?.phase !== 'core') {
    issues.push(`Entry question must be core: ${content.entryQuestionId}`)
  }

  const coreQuestions = content.questions.filter(({ phase }) => phase === 'core')
  if (coreQuestions.length !== content.coreQuestionCount) {
    issues.push(`Expected ${content.coreQuestionCount} core questions, found ${coreQuestions.length}`)
  }
  for (const question of coreQuestions) {
    if (question.kind !== 'single_choice') {
      issues.push(`Core question ${question.id} must be single_choice`)
    }
  }
  for (const slot of GUARDIAN_REPORT_SLOTS) {
    const slotCoreCount = coreQuestions.filter((question) => question.slot === slot).length
    if (slotCoreCount !== GUARDIAN_CORE_QUESTIONS_PER_SLOT) {
      issues.push(
        `Slot ${slot} must contain ${GUARDIAN_CORE_QUESTIONS_PER_SLOT} core questions, found ${slotCoreCount}`,
      )
    }
  }

  const freeTextQuestions = content.questions.filter(({ kind }) => kind === 'free_text')
  if (freeTextQuestions.length > 1) {
    issues.push(`At most one optional free_text question may be published, found ${freeTextQuestions.length}`)
  }

  const nextIds = (question: GuardianQuestion): readonly (string | null)[] =>
    question.kind === 'single_choice'
      ? question.options.map(({ nextQuestionId }) => nextQuestionId)
      : [question.nextQuestionId]

  for (const question of content.questions) {
    for (const nextQuestionId of nextIds(question)) {
      if (nextQuestionId !== null && !questionById.has(nextQuestionId)) {
        issues.push(`Question ${question.id} references missing next question ${nextQuestionId}`)
      } else if (
        nextQuestionId !== null &&
        question.phase === 'adaptive' &&
        questionById.get(nextQuestionId)?.phase === 'core'
      ) {
        issues.push(`Adaptive question ${question.id} cannot return to core question ${nextQuestionId}`)
      }
    }
  }

  if (issues.length > 0 || !questionById.has(content.entryQuestionId)) {
    return issues
  }

  const visiting = new Set<string>()
  const reachable = new Set<string>()
  const pathCounts = new Map<string, { minCore: number; maxCore: number; minAdaptive: number; maxAdaptive: number }>()

  const countPaths = (
    questionId: string,
  ): { minCore: number; maxCore: number; minAdaptive: number; maxAdaptive: number } | null => {
    const memoized = pathCounts.get(questionId)
    if (memoized) {
      return memoized
    }
    if (visiting.has(questionId)) {
      issues.push(`Question graph contains a cycle at ${questionId}`)
      return null
    }

    const question = questionById.get(questionId)
    if (!question) {
      return null
    }
    visiting.add(questionId)
    reachable.add(questionId)

    const branches = nextIds(question)
    const branchCounts: { minCore: number; maxCore: number; minAdaptive: number; maxAdaptive: number }[] = []
    for (const nextQuestionId of branches) {
      if (nextQuestionId === null) {
        branchCounts.push({ minCore: 0, maxCore: 0, minAdaptive: 0, maxAdaptive: 0 })
        continue
      }
      const counts = countPaths(nextQuestionId)
      if (counts) {
        branchCounts.push(counts)
      }
    }

    visiting.delete(questionId)
    if (branchCounts.length === 0) {
      return null
    }

    const ownCore = question.phase === 'core' ? 1 : 0
    const ownAdaptive = question.phase === 'adaptive' ? 1 : 0
    const counts = {
      minCore: ownCore + Math.min(...branchCounts.map(({ minCore }) => minCore)),
      maxCore: ownCore + Math.max(...branchCounts.map(({ maxCore }) => maxCore)),
      minAdaptive: ownAdaptive + Math.min(...branchCounts.map(({ minAdaptive }) => minAdaptive)),
      maxAdaptive: ownAdaptive + Math.max(...branchCounts.map(({ maxAdaptive }) => maxAdaptive)),
    }
    pathCounts.set(questionId, counts)
    return counts
  }

  const entryCounts = countPaths(content.entryQuestionId)
  if (entryCounts) {
    if (entryCounts.minCore !== content.coreQuestionCount || entryCounts.maxCore !== content.coreQuestionCount) {
      issues.push(
        `Every path must contain exactly ${content.coreQuestionCount} core questions; paths contain ${entryCounts.minCore}–${entryCounts.maxCore}`,
      )
    }
    if (entryCounts.maxAdaptive > content.maximumAdaptiveQuestions) {
      issues.push(
        `A path contains ${entryCounts.maxAdaptive} adaptive questions; maximum is ${content.maximumAdaptiveQuestions}`,
      )
    }
  }

  for (const question of content.questions) {
    if (!reachable.has(question.id)) {
      issues.push(`Question is unreachable from ${content.entryQuestionId}: ${question.id}`)
    }
  }

  return issues
}
