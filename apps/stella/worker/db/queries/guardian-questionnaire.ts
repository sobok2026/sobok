import type { Locale } from '@sobok/domain/locale'
import type { Db } from '@sobok/edge/db/client'
import { asc, eq } from 'drizzle-orm'
import type { GuardianFullReportProductSku } from '../../guardian/manifest'
import {
  GUARDIAN_MAX_TEXT_ANSWER_LENGTH,
  type GuardianQuestion,
  type GuardianQuestionnaireAnswer,
  type GuardianQuestionnaireAnswerSnapshot,
  type GuardianQuestionnaireClientStep,
  type GuardianQuestionnaireContent,
  resolveGuardianQuestionnaireProgress,
  toGuardianQuestionnaireClientStep,
} from '../../guardian/questionnaire'
import { guardianQuestionnaire } from '../../guardian/questionnaire-content'
import {
  guardianQuestionAnswerTable,
  guardianQuestionnaireMilestoneTable,
  guardianReportTable,
} from '../schema/guardian'
import {
  findPaidFullReportPurchase,
  fulfillGuardianReportAfterQuestionnaireInTransaction,
  lockedReportOf,
} from './guardian'

export type GuardianQuestionnaireStepResult =
  | { status: 'ok'; step: GuardianQuestionnaireClientStep }
  | { status: 'report-not-found' | 'payment-required' }

export type SaveGuardianQuestionnaireAnswerResult =
  | { status: 'saved' | 'already-saved'; step: GuardianQuestionnaireClientStep }
  | { status: 'report-not-found' | 'payment-required' | 'question-conflict' | 'invalid-answer' }

export type AcknowledgeGuardianQuestionnaireMilestoneResult =
  | { status: 'acknowledged' | 'already-acknowledged'; step: GuardianQuestionnaireClientStep }
  | { status: 'report-not-found' | 'payment-required' | 'milestone-conflict' }

/**
 * Returns only the current question projection. The server-only signal matrix and every not-yet-selected candidate
 * stay inside the Worker bundle and never enter the public response.
 */
export async function getGuardianQuestionnaireStep(
  db: Db,
  input: { collectionId: number; reportId: number },
): Promise<GuardianQuestionnaireStepResult> {
  const report = await findGuardianQuestionnaireReport(db, input)
  if (!report) {
    return { status: 'report-not-found' }
  }

  const questionnaire = guardianQuestionnaire(report.productSku, report.locale)
  if (!(await hasGuardianQuestionnaireEntitlement(db, input, report.productSku))) {
    return { status: 'payment-required' }
  }

  const answers = await loadGuardianQuestionnaireAnswers(db, input.reportId)
  const milestones = await loadGuardianQuestionnaireMilestones(db, input.reportId)
  const progress = resolveGuardianQuestionnaireProgress(questionnaire, answers, milestones)
  return {
    status: 'ok',
    step: toGuardianQuestionnaireClientStep(questionnaire, progress),
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

    const questionnaire = guardianQuestionnaire(report.productSku, report.locale)
    if (!(await hasGuardianQuestionnaireEntitlement(tx, input, report.productSku))) {
      return { status: 'payment-required' as const }
    }

    const answers = await loadGuardianQuestionnaireAnswers(tx, input.reportId)
    const milestones = await loadGuardianQuestionnaireMilestones(tx, input.reportId)
    const progress = resolveGuardianQuestionnaireProgress(questionnaire, answers, milestones)
    const currentQuestion =
      progress.status === 'question' ? progress.question : progress.status === 'optional-note' ? progress.note : null

    if (!currentQuestion || currentQuestion.id !== input.questionId) {
      const saved = answers[input.questionId]
      if (!saved || !sameGuardianAnswer(saved, normalizeAnswerForStoredQuestion(questionnaire, input))) {
        return { status: 'question-conflict' as const }
      }
      return {
        status: 'already-saved' as const,
        step: toGuardianQuestionnaireClientStep(questionnaire, progress),
      }
    }

    const answer = normalizeGuardianAnswer(currentQuestion, input.answer)
    if (!answer) {
      return { status: 'invalid-answer' as const }
    }

    await tx.insert(guardianQuestionAnswerTable).values({
      reportId: input.reportId,
      questionId: currentQuestion.id,
      kind: currentQuestion.kind,
      optionId: answer.type === 'option' ? answer.optionId : null,
      textValue: answer.type === 'text' ? answer.text : null,
    })

    const nextAnswers: GuardianQuestionnaireAnswerSnapshot = {
      ...answers,
      [currentQuestion.id]: answer,
    }
    const nextProgress = resolveGuardianQuestionnaireProgress(questionnaire, nextAnswers, milestones)

    if (nextProgress.status === 'complete') {
      await tx
        .update(guardianReportTable)
        .set({
          questionnaireAnswerSnapshot: nextAnswers,
          questionnaireSignalSnapshot: nextProgress.signalSnapshot,
          questionnaireCompletedAt: new Date(),
        })
        .where(eq(guardianReportTable.id, input.reportId))

      const fulfillment = await fulfillGuardianReportAfterQuestionnaireInTransaction(tx, input, questionnaire)
      if (fulfillment.status !== 'fulfilled' && fulfillment.status !== 'already-fulfilled') {
        throw new Error(`Guardian report fulfillment failed after questionnaire: ${fulfillment.status}`)
      }
    }

    return {
      status: 'saved' as const,
      step: toGuardianQuestionnaireClientStep(questionnaire, nextProgress),
    }
  })
}

