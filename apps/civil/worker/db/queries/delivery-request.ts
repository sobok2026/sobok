import {
  CIVIL_DELIVERY_MAX_ARTIFACTS,
  CIVIL_DELIVERY_MAX_SOURCE_BYTES,
  CIVIL_DELIVERY_RESERVATION_OVERHEAD_BYTES,
  type CivilDeliveryKind,
} from '@sobok/civil/delivery'
import type { Db } from '@sobok/edge/db/client'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { type CivilTransaction, withCivilContext } from '../context'
import { organizationTable, projectTable } from '../schema/tenancy'
import {
  artifactTable,
  auditEventTable,
  deliveryEventTable,
  deliveryGenerationJobTable,
  deliveryPackageItemTable,
  deliveryPackageTable,
} from '../schema/work'
import { canApproveProject, canContributeProject, canReviewProject } from './project'

const STORAGE_ADVISORY_LOCK = 2_026_082_901

async function lockAndReadGlobalStorage(tx: CivilTransaction): Promise<number> {
  await tx.execute(sql`select pg_advisory_xact_lock(${STORAGE_ADVISORY_LOCK})`)
  await tx.execute(sql`select set_config('app.civil_compute', 'on', true)`)
  try {
    const [result] = await tx
      .select({ used: sql<number>`coalesce(sum(${organizationTable.storageUsedBytes}), 0)::bigint`.mapWith(Number) })
      .from(organizationTable)
    return result?.used ?? 0
  } finally {
    await tx.execute(sql`select set_config('app.civil_compute', 'off', true)`)
  }
}

function archivePath(ordinal: number, kind: string, fileName: string): string {
  let safeName = ''
  for (const character of fileName.normalize('NFC')) {
    const codePoint = character.codePointAt(0) ?? 0
    safeName += codePoint < 32 || codePoint === 127 ? '_' : character
  }
  return `files/${kind}/${String(ordinal).padStart(3, '0')}-${safeName}`.slice(0, 512)
}

