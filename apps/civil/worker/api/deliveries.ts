import { CIVIL_DELIVERY_MAX_ARTIFACTS, CivilDeliveryKindSchema } from '@sobok/civil/delivery'
import { Hono } from 'hono'
import { z } from 'zod'
import { withCivilSession } from '../auth'
import {
  createDeliveryPackage,
  getDeliveryDownloadTarget,
  getDeliveryPackage,
  listDeliveryPackages,
  markDeliveryGenerationDispatched,
  markDeliveryGenerationDispatchFailed,
  reviewDeliveryPackage,
  submitDeliveryPackage,
  withdrawDeliveryPackage,
} from '../db/queries/delivery-request'
import type { AppEnv } from '../env'
import { problem } from '../errors'
import { NO_STORE_HEADERS, readJson } from '../lib/http'

const BODY_LIMIT_BYTES = 16 * 1024
const Id = z.uuid()
const CreateDeliveryBody = z
  .object({
    title: z.string().trim().min(1).max(160),
    deliveryKind: CivilDeliveryKindSchema,
    vendorName: z.string().trim().min(1).max(160),
    revision: z.string().trim().min(1).max(64),
    artifactIds: z.array(z.uuid()).min(1).max(CIVIL_DELIVERY_MAX_ARTIFACTS),
  })
  .strict()
const SubmitDeliveryBody = z.object({ note: z.string().trim().max(2000).nullable().default(null) }).strict()
const ReviewDeliveryBody = z
  .object({
    decision: z.enum(['changes_requested', 'approved']),
    note: z.string().trim().min(1).max(2000),
  })
  .strict()

export const deliveries = new Hono<AppEnv>()

function parseRouteIds(c: { req: { param(name: string): string } }) {
  return {
    organizationId: Id.safeParse(c.req.param('organizationId')),
    projectId: Id.safeParse(c.req.param('projectId')),
    packageId: Id.safeParse(c.req.param('packageId')),
  }
}

function globalStorageCapBytes(value: string): number {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1024 * 1024 * 1024) {
    throw new Error('CIVIL_STORAGE_CAP_BYTES is invalid')
  }
  return parsed
}

