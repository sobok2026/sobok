import {
  CIVIL_ARTIFACT_MAX_BYTES,
  CIVIL_ARTIFACT_PART_SIZE_BYTES,
  CivilArtifactKindSchema,
  CivilBoundingBoxSchema,
  isAllowedCivilArtifactFileName,
} from '@sobok/civil/artifact'
import { Hono } from 'hono'
import { z } from 'zod'
import { withCivilSession } from '../auth'
import {
  abortArtifactUploadRecord,
  authorizeArtifactUpload,
  createArtifactUploadRecord,
  expireStaleArtifactUploads,
  getArtifactCompletionTarget,
  getArtifactDownloadTarget,
  getArtifactUploadTarget,
  listArtifacts,
  markArtifactDeleted,
  markArtifactUploadCompleted,
  markArtifactVerificationDispatched,
  markArtifactVerificationDispatchFailed,
  recordArtifactUploadPart,
} from '../db/queries/artifact-request'
import type { AppEnv } from '../env'
import { problem } from '../errors'
import { NO_STORE_HEADERS, readJson } from '../lib/http'

const BODY_LIMIT_BYTES = 8192
const Id = z.uuid()
const PartNumber = z.coerce.number().int().min(1).max(128)

function isSafeFileName(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0
    if (codePoint < 32 || codePoint === 127 || character === '/' || character === '\\') return false
  }
  return true
}

const CreateArtifactUploadBody = z
  .object({
    fileName: z.string().min(1).max(255).refine(isSafeFileName).refine(isAllowedCivilArtifactFileName),
    mediaType: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .regex(/^[\w!#$&^_.+-]+\/[\w!#$&^_.+-]+$/u),
    byteSize: z.number().int().min(1).max(CIVIL_ARTIFACT_MAX_BYTES),
    kind: CivilArtifactKindSchema,
    revision: z.string().trim().min(1).max(64),
    coordinateReferenceSystem: z.string().trim().min(1).max(64).nullable().default(null),
    boundingBox: CivilBoundingBoxSchema.nullable().default(null),
    previousArtifactId: z.uuid().nullable().default(null),
  })
  .strict()

export const artifacts = new Hono<AppEnv>()

function globalStorageCapBytes(value: string): number {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < CIVIL_ARTIFACT_MAX_BYTES) {
    throw new Error('CIVIL_STORAGE_CAP_BYTES is invalid')
  }
  return parsed
}

async function abortMultipartQuietly(bucket: R2Bucket, objectKey: string, uploadId: string): Promise<void> {
  try {
    await bucket.resumeMultipartUpload(objectKey, uploadId).abort()
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'civil.artifact.multipart_abort_failed',
        objectKey,
        error: error instanceof Error ? error.message : 'unknown',
      }),
    )
  }
}

function parseRouteIds(c: { req: { param(name: string): string } }) {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const projectId = Id.safeParse(c.req.param('projectId'))
  const artifactId = Id.safeParse(c.req.param('artifactId'))
  return { organizationId, projectId, artifactId }
}

