import type { Db } from '@sobok/edge/db/client'
import { and, count, eq, sql } from 'drizzle-orm'
import { withCivilContext } from '../context'
import { organizationMemberTable, organizationTable, projectTable } from '../schema/tenancy'
import { auditEventTable } from '../schema/work'

export type OrganizationRole = (typeof organizationMemberTable.$inferSelect)['role']

export type OrganizationSummary = {
  id: string
  name: string
  slug: string
  role: OrganizationRole
  projectCount: number
  createdAt: Date
}

export function listOrganizations(db: Db, userId: string): Promise<OrganizationSummary[]> {
  return withCivilContext(db, userId, null, async (tx) => {
    const rows = await tx
      .select({
        id: organizationTable.id,
        name: organizationTable.name,
        slug: organizationTable.slug,
        role: organizationMemberTable.role,
        projectCount: count(projectTable.id),
        createdAt: organizationTable.createdAt,
      })
      .from(organizationMemberTable)
      .innerJoin(organizationTable, eq(organizationTable.id, organizationMemberTable.organizationId))
      .leftJoin(
        projectTable,
        and(
          eq(projectTable.organizationId, organizationTable.id),
          eq(projectTable.organizationId, organizationMemberTable.organizationId),
        ),
      )
      .where(eq(organizationMemberTable.userId, userId))
      .groupBy(
        organizationTable.id,
        organizationTable.name,
        organizationTable.slug,
        organizationMemberTable.role,
        organizationTable.createdAt,
      )
      .orderBy(organizationTable.name)
    return rows.map((row) => ({ ...row, projectCount: Number(row.projectCount) }))
  })
}

export function createOrganization(
  db: Db,
  input: { userId: string; name: string; slug: string; requestId: string },
): Promise<OrganizationSummary> {
  return withCivilContext(db, input.userId, null, async (tx) => {
    const organizationId = crypto.randomUUID()
    await tx
      .insert(organizationTable)
      .values({ id: organizationId, name: input.name, slug: input.slug, createdByUserId: input.userId })

    // Keep the tenant context transaction-local. Hyperdrive resets the connection before it returns to the pool.
    await tx.execute(sql`select set_config('app.civil_organization_id', ${organizationId}, true)`)
    await tx.insert(organizationMemberTable).values({
      organizationId,
      userId: input.userId,
      role: 'owner',
      createdByUserId: input.userId,
    })
    await tx.insert(auditEventTable).values({
      organizationId,
      actorType: 'user',
      actorUserId: input.userId,
      action: 'organization.created',
      targetType: 'organization',
      targetId: organizationId,
      requestId: input.requestId,
    })

    const [organization] = await tx
      .select({
        id: organizationTable.id,
        name: organizationTable.name,
        slug: organizationTable.slug,
        createdAt: organizationTable.createdAt,
      })
      .from(organizationTable)
      .where(eq(organizationTable.id, organizationId))
      .limit(1)
    if (!organization) throw new Error('organization insert was not visible after membership creation')

    return { ...organization, role: 'owner', projectCount: 0 }
  })
}
