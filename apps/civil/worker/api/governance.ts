import { CivilCalculationApprovalActionSchema } from '@sobok/civil/collaboration'
import { Hono } from 'hono'
import { z } from 'zod'
import { withCivilSession } from '../auth'
import { actOnCalculationApproval, listProjectAuditEvents, listProjectCalculations } from '../db/queries/governance'
import type { AppEnv } from '../env'
import { problem } from '../errors'
import { NO_STORE_HEADERS, readJson } from '../lib/http'

const BODY_LIMIT_BYTES = 8192
const Id = z.uuid()
const ApprovalBody = z
  .object({
    action: CivilCalculationApprovalActionSchema,
    note: z.string().trim().max(4000).nullable().default(null),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.action !== 'submit' && !value.note) {
      context.addIssue({ code: 'custom', message: 'note is required', path: ['note'] })
    }
  })

export const governance = new Hono<AppEnv>()

governance.get('/:organizationId/projects/:projectId/calculations', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const projectId = Id.safeParse(c.req.param('projectId'))
  if (!organizationId.success || !projectId.success) return problem(422, 'invalid-request')
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return listProjectCalculations(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result === null) return problem(404, 'not-found')
  return c.json(
    {
      ...result,
      items: result.items.map(({ job, result: calculationResult, approval }) => ({
        job: {
          ...job,
          queuedAt: job.queuedAt.toISOString(),
          startedAt: job.startedAt?.toISOString() ?? null,
          completedAt: job.completedAt?.toISOString() ?? null,
        },
        result: calculationResult
          ? { ...calculationResult, createdAt: calculationResult.createdAt.toISOString() }
          : null,
        approval: approval ? { ...approval, actedAt: approval.actedAt.toISOString() } : null,
      })),
    },
    200,
    NO_STORE_HEADERS,
  )
})

governance.post('/:organizationId/projects/:projectId/results/:resultId/approval', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const projectId = Id.safeParse(c.req.param('projectId'))
  const resultId = Id.safeParse(c.req.param('resultId'))
  const body = await readJson(c, ApprovalBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !projectId.success || !resultId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return actOnCalculationApproval(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      resultId: resultId.data,
      action: body.data.action,
      note: body.data.note,
      requestId: c.get('requestId'),
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'missing') return problem(404, 'not-found')
  if (result.kind === 'conflict') return problem(409, 'conflict')
  return c.json({ ...result.approval, actedAt: result.approval.actedAt.toISOString() }, 200, NO_STORE_HEADERS)
})

governance.get('/:organizationId/projects/:projectId/audit-events', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const projectId = Id.safeParse(c.req.param('projectId'))
  const beforeId = z.coerce.number().int().positive().safeParse(c.req.query('before'))
  const limit = z.coerce.number().int().min(1).max(100).default(50).safeParse(c.req.query('limit'))
  if (!organizationId.success || !projectId.success || (!beforeId.success && c.req.query('before')) || !limit.success) {
    return problem(422, 'invalid-request')
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return listProjectAuditEvents(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      beforeId: beforeId.success ? beforeId.data : null,
      limit: limit.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result === null) return problem(404, 'not-found')
  return c.json(
    {
      role: result.role,
      items: result.items.map((item) => ({ ...item, id: String(item.id), createdAt: item.createdAt.toISOString() })),
    },
    200,
    NO_STORE_HEADERS,
  )
})
