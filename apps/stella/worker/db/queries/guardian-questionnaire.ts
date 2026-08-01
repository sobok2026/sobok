import type { Db } from '@sobok/edge/db/client'
import { asc, eq } from 'drizzle-orm'
import type { GuardianFullReportProductSku } from '../../guardian/manifest'
import {
  GUARDIAN_MAX_TEXT_ANSWER_LENGTH,
  type GuardianAdaptiveQuestion,
  type GuardianQuestion,
  type GuardianQuestionnaireAnswer,
  type GuardianQuestionnaireAnswerSnapshot,
  type GuardianQuestionnaireClientStep,
  type GuardianQuestionnaireContent,
  type GuardianSingleChoiceQuestion,
  parseGuardianQuestionnaireContent,
  resolveGuardianQuestionnaireProgress,
  toGuardianQuestionnaireClientStep,
} from '../../guardian/questionnaire'
import { guardianQuestionAnswerTable, guardianReportTable } from '../schema/guardian'
import {
  guardianQuestionnaireVersionTable,
  guardianQuestionOptionTable,
  guardianQuestionTable,
} from '../schema/guardian-questionnaire'
import {
  findPaidFullReportPurchase,
  fulfillGuardianReportAfterQuestionnaireInTransaction,
  lockedReportOf,
} from './guardian'

interface LoadedGuardianQuestionnaire {
  content: GuardianQuestionnaireContent
  questionRowIdByQuestionId: ReadonlyMap<string, number>
  optionRowIdByQuestionAndOptionId: ReadonlyMap<string, number>
}

export type GuardianQuestionnaireStepResult =
  | { status: 'ok'; step: GuardianQuestionnaireClientStep }
  | { status: 'report-not-found' | 'payment-required' }

export type SaveGuardianQuestionnaireAnswerResult =
  | { status: 'saved' | 'already-saved'; step: GuardianQuestionnaireClientStep }
  | { status: 'report-not-found' | 'payment-required' | 'question-conflict' | 'invalid-answer' }

/**
 * Returns only the current question projection. The server-only signal matrix and every not-yet-selected candidate
 * stay inside the Worker even though the whole immutable version is loaded in one small server-side query set.
 */
export async function getGuardianQuestionnaireStep(
  db: Db,
  input: { collectionId: number; reportId: number },
): Promise<GuardianQuestionnaireStepResult> {
  const report = await findGuardianQuestionnaireReport(db, input)
  if (!report) {
    return { status: 'report-not-found' }
  }

  const questionnaire = await loadGuardianQuestionnaire(db, report.questionnaireVersion)
  if (questionnaire.content.productSku !== report.productSku) {
    throw new Error(`Guardian report ${input.reportId} has a questionnaire for another product`)
  }
  if (!(await hasGuardianQuestionnaireEntitlement(db, input, report.productSku))) {
    return { status: 'payment-required' }
  }

  const answers = await loadGuardianQuestionnaireAnswers(db, input.reportId)
  const progress = resolveGuardianQuestionnaireProgress(questionnaire.content, answers)
  return {
    status: 'ok',
    step: toGuardianQuestionnaireClientStep(questionnaire.content, progress),
  }
}

/**
 * Saves exactly the currently reachable question under a report row lock. A lost-response retry with the
 * same answer is idempotent and returns the already-advanced step; changing an old answer is a separate future
 * operation rather than an implicit delete of downstream paid answers.
 */
