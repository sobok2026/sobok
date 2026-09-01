import { CivilOrganizationRoleSchema, CivilProjectRoleSchema } from '@sobok/civil/collaboration'
import { Hono } from 'hono'
import { z } from 'zod'
import { withCivilSession } from '../auth'
import {
  listOrganizationMembers,
  listProjectMembers,
  removeOrganizationMember,
  removeProjectMember,
  updateOrganizationMemberRole,
  upsertOrganizationMember,
  upsertProjectMember,
} from '../db/queries/member'
import type { AppEnv } from '../env'
import { problem } from '../errors'
import { NO_STORE_HEADERS, readJson } from '../lib/http'

const BODY_LIMIT_BYTES = 4096
const Id = z.uuid()
const AddOrganizationMemberBody = z
  .object({ email: z.email().trim().toLowerCase().max(320), role: CivilOrganizationRoleSchema })
  .strict()
const UpdateOrganizationMemberBody = z.object({ role: CivilOrganizationRoleSchema }).strict()
const SaveProjectMemberBody = z.object({ userId: z.string().min(1).max(255), role: CivilProjectRoleSchema }).strict()

export const members = new Hono<AppEnv>()

members.get('/:organizationId/members', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  if (!organizationId.success) return problem(422, 'invalid-request')
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return listOrganizationMembers(db, { userId: session.user.id, organizationId: organizationId.data })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result === null) return problem(403, 'forbidden')
  return c.json(
    {
      actorRole: result.actorRole,
      canManage: result.canManage,
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

members.put('/:organizationId/members', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const body = await readJson(c, AddOrganizationMemberBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return upsertOrganizationMember(db, {
      actorUserId: session.user.id,
      organizationId: organizationId.data,
      requestId: c.get('requestId'),
      ...body.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'missing' || result.kind === 'user-not-found') return problem(404, 'not-found')
  if (result.kind === 'last-owner') return problem(409, 'conflict')
  return c.json(result.item, 200, NO_STORE_HEADERS)
})

members.patch('/:organizationId/members/:targetUserId', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const targetUserId = z.string().min(1).max(255).safeParse(c.req.param('targetUserId'))
  const body = await readJson(c, UpdateOrganizationMemberBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !targetUserId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return updateOrganizationMemberRole(db, {
      actorUserId: session.user.id,
      organizationId: organizationId.data,
      targetUserId: targetUserId.data,
      role: body.data.role,
      requestId: c.get('requestId'),
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'missing') return problem(404, 'not-found')
  if (result.kind === 'last-owner') return problem(409, 'conflict')
  return c.json({ role: body.data.role }, 200, NO_STORE_HEADERS)
})

members.delete('/:organizationId/members/:targetUserId', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const targetUserId = z.string().min(1).max(255).safeParse(c.req.param('targetUserId'))
  if (!organizationId.success || !targetUserId.success) return problem(422, 'invalid-request')
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return removeOrganizationMember(db, {
      actorUserId: session.user.id,
      organizationId: organizationId.data,
      targetUserId: targetUserId.data,
      requestId: c.get('requestId'),
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'missing') return problem(404, 'not-found')
  if (result.kind === 'last-owner') return problem(409, 'conflict')
  return new Response(null, { status: 204, headers: NO_STORE_HEADERS })
})

members.get('/:organizationId/projects/:projectId/members', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const projectId = Id.safeParse(c.req.param('projectId'))
  if (!organizationId.success || !projectId.success) return problem(422, 'invalid-request')
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return listProjectMembers(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result === null) return problem(404, 'not-found')
  return c.json(
    {
      canManage: result.canManage,
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

members.put('/:organizationId/projects/:projectId/members', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const projectId = Id.safeParse(c.req.param('projectId'))
  const body = await readJson(c, SaveProjectMemberBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !projectId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return upsertProjectMember(db, {
      actorUserId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      targetUserId: body.data.userId,
      role: body.data.role,
      requestId: c.get('requestId'),
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'missing') return problem(404, 'not-found')
  if (result.kind === 'not-organization-member') return problem(422, 'invalid-request')
  return c.json({ userId: body.data.userId, role: body.data.role }, 200, NO_STORE_HEADERS)
})

members.delete('/:organizationId/projects/:projectId/members/:targetUserId', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const projectId = Id.safeParse(c.req.param('projectId'))
  const targetUserId = z.string().min(1).max(255).safeParse(c.req.param('targetUserId'))
  if (!organizationId.success || !projectId.success || !targetUserId.success) {
    return problem(422, 'invalid-request')
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return removeProjectMember(db, {
      actorUserId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      targetUserId: targetUserId.data,
      requestId: c.get('requestId'),
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'missing') return problem(404, 'not-found')
  return new Response(null, { status: 204, headers: NO_STORE_HEADERS })
})
