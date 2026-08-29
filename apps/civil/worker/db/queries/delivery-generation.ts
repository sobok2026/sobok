import {
  type CivilDeliveryGenerationClaim,
  type CivilDeliveryGenerationOutput,
  CivilDeliveryGenerationOutputSchema,
  CivilDeliveryGenerationWorkSchema,
} from '@sobok/civil/delivery'
import type { Db } from '@sobok/edge/db/client'
import { and, asc, eq, inArray, lt, or, sql } from 'drizzle-orm'
import { withCivilComputeContext } from '../context'
import { organizationTable } from '../schema/tenancy'
import {
  artifactTable,
  auditEventTable,
  deliveryEventTable,
  deliveryGenerationJobTable,
  deliveryPackageItemTable,
  deliveryPackageTable,
} from '../schema/work'

export function claimDeliveryGeneration(db: Db, packageId: string): Promise<CivilDeliveryGenerationClaim> {
  return withCivilComputeContext(db, async (tx) => {
    const [cleanup] = await tx
      .select({ objectKey: deliveryPackageTable.objectKey })
      .from(deliveryGenerationJobTable)
      .innerJoin(deliveryPackageTable, eq(deliveryPackageTable.id, deliveryGenerationJobTable.packageId))
      .where(
        and(eq(deliveryGenerationJobTable.packageId, packageId), eq(deliveryGenerationJobTable.cleanupRequired, true)),
      )
      .limit(1)
    if (cleanup) return { status: 'cleanup', objectKey: cleanup.objectKey }

    const [job] = await tx
      .update(deliveryGenerationJobTable)
      .set({
        status: 'running',
        startedAt: new Date(),
        failureCode: null,
        attemptCount: sql`${deliveryGenerationJobTable.attemptCount} + 1`,
      })
      .where(
        and(
          eq(deliveryGenerationJobTable.packageId, packageId),
          or(
            inArray(deliveryGenerationJobTable.status, ['queued', 'failed']),
            and(
              eq(deliveryGenerationJobTable.status, 'running'),
              lt(deliveryGenerationJobTable.startedAt, sql`now() - interval '20 minutes'`),
            ),
          ),
        ),
      )
      .returning({ packageId: deliveryGenerationJobTable.packageId })
    if (!job) {
      const [current] = await tx
        .select({ status: deliveryGenerationJobTable.status })
        .from(deliveryGenerationJobTable)
        .where(eq(deliveryGenerationJobTable.packageId, packageId))
        .limit(1)
      return !current || current.status === 'succeeded' ? { status: 'complete' } : { status: 'retry' }
    }

    const [delivery] = await tx
      .select({
        packageId: deliveryPackageTable.id,
        organizationId: deliveryPackageTable.organizationId,
        projectId: deliveryPackageTable.projectId,
        objectKey: deliveryPackageTable.objectKey,
        title: deliveryPackageTable.title,
        deliveryKind: deliveryPackageTable.deliveryKind,
        vendorName: deliveryPackageTable.vendorName,
        revision: deliveryPackageTable.revision,
        createdAt: deliveryPackageTable.createdAt,
        status: deliveryPackageTable.status,
        reservedBytes: deliveryPackageTable.reservedBytes,
      })
      .from(deliveryPackageTable)
      .where(eq(deliveryPackageTable.id, packageId))
      .limit(1)
    if (delivery && !['assembling', 'failed'].includes(delivery.status)) {
      await tx
        .update(deliveryGenerationJobTable)
        .set({ status: 'succeeded', completedAt: new Date() })
        .where(eq(deliveryGenerationJobTable.packageId, packageId))
      return { status: 'complete' }
    }
    if (!delivery) return { status: 'complete' }
    if (delivery.status === 'failed') {
      await tx
        .update(deliveryPackageTable)
        .set({ status: 'assembling', failureCode: null })
        .where(eq(deliveryPackageTable.id, packageId))
    }
    const items = await tx
      .select({
        artifactId: deliveryPackageItemTable.artifactId,
        objectKey: artifactTable.objectKey,
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
      .innerJoin(artifactTable, eq(artifactTable.id, deliveryPackageItemTable.artifactId))
      .where(eq(deliveryPackageItemTable.packageId, packageId))
      .orderBy(asc(deliveryPackageItemTable.ordinal))
    const { status: _status, reservedBytes: _reservedBytes, ...deliveryWork } = delivery
    const parsed = CivilDeliveryGenerationWorkSchema.safeParse({
      ...deliveryWork,
      createdAt: delivery.createdAt.toISOString(),
      items,
    })
    if (!parsed.success) {
      await tx
        .update(deliveryGenerationJobTable)
        .set({
          status: 'succeeded',
          failureCode: 'invalid-delivery-snapshot',
          cleanupRequired: true,
          completedAt: new Date(),
        })
        .where(eq(deliveryGenerationJobTable.packageId, packageId))
      await tx
        .update(deliveryPackageTable)
        .set({ status: 'failed', failureCode: 'invalid-delivery-snapshot', reservedBytes: 0 })
        .where(eq(deliveryPackageTable.id, packageId))
      await tx
        .update(organizationTable)
        .set({ storageUsedBytes: sql`${organizationTable.storageUsedBytes} - ${delivery.reservedBytes}` })
        .where(eq(organizationTable.id, delivery.organizationId))
      return { status: 'cleanup', objectKey: delivery.objectKey }
    }
    return { status: 'work', work: parsed.data }
  })
}

export function completeDeliveryGeneration(
  db: Db,
  input: { packageId: string; output: CivilDeliveryGenerationOutput },
): Promise<void> {
  return withCivilComputeContext(db, async (tx) => {
    const output = CivilDeliveryGenerationOutputSchema.parse(input.output)
    const [delivery] = await tx
      .select({
        organizationId: deliveryPackageTable.organizationId,
        projectId: deliveryPackageTable.projectId,
        reservedBytes: deliveryPackageTable.reservedBytes,
        status: deliveryPackageTable.status,
      })
      .from(deliveryPackageTable)
      .where(eq(deliveryPackageTable.id, input.packageId))
      .limit(1)
      .for('update')
    if (!delivery) throw new Error('delivery package not found')
    if (delivery.status !== 'assembling') return
    if (output.byteSize > delivery.reservedBytes) throw new Error('delivery package exceeded reserved storage')

    const now = new Date()
    await tx
      .update(deliveryPackageTable)
      .set({
        status: 'ready',
        manifest: output.manifest,
        manifestSha256: output.manifestSha256,
        byteSize: output.byteSize,
        reservedBytes: output.byteSize,
        sha256: output.sha256,
        failureCode: null,
      })
      .where(eq(deliveryPackageTable.id, input.packageId))
    await tx
      .update(organizationTable)
      .set({
        storageUsedBytes: sql`${organizationTable.storageUsedBytes} - ${delivery.reservedBytes - output.byteSize}`,
      })
      .where(eq(organizationTable.id, delivery.organizationId))
    await tx
      .update(deliveryGenerationJobTable)
      .set({ status: 'succeeded', completedAt: now, failureCode: null })
      .where(eq(deliveryGenerationJobTable.packageId, input.packageId))
    await tx.insert(deliveryEventTable).values({
      organizationId: delivery.organizationId,
      projectId: delivery.projectId,
      packageId: input.packageId,
      fromStatus: 'assembling',
      toStatus: 'ready',
      note: 'ZIP 및 manifest.json 생성 완료',
      actorType: 'system',
      actorUserId: null,
    })
    await tx.insert(auditEventTable).values({
      organizationId: delivery.organizationId,
      projectId: delivery.projectId,
      actorType: 'system',
      actorUserId: null,
      action: 'delivery.generated',
      targetType: 'delivery_package',
      targetId: input.packageId,
      requestId: `compute:delivery:${input.packageId}`,
      detail: {
        byteSize: output.byteSize,
        sha256: output.sha256,
        manifestSha256: output.manifestSha256,
      },
    })
  })
}

export function failDeliveryGeneration(db: Db, input: { packageId: string; failureCode: string }): Promise<void> {
  return withCivilComputeContext(db, async (tx) => {
    await tx
      .update(deliveryGenerationJobTable)
      .set({ status: 'failed', failureCode: input.failureCode.slice(0, 120), completedAt: new Date() })
      .where(
        and(
          eq(deliveryGenerationJobTable.packageId, input.packageId),
          inArray(deliveryGenerationJobTable.status, ['queued', 'running']),
        ),
      )
    await tx
      .update(deliveryPackageTable)
      .set({ status: 'failed', failureCode: input.failureCode.slice(0, 120) })
      .where(and(eq(deliveryPackageTable.id, input.packageId), eq(deliveryPackageTable.status, 'assembling')))
  })
}

export function completeDeliveryCleanup(db: Db, packageId: string): Promise<void> {
  return withCivilComputeContext(db, async (tx) => {
    await tx
      .update(deliveryGenerationJobTable)
      .set({ cleanupRequired: false })
      .where(eq(deliveryGenerationJobTable.packageId, packageId))
  })
}
