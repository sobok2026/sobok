import type { AssessmentProfile } from '@deep-type/model'
import { scoreBaseAssessment } from '@deep-type/scoring'
import { Hono } from 'hono'
import { z } from 'zod'

import { openFresh, withDB } from '~/db/client'
import { insertResult } from '~/db/queries/result'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { randomToken } from '~/lib/tokens'
import { BaseAnswersSchema, BaseWorkAnswersSchema, DeclaredPersonaSchema } from '~/scoring/answer-schema'

const SessionBody = z.object({
  answers: BaseAnswersSchema,
  declaredPersona: DeclaredPersonaSchema.default(null),
  locale: z.enum(['ko', 'en', 'ja', 'zh']),
  workAnswers: BaseWorkAnswersSchema,
})

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  if (Number(c.req.header('content-length') ?? 0) > 16 * 1024) {
    return problem(413, 'payload-too-large')
  }

  const parsed = SessionBody.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return problem(422, 'invalid-request')
  }

  let profile: AssessmentProfile
  try {
    profile = scoreBaseAssessment(parsed.data.answers, parsed.data.workAnswers, parsed.data.declaredPersona)
  } catch {
    return problem(422, 'invalid-request')
  }

  const resultToken = randomToken()
  await withDB(openFresh(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
    insertResult(db, {
      baseAnswers: parsed.data.answers,
      baseProfile: profile,
      declaredPersona: parsed.data.declaredPersona,
      freeWorkAnswers: parsed.data.workAnswers,
      locale: parsed.data.locale,
      resultToken,
    }),
  )
  return c.json({ profile, resultToken }, 201)
})

export default route
