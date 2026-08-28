import {
  canonicalJson,
  EARTHWORK_AVERAGE_END_AREA_VERSION,
  EarthworkAverageEndAreaInputSchema,
} from '@sobok/civil/calculation'
import { sha256Hex } from '@sobok/edge/tokens'
import { Hono } from 'hono'
import { z } from 'zod'
import { withCivilSession } from '../auth'
import {
  createEarthworkCalculationJob,
  getCalculation,
  markCalculationDispatchFailed,
} from '../db/queries/calculation-request'
import type { AppEnv } from '../env'
import { problem } from '../errors'
import { NO_STORE_HEADERS, readJson } from '../lib/http'

const BODY_LIMIT_BYTES = 2 * 1024 * 1024
const Id = z.uuid()

export const calculations = new Hono<AppEnv>()

calculations.post('/:organizationId/projects/:projectId/calculations/earthwork-average-end-area', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const projectId = Id.safeParse(c.req.param('projectId'))
  const body = await readJson(c, EarthworkAverageEndAreaInputSchema, BODY_LIMIT_BYTES)
  if (!organizationId.success || !projectId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }

  const inputHash = await sha256Hex(canonicalJson(body.data))
  const job = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return createEarthworkCalculationJob(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      algorithmVersion: EARTHWORK_AVERAGE_END_AREA_VERSION,
      inputHash,
      calculationInput: body.data,
      requestId: c.get('requestId'),
    })
  })
  if (job === undefined) return problem(401, 'unauthorized')
  if (job === null) return problem(403, 'forbidden')

  try {
    await c.env.CIVIL_CALCULATION_QUEUE.send({ jobId: job.id })
  } catch (error) {
    await withCivilSession(c, (db, session) => {
      if (!session) return Promise.resolve()
      return markCalculationDispatchFailed(db, {
        userId: session.user.id,
        organizationId: organizationId.data,
        jobId: job.id,
      })
    })
    throw error
  }

  return c.json({ id: job.id, status: job.status }, 202, NO_STORE_HEADERS)
})

calculations.get('/:organizationId/projects/:projectId/calculations/:jobId', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const projectId = Id.safeParse(c.req.param('projectId'))
  const jobId = Id.safeParse(c.req.param('jobId'))
  if (!organizationId.success || !projectId.success || !jobId.success) return problem(422, 'invalid-request')

  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return getCalculation(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      jobId: jobId.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result === null) return problem(404, 'not-found')
  return c.json(
    {
      job: {
        ...result.job,
        queuedAt: result.job.queuedAt.toISOString(),
        startedAt: result.job.startedAt?.toISOString() ?? null,
        completedAt: result.job.completedAt?.toISOString() ?? null,
      },
      result: result.result ? { ...result.result, createdAt: result.result.createdAt.toISOString() } : null,
    },
    200,
    NO_STORE_HEADERS,
  )
})
