import { type SQL, sql } from 'drizzle-orm'
import { type AnyPgColumn, pgPolicy } from 'drizzle-orm/pg-core'

export const civilRuntimeRole = 'sobok_runtime'

export const actorContext = sql`nullif(current_setting('app.civil_user_id', true), '')`
export const organizationContext = sql`nullif(current_setting('app.civil_organization_id', true), '')::uuid`
export const computeContext = sql`coalesce(current_setting('app.civil_compute', true), '') = 'on'`

function actorBelongsToOrganization(organizationId: AnyPgColumn): SQL {
  return sql`exists (
    select 1
    from "civil"."organization_member" as membership
    where membership."organization_id" = ${organizationId}
      and membership."user_id" = ${actorContext}
  )`
}

function actorCanAccessProject(organizationId: AnyPgColumn, projectId: AnyPgColumn): SQL {
  return sql`exists (
      select 1
      from "civil"."organization_member" as organization_membership
      where organization_membership."organization_id" = ${organizationId}
        and organization_membership."user_id" = ${actorContext}
        and organization_membership."role" in ('owner', 'administrator')
    ) or exists (
      select 1
      from "civil"."project_member" as project_membership
      where project_membership."organization_id" = ${organizationId}
        and project_membership."project_id" = ${projectId}
        and project_membership."user_id" = ${actorContext}
    )`
}

export function tenantPolicies(
  tableName: string,
  organizationId: AnyPgColumn,
  options: { allowCompute?: boolean } = {},
) {
  const inSelectedOrganization = sql`${organizationId} = ${organizationContext}`
  const selectedOrganization = options.allowCompute
    ? sql`${computeContext} or ${inSelectedOrganization}`
    : inSelectedOrganization
  const visibleOrganization = options.allowCompute
    ? sql`${computeContext} or ${actorBelongsToOrganization(organizationId)}`
    : actorBelongsToOrganization(organizationId)
  return [
    pgPolicy(`civil_${tableName}_select`, {
      for: 'select',
      to: civilRuntimeRole,
      using: visibleOrganization,
    }),
    pgPolicy(`civil_${tableName}_insert`, {
      for: 'insert',
      to: civilRuntimeRole,
      withCheck: selectedOrganization,
    }),
    pgPolicy(`civil_${tableName}_update`, {
      for: 'update',
      to: civilRuntimeRole,
      using: selectedOrganization,
      withCheck: selectedOrganization,
    }),
    pgPolicy(`civil_${tableName}_delete`, {
      for: 'delete',
      to: civilRuntimeRole,
      using: selectedOrganization,
    }),
  ]
}

export function tenantAppendOnlyPolicies(
  tableName: string,
  organizationId: AnyPgColumn,
  options: { allowCompute?: boolean; computeOnlyInsert?: boolean } = {},
) {
  const inSelectedOrganization = sql`${organizationId} = ${organizationContext}`
  const visibleOrganization = options.allowCompute
    ? sql`${computeContext} or ${actorBelongsToOrganization(organizationId)}`
    : actorBelongsToOrganization(organizationId)
  return [
    pgPolicy(`civil_${tableName}_select`, {
      for: 'select',
      to: civilRuntimeRole,
      using: visibleOrganization,
    }),
    pgPolicy(`civil_${tableName}_insert`, {
      for: 'insert',
      to: civilRuntimeRole,
      withCheck: options.computeOnlyInsert
        ? computeContext
        : options.allowCompute
          ? sql`${computeContext} or ${inSelectedOrganization}`
          : inSelectedOrganization,
    }),
  ]
}

export function projectPolicies(
  tableName: string,
  organizationId: AnyPgColumn,
  projectId: AnyPgColumn,
  options: { allowCompute?: boolean; appendOnly?: boolean; computeOnlyInsert?: boolean } = {},
) {
  const inSelectedOrganization = sql`${organizationId} = ${organizationContext}`
  const access = actorCanAccessProject(organizationId, projectId)
  const visible = options.allowCompute ? sql`${computeContext} or ${access}` : access
  const userMutable = sql`${inSelectedOrganization} and (${access})`
  const mutable = options.allowCompute ? sql`${computeContext} or (${userMutable})` : userMutable
  const policies = [
    pgPolicy(`civil_${tableName}_select`, {
      for: 'select',
      to: civilRuntimeRole,
      using: visible,
    }),
    pgPolicy(`civil_${tableName}_insert`, {
      for: 'insert',
      to: civilRuntimeRole,
      withCheck: options.computeOnlyInsert ? computeContext : mutable,
    }),
  ]
  if (options.appendOnly) return policies
  return [
    ...policies,
    pgPolicy(`civil_${tableName}_update`, {
      for: 'update',
      to: civilRuntimeRole,
      using: mutable,
      withCheck: mutable,
    }),
    pgPolicy(`civil_${tableName}_delete`, {
      for: 'delete',
      to: civilRuntimeRole,
      using: mutable,
    }),
  ]
}
