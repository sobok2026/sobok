import type { Db } from '@sobok/edge/db/client'
import { and, eq } from 'drizzle-orm'
import { type CivilTransaction, withCivilContext } from '../context'
import { organizationMemberTable, projectMemberTable, projectTable } from '../schema/tenancy'
import { auditEventTable } from '../schema/work'

export type OrganizationRole = (typeof organizationMemberTable.$inferSelect)['role']

const PROJECT_WRITE_ROLES: ReadonlySet<OrganizationRole> = new Set(['owner', 'administrator', 'designer'])

async function organizationRole(
  tx: CivilTransaction,
  userId: string,
  organizationId: string,
): Promise<OrganizationRole | null> {
  const [membership] = await tx
    .select({ role: organizationMemberTable.role })
    .from(organizationMemberTable)
    .where(and(eq(organizationMemberTable.organizationId, organizationId), eq(organizationMemberTable.userId, userId)))
    .limit(1)
  return membership?.role ?? null
}

export function listProjects(db: Db, userId: string, organizationId: string) {
  return withCivilContext(db, userId, organizationId, async (tx) => {
    const role = await organizationRole(tx, userId, organizationId)
    if (!role) return null
    const items = await tx
      .select({
        id: projectTable.id,
        organizationId: projectTable.organizationId,
        code: projectTable.code,
        name: projectTable.name,
        status: projectTable.status,
        coordinateReferenceSystem: projectTable.coordinateReferenceSystem,
        createdAt: projectTable.createdAt,
        updatedAt: projectTable.updatedAt,
      })
      .from(projectTable)
      .where(eq(projectTable.organizationId, organizationId))
      .orderBy(projectTable.updatedAt)
    return { role, items }
  })
}

export function createProject(
  db: Db,
  input: {
    userId: string
    organizationId: string
    code: string
    name: string
    coordinateReferenceSystem: string
    requestId: string
  },
) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const role = await organizationRole(tx, input.userId, input.organizationId)
    if (!role || !PROJECT_WRITE_ROLES.has(role)) return null
    const projectId = crypto.randomUUID()
    await tx.insert(projectTable).values({
      id: projectId,
      organizationId: input.organizationId,
      code: input.code,
      name: input.name,
      coordinateReferenceSystem: input.coordinateReferenceSystem,
      createdByUserId: input.userId,
    })
    await tx.insert(projectMemberTable).values({
      organizationId: input.organizationId,
      projectId,
      userId: input.userId,
      role,
      createdByUserId: input.userId,
    })
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'project.created',
      targetType: 'project',
      targetId: projectId,
      requestId: input.requestId,
    })
    const [item] = await tx
      .select()
      .from(projectTable)
      .where(and(eq(projectTable.organizationId, input.organizationId), eq(projectTable.id, projectId)))
      .limit(1)
    if (!item) throw new Error('project insert was not visible after membership creation')
    return item
  })
}

export async function canWriteProject(
  tx: CivilTransaction,
  userId: string,
  organizationId: string,
  projectId: string,
): Promise<boolean> {
  const role = await organizationRole(tx, userId, organizationId)
  if (!role) return false
  const [project] = await tx
    .select({ id: projectTable.id })
    .from(projectTable)
    .where(and(eq(projectTable.organizationId, organizationId), eq(projectTable.id, projectId)))
    .limit(1)
  if (!project) return false
  if (role === 'owner' || role === 'administrator') return true
  const [projectMembership] = await tx
    .select({ role: projectMemberTable.role })
    .from(projectMemberTable)
    .where(and(eq(projectMemberTable.projectId, projectId), eq(projectMemberTable.userId, userId)))
    .limit(1)
  return Boolean(projectMembership && PROJECT_WRITE_ROLES.has(projectMembership.role))
}