function contentDisposition(fileName: string): string {
  const encoded = encodeURIComponent(fileName).replace(
    /[!'()*]/gu,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
  return `attachment; filename="artifact"; filename*=UTF-8''${encoded}`
}

function hasR2Body(object: R2Object | R2ObjectBody): object is R2ObjectBody {
  return 'body' in object
}

artifacts.post('/:organizationId/projects/:projectId/artifacts/uploads', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const projectId = Id.safeParse(c.req.param('projectId'))
  const body = await readJson(c, CreateArtifactUploadBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !projectId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }

  const access = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return authorizeArtifactUpload(db, session.user.id, organizationId.data, projectId.data)
  })
  if (access === undefined) return problem(401, 'unauthorized')
  if (!access) return problem(403, 'forbidden')

  const expired = await withCivilSession(c, (db, session) =>
    session ? expireStaleArtifactUploads(db, organizationId.data) : Promise.resolve([]),
  )
  await Promise.all(expired.map((item) => abortMultipartQuietly(c.env.CIVIL_FILES, item.objectKey, item.r2UploadId)))

  const artifactId = crypto.randomUUID()
  const objectKey = `organizations/${organizationId.data}/projects/${projectId.data}/artifacts/${artifactId}/source`
  const multipart = await c.env.CIVIL_FILES.createMultipartUpload(objectKey, {
    httpMetadata: { contentType: 'application/octet-stream' },
    customMetadata: { artifactId, organizationId: organizationId.data, projectId: projectId.data },
  })

  try {
    const result = await withCivilSession(c, (db, session) => {
      if (!session) return Promise.resolve(null)
      return createArtifactUploadRecord(db, {
        userId: session.user.id,
        organizationId: organizationId.data,
        projectId: projectId.data,
        artifactId,
        objectKey,
        r2UploadId: multipart.uploadId,
        globalStorageCapBytes: globalStorageCapBytes(c.env.CIVIL_STORAGE_CAP_BYTES),
        requestId: c.get('requestId'),
        ...body.data,
      })
    })
    if (!result) {
      await abortMultipartQuietly(c.env.CIVIL_FILES, objectKey, multipart.uploadId)
      return problem(401, 'unauthorized')
    }
    if (result.kind !== 'created') {
      await abortMultipartQuietly(c.env.CIVIL_FILES, objectKey, multipart.uploadId)
      if (result.kind === 'forbidden') return problem(403, 'forbidden')
      if (result.kind === 'active-upload-limit') return problem(409, 'upload-limit-reached')
      if (result.kind === 'invalid-previous') return problem(422, 'invalid-request')
      return problem(409, 'storage-quota-exceeded')
    }
    return c.json(
      { artifact: result.artifact, upload: { ...result.upload, expiresAt: result.upload.expiresAt.toISOString() } },
      201,
      NO_STORE_HEADERS,
    )
  } catch (error) {
    await abortMultipartQuietly(c.env.CIVIL_FILES, objectKey, multipart.uploadId)
    throw error
  }
})

artifacts.put('/:organizationId/projects/:projectId/artifacts/:artifactId/uploads/:partNumber', async (c) => {
  const { organizationId, projectId, artifactId } = parseRouteIds(c)
  const partNumber = PartNumber.safeParse(c.req.param('partNumber'))
  if (!organizationId.success || !projectId.success || !artifactId.success || !partNumber.success) {
    return problem(422, 'invalid-request')
  }
  const contentLengthValue = c.req.header('content-length')
  if (!contentLengthValue || !/^\d+$/u.test(contentLengthValue)) return problem(411, 'length-required')
  const contentLength = Number(contentLengthValue)
  if (!Number.isSafeInteger(contentLength) || contentLength < 1 || contentLength > CIVIL_ARTIFACT_PART_SIZE_BYTES) {
    return problem(413, 'payload-too-large')
  }
  if (!c.req.raw.body) return problem(422, 'invalid-request')

  const result = await withCivilSession(c, async (db, session) => {
    if (!session) return { kind: 'unauthorized' as const }
    const target = await getArtifactUploadTarget(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      artifactId: artifactId.data,
    })
    return target ? { kind: 'target' as const, target } : { kind: 'missing' as const }
  })
  if (result.kind === 'unauthorized') return problem(401, 'unauthorized')
  if (result.kind === 'missing') return problem(404, 'not-found')
  const { target } = result
  if (target.uploadStatus !== 'open') return problem(409, 'upload-unavailable')
  if (target.expiresAt.getTime() <= Date.now()) {
    await withCivilSession(c, (db, session) =>
      session ? expireStaleArtifactUploads(db, organizationId.data) : Promise.resolve([]),
    )
    await abortMultipartQuietly(c.env.CIVIL_FILES, target.objectKey, target.r2UploadId)
    return problem(410, 'upload-expired')
  }
  if (partNumber.data > target.partCount) return problem(422, 'invalid-request')
  const expectedBytes =
    partNumber.data === target.partCount ? target.byteSize - target.partSize * (target.partCount - 1) : target.partSize
  if (contentLength !== expectedBytes) return problem(422, 'invalid-request')

  let uploadedPart: R2UploadedPart
  try {
    uploadedPart = await c.env.CIVIL_FILES.resumeMultipartUpload(target.objectKey, target.r2UploadId).uploadPart(
      partNumber.data,
      c.req.raw.body,
    )
  } catch {
    return problem(409, 'upload-unavailable')
  }
  const recorded = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(false)
    return recordArtifactUploadPart(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      artifactId: artifactId.data,
      partNumber: uploadedPart.partNumber,
      etag: uploadedPart.etag,
      byteSize: contentLength,
    })
  })
  if (!recorded) return problem(409, 'upload-unavailable')
  return c.json({ partNumber: uploadedPart.partNumber, byteSize: contentLength }, 200, NO_STORE_HEADERS)
})

