/**
 * Which Postgres schema this deployment owns.
 *
 * `pgSchema()` runs while the module is loaded, before Worker bindings exist, so the name must be a
 * build-time constant. Wrangler substitutes the identifier below through `define`: production uses
 * `stella`, while the named `stg` environment uses `stella_stg`.
 *
 * Both deployments deliberately share one Supabase database, one Hyperdrive config, and the `stella_app`
 * role. Every Drizzle statement is schema-qualified, and sobok-ops gives the role a `pg_catalog`-only
 * search_path so an unqualified application-table query fails instead of falling into production.
 *
 * drizzle-kit loads this module in Node and reads the environment variable instead. There is no default:
 * schema push and Worker startup must fail if their target was not selected explicitly.
 */
declare const SOBOK_DB_SCHEMA: string | undefined

type StellaDbSchema = 'stella' | 'stella_stg'

function isStellaDbSchema(value: string | undefined): value is StellaDbSchema {
  return value === 'stella' || value === 'stella_stg'
}

function resolveSchemaName(): StellaDbSchema {
  if (typeof SOBOK_DB_SCHEMA === 'string' && SOBOK_DB_SCHEMA) {
    if (isStellaDbSchema(SOBOK_DB_SCHEMA)) {
      return SOBOK_DB_SCHEMA
    }
    throw new Error(`Invalid SOBOK_DB_SCHEMA: ${SOBOK_DB_SCHEMA}`)
  }

  const fromNode = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.SOBOK_DB_SCHEMA
  if (isStellaDbSchema(fromNode)) {
    return fromNode
  }
  if (fromNode) {
    throw new Error(`Invalid SOBOK_DB_SCHEMA: ${fromNode}`)
  }

  throw new Error(
    'SOBOK_DB_SCHEMA is unset — set wrangler `define` for this environment, or the env var when running drizzle-kit',
  )
}

export const DB_SCHEMA = resolveSchemaName()
