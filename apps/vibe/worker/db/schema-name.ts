/**
 * Which Postgres schema this deployment owns.
 *
 * It has to be a BUILD-time constant rather than a binding: `pgSchema()` runs at module load, where Worker
 * bindings do not exist yet and every table name is already baked into the SQL drizzle emits. wrangler
 * substitutes the bare identifier below through esbuild `define`, declared once per environment — `deeptype`
 * at the top level, `deeptype_stg` under `env.stg`. `define` is one of the non-inheritable keys, so a new
 * environment that forgets it gets no value at all rather than the production one.
 *
 * This is the ONLY thing keeping the two apart at runtime. Both deployments authenticate as the same
 * `deeptype_app` role — the role is what a Hyperdrive config's connection string carries, so separate roles
 * would mean separate configs — and that role can reach both schemas. The role's `search_path` is emptied in
 * sobok-ops so an unqualified statement fails loudly instead of resolving into live payment tables, but every
 * qualified one goes wherever the constant below says.
 *
 * drizzle-kit loads this same file in Node, where nothing was substituted, and reads the env var instead.
 *
 * There is deliberately NO default. A missing value must fail loudly at module load, because the one thing
 * this split exists to prevent is a staging deploy quietly writing into the real revenue tables — and a
 * fallback of `'deeptype'` is exactly that failure, spelled as a convenience.
 */
declare const SOBOK_DB_SCHEMA: string | undefined

type VibeDbSchema = 'deeptype' | 'deeptype_stg'

function isVibeDbSchema(value: string | undefined): value is VibeDbSchema {
  return value === 'deeptype' || value === 'deeptype_stg'
}

function resolveSchemaName(): VibeDbSchema {
  // Substituted branch (Worker bundle). `typeof` on an undeclared identifier is safe, which is what makes the
  // same expression legal in Node where the substitution never happened.
  if (typeof SOBOK_DB_SCHEMA === 'string' && SOBOK_DB_SCHEMA) {
    if (isVibeDbSchema(SOBOK_DB_SCHEMA)) return SOBOK_DB_SCHEMA
    throw new Error(`Invalid SOBOK_DB_SCHEMA: ${SOBOK_DB_SCHEMA}`)
  }

  // Reached only under drizzle-kit. Read off `globalThis` rather than the bare `process`, which the Worker
  // tsconfig has no types for and which this file must not require the Worker to provide.
  const fromNode = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.SOBOK_DB_SCHEMA
  if (isVibeDbSchema(fromNode)) return fromNode
  if (fromNode) throw new Error(`Invalid SOBOK_DB_SCHEMA: ${fromNode}`)

  throw new Error(
    'SOBOK_DB_SCHEMA is unset — set wrangler `define` for this environment, or the env var when running drizzle-kit',
  )
}

export const DB_SCHEMA = resolveSchemaName()
