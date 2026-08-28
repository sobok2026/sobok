import type { Db } from '@sobok/edge/db/client'
import { sql } from 'drizzle-orm'

export type CivilTransaction = Parameters<Parameters<Db['transaction']>[0]>[0]

export async function withCivilContext<T>(
  db: Db,
  actorUserId: string,
  organizationId: string | null,
  run: (tx: CivilTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`
      select
        set_config('app.civil_user_id', ${actorUserId}, true),
        set_config('app.civil_organization_id', ${organizationId ?? ''}, true)
    `)
    return run(tx)
  })
}

export async function withCivilComputeContext<T>(db: Db, run: (tx: CivilTransaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.civil_compute', 'on', true)`)
    return run(tx)
  })
}

export async function selectOrganization<T>(
  db: Db,
  actorUserId: string,
  organizationId: string,
  run: (tx: CivilTransaction) => Promise<T>,
): Promise<T | null> {
  return withCivilContext(db, actorUserId, organizationId, async (tx) => {
    const membership = await tx.execute(sql`
      select 1
      from "civil"."organization_member"
      where "organization_id" = ${organizationId}::uuid
        and "user_id" = ${actorUserId}
      limit 1
    `)
    if (membership.length === 0) return null
    return run(tx)
  })
}