export function createDeliveryPackage(
  db: Db,
  input: {
    userId: string
    organizationId: string
    projectId: string
    title: string
    deliveryKind: CivilDeliveryKind
    vendorName: string
    revision: string
    artifactIds: string[]
    globalStorageCapBytes: number
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canContributeProject(tx, input.userId, input.organizationId, input.projectId))) {
      return { kind: 'forbidden' as const }
    }
    if (new Set(input.artifactIds).size !== input.artifactIds.length) return { kind: 'invalid-artifacts' as const }

    const artifacts = await tx
      .select({
        id: artifactTable.id,
        fileName: artifactTable.fileName,
        mediaType: artifactTable.mediaType,
        byteSize: artifactTable.byteSize,
        sha256: artifactTable.sha256,
        kind: artifactTable.kind,
        revision: artifactTable.revision,
        coordinateReferenceSystem: artifactTable.coordinateReferenceSystem,
      })
      .from(artifactTable)
      .where(
        and(
          eq(artifactTable.organizationId, input.organizationId),
          eq(artifactTable.projectId, input.projectId),
          eq(artifactTable.status, 'available'),
          inArray(artifactTable.id, input.artifactIds),
        ),
      )
    if (artifacts.length !== input.artifactIds.length) return { kind: 'invalid-artifacts' as const }
    const byId = new Map(artifacts.map((artifact) => [artifact.id, artifact]))
    const ordered = input.artifactIds.map((id) => byId.get(id)).filter((item) => item !== undefined)
    if (ordered.length < 1 || ordered.length > CIVIL_DELIVERY_MAX_ARTIFACTS)
      return { kind: 'invalid-artifacts' as const }
    if (ordered.some((artifact) => !artifact.sha256)) return { kind: 'invalid-artifacts' as const }
    const sourceBytes = ordered.reduce((total, artifact) => total + artifact.byteSize, 0)
    if (sourceBytes > CIVIL_DELIVERY_MAX_SOURCE_BYTES) return { kind: 'package-too-large' as const }
    const reservedBytes = sourceBytes + CIVIL_DELIVERY_RESERVATION_OVERHEAD_BYTES

    const globalUsed = await lockAndReadGlobalStorage(tx)
    const [organization] = await tx
      .select({ quota: organizationTable.storageQuotaBytes, used: organizationTable.storageUsedBytes })
      .from(organizationTable)
      .where(eq(organizationTable.id, input.organizationId))
      .limit(1)
      .for('update')
    if (!organization) return { kind: 'forbidden' as const }
    if (
      organization.used + reservedBytes > organization.quota ||
      globalUsed + reservedBytes > input.globalStorageCapBytes
    ) {
      return { kind: 'quota-exceeded' as const }
    }

    const packageId = crypto.randomUUID()
    const objectKey = `organizations/${input.organizationId}/projects/${input.projectId}/deliveries/${packageId}.zip`
    const [created] = await tx
      .insert(deliveryPackageTable)
      .values({
        id: packageId,
        organizationId: input.organizationId,
        projectId: input.projectId,
        title: input.title,
        deliveryKind: input.deliveryKind,
        vendorName: input.vendorName,
        revision: input.revision,
        objectKey,
        reservedBytes,
        requestedByUserId: input.userId,
      })
      .returning({
        id: deliveryPackageTable.id,
        title: deliveryPackageTable.title,
        deliveryKind: deliveryPackageTable.deliveryKind,
        vendorName: deliveryPackageTable.vendorName,
        revision: deliveryPackageTable.revision,
        status: deliveryPackageTable.status,
        createdAt: deliveryPackageTable.createdAt,
      })
    if (!created) throw new Error('delivery package insert returned no row')

    await tx.insert(deliveryPackageItemTable).values(
      ordered.map((artifact, index) => ({
        packageId,
        artifactId: artifact.id,
        organizationId: input.organizationId,
        projectId: input.projectId,
        ordinal: index + 1,
        archivePath: archivePath(index + 1, artifact.kind, artifact.fileName),
        fileName: artifact.fileName,
        mediaType: artifact.mediaType,
        byteSize: artifact.byteSize,
        sha256: artifact.sha256 as string,
        kind: artifact.kind,
        revision: artifact.revision,
        coordinateReferenceSystem: artifact.coordinateReferenceSystem,
      })),
    )
    await tx.insert(deliveryGenerationJobTable).values({
      packageId,
      organizationId: input.organizationId,
      projectId: input.projectId,
    })
    await tx
      .update(organizationTable)
      .set({ storageUsedBytes: sql`${organizationTable.storageUsedBytes} + ${reservedBytes}` })
      .where(eq(organizationTable.id, input.organizationId))
    await tx.insert(deliveryEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      packageId,
      fromStatus: null,
      toStatus: 'assembling',
      note: '전자납품 패키지 생성 요청',
      actorType: 'user',
      actorUserId: input.userId,
    })
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'delivery.created',
      targetType: 'delivery_package',
      targetId: packageId,
      requestId: input.requestId,
      detail: { deliveryKind: input.deliveryKind, revision: input.revision, artifactCount: ordered.length },
    })
    return { kind: 'created' as const, item: { ...created, artifactCount: ordered.length } }
  })
}

export function markDeliveryGenerationDispatched(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; packageId: string },
): Promise<void> {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    await tx
      .update(deliveryGenerationJobTable)
      .set({
        dispatchedAt: new Date(),
        dispatchAttemptCount: sql`${deliveryGenerationJobTable.dispatchAttemptCount} + 1`,
        failureCode: null,
      })
      .where(eq(deliveryGenerationJobTable.packageId, input.packageId))
  })
}

export function markDeliveryGenerationDispatchFailed(
  db: Db,
  input: { userId: string; organizationId: string; packageId: string },
): Promise<void> {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    await tx
      .update(deliveryGenerationJobTable)
      .set({
        dispatchAttemptCount: sql`${deliveryGenerationJobTable.dispatchAttemptCount} + 1`,
        failureCode: 'queue-dispatch-failed',
      })
      .where(eq(deliveryGenerationJobTable.packageId, input.packageId))
  })
}