export async function saveGuardianQuestionnaireAnswer(
  db: Db,
  input: {
    collectionId: number
    reportId: number
    questionId: string
    answer: GuardianQuestionnaireAnswer
  },
): Promise<SaveGuardianQuestionnaireAnswerResult> {
  return db.transaction(async (tx) => {
    const report = await findGuardianQuestionnaireReport(tx, input, true)
    if (!report) {
      return { status: 'report-not-found' as const }
    }

    const questionnaire = await loadGuardianQuestionnaire(tx, report.questionnaireVersion)
    if (questionnaire.content.productSku !== report.productSku) {
      throw new Error(`Guardian report ${input.reportId} has a questionnaire for another product`)
    }
    if (!(await hasGuardianQuestionnaireEntitlement(tx, input, report.productSku))) {
      return { status: 'payment-required' as const }
    }

    const answers = await loadGuardianQuestionnaireAnswers(tx, input.reportId)
    const progress = resolveGuardianQuestionnaireProgress(questionnaire.content, answers)
    const currentQuestion =
      progress.status === 'question' ? progress.question : progress.status === 'optional-note' ? progress.note : null

    if (!currentQuestion || currentQuestion.id !== input.questionId) {
      const saved = answers[input.questionId]
      if (!saved || !sameGuardianAnswer(saved, normalizeAnswerForStoredQuestion(questionnaire.content, input))) {
        return { status: 'question-conflict' as const }
      }
      return {
        status: 'already-saved' as const,
        step: toGuardianQuestionnaireClientStep(questionnaire.content, progress),
      }
    }

    const answer = normalizeGuardianAnswer(currentQuestion, input.answer)
    if (!answer) {
      return { status: 'invalid-answer' as const }
    }

    const questionRowId = questionnaire.questionRowIdByQuestionId.get(currentQuestion.id)
    if (!questionRowId) {
      throw new Error(`Guardian questionnaire row is missing for ${currentQuestion.id}`)
    }

    let optionRowId: number | null = null
    if (answer.type === 'option') {
      optionRowId =
        questionnaire.optionRowIdByQuestionAndOptionId.get(optionMapKey(currentQuestion.id, answer.optionId)) ?? null
      if (!optionRowId) {
        throw new Error(`Guardian questionnaire option row is missing for ${currentQuestion.id}/${answer.optionId}`)
      }
    }

    await tx.insert(guardianQuestionAnswerTable).values({
      reportId: input.reportId,
      questionId: questionRowId,
      kind: currentQuestion.kind,
      optionId: optionRowId,
      textValue: answer.type === 'text' ? answer.text : null,
    })

    const nextAnswers: GuardianQuestionnaireAnswerSnapshot = {
      ...answers,
      [currentQuestion.id]: answer,
    }
    const nextProgress = resolveGuardianQuestionnaireProgress(questionnaire.content, nextAnswers)

    if (nextProgress.status === 'complete') {
      await tx
        .update(guardianReportTable)
        .set({
          questionnaireAnswerSnapshot: nextAnswers,
          questionnaireSignalSnapshot: nextProgress.signalSnapshot,
          questionnaireCompletedAt: new Date(),
        })
        .where(eq(guardianReportTable.id, input.reportId))

      const fulfillment = await fulfillGuardianReportAfterQuestionnaireInTransaction(tx, input)
      if (fulfillment.status !== 'fulfilled' && fulfillment.status !== 'already-fulfilled') {
        throw new Error(`Guardian report fulfillment failed after questionnaire: ${fulfillment.status}`)
      }
    }

    return {
      status: 'saved' as const,
      step: toGuardianQuestionnaireClientStep(questionnaire.content, nextProgress),
    }
  })
}

async function findGuardianQuestionnaireReport(
  db: Db,
  input: { collectionId: number; reportId: number },
  lock = false,
): Promise<{ productSku: GuardianFullReportProductSku; questionnaireVersion: string } | null> {
  const report = await lockedReportOf(db, input, lock)
  if (!report) {
    return null
  }
  return { productSku: report.productSku, questionnaireVersion: report.questionnaireVersion }
}

async function hasGuardianQuestionnaireEntitlement(
  db: Db,
  input: { collectionId: number; reportId: number },
  productSku: GuardianFullReportProductSku,
): Promise<boolean> {
  const purchase = await findPaidFullReportPurchase(db, {
    collectionId: input.collectionId,
    reportId: input.reportId,
    sku: productSku,
  })

  return purchase !== null
}

