import type { AssessmentProfile } from '@deep-type/model'
import { scoreBaseAssessment } from '@deep-type/scoring'
import { LOCALES } from '@sobok/domain/locale'
import { openDB, withDB } from '@sobok/edge/db/client'
import { randomToken } from '@sobok/edge/tokens'
import { Hono } from 'hono'
import { z } from 'zod'
import { insertResult } from '~/db/queries/result'
import type { AppEnv } from '~/env'
import { problem } from '~/errors'
import { BaseAnswersSchema, BaseWorkAnswersSchema, DeclaredPersonaSchema } from '~/scoring/answer-schema'

const SessionBody = z.object({
  answers: BaseAnswersSchema,
  declaredPersona: DeclaredPersonaSchema.default(null),
  personaSource: z.enum(['declared', 'guided']).default('declared'),
  locale: z.enum(LOCALES),
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
    profile = scoreBaseAssessment(
      parsed.data.answers,
      parsed.data.workAnswers,
      parsed.data.declaredPersona,
      parsed.data.personaSource,
    )
  } catch {
    return problem(422, 'invalid-request')
  }

  const resultToken = randomToken()
  await withDB(openDB(c.env.HYPERDRIVE_FRESH), c.executionCtx, (db) =>
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
