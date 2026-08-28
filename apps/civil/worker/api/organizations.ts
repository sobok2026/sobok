import { Hono } from 'hono'
import { z } from 'zod'
import { withCivilSession } from '../auth'
import { createOrganization, listOrganizations } from '../db/queries/organization'
import type { AppEnv } from '../env'
import { problem } from '../errors'
import { NO_STORE_HEADERS, readJson } from '../lib/http'

const BODY_LIMIT_BYTES = 4096
const CreateOrganizationBody = z
  .object({
    name: z.string().trim().min(2).max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9][a-z0-9-]{1,47}$/),
  })
  .strict()

export const organizations = new Hono<AppEnv>()

organizations.get('/', async (c) => {
  const items = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(null)
    return listOrganizations(db, session.user.id)
  })
  if (!items) return problem(401, 'unauthorized')
  return c.json(
    {
      items: items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    },
    200,
    NO_STORE_HEADERS,
  )
})

organizations.post('/', async (c) => {
  const body = await readJson(c, CreateOrganizationBody, BODY_LIMIT_BYTES)
  if (!body.success) return problem(body.tooLarge ? 413 : 422, body.tooLarge ? 'payload-too-large' : 'invalid-request')

  try {
    const item = await withCivilSession(c, (db, session) => {
      if (!session) return Promise.resolve(null)
      return createOrganization(db, { userId: session.user.id, requestId: c.get('requestId'), ...body.data })
    })
    if (!item) return problem(401, 'unauthorized')
    return c.json({ ...item, createdAt: item.createdAt.toISOString() }, 201, NO_STORE_HEADERS)
  } catch (error) {
    if (error instanceof Error && error.message.includes('uq_civil_organization_slug')) {
      return problem(409, 'conflict')
    }
    throw error
  }
})
