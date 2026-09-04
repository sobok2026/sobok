import {
  acknowledgeGuardianQuestionnaireMilestone,
  getGuardianQuestionnaireStep,
  saveGuardianQuestionnaireAnswer,
} from '@stella-worker/db/queries/guardian-questionnaire'
import { readGuardianReport } from '@stella-worker/db/queries/guardian-report'
import type { AppEnv } from '@stella-worker/env'
import { problem } from '@stella-worker/errors'
import { GUARDIAN_MAX_TEXT_ANSWER_LENGTH } from '@stella-worker/guardian/questionnaire'
import { NO_STORE_HEADERS, parseJson } from '@stella-worker/lib/http'
import { Hono } from 'hono'
import { z } from 'zod'
import { withAuthorizedGuardianReport } from './access'

const ANSWER_BODY_LIMIT_BYTES = 2 * 1024
const QuestionIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9._-]*$/)

const AnswerBody = z
  .object({
    answer: z.discriminatedUnion('type', [
      z.object({ type: z.literal('option'), optionId: QuestionIdSchema }).strict(),
      z
        .object({
          type: z.literal('text'),
          text: z.string().max(GUARDIAN_MAX_TEXT_ANSWER_LENGTH).nullable(),
        })
        .strict(),
    ]),
  })
  .strict()

export const guardianReports = new Hono<AppEnv>()

// GET /api/guardian-reports/:reportPublicId/question — reveal only the one currently reachable paid step.
guardianReports.get('/:reportPublicId/question', async (c) => {
  const authorized = await withAuthorizedGuardianReport(c, getGuardianQuestionnaireStep)
  if (!authorized.authorized) {
    return problem(403, 'forbidden')
  }
  const { result } = authorized

  if (!('step' in result)) {
    return result.status === 'payment-required' ? problem(402, 'payment-required') : problem(404, 'report-not-found')
  }
  return c.json({ step: result.step }, 200, NO_STORE_HEADERS)
})

// PUT /api/guardian-reports/:reportPublicId/answers/:id — save one reachable answer and return the next step.
guardianReports.put('/:reportPublicId/answers/:id', async (c) => {
  const questionId = QuestionIdSchema.safeParse(c.req.param('id'))
  if (!questionId.success) {
    return problem(422, 'invalid-request')
  }

  const rawBody = await c.req.text()
  if (new TextEncoder().encode(rawBody).byteLength > ANSWER_BODY_LIMIT_BYTES) {
    return problem(413, 'payload-too-large')
  }
  const parsed = AnswerBody.safeParse(parseJson(rawBody))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  const authorized = await withAuthorizedGuardianReport(c, (db, access) =>
    saveGuardianQuestionnaireAnswer(db, {
      ...access,
      questionId: questionId.data,
      answer: parsed.data.answer,
      assetOrigin: c.env.STELLA_GUARDIAN_ASSET_ORIGIN,
    }),
  )
  if (!authorized.authorized) {
    return problem(403, 'forbidden')
  }
  const { result } = authorized

  if (!('step' in result)) {
    if (result.status === 'payment-required') {
      return problem(402, 'payment-required')
    }
    if (result.status === 'question-conflict') {
      return problem(409, 'question-conflict')
    }
    if (result.status === 'invalid-answer') {
      return problem(422, 'invalid-answer')
    }
    return problem(404, 'report-not-found')
  }
  return c.json({ saved: result.status, step: result.step }, 200, NO_STORE_HEADERS)
})

// PUT /api/guardian-reports/:reportPublicId/milestones/:id — durably pass the currently reachable break.
guardianReports.put('/:reportPublicId/milestones/:id', async (c) => {
  const milestoneId = QuestionIdSchema.safeParse(c.req.param('id'))
  if (!milestoneId.success) {
    return problem(422, 'invalid-request')
  }

  const authorized = await withAuthorizedGuardianReport(c, (db, access) =>
    acknowledgeGuardianQuestionnaireMilestone(db, { ...access, milestoneId: milestoneId.data }),
  )
  if (!authorized.authorized) {
    return problem(403, 'forbidden')
  }
  const { result } = authorized

  if (!('step' in result)) {
    if (result.status === 'payment-required') {
      return problem(402, 'payment-required')
    }
    if (result.status === 'milestone-conflict') {
      return problem(409, 'milestone-conflict')
    }
    return problem(404, 'report-not-found')
  }
  return c.json({ acknowledged: result.status, step: result.step }, 200, NO_STORE_HEADERS)
})

// GET /api/guardian-reports/:reportPublicId — progress metadata while drafting, immutable cards and narrative once fulfilled.
guardianReports.get('/:reportPublicId', async (c) => {
  const authorized = await withAuthorizedGuardianReport(c, readGuardianReport)
  if (!authorized.authorized) {
    return problem(403, 'forbidden')
  }
  const { result } = authorized

  if (result.status === 'payment-required') {
    return problem(402, 'payment-required')
  }
  if (result.status === 'report-not-found') {
    return problem(404, 'report-not-found')
  }
  return c.json({ report: result.report }, 200, NO_STORE_HEADERS)
})