artifacts.post('/:organizationId/projects/:projectId/artifacts/:artifactId/complete', async (c) => {
  const { organizationId, projectId, artifactId } = parseRouteIds(c)
  if (!organizationId.success || !projectId.success || !artifactId.success) return problem(422, 'invalid-request')
  const targetResult = await withCivilSession(c, async (db, session) => {
    if (!session) return { kind: 'unauthorized' as const }
    const target = await getArtifactCompletionTarget(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      artifactId: artifactId.data,
    })
    return target ? { kind: 'target' as const, target } : { kind: 'missing' as const }
  })
  if (targetResult.kind === 'unauthorized') return problem(401, 'unauthorized')
  if (targetResult.kind === 'missing') return problem(404, 'not-found')
  const { target } = targetResult
  if (target.uploadStatus === 'aborted' || target.uploadStatus === 'expired') return problem(410, 'upload-expired')

  let completedR2Object = false
  if (target.uploadStatus === 'open') {
    if (target.expiresAt.getTime() <= Date.now()) {
      await withCivilSession(c, (db, session) =>
        session ? expireStaleArtifactUploads(db, organizationId.data) : Promise.resolve([]),
      )
      await abortMultipartQuietly(c.env.CIVIL_FILES, target.objectKey, target.r2UploadId)
      return problem(410, 'upload-expired')
    }
    if (target.parts.length !== target.partCount) return problem(409, 'upload-incomplete')
    for (let index = 0; index < target.parts.length; index += 1) {
      const part = target.parts[index]
      const expectedNumber = index + 1
      const expectedBytes =
        expectedNumber === target.partCount
          ? target.byteSize - target.partSize * (target.partCount - 1)
          : target.partSize
      if (!part || part.partNumber !== expectedNumber || part.byteSize !== expectedBytes) {
        return problem(409, 'upload-incomplete')
      }
    }
    try {
      const object = await c.env.CIVIL_FILES.resumeMultipartUpload(target.objectKey, target.r2UploadId).complete(
        target.parts.map(({ partNumber, etag }) => ({ partNumber, etag })),
      )
      if (object.size !== target.byteSize) {
        await c.env.CIVIL_FILES.delete(target.objectKey)
        return problem(409, 'upload-incomplete')
      }
      completedR2Object = true
    } catch {
      const existing = await c.env.CIVIL_FILES.head(target.objectKey)
      if (!existing || existing.size !== target.byteSize) return problem(409, 'upload-unavailable')
      completedR2Object = true
    }
  }

  const marked = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(null)
    return markArtifactUploadCompleted(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      artifactId: artifactId.data,
      requestId: c.get('requestId'),
    })
  })
  if (!marked) {
    if (completedR2Object) await c.env.CIVIL_FILES.delete(target.objectKey)
    return problem(404, 'not-found')
  }
  if (marked.status === 'aborted' || marked.status === 'expired') {
    if (completedR2Object) await c.env.CIVIL_FILES.delete(target.objectKey)
    return problem(410, 'upload-expired')
  }

  try {
    await c.env.CIVIL_ARTIFACT_QUEUE.send({ artifactId: artifactId.data }, { contentType: 'json' })
    await withCivilSession(c, (db, session) => {
      if (!session) return Promise.resolve()
      return markArtifactVerificationDispatched(db, {
        userId: session.user.id,
        organizationId: organizationId.data,
        projectId: projectId.data,
        artifactId: artifactId.data,
      })
    })
  } catch (error) {
    await withCivilSession(c, (db, session) => {
      if (!session) return Promise.resolve()
      return markArtifactVerificationDispatchFailed(db, {
        userId: session.user.id,
        organizationId: organizationId.data,
        projectId: projectId.data,
        artifactId: artifactId.data,
      })
    })
    throw error
  }
  return c.json({ id: artifactId.data, status: 'verifying' }, 202, NO_STORE_HEADERS)
})

