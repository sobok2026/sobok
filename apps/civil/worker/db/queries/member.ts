import type { CivilOrganizationRole, CivilProjectRole } from '@sobok/civil/collaboration'
import type { Db } from '@sobok/edge/db/client'
import { and, asc, eq, sql } from 'drizzle-orm'
import { type CivilTransaction, withCivilContext } from '../context'
import { civilUser } from '../schema/auth'
import { organizationMemberTable, organizationTable, projectMemberTable, projectTable } from '../schema/tenancy'
import { auditEventTable } from '../schema/work'
import { getOrganizationRole } from './project'

function canManageMembers(role: string | null): role is 'owner' | 'administrator' {
  return role === 'owner' || role === 'administrator'
}

function actorCanAssignOrganizationRole(actorRole: 'owner' | 'administrator', role: CivilOrganizationRole): boolean {
  return actorRole === 'owner' || role === 'viewer'
}

async function lockOrganization(tx: CivilTransaction, organizationId: string) {
  const [organization] = await tx
    .select({ id: organizationTable.id })
    .from(organizationTable)
    .where(eq(organizationTable.id, organizationId))
    .limit(1)
    .for('update')
  return organization ?? null
}

async function ownerCount(tx: CivilTransaction, organizationId: string) {
  const [result] = await tx
    .select({ count: sql<number>`count(*)::integer`.mapWith(Number) })
    .from(organizationMemberTable)
    .where(and(eq(organizationMemberTable.organizationId, organizationId), eq(organizationMemberTable.role, 'owner')))
  return result?.count ?? 0
}

export function listOrganizationMembers(db: Db, input: { userId: string; organizationId: string }) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const actorRole = await getOrganizationRole(tx, input.userId, input.organizationId)
    if (!actorRole) return null
    const items = await tx
      .select({
        userId: organizationMemberTable.userId,
        name: civilUser.name,
        email: civilUser.email,
        role: organizationMemberTable.role,
        createdAt: organizationMemberTable.createdAt,
        updatedAt: organizationMemberTable.updatedAt,
      })
      .from(organizationMemberTable)
      .innerJoin(civilUser, eq(civilUser.id, organizationMemberTable.userId))
      .where(eq(organizationMemberTable.organizationId, input.organizationId))
      .orderBy(asc(civilUser.name), asc(civilUser.email))
    return { actorRole, canManage: canManageMembers(actorRole), items }
  })
}

export function upsertOrganizationMember(
  db: Db,
  input: {
    actorUserId: string
    organizationId: string
    email: string
    role: CivilOrganizationRole
    requestId: string
  },
) {
  return withCivilContext(db, input.actorUserId, input.organizationId, async (tx) => {
    const actorRole = await getOrganizationRole(tx, input.actorUserId, input.organizationId)
    if (!canManageMembers(actorRole)) return { kind: 'forbidden' as const }
    if (!actorCanAssignOrganizationRole(actorRole, input.role)) return { kind: 'forbidden' as const }
    if (!(await lockOrganization(tx, input.organizationId))) return { kind: 'missing' as const }

    const [user] = await tx
      .select({ id: civilUser.id, name: civilUser.name, email: civilUser.email })
      .from(civilUser)
      .where(sql`lower(${civilUser.email}) = ${input.email.toLowerCase()}`)
      .limit(1)
    if (!user) return { kind: 'user-not-found' as const }

    const [existing] = await tx
      .select({ role: organizationMemberTable.role })
      .from(organizationMemberTable)
      .where(
        and(
          eq(organizationMemberTable.organizationId, input.organizationId),
          eq(organizationMemberTable.userId, user.id),
        ),
      )
      .limit(1)
    if (actorRole === 'administrator' && existing && existing.role !== 'viewer') {
      return { kind: 'forbidden' as const }
    }
    if (existing?.role === 'owner' && input.role !== 'owner' && (await ownerCount(tx, input.organizationId)) <= 1) {
      return { kind: 'last-owner' as const }
    }

    await tx
      .insert(organizationMemberTable)
      .values({
        organizationId: input.organizationId,
        userId: user.id,
        role: input.role,
        createdByUserId: input.actorUserId,
      })
      .onConflictDoUpdate({
        target: [organizationMemberTable.organizationId, organizationMemberTable.userId],
        set: { role: input.role },
      })
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      actorType: 'user',
      actorUserId: input.actorUserId,
      action: existing ? 'organization_member.role_changed' : 'organization_member.added',
      targetType: 'organization_member',
      targetId: user.id,
      requestId: input.requestId,
      detail: { previousRole: existing?.role ?? null, role: input.role },
    })
    return { kind: 'saved' as const, item: { userId: user.id, name: user.name, email: user.email, role: input.role } }
  })
}

