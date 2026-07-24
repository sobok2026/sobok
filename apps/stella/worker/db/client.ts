import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Core query builder only (tables are imported directly by the query modules), so no relational `schema` is
// passed to drizzle. Mirrors apps/vibe's worker db client.
export type Db = PostgresJsDatabase

export interface DbHandle {
  db: Db
  sql: postgres.Sql
}

// Per-request postgres.js over Hyperdrive.
// - max:5            Workers caps a script at 6 concurrent TCP connections; leave headroom.
// - fetch_types:false Hyperdrive can't serve the type-introspection round trip postgres.js does on boot.
// - prepare:false    Hyperdrive pools in transaction mode, so a prepared statement created on one backend
//                    connection may not exist on the next — disable to avoid "prepared statement …" errors.
// Always close the socket after the response via `c.executionCtx.waitUntil(handle.sql.end({ timeout: 5 }))`.
export function openDb(hyperdrive: Hyperdrive): DbHandle {
  const sql = postgres(hyperdrive.connectionString, { max: 5, fetch_types: false, prepare: false })
  return { db: drizzle({ client: sql }), sql }
}

// Run a unit of work against a per-request handle, then close the socket in the background after the response
// is sent (the Workers-idiomatic way — never block the response on the TCP teardown). The ctx is structurally
// typed so both Hono's `c.executionCtx` and the raw Workers `ExecutionContext` fit.
export async function withDb<T>(
  handle: DbHandle,
  ctx: { waitUntil(promise: Promise<unknown>): void },
  fn: (db: Db) => Promise<T>,
): Promise<T> {
  try {
    return await fn(handle.db)
  } finally {
    ctx.waitUntil(handle.sql.end({ timeout: 5 }))
  }
}