artifacts.delete('/:organizationId/projects/:projectId/artifacts/:artifactId/upload', async (c) => {
  const { organizationId, projectId, artifactId } = parseRouteIds(c)
  if (!organizationId.success || !projectId.success || !artifactId.success) return problem(422, 'invalid-request')
  const targetResult = await withCivilSession(c, async (db, session) => {
    if (!session) return { kind: 'unauthorized' as const }
    const target = await getArtifactUploadTarget(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      artifactId: artifactId.data,
    })
    return target ? { kind: 'target' as const, target } : { kind: 'missing' as const }
  })
  if (targetResult.kind === 'unauthorized') return problem(401, 'unauthorized')
  if (targetResult.kind === 'missing') return problem(404, 'not-found')
  if (targetResult.target.uploadStatus === 'open') {
    await abortMultipartQuietly(c.env.CIVIL_FILES, targetResult.target.objectKey, targetResult.target.r2UploadId)
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(null)
    return abortArtifactUploadRecord(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      artifactId: artifactId.data,
      requestId: c.get('requestId'),
    })
  })
  if (!result) return problem(404, 'not-found')
  if (result.status !== 'aborted') return problem(409, 'upload-unavailable')
  return new Response(null, { status: 204, headers: NO_STORE_HEADERS })
})

artifacts.get('/:organizationId/projects/:projectId/artifacts', async (c) => {
  const organizationId = Id.safeParse(c.req.param('organizationId'))
  const projectId = Id.safeParse(c.req.param('projectId'))
  if (!organizationId.success || !projectId.success) return problem(422, 'invalid-request')
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return listArtifacts(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result === null) return problem(404, 'not-found')
  return c.json(
    {
      storageQuotaBytes: result.storageQuotaBytes,
      storageUsedBytes: result.storageUsedBytes,
      canUpload: result.canUpload,
      items: result.items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        verifiedAt: item.verifiedAt?.toISOString() ?? null,
        availableAt: item.availableAt?.toISOString() ?? null,
      })),
    },
    200,
    NO_STORE_HEADERS,
  )
})

artifacts.on(['GET', 'HEAD'], '/:organizationId/projects/:projectId/artifacts/:artifactId/download', async (c) => {
  const { organizationId, projectId, artifactId } = parseRouteIds(c)
  if (!organizationId.success || !projectId.success || !artifactId.success) return problem(422, 'invalid-request')
  const target = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return getArtifactDownloadTarget(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      artifactId: artifactId.data,
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
  headers.set('content-disposition', contentDisposition(target.fileName))
  headers.set('content-type', 'application/octet-stream')
  headers.set('etag', object.httpEtag)
  if (target.sha256) headers.set('x-content-sha256', target.sha256)
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

artifacts.delete('/:organizationId/projects/:projectId/artifacts/:artifactId', async (c) => {
  const { organizationId, projectId, artifactId } = parseRouteIds(c)
  if (!organizationId.success || !projectId.success || !artifactId.success) return problem(422, 'invalid-request')
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return markArtifactDeleted(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      artifactId: artifactId.data,
      requestId: c.get('requestId'),
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'referenced') return problem(409, 'conflict')
  if (result.kind === 'missing') return problem(404, 'not-found')
  await c.env.CIVIL_ARTIFACT_QUEUE.send({ artifactId: artifactId.data }, { contentType: 'json' })
  return new Response(null, { status: 204, headers: NO_STORE_HEADERS })
})