export function updateOrganizationMemberRole(
  db: Db,
  input: {
    actorUserId: string
    organizationId: string
    targetUserId: string
    role: CivilOrganizationRole
    requestId: string
  },
) {
  return withCivilContext(db, input.actorUserId, input.organizationId, async (tx) => {
    const actorRole = await getOrganizationRole(tx, input.actorUserId, input.organizationId)
    if (!canManageMembers(actorRole)) return { kind: 'forbidden' as const }
    if (!actorCanAssignOrganizationRole(actorRole, input.role)) return { kind: 'forbidden' as const }
    if (!(await lockOrganization(tx, input.organizationId))) return { kind: 'missing' as const }
    const [existing] = await tx
      .select({ role: organizationMemberTable.role })
      .from(organizationMemberTable)
      .where(
        and(
          eq(organizationMemberTable.organizationId, input.organizationId),
          eq(organizationMemberTable.userId, input.targetUserId),
        ),
      )
      .limit(1)
    if (!existing) return { kind: 'missing' as const }
    if (actorRole === 'administrator' && existing.role !== 'viewer') return { kind: 'forbidden' as const }
    if (existing.role === 'owner' && input.role !== 'owner' && (await ownerCount(tx, input.organizationId)) <= 1) {
      return { kind: 'last-owner' as const }
    }
    await tx
      .update(organizationMemberTable)
      .set({ role: input.role })
      .where(
        and(
          eq(organizationMemberTable.organizationId, input.organizationId),
          eq(organizationMemberTable.userId, input.targetUserId),
        ),
      )
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      actorType: 'user',
      actorUserId: input.actorUserId,
      action: 'organization_member.role_changed',
      targetType: 'organization_member',
      targetId: input.targetUserId,
      requestId: input.requestId,
      detail: { previousRole: existing.role, role: input.role },
    })
    return { kind: 'saved' as const }
  })
}

export function removeOrganizationMember(
  db: Db,
  input: { actorUserId: string; organizationId: string; targetUserId: string; requestId: string },
) {
  return withCivilContext(db, input.actorUserId, input.organizationId, async (tx) => {
    const actorRole = await getOrganizationRole(tx, input.actorUserId, input.organizationId)
    if (!canManageMembers(actorRole)) return { kind: 'forbidden' as const }
    if (!(await lockOrganization(tx, input.organizationId))) return { kind: 'missing' as const }
    const [existing] = await tx
      .select({ role: organizationMemberTable.role })
      .from(organizationMemberTable)
      .where(
        and(
          eq(organizationMemberTable.organizationId, input.organizationId),
          eq(organizationMemberTable.userId, input.targetUserId),
        ),
      )
      .limit(1)
    if (!existing) return { kind: 'missing' as const }
    if (actorRole === 'administrator' && existing.role !== 'viewer') return { kind: 'forbidden' as const }
    if (existing.role === 'owner' && (await ownerCount(tx, input.organizationId)) <= 1) {
      return { kind: 'last-owner' as const }
    }
    await tx
      .delete(projectMemberTable)
      .where(
        and(
          eq(projectMemberTable.organizationId, input.organizationId),
          eq(projectMemberTable.userId, input.targetUserId),
        ),
      )
    await tx
      .delete(organizationMemberTable)
      .where(
        and(
          eq(organizationMemberTable.organizationId, input.organizationId),
          eq(organizationMemberTable.userId, input.targetUserId),
        ),
      )
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      actorType: 'user',
      actorUserId: input.actorUserId,
      action: 'organization_member.removed',
      targetType: 'organization_member',
      targetId: input.targetUserId,
      requestId: input.requestId,
      detail: { previousRole: existing.role },
    })
    return { kind: 'removed' as const }
  })
}

