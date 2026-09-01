import {
  CivilDesignReviewAreaSchema,
  CivilDesignReviewResultSchema,
  CivilDesignTransitionSchema,
  CivilDesignWorkTypeSchema,
} from '@sobok/civil/collaboration'
import { Hono } from 'hono'
import { z } from 'zod'
import { withCivilSession } from '../auth'
import {
  createDesignReviewItem,
  createDesignRevision,
  decideDesignReviewItem,
  getDesignRevision,
  listDesignRevisions,
  respondToDesignReviewItem,
  transitionDesignRevision,
  updateDesignRevision,
} from '../db/queries/design'
import type { AppEnv } from '../env'
import { problem } from '../errors'
import { NO_STORE_HEADERS, readJson } from '../lib/http'

const BODY_LIMIT_BYTES = 32 * 1024
const Id = z.uuid()
const NullableId = z.uuid().nullable().default(null)
const RevisionFields = {
  title: z.string().trim().min(1).max(160),
  reason: z.string().trim().max(4000).nullable().default(null),
  legalBasis: z.string().trim().max(4000).nullable().default(null),
  documentNumber: z.string().trim().max(120).nullable().default(null),
  scheduleImpactDays: z.number().int().min(-36_500).max(36_500).nullable().default(null),
  costImpactAmount: z.number().int().safe().nullable().default(null),
  baseDrawingArtifactId: NullableId,
  newDrawingArtifactId: NullableId,
  baseCalculationResultId: NullableId,
  newCalculationResultId: NullableId,
}
const CreateRevisionBody = z.object({ workType: CivilDesignWorkTypeSchema, ...RevisionFields }).strict()
const UpdateRevisionBody = z.object(RevisionFields).strict()
const TransitionBody = z
  .object({ action: CivilDesignTransitionSchema, note: z.string().trim().max(4000).nullable().default(null) })
  .strict()
  .superRefine((value, context) => {
    if (['request_changes', 'approve', 'finalize'].includes(value.action) && !value.note) {
      context.addIssue({ code: 'custom', message: 'note is required', path: ['note'] })
    }
  })
const CreateReviewBody = z
  .object({
    area: CivilDesignReviewAreaSchema,
    item: z.string().trim().min(1).max(240),
    comment: z.string().trim().max(4000).nullable().default(null),
  })
  .strict()
const DecideReviewBody = z
  .object({
    result: CivilDesignReviewResultSchema,
    comment: z.string().trim().max(4000).nullable().default(null),
  })
  .strict()
const RespondReviewBody = z.object({ response: z.string().trim().min(1).max(4000) }).strict()

export const designs = new Hono<AppEnv>()

function routeIds(c: { req: { param(name: string): string } }) {
  return {
    organizationId: Id.safeParse(c.req.param('organizationId')),
    projectId: Id.safeParse(c.req.param('projectId')),
    revisionId: Id.safeParse(c.req.param('revisionId')),
    reviewId: Id.safeParse(c.req.param('reviewId')),
  }
}

function revisionInput(body: z.infer<typeof UpdateRevisionBody>) {
  return {
    title: body.title,
    reason: body.reason,
    legalBasis: body.legalBasis,
    documentNumber: body.documentNumber,
    scheduleImpactDays: body.scheduleImpactDays,
    costImpactAmount: body.costImpactAmount,
    links: {
      baseDrawingArtifactId: body.baseDrawingArtifactId,
      newDrawingArtifactId: body.newDrawingArtifactId,
      baseCalculationResultId: body.baseCalculationResultId,
      newCalculationResultId: body.newCalculationResultId,
    },
  }
}

function serializeRevision<
  T extends {
    createdAt: Date
    updatedAt: Date
    submittedAt?: Date | null
    approvedAt?: Date | null
    finalizedAt?: Date | null
  },
>(item: T) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    submittedAt: item.submittedAt?.toISOString() ?? null,
    approvedAt: item.approvedAt?.toISOString() ?? null,
    finalizedAt: item.finalizedAt?.toISOString() ?? null,
  }
}

designs.get('/:organizationId/projects/:projectId/design-revisions', async (c) => {
  const { organizationId, projectId } = routeIds(c)
  if (!organizationId.success || !projectId.success) return problem(422, 'invalid-request')
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return listDesignRevisions(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result === null) return problem(404, 'not-found')
  return c.json({ ...result, items: result.items.map((item) => serializeRevision(item)) }, 200, NO_STORE_HEADERS)
})