/** Acknowledges only the currently reachable milestone and returns the first adaptive question. */
export async function acknowledgeGuardianQuestionnaireMilestone(
  db: Db,
  input: { collectionId: number; reportId: number; milestoneId: string },
): Promise<AcknowledgeGuardianQuestionnaireMilestoneResult> {
  return db.transaction(async (tx) => {
    const report = await findGuardianQuestionnaireReport(tx, input, true)
    if (!report) {
      return { status: 'report-not-found' as const }
    }

    const questionnaire = guardianQuestionnaire(report.productSku, report.locale)
    if (!(await hasGuardianQuestionnaireEntitlement(tx, input, report.productSku))) {
      return { status: 'payment-required' as const }
    }

    const answers = await loadGuardianQuestionnaireAnswers(tx, input.reportId)
    const milestones = await loadGuardianQuestionnaireMilestones(tx, input.reportId)
    const progress = resolveGuardianQuestionnaireProgress(questionnaire, answers, milestones)

    if (milestones.has(input.milestoneId)) {
      return {
        status: 'already-acknowledged' as const,
        step: toGuardianQuestionnaireClientStep(questionnaire, progress),
      }
    }
    if (progress.status !== 'milestone' || progress.milestoneId !== input.milestoneId) {
      return { status: 'milestone-conflict' as const }
    }

    await tx.insert(guardianQuestionnaireMilestoneTable).values({
      reportId: input.reportId,
      milestoneId: input.milestoneId,
    })

    const nextMilestones = new Set(milestones)
    nextMilestones.add(input.milestoneId)
    const nextProgress = resolveGuardianQuestionnaireProgress(questionnaire, answers, nextMilestones)
    return {
      status: 'acknowledged' as const,
      step: toGuardianQuestionnaireClientStep(questionnaire, nextProgress),
    }
  })
}

async function findGuardianQuestionnaireReport(
  db: Db,
  input: { collectionId: number; reportId: number },
  lock = false,
): Promise<{ productSku: GuardianFullReportProductSku; locale: Locale } | null> {
  const report = await lockedReportOf(db, input, lock)
  if (!report) {
    return null
  }
  return { productSku: report.productSku, locale: report.locale }
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

async function loadGuardianQuestionnaireAnswers(
  db: Db,
  reportId: number,
): Promise<GuardianQuestionnaireAnswerSnapshot> {
  const rows = await db
    .select({
      questionId: guardianQuestionAnswerTable.questionId,
      kind: guardianQuestionAnswerTable.kind,
      optionId: guardianQuestionAnswerTable.optionId,
      textValue: guardianQuestionAnswerTable.textValue,
    })
    .from(guardianQuestionAnswerTable)
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

async function loadGuardianQuestionnaireMilestones(db: Db, reportId: number): Promise<ReadonlySet<string>> {
  const rows = await db
    .select({ milestoneId: guardianQuestionnaireMilestoneTable.milestoneId })
    .from(guardianQuestionnaireMilestoneTable)
    .where(eq(guardianQuestionnaireMilestoneTable.reportId, reportId))
    .orderBy(asc(guardianQuestionnaireMilestoneTable.acknowledgedAt))

  return new Set(rows.map(({ milestoneId }) => milestoneId))
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