export function listDeliveryPackages(db: Db, input: { userId: string; organizationId: string; projectId: string }) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const [project] = await tx
      .select({ id: projectTable.id })
      .from(projectTable)
      .where(and(eq(projectTable.organizationId, input.organizationId), eq(projectTable.id, input.projectId)))
      .limit(1)
    if (!project) return null
    const items = await tx
      .select({
        id: deliveryPackageTable.id,
        title: deliveryPackageTable.title,
        deliveryKind: deliveryPackageTable.deliveryKind,
        vendorName: deliveryPackageTable.vendorName,
        revision: deliveryPackageTable.revision,
        status: deliveryPackageTable.status,
        byteSize: deliveryPackageTable.byteSize,
        sha256: deliveryPackageTable.sha256,
        manifestSha256: deliveryPackageTable.manifestSha256,
        failureCode: deliveryPackageTable.failureCode,
        submittedAt: deliveryPackageTable.submittedAt,
        reviewedAt: deliveryPackageTable.reviewedAt,
        approvedAt: deliveryPackageTable.approvedAt,
        createdAt: deliveryPackageTable.createdAt,
        updatedAt: deliveryPackageTable.updatedAt,
        artifactCount: sql<number>`count(${deliveryPackageItemTable.artifactId})::integer`.mapWith(Number),
      })
      .from(deliveryPackageTable)
      .leftJoin(deliveryPackageItemTable, eq(deliveryPackageItemTable.packageId, deliveryPackageTable.id))
      .where(
        and(
          eq(deliveryPackageTable.organizationId, input.organizationId),
          eq(deliveryPackageTable.projectId, input.projectId),
        ),
      )
      .groupBy(deliveryPackageTable.id)
      .orderBy(desc(deliveryPackageTable.createdAt))
    return {
      canCreate: await canContributeProject(tx, input.userId, input.organizationId, input.projectId),
      canReview: await canReviewProject(tx, input.userId, input.organizationId, input.projectId),
      canApprove: await canApproveProject(tx, input.userId, input.organizationId, input.projectId),
      items,
    }
  })
}

export function getDeliveryPackage(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; packageId: string },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const [item] = await tx
      .select({
        id: deliveryPackageTable.id,
        title: deliveryPackageTable.title,
        deliveryKind: deliveryPackageTable.deliveryKind,
        vendorName: deliveryPackageTable.vendorName,
        revision: deliveryPackageTable.revision,
        status: deliveryPackageTable.status,
        manifest: deliveryPackageTable.manifest,
        manifestSha256: deliveryPackageTable.manifestSha256,
        byteSize: deliveryPackageTable.byteSize,
        sha256: deliveryPackageTable.sha256,
        failureCode: deliveryPackageTable.failureCode,
        submittedAt: deliveryPackageTable.submittedAt,
        reviewedAt: deliveryPackageTable.reviewedAt,
        approvedAt: deliveryPackageTable.approvedAt,
        createdAt: deliveryPackageTable.createdAt,
        updatedAt: deliveryPackageTable.updatedAt,
      })
      .from(deliveryPackageTable)
      .where(
        and(
          eq(deliveryPackageTable.id, input.packageId),
          eq(deliveryPackageTable.organizationId, input.organizationId),
          eq(deliveryPackageTable.projectId, input.projectId),
        ),
      )
      .limit(1)
    if (!item) return null
    const packageItems = await tx
      .select({
        artifactId: deliveryPackageItemTable.artifactId,
        ordinal: deliveryPackageItemTable.ordinal,
        archivePath: deliveryPackageItemTable.archivePath,
        fileName: deliveryPackageItemTable.fileName,
        mediaType: deliveryPackageItemTable.mediaType,
        byteSize: deliveryPackageItemTable.byteSize,
        sha256: deliveryPackageItemTable.sha256,
        kind: deliveryPackageItemTable.kind,
        revision: deliveryPackageItemTable.revision,
        coordinateReferenceSystem: deliveryPackageItemTable.coordinateReferenceSystem,
      })
      .from(deliveryPackageItemTable)
      .where(eq(deliveryPackageItemTable.packageId, input.packageId))
      .orderBy(asc(deliveryPackageItemTable.ordinal))
    const events = await tx
      .select({
        id: deliveryEventTable.id,
        fromStatus: deliveryEventTable.fromStatus,
        toStatus: deliveryEventTable.toStatus,
        note: deliveryEventTable.note,
        actorType: deliveryEventTable.actorType,
        actorUserId: deliveryEventTable.actorUserId,
        createdAt: deliveryEventTable.createdAt,
      })
      .from(deliveryEventTable)
      .where(eq(deliveryEventTable.packageId, input.packageId))
      .orderBy(asc(deliveryEventTable.createdAt))
    return { item, items: packageItems, events }
  })
}

export function getDeliveryDownloadTarget(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; packageId: string },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const [target] = await tx
      .select({
        objectKey: deliveryPackageTable.objectKey,
        title: deliveryPackageTable.title,
        revision: deliveryPackageTable.revision,
        byteSize: deliveryPackageTable.byteSize,
        sha256: deliveryPackageTable.sha256,
        manifestSha256: deliveryPackageTable.manifestSha256,
      })
      .from(deliveryPackageTable)
      .where(
        and(
          eq(deliveryPackageTable.id, input.packageId),
          eq(deliveryPackageTable.organizationId, input.organizationId),
          eq(deliveryPackageTable.projectId, input.projectId),
          inArray(deliveryPackageTable.status, ['ready', 'submitted', 'changes_requested', 'approved']),
        ),
      )
      .limit(1)
    return target ?? null
  })
}

