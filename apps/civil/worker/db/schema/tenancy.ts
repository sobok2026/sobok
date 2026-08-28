import { sql } from 'drizzle-orm'
import { check, foreignKey, index, pgPolicy, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { civilUser } from './auth'
import { civil, organizationRoleEnum, projectStatusEnum } from './common'
import { actorContext, civilRuntimeRole, computeContext, organizationContext } from './rls'

const createdAt = timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull()
const updatedAt = timestamp('updated_at', { precision: 3, withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date())

export const organizationTable = civil.table(
  'organization',
  {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    slug: text().notNull(),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('uq_civil_organization_slug').on(table.slug),
    check('ck_civil_organization_slug', sql`${table.slug} ~ '^[a-z0-9][a-z0-9-]{1,47}$'`),
    pgPolicy('civil_organization_select', {
      for: 'select',
      to: civilRuntimeRole,
      using: sql`${computeContext} or exists (
          select 1
          from "civil"."organization_member" as membership
          where membership."organization_id" = ${table.id}
            and membership."user_id" = ${actorContext}
        )`,
    }),
    pgPolicy('civil_organization_insert', {
      for: 'insert',
      to: civilRuntimeRole,
      withCheck: sql`${table.createdByUserId} = ${actorContext}`,
    }),
    pgPolicy('civil_organization_update', {
      for: 'update',
      to: civilRuntimeRole,
      using: sql`${computeContext} or ${table.id} = ${organizationContext}`,
      withCheck: sql`${computeContext} or ${table.id} = ${organizationContext}`,
    }),
    pgPolicy('civil_organization_delete', {
      for: 'delete',
      to: civilRuntimeRole,
      using: sql`${table.id} = ${organizationContext}`,
    }),
  ],
)

export const organizationMemberTable = civil.table(
  'organization_member',
  {
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    role: organizationRoleEnum().notNull(),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    createdAt,
    updatedAt,
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.userId], name: 'pk_civil_organization_member' }),
    index('idx_civil_organization_member_user').on(table.userId, table.organizationId),
    pgPolicy('civil_organization_member_select', {
      for: 'select',
      to: civilRuntimeRole,
      using: sql`${table.userId} = ${actorContext} or ${table.organizationId} = ${organizationContext}`,
    }),
    pgPolicy('civil_organization_member_insert', {
      for: 'insert',
      to: civilRuntimeRole,
      withCheck: sql`${table.organizationId} = ${organizationContext}`,
    }),
    pgPolicy('civil_organization_member_update', {
      for: 'update',
      to: civilRuntimeRole,
      using: sql`${table.organizationId} = ${organizationContext}`,
      withCheck: sql`${table.organizationId} = ${organizationContext}`,
    }),
    pgPolicy('civil_organization_member_delete', {
      for: 'delete',
      to: civilRuntimeRole,
      using: sql`${table.organizationId} = ${organizationContext}`,
    }),
  ],
)

export const projectTable = civil.table(
  'project',
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationTable.id, { onDelete: 'restrict' }),
    code: text().notNull(),
    name: text().notNull(),
    status: projectStatusEnum().default('planning').notNull(),
    coordinateReferenceSystem: text('coordinate_reference_system').default('EPSG:5186').notNull(),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('uq_civil_project_org_code').on(table.organizationId, table.code),
    uniqueIndex('uq_civil_project_org_id').on(table.organizationId, table.id),
    index('idx_civil_project_org_status').on(table.organizationId, table.status),
    pgPolicy('civil_project_select', {
      for: 'select',
      to: civilRuntimeRole,
      using: sql`exists (
          select 1
          from "civil"."organization_member" as organization_membership
          where organization_membership."organization_id" = ${table.organizationId}
            and organization_membership."user_id" = ${actorContext}
            and organization_membership."role" in ('owner', 'administrator')
        ) or exists (
          select 1
          from "civil"."project_member" as project_membership
          where project_membership."project_id" = ${table.id}
            and project_membership."user_id" = ${actorContext}
        )`,
    }),
    pgPolicy('civil_project_insert', {
      for: 'insert',
      to: civilRuntimeRole,
      withCheck: sql`${table.organizationId} = ${organizationContext}`,
    }),
    pgPolicy('civil_project_update', {
      for: 'update',
      to: civilRuntimeRole,
      using: sql`${table.organizationId} = ${organizationContext}`,
      withCheck: sql`${table.organizationId} = ${organizationContext}`,
    }),
    pgPolicy('civil_project_delete', {
      for: 'delete',
      to: civilRuntimeRole,
      using: sql`${table.organizationId} = ${organizationContext}`,
    }),
  ],
)

export const projectMemberTable = civil.table(
  'project_member',
  {
    organizationId: uuid('organization_id').notNull(),
    projectId: uuid('project_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    role: organizationRoleEnum().notNull(),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => civilUser.id, { onDelete: 'restrict' }),
    createdAt,
    updatedAt,
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.userId], name: 'pk_civil_project_member' }),
    index('idx_civil_project_member_user').on(table.userId, table.organizationId, table.projectId),
    foreignKey({
      name: 'fk_civil_project_member_project',
      columns: [table.organizationId, table.projectId],
      foreignColumns: [projectTable.organizationId, projectTable.id],
    }).onDelete('cascade'),
    pgPolicy('civil_project_member_select', {
      for: 'select',
      to: civilRuntimeRole,
      using: sql`${table.userId} = ${actorContext} or ${table.organizationId} = ${organizationContext}`,
    }),
    pgPolicy('civil_project_member_insert', {
      for: 'insert',
      to: civilRuntimeRole,
      withCheck: sql`${table.organizationId} = ${organizationContext}`,
    }),
    pgPolicy('civil_project_member_update', {
      for: 'update',
      to: civilRuntimeRole,
      using: sql`${table.organizationId} = ${organizationContext}`,
      withCheck: sql`${table.organizationId} = ${organizationContext}`,
    }),
    pgPolicy('civil_project_member_delete', {
      for: 'delete',
      to: civilRuntimeRole,
      using: sql`${table.organizationId} = ${organizationContext}`,
    }),
  ],
)