function contentDisposition(title: string, revision: string): string {
  let safe = ''
  for (const character of `${title}-${revision}.zip`) {
    const codePoint = character.codePointAt(0) ?? 0
    safe += codePoint < 32 || codePoint === 127 || character === '/' || character === '\\' ? '_' : character
  }
  safe = safe.slice(0, 220)
  const encoded = encodeURIComponent(safe).replace(
    /[!'()*]/gu,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
  return `attachment; filename="civil-delivery.zip"; filename*=UTF-8''${encoded}`
}

function hasR2Body(object: R2Object | R2ObjectBody): object is R2ObjectBody {
  return 'body' in object
}

deliveries.post('/:organizationId/projects/:projectId/deliveries', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const projectId = Id.safeParse(c.req.param('projectId'))
  const body = await readJson(c, CreateDeliveryBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !projectId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return createDeliveryPackage(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      globalStorageCapBytes: globalStorageCapBytes(c.env.CIVIL_STORAGE_CAP_BYTES),
      requestId: c.get('requestId'),
      ...body.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'invalid-artifacts') return problem(422, 'invalid-request')
  if (result.kind === 'package-too-large') return problem(413, 'payload-too-large')
  if (result.kind === 'quota-exceeded') return problem(409, 'storage-quota-exceeded')

  try {
    await c.env.CIVIL_DELIVERY_QUEUE.send({ packageId: result.item.id }, { contentType: 'json' })
    await withCivilSession(c, (db, session) => {
      if (!session) return Promise.resolve()
      return markDeliveryGenerationDispatched(db, {
        userId: session.user.id,
        organizationId: organizationId.data,
        projectId: projectId.data,
        packageId: result.item.id,
      })
    })
  } catch (error) {
    await withCivilSession(c, (db, session) => {
      if (!session) return Promise.resolve()
      return markDeliveryGenerationDispatchFailed(db, {
        userId: session.user.id,
        organizationId: organizationId.data,
        packageId: result.item.id,
      })
    })
    throw error
  }
  return c.json({ ...result.item, createdAt: result.item.createdAt.toISOString() }, 202, NO_STORE_HEADERS)
})

deliveries.get('/:organizationId/projects/:projectId/deliveries', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const projectId = Id.safeParse(c.req.param('projectId'))
  if (!organizationId.success || !projectId.success) return problem(422, 'invalid-request')
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return listDeliveryPackages(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result === null) return problem(404, 'not-found')
  return c.json(
    {
      canCreate: result.canCreate,
      canReview: result.canReview,
      canApprove: result.canApprove,
      items: result.items.map((item) => ({
        ...item,
        submittedAt: item.submittedAt?.toISOString() ?? null,
        reviewedAt: item.reviewedAt?.toISOString() ?? null,
        approvedAt: item.approvedAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    },
    200,
    NO_STORE_HEADERS,
  )
})

deliveries.get('/:organizationId/projects/:projectId/deliveries/:packageId', async (c) => {
  const { organizationId, projectId, packageId } = parseRouteIds(c)
  if (!organizationId.success || !projectId.success || !packageId.success) return problem(422, 'invalid-request')
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return getDeliveryPackage(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      packageId: packageId.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result === null) return problem(404, 'not-found')
  return c.json(
    {
      item: {
        ...result.item,
        submittedAt: result.item.submittedAt?.toISOString() ?? null,
        reviewedAt: result.item.reviewedAt?.toISOString() ?? null,
        approvedAt: result.item.approvedAt?.toISOString() ?? null,
        createdAt: result.item.createdAt.toISOString(),
        updatedAt: result.item.updatedAt.toISOString(),
      },
      items: result.items,
      events: result.events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
    },
    200,
    NO_STORE_HEADERS,
  )
})

deliveries.post('/:organizationId/projects/:projectId/deliveries/:packageId/submit', async (c) => {
  const { organizationId, projectId, packageId } = parseRouteIds(c)
  const body = await readJson(c, SubmitDeliveryBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !projectId.success || !packageId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return submitDeliveryPackage(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      packageId: packageId.data,
      note: body.data.note,
      requestId: c.get('requestId'),
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result === 'forbidden') return problem(403, 'forbidden')
  if (result === 'conflict') return problem(409, 'conflict')
  return c.json({ status: result }, 200, NO_STORE_HEADERS)
})

deliveries.post('/:organizationId/projects/:projectId/deliveries/:packageId/review', async (c) => {
  const { organizationId, projectId, packageId } = parseRouteIds(c)
  const body = await readJson(c, ReviewDeliveryBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !projectId.success || !packageId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return reviewDeliveryPackage(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      packageId: packageId.data,
      requestId: c.get('requestId'),
      ...body.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result === 'forbidden') return problem(403, 'forbidden')
  if (result === 'conflict') return problem(409, 'conflict')
  return c.json({ status: result }, 200, NO_STORE_HEADERS)
})

deliveries.on(['GET', 'HEAD'], '/:organizationId/projects/:projectId/deliveries/:packageId/download', async (c) => {
  const { organizationId, projectId, packageId } = parseRouteIds(c)
  if (!organizationId.success || !projectId.success || !packageId.success) return problem(422, 'invalid-request')
  const target = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return getDeliveryDownloadTarget(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      packageId: packageId.data,
    })
  })
  if (target === undefined) return problem(401, 'unauthorized')
  if (target === null) return problem(404, 'not-found')

  const rangeHeader = c.req.header('range')
  let object: R2Object | R2ObjectBody | null
  try {
    object =
      c.req.method === 'HEAD'
        ? await c.env.CIVIL_FILES.head(target.objectKey)
        : await c.env.CIVIL_FILES.get(target.objectKey, rangeHeader ? { range: c.req.raw.headers } : undefined)
  } catch {
    return problem(rangeHeader ? 416 : 404, rangeHeader ? 'range-not-satisfiable' : 'not-found')
  }
  if (!object) return problem(404, 'not-found')
  const headers = new Headers(NO_STORE_HEADERS)
  headers.set('accept-ranges', 'bytes')
  headers.set('cache-control', 'private, no-store')
  headers.set('content-disposition', contentDisposition(target.title, target.revision))
  headers.set('content-type', 'application/zip')
  headers.set('etag', object.httpEtag)
  if (target.sha256) headers.set('x-content-sha256', target.sha256)
  if (target.manifestSha256) headers.set('x-manifest-sha256', target.manifestSha256)
  if (object.range) {
    const length =
      'suffix' in object.range ? Math.min(object.range.suffix, object.size) : (object.range.length ?? object.size)
    const offset = 'suffix' in object.range ? object.size - length : (object.range.offset ?? 0)
    headers.set('content-length', String(length))
    headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${object.size}`)
  } else {
    headers.set('content-length', String(object.size))
  }
  return new Response(c.req.method === 'HEAD' || !hasR2Body(object) ? null : object.body, {
    status: object.range ? 206 : 200,
    headers,
  })
})

deliveries.delete('/:organizationId/projects/:projectId/deliveries/:packageId', async (c) => {
  const { organizationId, projectId, packageId } = parseRouteIds(c)
  if (!organizationId.success || !projectId.success || !packageId.success) return problem(422, 'invalid-request')
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return withdrawDeliveryPackage(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      packageId: packageId.data,
      requestId: c.get('requestId'),
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'conflict') return problem(409, 'conflict')
  await c.env.CIVIL_DELIVERY_QUEUE.send({ packageId: packageId.data }, { contentType: 'json' })
  return new Response(null, { status: 204, headers: NO_STORE_HEADERS })
})
