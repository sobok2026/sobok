import { Hono } from 'hono'
import { z } from 'zod'
import { withCivilSession } from '../auth'
import { createProject, listProjects } from '../db/queries/project'
import type { AppEnv } from '../env'
import { problem } from '../errors'
import { NO_STORE_HEADERS, readJson } from '../lib/http'

const BODY_LIMIT_BYTES = 4096
const OrganizationId = z.uuid()
const CreateProjectBody = z
  .object({
    code: z.string().trim().min(1).max(48),
    name: z.string().trim().min(2).max(160),
    coordinateReferenceSystem: z.string().trim().min(1).max(64).default('EPSG:5186'),
  })
  .strict()

export const projects = new Hono<AppEnv>()

projects.get('/:organizationId/projects', async (c) => {
  const organizationId = OrganizationId.safeParse(c.req.param('organizationId'))
  if (!organizationId.success) return problem(422, 'invalid-request')
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return listProjects(db, session.user.id, organizationId.data)
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result === null) return problem(403, 'forbidden')
  return c.json(
    {
      role: result.role,
      items: result.items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    },
    200,
    NO_STORE_HEADERS,
  )
})

projects.post('/:organizationId/projects', async (c) => {
  const organizationId = OrganizationId.safeParse(c.req.param('organizationId'))
  const body = await readJson(c, CreateProjectBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }
  try {
    const item = await withCivilSession(c, (db, session) => {
      if (!session) return Promise.resolve(undefined)
      return createProject(db, {
        userId: session.user.id,
        organizationId: organizationId.data,
        requestId: c.get('requestId'),
        ...body.data,
      })
    })
    if (item === undefined) return problem(401, 'unauthorized')
    if (item === null) return problem(403, 'forbidden')
    return c.json(
      { ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() },
      201,
      NO_STORE_HEADERS,
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('uq_civil_project_org_code')) {
      return problem(409, 'conflict')
    }
    throw error
  }
})