async function loadGuardianQuestionnaire(db: Db, version: string): Promise<LoadedGuardianQuestionnaire> {
  const [versionRow] = await db
    .select({
      id: guardianQuestionnaireVersionTable.id,
      schemaVersion: guardianQuestionnaireVersionTable.schemaVersion,
      version: guardianQuestionnaireVersionTable.version,
      productSku: guardianQuestionnaireVersionTable.productSku,
      locale: guardianQuestionnaireVersionTable.locale,
      coreQuestionsPerSlot: guardianQuestionnaireVersionTable.coreQuestionsPerSlot,
      requiredAdaptiveQuestionsPerSlot: guardianQuestionnaireVersionTable.requiredAdaptiveQuestionsPerSlot,
      maximumAdaptiveQuestionsPerSlot: guardianQuestionnaireVersionTable.maximumAdaptiveQuestionsPerSlot,
    })
    .from(guardianQuestionnaireVersionTable)
    .where(eq(guardianQuestionnaireVersionTable.version, version))
    .limit(1)
  if (!versionRow) {
    throw new Error(`Guardian questionnaire content is not published: ${version}`)
  }

  const questionRows = await db
    .select({
      rowId: guardianQuestionTable.id,
      questionId: guardianQuestionTable.questionId,
      slot: guardianQuestionTable.slot,
      phase: guardianQuestionTable.phase,
      kind: guardianQuestionTable.kind,
      prompt: guardianQuestionTable.prompt,
      supportingText: guardianQuestionTable.supportingText,
      selectionRole: guardianQuestionTable.selectionRole,
      selectionPriority: guardianQuestionTable.selectionPriority,
      selectionMinimumScore: guardianQuestionTable.selectionMinimumScore,
      selectionSignalWeights: guardianQuestionTable.selectionSignalWeights,
    })
    .from(guardianQuestionTable)
    .where(eq(guardianQuestionTable.questionnaireVersionId, versionRow.id))
    .orderBy(asc(guardianQuestionTable.position))

  const optionRows = await db
    .select({
      rowId: guardianQuestionOptionTable.id,
      questionRowId: guardianQuestionOptionTable.questionId,
      optionId: guardianQuestionOptionTable.optionId,
      label: guardianQuestionOptionTable.label,
      signals: guardianQuestionOptionTable.signals,
    })
    .from(guardianQuestionOptionTable)
    .innerJoin(guardianQuestionTable, eq(guardianQuestionOptionTable.questionId, guardianQuestionTable.id))
    .where(eq(guardianQuestionTable.questionnaireVersionId, versionRow.id))
    .orderBy(asc(guardianQuestionTable.position), asc(guardianQuestionOptionTable.position))

  const questionRowIdByQuestionId = new Map(questionRows.map((question) => [question.questionId, question.rowId]))
  const questionIdByQuestionRowId = new Map(questionRows.map((question) => [question.rowId, question.questionId]))
  const optionsByQuestionRowId = new Map<number, GuardianSingleChoiceQuestion['options'][number][]>()
  const optionRowIdByQuestionAndOptionId = new Map<string, number>()

  for (const option of optionRows) {
    const questionId = questionIdByQuestionRowId.get(option.questionRowId)
    if (!questionId) {
      throw new Error(`Guardian questionnaire option ${option.rowId} has no question`)
    }
    const values = optionsByQuestionRowId.get(option.questionRowId) ?? []
    values.push({
      id: option.optionId,
      label: option.label,
      signals: option.signals,
    })
    optionsByQuestionRowId.set(option.questionRowId, values)
    optionRowIdByQuestionAndOptionId.set(optionMapKey(questionId, option.optionId), option.rowId)
  }

  const questions: GuardianQuestion[] = questionRows.map((question): GuardianQuestion => {
    if (question.phase === 'note') {
      if (question.kind !== 'free_text' || question.slot !== null || optionsByQuestionRowId.has(question.rowId)) {
        throw new Error(`Guardian optional note ${question.questionId} has an invalid stored shape`)
      }
      return {
        id: question.questionId,
        phase: 'note',
        kind: 'free_text',
        prompt: question.prompt,
        supportingText: question.supportingText,
        optional: true,
      }
    }

    if (question.kind !== 'single_choice' || question.slot === null) {
      throw new Error(`Guardian choice question ${question.questionId} has an invalid stored shape`)
    }
    const base = {
      id: question.questionId,
      slot: question.slot,
      kind: 'single_choice' as const,
      prompt: question.prompt,
      supportingText: question.supportingText,
      options: optionsByQuestionRowId.get(question.rowId) ?? [],
    }
    if (question.phase === 'core') {
      return { ...base, phase: 'core' }
    }
    if (!question.selectionRole || question.selectionPriority === null || !question.selectionSignalWeights) {
      throw new Error(`Guardian adaptive question ${question.questionId} has no selection policy`)
    }
    const selection: GuardianAdaptiveQuestion['selection'] =
      question.selectionRole === 'required'
        ? {
            role: 'required',
            priority: question.selectionPriority,
            signalWeights: question.selectionSignalWeights,
          }
        : {
            role: 'deepening',
            priority: question.selectionPriority,
            minimumScore: question.selectionMinimumScore ?? 0,
            signalWeights: question.selectionSignalWeights,
          }
    if (selection.role === 'deepening' && selection.minimumScore <= 0) {
      throw new Error(`Guardian deepening question ${question.questionId} has no positive threshold`)
    }
    return {
      ...base,
      phase: 'adaptive',
      selection,
    }
  })

  const content = parseGuardianQuestionnaireContent({
    schemaVersion: versionRow.schemaVersion,
    version: versionRow.version,
    productSku: versionRow.productSku,
    locale: versionRow.locale,
    coreQuestionsPerSlot: versionRow.coreQuestionsPerSlot,
    requiredAdaptiveQuestionsPerSlot: versionRow.requiredAdaptiveQuestionsPerSlot,
    maximumAdaptiveQuestionsPerSlot: versionRow.maximumAdaptiveQuestionsPerSlot,
    questions,
  })

  return {
    content,
    questionRowIdByQuestionId,
    optionRowIdByQuestionAndOptionId,
  }
}