designs.post('/:organizationId/projects/:projectId/design-revisions', async (c) => {
  const { organizationId, projectId } = routeIds(c)
  const body = await readJson(c, CreateRevisionBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !projectId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return createDesignRevision(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      workType: body.data.workType,
      requestId: c.get('requestId'),
      ...revisionInput(body.data),
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'missing') return problem(404, 'not-found')
  if (result.kind === 'invalid-links') return problem(422, 'invalid-request')
  return c.json(serializeRevision(result.item), 201, NO_STORE_HEADERS)
})

designs.get('/:organizationId/projects/:projectId/design-revisions/:revisionId', async (c) => {
  const { organizationId, projectId, revisionId } = routeIds(c)
  if (!organizationId.success || !projectId.success || !revisionId.success) return problem(422, 'invalid-request')
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return getDesignRevision(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      revisionId: revisionId.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result === null) return problem(404, 'not-found')
  return c.json(
    {
      ...result,
      item: serializeRevision(result.item),
      reviews: result.reviews.map((review) => ({
        ...review,
        reviewedAt: review.reviewedAt?.toISOString() ?? null,
        respondedAt: review.respondedAt?.toISOString() ?? null,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      })),
      events: result.events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
      finalization: result.finalization
        ? { ...result.finalization, createdAt: result.finalization.createdAt.toISOString() }
        : null,
    },
    200,
    NO_STORE_HEADERS,
  )
})

designs.put('/:organizationId/projects/:projectId/design-revisions/:revisionId', async (c) => {
  const { organizationId, projectId, revisionId } = routeIds(c)
  const body = await readJson(c, UpdateRevisionBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !projectId.success || !revisionId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return updateDesignRevision(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      revisionId: revisionId.data,
      requestId: c.get('requestId'),
      ...revisionInput(body.data),
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'invalid-links') return problem(422, 'invalid-request')
  if (result.kind === 'conflict') return problem(409, 'conflict')
  return c.json(serializeRevision(result.item), 200, NO_STORE_HEADERS)
})

designs.post('/:organizationId/projects/:projectId/design-revisions/:revisionId/transition', async (c) => {
  const { organizationId, projectId, revisionId } = routeIds(c)
  const body = await readJson(c, TransitionBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !projectId.success || !revisionId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return transitionDesignRevision(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      revisionId: revisionId.data,
      action: body.data.action,
      note: body.data.note,
      requestId: c.get('requestId'),
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'missing') return problem(404, 'not-found')
  if (result.kind === 'conflict' || result.kind === 'reviews-unresolved') return problem(409, 'conflict')
  return c.json({ status: result.status }, 200, NO_STORE_HEADERS)
})

designs.post('/:organizationId/projects/:projectId/design-revisions/:revisionId/reviews', async (c) => {
  const { organizationId, projectId, revisionId } = routeIds(c)
  const body = await readJson(c, CreateReviewBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !projectId.success || !revisionId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return createDesignReviewItem(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      revisionId: revisionId.data,
      requestId: c.get('requestId'),
      ...body.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'missing') return problem(404, 'not-found')
  if (result.kind === 'conflict') return problem(409, 'conflict')
  return c.json(
    { ...result.item, createdAt: result.item.createdAt.toISOString(), updatedAt: result.item.updatedAt.toISOString() },
    201,
    NO_STORE_HEADERS,
  )
})

designs.patch('/:organizationId/projects/:projectId/design-revisions/:revisionId/reviews/:reviewId', async (c) => {
  const { organizationId, projectId, revisionId, reviewId } = routeIds(c)
  const body = await readJson(c, DecideReviewBody, BODY_LIMIT_BYTES)
  if (!organizationId.success || !projectId.success || !revisionId.success || !reviewId.success || !body.success) {
    return problem(
      !body.success && body.tooLarge ? 413 : 422,
      !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
    )
  }
  const result = await withCivilSession(c, (db, session) => {
    if (!session) return Promise.resolve(undefined)
    return decideDesignReviewItem(db, {
      userId: session.user.id,
      organizationId: organizationId.data,
      projectId: projectId.data,
      revisionId: revisionId.data,
      reviewId: reviewId.data,
      requestId: c.get('requestId'),
      ...body.data,
    })
  })
  if (result === undefined) return problem(401, 'unauthorized')
  if (result.kind === 'forbidden') return problem(403, 'forbidden')
  if (result.kind === 'missing') return problem(404, 'not-found')
  if (result.kind === 'conflict') return problem(409, 'conflict')
  return c.json({ result: body.data.result }, 200, NO_STORE_HEADERS)
})

designs.patch(
  '/:organizationId/projects/:projectId/design-revisions/:revisionId/reviews/:reviewId/response',
  async (c) => {
    const { organizationId, projectId, revisionId, reviewId } = routeIds(c)
    const body = await readJson(c, RespondReviewBody, BODY_LIMIT_BYTES)
    if (!organizationId.success || !projectId.success || !revisionId.success || !reviewId.success || !body.success) {
      return problem(
        !body.success && body.tooLarge ? 413 : 422,
        !body.success && body.tooLarge ? 'payload-too-large' : 'invalid-request',
      )
    }
    const result = await withCivilSession(c, (db, session) => {
      if (!session) return Promise.resolve(undefined)
      return respondToDesignReviewItem(db, {
        userId: session.user.id,
        organizationId: organizationId.data,
        projectId: projectId.data,
        revisionId: revisionId.data,
        reviewId: reviewId.data,
        response: body.data.response,
        requestId: c.get('requestId'),
      })
    })
    if (result === undefined) return problem(401, 'unauthorized')
    if (result.kind === 'forbidden') return problem(403, 'forbidden')
    if (result.kind === 'missing') return problem(404, 'not-found')
    if (result.kind === 'conflict') return problem(409, 'conflict')
    return c.json({ response: body.data.response }, 200, NO_STORE_HEADERS)
  },
)
