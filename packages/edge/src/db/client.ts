import { makePgArray } from 'drizzle-orm/pg-core'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Decodes a one-dimensional Postgres array literal — `{a,"b,c",NULL}`. Inside a quoted element a backslash
// escapes the next character; an unquoted NULL is the SQL null, a quoted "NULL" is the four-letter string.
// We own this rather than borrowing one: postgres.js's parser is not importable (the package publishes no
// subpath exports) and drizzle's `parsePgArray` silently drops `\\` escapes.
function parsePgTextArray(literal: string): (string | null)[] {
  const items: (string | null)[] = []
  let index = 1 // past the opening brace

  while (index < literal.length && literal[index] !== '}') {
    if (literal[index] === '"') {
      let value = ''
      for (index++; literal[index] !== '"'; index++) {
        if (literal[index] === '\\') index++
        value += literal[index]
      }
      index++ // past the closing quote
      items.push(value)
    } else {
      const start = index
      while (index < literal.length && literal[index] !== ',' && literal[index] !== '}') index++
      const value = literal.slice(start, index)
      items.push(value === 'NULL' ? null : value)
    }
    if (literal[index] === ',') index++
  }

  return items
}

// text[] (OID 1009). `fetch_types:false` skips the boot query that would have registered postgres.js's own
// array codecs, and drizzle trusts the driver to hand back a parsed array rather than parsing the literal
// itself — so without this every `text().array()` column reads back as the raw string `{a,b}`, and the
// `.find`/`.map` its consumers expect throws. Registering the codec by OID closes that gap.
// `serialize` receives an already-encoded literal on the drizzle path (drizzle encodes in mapToDriverValue)
// and a real array only on the raw `sql` path, so it has to accept both — encoding twice throws.
const textArrayCodec = {
  to: 1009,
  from: [1009],
  serialize: (value: string | readonly string[]) => (Array.isArray(value) ? makePgArray(value) : value),
  parse: parsePgTextArray,
}

// Core query builder only (tables are imported directly by the query modules), so no relational `schema` is
// passed to drizzle.
export type Db = PostgresJsDatabase

export interface DbHandle {
  db: Db
  sql: postgres.Sql
}

// Per-request postgres.js over Hyperdrive. Takes the BINDING, not a connection string, so a caller can't
// hand it a direct unpooled URL and quietly lose Hyperdrive's pooling — the caching policy stays a property
// of which binding you pass (a fresh-vs-cached config), which is the distinction that matters on money paths.
// - max:5             Workers caps a script at 6 concurrent TCP connections; leave headroom.
// - fetch_types:false Hyperdrive can't serve the type-introspection round trip postgres.js does on boot;
//                     array codecs it would have registered are supplied by `types` below.
// - prepare:true      Hyperdrive supports and caches Postgres.js prepared statements; disabling them adds
//                     round trips and makes the cached binding less effective.
// Always close the socket after the response — use `withDb`, or waitUntil(handle.sql.end({ timeout: 5 })).
export function openDb(hyperdrive: Hyperdrive): DbHandle {
  const sql = postgres(hyperdrive.connectionString, {
    max: 5,
    fetch_types: false,
    prepare: true,
    types: { textArray: textArrayCodec },
  })

  return {
    db: drizzle({ client: sql }),
    sql,
  }
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