export function listProjectMembers(db: Db, input: { userId: string; organizationId: string; projectId: string }) {
  return withCivilContext(db, input.userId, input.organizationId, async (tx) => {
    const actorRole = await getOrganizationRole(tx, input.userId, input.organizationId)
    if (!actorRole) return null
    const [project] = await tx
      .select({ id: projectTable.id })
      .from(projectTable)
      .where(and(eq(projectTable.organizationId, input.organizationId), eq(projectTable.id, input.projectId)))
      .limit(1)
    if (!project) return null
    const items = await tx
      .select({
        userId: projectMemberTable.userId,
        name: civilUser.name,
        email: civilUser.email,
        role: projectMemberTable.role,
        createdAt: projectMemberTable.createdAt,
        updatedAt: projectMemberTable.updatedAt,
      })
      .from(projectMemberTable)
      .innerJoin(civilUser, eq(civilUser.id, projectMemberTable.userId))
      .where(
        and(
          eq(projectMemberTable.organizationId, input.organizationId),
          eq(projectMemberTable.projectId, input.projectId),
        ),
      )
      .orderBy(asc(civilUser.name), asc(civilUser.email))
    return { canManage: canManageMembers(actorRole), items }
  })
}

export function upsertProjectMember(
  db: Db,
  input: {
    actorUserId: string
    organizationId: string
    projectId: string
    targetUserId: string
    role: CivilProjectRole
    requestId: string
  },
) {
  return withCivilContext(db, input.actorUserId, input.organizationId, async (tx) => {
    const actorRole = await getOrganizationRole(tx, input.actorUserId, input.organizationId)
    if (!canManageMembers(actorRole)) return { kind: 'forbidden' as const }
    const [project] = await tx
      .select({ id: projectTable.id })
      .from(projectTable)
      .where(and(eq(projectTable.organizationId, input.organizationId), eq(projectTable.id, input.projectId)))
      .limit(1)
    if (!project) return { kind: 'missing' as const }
    const [member] = await tx
      .select({ userId: organizationMemberTable.userId })
      .from(organizationMemberTable)
      .where(
        and(
          eq(organizationMemberTable.organizationId, input.organizationId),
          eq(organizationMemberTable.userId, input.targetUserId),
        ),
      )
      .limit(1)
    if (!member) return { kind: 'not-organization-member' as const }
    await tx
      .insert(projectMemberTable)
      .values({
        organizationId: input.organizationId,
        projectId: input.projectId,
        userId: input.targetUserId,
        role: input.role,
        createdByUserId: input.actorUserId,
      })
      .onConflictDoUpdate({
        target: [projectMemberTable.projectId, projectMemberTable.userId],
        set: { role: input.role },
      })
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.actorUserId,
      action: 'project_member.saved',
      targetType: 'project_member',
      targetId: input.targetUserId,
      requestId: input.requestId,
      detail: { role: input.role },
    })
    return { kind: 'saved' as const }
  })
}

export function removeProjectMember(
  db: Db,
  input: { actorUserId: string; organizationId: string; projectId: string; targetUserId: string; requestId: string },
) {
  return withCivilContext(db, input.actorUserId, input.organizationId, async (tx) => {
    const actorRole = await getOrganizationRole(tx, input.actorUserId, input.organizationId)
    if (!canManageMembers(actorRole)) return { kind: 'forbidden' as const }
    const deleted = await tx
      .delete(projectMemberTable)
      .where(
        and(
          eq(projectMemberTable.organizationId, input.organizationId),
          eq(projectMemberTable.projectId, input.projectId),
          eq(projectMemberTable.userId, input.targetUserId),
        ),
      )
      .returning({ userId: projectMemberTable.userId })
    if (deleted.length === 0) return { kind: 'missing' as const }
    await tx.insert(auditEventTable).values({
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorType: 'user',
      actorUserId: input.actorUserId,
      action: 'project_member.removed',
      targetType: 'project_member',
      targetId: input.targetUserId,
      requestId: input.requestId,
    })
    return { kind: 'removed' as const }
  })
}