async function loadGuardianQuestionnaireAnswers(
  db: Db,
  reportId: number,
): Promise<GuardianQuestionnaireAnswerSnapshot> {
  const rows = await db
    .select({
      questionId: guardianQuestionTable.questionId,
      kind: guardianQuestionAnswerTable.kind,
      optionId: guardianQuestionOptionTable.optionId,
      textValue: guardianQuestionAnswerTable.textValue,
    })
    .from(guardianQuestionAnswerTable)
    .innerJoin(guardianQuestionTable, eq(guardianQuestionAnswerTable.questionId, guardianQuestionTable.id))
    .leftJoin(guardianQuestionOptionTable, eq(guardianQuestionAnswerTable.optionId, guardianQuestionOptionTable.id))
    .where(eq(guardianQuestionAnswerTable.reportId, reportId))
    .orderBy(asc(guardianQuestionAnswerTable.createdAt))

  return Object.fromEntries(
    rows.map((row): [string, GuardianQuestionnaireAnswer] => {
      if (row.kind === 'single_choice') {
        if (!row.optionId) {
          throw new Error(`Guardian answer for ${row.questionId} is missing its option`)
        }
        return [row.questionId, { type: 'option', optionId: row.optionId }]
      }
      return [row.questionId, { type: 'text', text: row.textValue }]
    }),
  )
}

function normalizeGuardianAnswer(
  question: GuardianQuestion,
  answer: GuardianQuestionnaireAnswer,
): GuardianQuestionnaireAnswer | null {
  if (question.kind === 'single_choice') {
    if (answer.type !== 'option' || !question.options.some(({ id }) => id === answer.optionId)) {
      return null
    }
    return answer
  }

  if (answer.type !== 'text') {
    return null
  }
  const text = answer.text?.trim() || null
  if (text !== null && text.length > GUARDIAN_MAX_TEXT_ANSWER_LENGTH) {
    return null
  }
  return { type: 'text', text }
}

function normalizeAnswerForStoredQuestion(
  content: GuardianQuestionnaireContent,
  input: { questionId: string; answer: GuardianQuestionnaireAnswer },
): GuardianQuestionnaireAnswer | null {
  const question = content.questions.find(({ id }) => id === input.questionId)
  return question ? normalizeGuardianAnswer(question, input.answer) : null
}

function sameGuardianAnswer(left: GuardianQuestionnaireAnswer, right: GuardianQuestionnaireAnswer | null): boolean {
  if (!right || left.type !== right.type) {
    return false
  }
  return left.type === 'option'
    ? left.optionId === (right as { type: 'option'; optionId: string }).optionId
    : left.text === (right as { type: 'text'; text: string | null }).text
}

function optionMapKey(questionId: string, optionId: string): string {
  return `${questionId}\u0000${optionId}`
}