export function submitDeliveryPackage(
  db: Db,
  input: {
    userId: string
    organizationId: string
    projectId: string
    packageId: string
    note: string | null
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canContributeProject(tx, input.userId, input.organizationId, input.projectId)))
      return 'forbidden' as const
    const [item] = await tx
      .update(deliveryPackageTable)
      .set({ status: 'submitted', submittedAt: new Date() })
      .where(
        and(
          eq(deliveryPackageTable.id, input.packageId),
          eq(deliveryPackageTable.organizationId, input.organizationId),
          eq(deliveryPackageTable.projectId, input.projectId),
          eq(deliveryPackageTable.status, 'ready'),
        ),
      )
      .returning({ id: deliveryPackageTable.id })
    if (!item) return 'conflict' as const
    await tx.insert(deliveryEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      packageId: input.packageId,
      fromStatus: 'ready',
      toStatus: 'submitted',
      note: input.note,
      actorType: 'user',
      actorUserId: input.userId,
    })
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'delivery.submitted',
      targetType: 'delivery_package',
      targetId: input.packageId,
      requestId: input.requestId,
    })
    return 'submitted' as const
  })
}

export function reviewDeliveryPackage(
  db: Db,
  input: {
    userId: string
    organizationId: string
    projectId: string
    packageId: string
    decision: 'changes_requested' | 'approved'
    note: string
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const allowed =
      input.decision === 'approved'
        ? await canApproveProject(tx, input.userId, input.organizationId, input.projectId)
        : await canReviewProject(tx, input.userId, input.organizationId, input.projectId)
    if (!allowed) return 'forbidden' as const
    const now = new Date()
    const [item] = await tx
      .update(deliveryPackageTable)
      .set({
        status: input.decision,
        reviewedAt: now,
        approvedAt: input.decision === 'approved' ? now : null,
      })
      .where(
        and(
          eq(deliveryPackageTable.id, input.packageId),
          eq(deliveryPackageTable.organizationId, input.organizationId),
          eq(deliveryPackageTable.projectId, input.projectId),
          eq(deliveryPackageTable.status, 'submitted'),
        ),
      )
      .returning({ id: deliveryPackageTable.id })
    if (!item) return 'conflict' as const
    await tx.insert(deliveryEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      packageId: input.packageId,
      fromStatus: 'submitted',
      toStatus: input.decision,
      note: input.note,
      actorType: 'user',
      actorUserId: input.userId,
    })
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: `delivery.${input.decision}`,
      targetType: 'delivery_package',
      targetId: input.packageId,
      requestId: input.requestId,
    })
    return input.decision
  })
}

export function withdrawDeliveryPackage(
  db: Db,
  input: { userId: string; organizationId: string; projectId: string; packageId: string; requestId: string },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    if (!(await canContributeProject(tx, input.userId, input.organizationId, input.projectId))) {
      return { kind: 'forbidden' as const }
    }
    const [item] = await tx
      .select({ status: deliveryPackageTable.status, reservedBytes: deliveryPackageTable.reservedBytes })
      .from(deliveryPackageTable)
      .where(
        and(
          eq(deliveryPackageTable.id, input.packageId),
          eq(deliveryPackageTable.organizationId, input.organizationId),
          eq(deliveryPackageTable.projectId, input.projectId),
          inArray(deliveryPackageTable.status, ['assembling', 'ready', 'failed']),
        ),
      )
      .limit(1)
      .for('update')
    if (!item) return { kind: 'conflict' as const }
    await tx
      .update(deliveryPackageTable)
      .set({ status: 'withdrawn', reservedBytes: 0 })
      .where(eq(deliveryPackageTable.id, input.packageId))
    await tx
      .update(organizationTable)
      .set({ storageUsedBytes: sql`${organizationTable.storageUsedBytes} - ${item.reservedBytes}` })
      .where(eq(organizationTable.id, input.organizationId))
    await tx
      .update(deliveryGenerationJobTable)
      .set({ cleanupRequired: true })
      .where(eq(deliveryGenerationJobTable.packageId, input.packageId))
    await tx.insert(deliveryEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      packageId: input.packageId,
      fromStatus: item.status,
      toStatus: 'withdrawn',
      note: '패키지 철회 및 저장 객체 삭제',
      actorType: 'user',
      actorUserId: input.userId,
    })
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'delivery.withdrawn',
      targetType: 'delivery_package',
      targetId: input.packageId,
      requestId: input.requestId,
    })
    return { kind: 'withdrawn' as const }
  })
}
