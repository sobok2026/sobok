import type { Db } from '@sobok/edge/db/client'
import { and, asc, eq, isNotNull } from 'drizzle-orm'
import type { GuardianFullReportProductSku } from '../../guardian/manifest'
import {
  GUARDIAN_MAX_TEXT_ANSWER_LENGTH,
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
import {
  guardianPurchaseTable,
  guardianQuestionAnswerTable,
  guardianQuestionnaireVersionTable,
  guardianQuestionOptionTable,
  guardianQuestionTable,
  guardianReportTable,
} from '../schema'
import { fulfillGuardianReportAfterQuestionnaireInTransaction } from './guardian'

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
 * Returns only the current question projection. The server-only signal matrix and every not-yet-selected branch
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
 * same answer is idempotent and returns the already-advanced step; changing an old branch is a separate future
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

    if (progress.status === 'complete' || progress.question.id !== input.questionId) {
      const saved = answers[input.questionId]
      if (!saved || !sameGuardianAnswer(saved, normalizeAnswerForStoredQuestion(questionnaire.content, input))) {
        return { status: 'question-conflict' as const }
      }
      return {
        status: 'already-saved' as const,
        step: toGuardianQuestionnaireClientStep(questionnaire.content, progress),
      }
    }

    const answer = normalizeGuardianAnswer(progress.question, input.answer)
    if (!answer) {
      return { status: 'invalid-answer' as const }
    }

    const questionRowId = questionnaire.questionRowIdByQuestionId.get(progress.question.id)
    if (!questionRowId) {
      throw new Error(`Guardian questionnaire row is missing for ${progress.question.id}`)
    }

    let optionRowId: number | null = null
    if (answer.type === 'option') {
      optionRowId =
        questionnaire.optionRowIdByQuestionAndOptionId.get(optionMapKey(progress.question.id, answer.optionId)) ?? null
      if (!optionRowId) {
        throw new Error(`Guardian questionnaire option row is missing for ${progress.question.id}/${answer.optionId}`)
      }
    }

    await tx.insert(guardianQuestionAnswerTable).values({
      reportId: input.reportId,
      questionId: questionRowId,
      kind: progress.question.kind,
      optionId: optionRowId,
      textValue: answer.type === 'text' ? answer.text : null,
    })

    const nextAnswers: GuardianQuestionnaireAnswerSnapshot = {
      ...answers,
      [progress.question.id]: answer,
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
  const query = db
    .select({
      productSku: guardianReportTable.productSku,
      questionnaireVersion: guardianReportTable.questionnaireVersion,
    })
    .from(guardianReportTable)
    .where(and(eq(guardianReportTable.id, input.reportId), eq(guardianReportTable.collectionId, input.collectionId)))
    .limit(1)

  const rows = lock ? await query.for('update') : await query
  return rows[0] ?? null
}

async function hasGuardianQuestionnaireEntitlement(
  db: Db,
  input: { collectionId: number; reportId: number },
  productSku: GuardianFullReportProductSku,
): Promise<boolean> {
  const [purchase] = await db
    .select({ id: guardianPurchaseTable.id })
    .from(guardianPurchaseTable)
    .where(
      and(
        eq(guardianPurchaseTable.collectionId, input.collectionId),
        eq(guardianPurchaseTable.reportId, input.reportId),
        eq(guardianPurchaseTable.sku, productSku),
        eq(guardianPurchaseTable.kind, 'full_report'),
        eq(guardianPurchaseTable.status, 'paid'),
        isNotNull(guardianPurchaseTable.entitlementGrantedAt),
      ),
    )
    .limit(1)
  return Boolean(purchase)
}

async function loadGuardianQuestionnaire(db: Db, version: string): Promise<LoadedGuardianQuestionnaire> {
  const [versionRow] = await db
    .select({
      id: guardianQuestionnaireVersionTable.id,
      schemaVersion: guardianQuestionnaireVersionTable.schemaVersion,
      version: guardianQuestionnaireVersionTable.version,
      productSku: guardianQuestionnaireVersionTable.productSku,
      locale: guardianQuestionnaireVersionTable.locale,
      entryQuestionId: guardianQuestionnaireVersionTable.entryQuestionId,
      coreQuestionCount: guardianQuestionnaireVersionTable.coreQuestionCount,
      maximumAdaptiveQuestions: guardianQuestionnaireVersionTable.maximumAdaptiveQuestions,
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
      optional: guardianQuestionTable.optional,
      nextQuestionId: guardianQuestionTable.nextQuestionId,
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
      nextQuestionId: guardianQuestionOptionTable.nextQuestionId,
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
      nextQuestionId: option.nextQuestionId,
      signals: option.signals,
    })
    optionsByQuestionRowId.set(option.questionRowId, values)
    optionRowIdByQuestionAndOptionId.set(optionMapKey(questionId, option.optionId), option.rowId)
  }

  const questions: GuardianQuestion[] = questionRows.map((question): GuardianQuestion => {
    const base = {
      id: question.questionId,
      slot: question.slot,
      phase: question.phase,
      prompt: question.prompt,
      supportingText: question.supportingText,
    }
    if (question.kind === 'single_choice') {
      if (question.optional || question.nextQuestionId !== null) {
        throw new Error(`Guardian single-choice question ${question.questionId} has an invalid stored shape`)
      }
      return {
        ...base,
        kind: 'single_choice',
        options: optionsByQuestionRowId.get(question.rowId) ?? [],
      }
    }
    if (!question.optional || optionsByQuestionRowId.has(question.rowId)) {
      throw new Error(`Guardian free-text question ${question.questionId} has an invalid stored shape`)
    }
    return {
      ...base,
      kind: 'free_text',
      optional: true,
      nextQuestionId: question.nextQuestionId,
    }
  })

  const content = parseGuardianQuestionnaireContent({
    schemaVersion: versionRow.schemaVersion,
    version: versionRow.version,
    productSku: versionRow.productSku,
    locale: versionRow.locale,
    entryQuestionId: versionRow.entryQuestionId,
    coreQuestionCount: versionRow.coreQuestionCount,
    maximumAdaptiveQuestions: versionRow.maximumAdaptiveQuestions,
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
